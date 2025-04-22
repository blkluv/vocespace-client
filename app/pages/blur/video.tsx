import { isTrackReference, TrackReference, useLocalParticipant } from '@livekit/components-react';
import { LocalTrack, Track } from 'livekit-client';
import { forwardRef, RefObject, useEffect, useRef, useState } from 'react';

export interface BlurVideoProps {
  blur: number;
  deviceId?: string;
}

export const BlurVideo = forwardRef<{}, BlurVideoProps>(({ blur, deviceId }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // 组件内部的video元素
  const animationFrameRef = useRef<number | null>(null);
  const { localParticipant } = useLocalParticipant();
  const [isProcessing, setIsProcessing] = useState(false);
  const originalStreamRef = useRef<MediaStream | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const bufferRefs = useRef<{
    positionBuffer: WebGLBuffer | null;
    texCoordBuffer: WebGLBuffer | null;
  }>({ positionBuffer: null, texCoordBuffer: null });
  const [initFailed, setInitFailed] = useState(false);

  // 1. 初始化WebGL
  const initWebGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    // 获取WebGL上下文
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error('WebGL不可用');
      return false;
    }

    glRef.current = gl;

    // 创建着色器程序
    const vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0, 1);
          v_texCoord = a_texCoord;
        }
      `,
    );

    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_blurAmount;
  varying vec2 v_texCoord;
  
  // CSS风格的均匀模糊实现
  vec4 cssBlur(sampler2D image, vec2 uv, vec2 resolution, float pixelBlur) {
    // 翻转Y坐标以匹配视频方向
    vec2 flipUV = vec2(uv.x, 1.0 - uv.y);
    
    // 如果模糊量很小，直接返回原图像
    if (pixelBlur <= 0.5) {
      return texture2D(image, flipUV);
    }
    
    // 计算采样半径（以像素为单位）
    float radius = pixelBlur;
    
    // 将半径转换为纹理坐标单位
    vec2 texelSize = 1.0 / resolution;
    float texelRadius = radius * texelSize.x;
    
    // 均匀采样多个点
    vec4 sum = vec4(0.0);
    float weightSum = 0.0;
    
    // 采样点数与模糊半径相关，保证足够的覆盖率
    int samples = int(min(17.0, max(7.0, radius * 0.5)));
    
    // 两层循环确保X和Y方向的均匀模糊
    for (int y = -3; y <= 3; y++) {
      for (int x = -3; x <= 3; x++) {
        // 跳过距离过远的采样点
        if (abs(float(x)) + abs(float(y)) > 4.0) continue;
        
        // 计算采样偏移
        vec2 offset = vec2(float(x), float(y)) * texelRadius / 3.0;
        
        // 计算采样权重 - 距离越远权重越小
        float distance = length(offset) / texelRadius;
        float weight = 1.0 - smoothstep(0.0, 1.0, distance);
        
        // 采样并累加
        sum += texture2D(image, flipUV + offset) * weight;
        weightSum += weight;
      }
    }
    
    // 标准化结果
    return sum / weightSum;
  }
  
  void main() {
    // 直接使用传入的blur值(像素)进行模糊
    gl_FragColor = cssBlur(u_image, v_texCoord, u_textureSize, u_blurAmount);
  }
`,
    );

    if (!vertexShader || !fragmentShader) return false;

    // 创建并链接程序
    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('无法初始化着色器程序:', gl.getProgramInfoLog(program));
      return false;
    }

    programRef.current = program;

    // 设置顶点缓冲区
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
      gl.STATIC_DRAW,
    );
    bufferRefs.current.positionBuffer = positionBuffer;

    // 设置纹理坐标缓冲区
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    // 添加纹理坐标数据
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]),
      gl.STATIC_DRAW,
    );
    bufferRefs.current.texCoordBuffer = texCoordBuffer;

    // 创建纹理
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 设置参数，使我们可以渲染任何尺寸的图像
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    textureRef.current = texture;

    return true;
  };

  // 创建着色器辅助函数
  const createShader = (
    gl: WebGLRenderingContext,
    type: number,
    source: string,
  ): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  // 使用WebGL处理视频帧
  const processVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const program = programRef.current;

    if (!video || !canvas || !gl || !program || video.videoWidth === 0) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }
    // 确保视频已开始播放
    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    // 确保canvas尺寸与视频一致
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    //   // 性能优化：如果模糊值特别小，可以考虑降低处理频率
    //   const frameSkip = blur < 0.1 ? 3 : 1;
    //   if (animationFrameRef.current && animationFrameRef.current % frameSkip !== 0) {
    //     animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    //     return;
    //   }

    // 使用程序
    gl.useProgram(program);

    // 绑定位置属性
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferRefs.current.positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 绑定纹理坐标属性
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferRefs.current.texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // 查找并设置纹理大小和模糊量
    const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
    gl.uniform2f(textureSizeLocation, canvas.width, canvas.height);

    const blurAmountLocation = gl.getUniformLocation(program, 'u_blurAmount');
    // 将模糊值映射到适合着色器的范围
    //   gl.uniform1f(blurAmountLocation, Math.min(30.0, Math.max(0.0, blur * 5)));
    gl.uniform1f(blurAmountLocation, blur);
    // 上传视频到纹理
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    // 绘制
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 继续处理下一帧
    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  };

  // 开始视频处理
  const startVideoProcessing = async () => {
    if (initFailed) return;

    try {
      // 直接获取用户摄像头流
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      originalStreamRef.current = stream;

      // 将流绑定到内部video元素
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // 避免反馈
        await videoRef.current.play().catch((e) => console.warn('视频播放失败:', e));
      }

      // 初始化WebGL和处理循环
      if (!initWebGL()) throw new Error('WebGL初始化失败');
      processVideoFrame();

      // 创建处理后的流
      const blurredStream = canvasRef.current!.captureStream(30);
      const blurredTrack = blurredStream.getVideoTracks()[0];

      // 替换发布的轨道
      const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
      if (cameraPub?.track) {
        await cameraPub.track.replaceTrack(blurredTrack);
      }

      setIsProcessing(true);
    } catch (error) {
      console.error('启动失败:', error);
      setInitFailed(true);
    }
  };

  // 停止视频处理
  const stopVideoProcessing = async () => {
    if (!isProcessing) return;

    try {
      // 停止动画帧
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // 恢复原始视频轨道
      if (originalStreamRef.current) {
        const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
        if (cameraPub?.track) {
          const originalTrack = originalStreamRef.current.getVideoTracks()[0];
          if (originalTrack) {
            await cameraPub.track.replaceTrack(originalTrack);
          }
        }
      }

      // 停止原始流的所有轨道
      if (originalStreamRef.current) {
        originalStreamRef.current.getTracks().forEach((track) => track.stop());
        originalStreamRef.current = null;
      }

      // 清理视频元素
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // 彻底清理WebGL资源
      const gl = glRef.current;
      if (gl) {
        // 清理着色器程序
        if (programRef.current) {
          gl.deleteProgram(programRef.current);
          programRef.current = null;
        }

        // 清理纹理
        if (textureRef.current) {
          gl.deleteTexture(textureRef.current);
          textureRef.current = null;
        }

        // 清理缓冲区
        if (bufferRefs.current.positionBuffer) {
          gl.deleteBuffer(bufferRefs.current.positionBuffer);
          bufferRefs.current.positionBuffer = null;
        }

        if (bufferRefs.current.texCoordBuffer) {
          gl.deleteBuffer(bufferRefs.current.texCoordBuffer);
          bufferRefs.current.texCoordBuffer = null;
        }

        // 重置GL上下文
        gl.finish();
        glRef.current = null;
      }

      // 清理引用
      // originTrackRef.current = null;

      // 重置状态
      setIsProcessing(false);
    } catch (error) {
      console.error('停止视频模糊处理失败:', error);
      // 即使失败也尝试重置状态
      setIsProcessing(false);
    }
  };

  // 响应blur变化
  useEffect(() => {
    if (isProcessing && programRef.current) {
      const gl = glRef.current!;
      gl.useProgram(programRef.current);
      const blurLoc = gl.getUniformLocation(programRef.current, 'u_blurAmount');
      gl.uniform1f(blurLoc, blur);
    }
  }, [blur]);

  // 启动和清理
  useEffect(() => {
    startVideoProcessing();
    return () => {
      // stopVideoProcessing();
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        style={{ display: 'none' }} // 隐藏内部视频元素
        playsInline
        autoPlay
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }} // 隐藏Canvas
      />
    </>
  );
});

export default BlurVideo;
