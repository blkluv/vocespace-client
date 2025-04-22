# 在LiveKit中实现本地视频模糊处理

要在LiveKit中实现本地视频模糊处理并将模糊后的视频流发布给其他参与者，您可以使用Canvas处理视频流的方式，与您已实现的虚拟视频流类似。这里是具体的实现方案：

## 1. 创建视频模糊处理组件

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { LocalTrack, Track } from 'livekit-client';
import { useLocalParticipant } from '@livekit/components-react';

interface BlurredVideoProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  blurAmount: number; // 0-20，模糊程度
  enabled: boolean;
  messageApi: any;
}

const BlurredVideoProcessor: React.FC<BlurredVideoProcessorProps> = ({
  videoRef,
  blurAmount,
  enabled,
  messageApi,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { localParticipant } = useLocalParticipant();
  const originalTrackRef = useRef<LocalTrack<Track.Kind> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 处理视频帧
  const processVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置Canvas尺寸与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 清除Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 应用模糊滤镜 - 如果启用了模糊处理
    if (enabled && blurAmount > 0) {
      ctx.filter = `blur(${blurAmount}px)`;
    } else {
      ctx.filter = 'none';
    }
    
    // 绘制视频帧到Canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 继续处理下一帧
    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  };

  // 开始视频处理
  const startVideoProcessing = async () => {
    if (!canvasRef.current || !videoRef.current || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // 获取当前摄像头轨道
      const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
      if (!cameraPub?.track) {
        throw new Error('未找到已发布的摄像头轨道');
      }
      
      // 保存原始轨道引用
      originalTrackRef.current = cameraPub.track;
      
      // 开始处理视频帧
      processVideoFrame();
      
      // 创建新的模糊视频流
      const blurredStream = canvasRef.current.captureStream(30); // 30fps
      if (!blurredStream || blurredStream.getVideoTracks().length === 0) {
        throw new Error('无法从Canvas创建视频流');
      }
      
      // 替换视频轨道
      const blurredTrack = blurredStream.getVideoTracks()[0];
      await cameraPub.track.replaceTrack(blurredTrack);
      
      messageApi.success('视频模糊已启用');
    } catch (error) {
      console.error('视频模糊处理失败:', error);
      messageApi.error('无法应用视频模糊效果');
      setIsProcessing(false);
    }
  };

  // 停止视频处理
  const stopVideoProcessing = async () => {
    if (!isProcessing || !originalTrackRef.current) return;
    
    try {
      // 停止动画帧
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // 恢复原始视频轨道
      const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
      if (cameraPub?.track) {
        // 获取原始设备ID
        const originalDeviceId = originalTrackRef.current.getDeviceId();
        
        // 创建新的媒体流
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: originalDeviceId ? { exact: originalDeviceId } : undefined }
        });
        
        // 替换回原始轨道
        await cameraPub.track.replaceTrack(newStream.getVideoTracks()[0]);
      }
      
      // 清理引用
      originalTrackRef.current = null;
      setIsProcessing(false);
      
      messageApi.success('视频模糊已禁用');
    } catch (error) {
      console.error('停止视频模糊处理失败:', error);
      messageApi.error('无法禁用视频模糊效果');
    }
  };

  // 响应参数变化
  useEffect(() => {
    if (enabled && !isProcessing) {
      startVideoProcessing();
    } else if (!enabled && isProcessing) {
      stopVideoProcessing();
    }
    
    return () => {
      // 组件卸载时清理资源
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (isProcessing) {
        stopVideoProcessing();
      }
    };
  }, [enabled, blurAmount]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'none' }} // 隐藏Canvas
    />
  );
};

export default BlurredVideoProcessor;
```

## 2. 修改ParticipantItem组件以集成模糊处理

在tile.tsx中集成模糊处理组件：

```tsx
// 在import部分添加
import BlurredVideoProcessor from '@/app/components/BlurredVideoProcessor';

// 在VideoTrack旁边添加BlurredVideoProcessor
{trackReference.source === Track.Source.Camera && (
  <div style={{ height: '100%', width: '100%' }}>
    <VideoTrack
      ref={videoRef}
      style={{
        // 本地UI上的模糊效果可以保留，不影响处理
        filter: `blur(${blurValue}px)`,
        visibility:
          localParticipant.identity === trackReference.participant.identity &&
          uState.virtualRole.enabled
            ? 'hidden'
            : 'visible',
      }}
      trackRef={trackReference}
      onSubscriptionStatusChanged={handleSubscribe}
      manageSubscription={autoManageSubscription}
    />
    
    {/* 虚拟角色处理 */}
    {localParticipant.identity === trackReference.participant.identity &&
      uState.virtualRole.enabled && (
        <div className={styles.virtual_video_box_canvas}>
          <VirtualRoleCanvas
            video_ele={videoRef}
            model_bg={uState.virtualRole.bg}
            model_role={uState.virtualRole.role}
            enabled={uState.virtualRole.enabled}
            messageApi={messageApi}
            trackRef={trackReference}
            isLocal={trackReference.participant.identity === localParticipant.identity}
          />
        </div>
      )}
      
    {/* 添加视频模糊处理器组件 */}
    {localParticipant.identity === trackReference.participant.identity && 
      !uState.virtualRole.enabled && (
        <BlurredVideoProcessor
          videoRef={videoRef}
          blurAmount={settings[trackReference.participant.identity]?.blur ?? 0}
          enabled={settings[trackReference.participant.identity]?.blurEnabled ?? false}
          messageApi={messageApi}
        />
      )}
  </div>
);
```

## 3. 扩展设置界面添加模糊开关

在您的设置面板中添加一个开关来控制模糊功能：

```tsx
// 在设置界面的相关组件中添加
<Switch 
  checked={settings[localParticipant.identity]?.blurEnabled ?? false}
  onChange={(checked) => {
    // 更新设置
    updateSettings({
      ...settings,
      [localParticipant.identity]: {
        ...settings[localParticipant.identity],
        blurEnabled: checked
      }
    });
  }}
/>
<Slider
  min={0}
  max={20}
  value={settings[localParticipant.identity]?.blur ?? 0}
  onChange={(value) => {
    // 更新模糊设置
    updateSettings({
      ...settings,
      [localParticipant.identity]: {
        ...settings[localParticipant.identity],
        blur: value
      }
    });
  }}
  disabled={!settings[localParticipant.identity]?.blurEnabled}
/>
```

## 关键实现要点

1. **视频处理原理**：使用Canvas捕获视频帧，应用模糊滤镜，然后创建新的视频流
2. **性能考虑**：
   - 使用requestAnimationFrame保证平滑处理
   - 只在模糊开启时进行处理
   - 可调整模糊程度以平衡性能和效果
3. **交互控制**：
   - 提供开关控制模糊功能
   - 提供滑块调整模糊程度
4. **资源清理**：
   - 组件卸载时停止处理
   - 模糊禁用时恢复原始视频流

这种实现方式能够在视频源级别应用模糊效果，确保远程用户收到的是已经模糊处理后的视频流，达到隐私保护的目的。