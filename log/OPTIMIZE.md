# 解决服务器上的 WebGL 上下文丢失问题

您遇到的 WebGL 上下文丢失问题是在部署到服务器后发生的，这通常与以下因素有关：

1. WebGL 资源管理
2. 浏览器限制和策略
3. 多模型切换时的上下文处理

## 问题分析

根据错误信息 `WebGL warning: bindTexture: tex is from a different (or lost) WebGL context` 和 `WebGL context was lost`，这是典型的 WebGL 上下文丢失问题。当您切换虚拟人物模型时，旧的 WebGL 上下文可能没有被正确清理，或者新的上下文创建过程中发生了问题。

## 解决方案

### 1. 改进 WebGL 上下文管理

修改 `cleanupResources` 函数，确保彻底清理 WebGL 资源：

```typescript
const cleanupResources = () => {
  console.log('清理资源...');
  
  // 清理面部追踪
  if (trackingRef.current != null) {
    console.log('取消面部追踪');
    cancelAnimationFrame(trackingRef.current);
    trackingRef.current = null;
  }
  
  // 清理虚拟轨道
  if (originTrackRef.current && localParticipant) {
    try {
      console.log('清理虚拟轨道');
      originTrackRef.current.stop();
      originTrackRef.current.restartTrack();
      originTrackRef.current = null;
    } catch (error) {
      console.error('清理虚拟轨道出错:', error);
    }
  }

  // 清理PIXI应用 - 更彻底的清理
  if (appRef.current) {
    try {
      console.log('清理PIXI应用');
      
      // 先移除所有子元素
      if (appRef.current.stage) {
        while(appRef.current.stage.children.length > 0) {
          const child = appRef.current.stage.children[0];
          appRef.current.stage.removeChild(child);
          if (child.destroy) {
            child.destroy(true);
          }
        }
      }
      
      // 停止所有ticker
      if (appRef.current.ticker) {
        appRef.current.ticker.stop();
      }
      
      // 销毁应用
      appRef.current.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true
      });
      
      appRef.current = null;
    } catch (e) {
      console.error('清理 PIXI 应用出错:', e);
    }
  }

  // 模型引用清理
  if (modelRef.current) {
    try {
      console.log('清理模型引用');
      if (modelRef.current.destroy) {
        modelRef.current.destroy();
      }
      modelRef.current = null;
    } catch (e) {
      console.error('清理模型引用出错:', e);
    }
  }

  // 重置状态机
  setCState({
    isLoading: false,
    error: null,
    trackingActive: false,
    detectorReady: false,
  });

  // 清理视频资源
  if (fakeVideoRef.current && fakeVideoRef.current.srcObject) {
    try {
      console.log('清理视频资源');
      const stream = fakeVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      fakeVideoRef.current.srcObject = null;
    } catch (e) {
      console.error('清理视频资源出错:', e);
    }
  }
  
  // 手动触发垃圾回收提示
  setTimeout(() => {
    console.log('资源清理完成');
  }, 100);
};
```

### 2. 使用 `contextRestored` 事件监听

添加 WebGL 上下文丢失和恢复的事件处理：

```typescript
const initPixiAndModel = async () => {
  (window as any).PIXI = PIXI;
  const { Live2DModel } = await import('pixi-live2d-display/cubism4');
  Live2DModel.registerTicker(PIXI.Ticker);
  
  // 确定canvas
  if (!canvasEle.current) {
    throw new Error('Canvas element is not available');
  }

  // 为 Canvas 添加 WebGL 上下文事件监听
  canvasEle.current.addEventListener('webglcontextlost', (event) => {
    console.warn('WebGL上下文丢失:', event);
    // 阻止默认行为，允许恢复
    event.preventDefault();
    
    // 标记状态
    setCState(prev => ({
      ...prev,
      error: 'WebGL上下文丢失，尝试恢复...'
    }));
  }, false);
  
  canvasEle.current.addEventListener('webglcontextrestored', () => {
    console.log('WebGL上下文已恢复');
    
    // 尝试重新初始化
    if (!appRef.current && enabled) {
      setTimeout(() => {
        initPixiAndModel().catch(err => {
          console.error('重新初始化失败:', err);
        });
      }, 500);
    }
  }, false);

  // 初始化 PIXI 应用
  const app = new PIXI.Application({
    view: canvasEle.current,
    resizeTo: canvasEle.current,
    autoStart: true,
    transparent: true,
    // 添加抗锯齿和高级设置
    antialias: true,
    powerPreference: 'high-performance',
    // 添加 WebGL 选项
    forceCanvas: false, // 强制使用 WebGL
    preserveDrawingBuffer: true, // 保留绘图缓冲区
  });
  
  appRef.current = app;
  
  /* ... 其余代码保持不变 ... */
};
```

### 3. 改进模型加载逻辑

使模型加载更加健壮，并处理潜在的错误：

```typescript
// 加载模型
console.log(`加载模型: ${model_role}`);
let model;
try {
  model = await Live2DModel.from(
    src(`/live2d_resources/${model_role}/${model_role}.model3.json`),
    { 
      autoInteract: false,
      autoUpdate: true,
      motionPreload: "none" // 减少初始加载的资源
    }
  );
  console.log('模型加载成功');
} catch (error) {
  console.error('模型加载失败:', error);
  throw new Error(`模型加载失败: ${error.message}`);
}

// 加载背景
console.log(`加载背景: ${model_bg}`);
let bg;
try {
  bg = await PIXI.Sprite.from(src(`/images/bg/${model_bg}`));
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChildAt(bg, 0);
  console.log('背景加载成功');
} catch (error) {
  console.error('背景加载失败:', error);
  // 背景加载失败不应中断流程
}

// 保存模型引用
modelRef.current = model;
```

### 4. 优化 Canvas 尺寸设置和渲染配置

确保 Canvas 元素的尺寸设置正确：

```jsx
<canvas
  ref={canvasEle}
  id="virtual_role_canvas"
  width="640"  // 设置明确的宽度
  height="480" // 设置明确的高度
  style={{ height: '100%', width: '100%', position: 'absolute' }}
></canvas>
```

### 5. 模型切换时的资源管理优化

当切换模型时，确保完全清理上一个模型的资源：

```typescript
// 当 model_role 或 enabled 改变时触发
useEffect(() => {
  // 如果禁用，清理资源并返回
  if (!enabled) {
    cleanupResources();
    return;
  }
  
  // 模型切换时，先进行资源清理
  if (modelRef.current && model_role) {
    console.log(`模型切换: ${modelRef.current.modelSettings?.name} -> ${model_role}`);
    cleanupResources();
  }
  
  // 初始化操作...
  let isActive = true;
  
  const init = async () => {
    try {
      // 初始化代码...
    } catch (error) {
      console.error('初始化失败:', error);
      setCState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
      }));
    }
  };
  
  init();
  
  return () => {
    isActive = false;
    cleanupResources();
  };
}, [enabled, model_role]);
```

### 6. 模型预加载和延迟展示

实现模型预加载逻辑，确保模型完全加载后再显示：

```typescript
// 模型预加载状态
const [modelPreloaded, setModelPreloaded] = useState(false);

// 在initPixiAndModel函数中
const initPixiAndModel = async () => {
  // ... 其他初始化代码 ...
  
  // 加载模型
  console.log(`开始预加载模型: ${model_role}`);
  const model = await Live2DModel.from(
    src(`/live2d_resources/${model_role}/${model_role}.model3.json`),
    { 
      autoInteract: false,
      autoUpdate: true 
    }
  );
  
  // 确保模型预加载完成
  if (model.internalModel) {
    await new Promise<void>(resolve => {
      model.once('load', () => {
        console.log('模型完全加载完成');
        setModelPreloaded(true);
        resolve();
      });
      
      // 设置超时，防止无限等待
      setTimeout(() => {
        if (!modelPreloaded) {
          console.log('模型加载超时，继续执行');
          setModelPreloaded(true);
          resolve();
        }
      }, 5000);
    });
  }
  
  // ... 其他代码 ...
};
```

### 7. WebGL 检测和后备方案

在组件挂载时检测 WebGL 支持并提供后备方案：

```typescript
// 检测 WebGL 支持
useEffect(() => {
  // 检测 WebGL 支持
  const checkWebGLSupport = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.error('WebGL 不受支持');
        setCState(prev => ({
          ...prev,
          error: 'WebGL不受支持，无法使用虚拟形象功能',
          isLoading: false
        }));
        return false;
      }
      
      // 检查 WebGL 能力
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        console.log('WebGL 渲染器:', renderer);
      }
      
      return true;
    } catch (e) {
      console.error('WebGL 检测失败:', e);
      setCState(prev => ({
        ...prev,
        error: 'WebGL检测失败',
        isLoading: false
      }));
      return false;
    }
  };
  
  if (enabled) {
    checkWebGLSupport();
  }
}, [enabled]);
```

### 8. 改进 useEffect 依赖项

确保所有相关状态变化都能触发正确的资源清理和重新初始化：

```typescript
// 初始化和清理
useEffect(() => {
  // 如果禁用，清理资源
  if (!enabled) {
    cleanupResources();
    return;
  }
  
  // 初始化逻辑...
  
  // 返回清理函数
  return () => {
    cleanupResources();
  };
}, [enabled, model_role, model_bg]); // 添加 model_bg 作为依赖
```

### 9. 完整的错误处理和状态展示

改进组件的错误处理和状态展示：

```jsx
return (
  <div ref={containerRef} className={styles.virtual_role}>
    {cState.isLoading && (
      <div className={styles.virtual_role_msgbox}>{t('msg.info.virtual_loading')}</div>
    )}
    
    {cState.error && (
      <div className={styles.virtual_role_error}>
        <p>{t('msg.error.virtual.general')}</p>
        <small>{cState.error}</small>
        <button 
          onClick={() => {
            setCState(prev => ({...prev, isLoading: true, error: null}));
            // 尝试重新初始化
            setTimeout(() => {
              if (enabled) {
                loadLive2dCore().then(() => {
                  initPixiAndModel().catch(err => {
                    setCState(prev => ({...prev, error: String(err), isLoading: false}));
                  });
                }).catch(err => {
                  setCState(prev => ({...prev, error: String(err), isLoading: false}));
                });
              }
            }, 1000);
          }}
        >
          {t('action.retry')}
        </button>
      </div>
    )}
    
    <canvas
      ref={canvasEle}
      id="virtual_role_canvas"
      width="640"
      height="480"
      style={{ 
        height: '100%', 
        width: '100%', 
        position: 'absolute',
        display: cState.error ? 'none' : 'block'
      }}
    ></canvas>
    
    {trackRef && (
      <video
        ref={fakeVideoRef}
        style={{
          height: '100%',
          width: '100%',
          visibility: 'hidden',
          position: 'absolute',
        }}
        muted
        playsInline
      ></video>
    )}
  </div>
);
```

## 特定环境优化

针对部署在服务器上的应用，还可以添加以下优化：

### 1. 降低 WebGL 性能需求

```typescript
const app = new PIXI.Application({
  view: canvasEle.current,
  resizeTo: canvasEle.current,
  autoStart: true,
  transparent: true,
  antialias: false, // 关闭抗锯齿以提高性能
  powerPreference: 'default', // 使用默认的性能配置
  resolution: 1, // 使用较低的分辨率
});
```

### 2. 实现 WebGL 上下文恢复尝试

```typescript
// 在 WebGL 上下文丢失时尝试恢复
let recoveryAttempts = 0;
const maxRecoveryAttempts = 3;

const attemptRecovery = () => {
  if (recoveryAttempts < maxRecoveryAttempts) {
    recoveryAttempts++;
    console.log(`尝试恢复 WebGL 上下文 (${recoveryAttempts}/${maxRecoveryAttempts})...`);
    
    cleanupResources();
    
    // 延迟重新初始化
    setTimeout(() => {
      if (enabled) {
        init().catch(err => {
          console.error(`恢复尝试 ${recoveryAttempts} 失败:`, err);
          attemptRecovery();
        });
      }
    }, 1000);
  } else {
    console.error('WebGL 上下文恢复失败，已达到最大尝试次数');
    setCState(prev => ({
      ...prev,
      error: 'WebGL 上下文恢复失败，请刷新页面重试',
      isLoading: false
    }));
  }
};
```

## 总结建议

1. **彻底清理资源**：确保在模型切换和组件卸载时彻底清理所有 WebGL 资源
2. **处理上下文事件**：监听并处理 WebGL 上下文丢失和恢复事件
3. **细化错误处理**：实现更细致的错误捕获和处理逻辑
4. **模型资源管理**：添加模型预加载和资源管理逻辑
5. **降低渲染要求**：在服务器环境中降低 WebGL 渲染要求，提高稳定性
6. **开发故障恢复机制**：添加自动恢复机制来应对上下文丢失情况

通过实施这些改进，您应该能够显著减少服务器环境中的 WebGL 上下文丢失问题，并在问题发生时提供更好的用户体验和恢复机制。





// ----


# 在 LiveKit 中实现屏幕共享时获取其他用户鼠标位置

要实现在用户进行屏幕共享演示时，获取其他用户的鼠标位置并展示，您需要通过额外的数据通道传输鼠标坐标信息。LiveKit 本身不直接提供鼠标位置共享功能，但我们可以使用 Socket.IO 或 LiveKit 的 DataChannel 来实现这一功能。

## 实现方案

### 1. 使用 Socket.IO 实现鼠标位置共享

您已经有了 Socket.IO 连接，可以直接扩展它来支持鼠标位置同步：

```typescript
// 在 tile.tsx 中添加鼠标位置跟踪和共享功能

// 添加鼠标位置状态
const [otherCursors, setOtherCursors] = useState<{
  [participantId: string]: { x: number; y: number; name: string; color: string };
}>({});

// 处理当前用户如果是演讲者并且当前track source是screen share，那么就需要获取其他用户的鼠标位置
useEffect(() => {
  if (trackReference.source === Track.Source.ScreenShare) {
    const isSpeakerSharing = localParticipant.isSpeaking && 
                            trackReference.participant.identity === localParticipant.identity;
    
    // 如果是演讲者自己的屏幕共享，监听其他用户的鼠标移动
    if (isSpeakerSharing) {
      console.log("演讲者开始屏幕共享，开始监听其他用户鼠标位置");
      
      // 监听鼠标位置事件
      socket.on('mouse_position', (data: {
        senderId: string,
        senderName: string,
        x: number,
        y: number,
        screenWidth: number,
        screenHeight: number
      }) => {
        // 接收到其他用户的鼠标位置
        const { senderId, senderName, x, y } = data;
        
        // 转换坐标到当前屏幕比例
        const videoElement = videoRef.current;
        if (!videoElement) return;
        
        const videoRect = videoElement.getBoundingClientRect();
        const relativeX = (x / data.screenWidth) * videoRect.width;
        const relativeY = (y / data.screenHeight) * videoRect.height;
        
        // 更新鼠标位置状态
        setOtherCursors(prev => ({
          ...prev,
          [senderId]: {
            x: relativeX,
            y: relativeY,
            name: senderName,
            color: getColorForUser(senderId) // 为每个用户生成固定颜色
          }
        }));
      });
      
      // 监听用户离开事件，清除对应的鼠标指针
      socket.on('participant_left', (data: { participantId: string }) => {
        setOtherCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[data.participantId];
          return newCursors;
        });
      });
      
      // 组件卸载时清理事件监听
      return () => {
        socket.off('mouse_position');
        socket.off('participant_left');
      };
    } 
    // 如果是观看者观看别人的屏幕共享，发送自己的鼠标位置
    else if (trackReference.participant.identity !== localParticipant.identity) {
      console.log("观看者在查看屏幕共享，开始发送鼠标位置");
      
      // 获取视频元素
      const videoElement = videoRef.current;
      if (!videoElement) return;
      
      // 添加鼠标移动事件监听
      const handleMouseMove = (e: MouseEvent) => {
        const videoRect = videoElement.getBoundingClientRect();
        
        // 检查鼠标是否在视频元素上
        if (
          e.clientX >= videoRect.left && 
          e.clientX <= videoRect.right && 
          e.clientY >= videoRect.top && 
          e.clientY <= videoRect.bottom
        ) {
          // 计算相对视频元素的坐标
          const relativeX = e.clientX - videoRect.left;
          const relativeY = e.clientY - videoRect.top;
          
          // 发送坐标给演讲者
          socket.emit('mouse_position', {
            receiverId: trackReference.participant.identity, // 演讲者ID
            senderId: localParticipant.identity,
            senderName: localParticipant.name,
            x: relativeX,
            y: relativeY,
            screenWidth: videoRect.width,
            screenHeight: videoRect.height
          });
        }
      };
      
      // 节流处理，避免发送过多事件
      const throttledMouseMove = throttle(handleMouseMove, 50);
      
      // 添加事件监听
      document.addEventListener('mousemove', throttledMouseMove);
      
      // 组件卸载时清理
      return () => {
        document.removeEventListener('mousemove', throttledMouseMove);
      };
    }
  }
  
  // 如果不是屏幕共享，清除所有鼠标指针
  return () => {
    setOtherCursors({});
  };
}, [trackReference.source, trackReference.participant.identity, localParticipant.isSpeaking, localParticipant.identity]);

// 节流函数实现
function throttle<T extends (...args: any[]) => any>(
  func: T, 
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 为每个用户生成固定颜色
function getColorForUser(userId: string): string {
  // 简单的哈希函数生成颜色
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0',
    '#33FFF0', '#F0FF33', '#FF3333', '#33FF33', '#3333FF'
  ];
  
  // 使用哈希值选择颜色
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}
```

### 2. 在组件中渲染其他用户的鼠标指针

修改 `deviceTrack` 部分，添加鼠标指针渲染：

```tsx
const deviceTrack = React.useMemo(() => {
  if (isTrackReference(trackReference) && !loading) {
    if (trackReference.source === Track.Source.Camera) {
      // 原有摄像头处理代码...
    } else if (trackReference.source === Track.Source.ScreenShare) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <VideoTrack
            ref={videoRef}
            style={{
              filter: `blur(${blurValue}px)`,
            }}
            trackRef={trackReference}
            onSubscriptionStatusChanged={handleSubscribe}
            manageSubscription={autoManageSubscription}
          />
          
          {/* 渲染其他用户的鼠标指针 */}
          {Object.entries(otherCursors).map(([participantId, cursor]) => (
            <div
              key={participantId}
              className={styles.remote_cursor}
              style={{
                position: 'absolute',
                left: `${cursor.x}px`,
                top: `${cursor.y}px`,
                pointerEvents: 'none', // 确保鼠标事件穿透
              }}
            >
              {/* 鼠标指针 */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 2L18 14H11L5 22V2Z"
                  fill={cursor.color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              
              {/* 用户名标签 */}
              <div
                className={styles.cursor_label}
                style={{
                  background: cursor.color,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginLeft: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                {cursor.name}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // 原有音频处理代码...
    }
  }
}, [trackReference, loading, blurValue, videoRef, uState.virtualRole, otherCursors]);
```

### 3. 添加样式

在您的 CSS 模块中添加必要的样式：

```scss
.remote_cursor {
  position: absolute;
  transform: translate(-8px, -8px); // 调整指针位置
  z-index: 100;
  pointer-events: none;
  transition: left 0.1s linear, top 0.1s linear; // 平滑移动
  
  .cursor_label {
    display: inline-block;
    transform: translateY(-100%);
    margin-top: -8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}
```

### 4. 更新服务端 Socket.IO 处理

您需要在服务端添加鼠标位置消息的处理：

```typescript
// 在您的 Socket.IO 服务端代码中添加

// 处理鼠标位置事件
socket.on('mouse_position', (data) => {
  const { receiverId, senderId, senderName, x, y, screenWidth, screenHeight } = data;
  
  // 获取接收者的 socket
  const receiverRoomId = getUserRoomId(receiverId);
  if (receiverRoomId) {
    // 转发给演讲者 (屏幕共享者)
    io.to(receiverRoomId).emit('mouse_position', {
      senderId,
      senderName,
      x,
      y,
      screenWidth,
      screenHeight
    });
  }
});

// 辅助函数：根据用户ID获取房间ID
function getUserRoomId(userId) {
  // 查找用户所在的房间和 socket
  // 实现取决于您的用户管理方式
  return userSocketMap[userId]; // 返回用户的 socket ID 或房间 ID
}
```

### 5. 使用 LiveKit DataChannel 实现 (替代方案)

如果您希望直接使用 LiveKit 的数据通道而不依赖 Socket.IO，可以这样实现：

```typescript
import { DataPacket_Kind, RemoteParticipant } from 'livekit-client';

// 在组件中添加
useEffect(() => {
  if (trackReference.source === Track.Source.ScreenShare) {
    const isSpeakerSharing = localParticipant.isSpeaking && 
                            trackReference.participant.identity === localParticipant.identity;
    
    if (isSpeakerSharing) {
      // 演讲者接收鼠标位置
      const handleDataReceived = (payload: Uint8Array, participant: RemoteParticipant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          if (data.type === 'mouse_position') {
            const { x, y, screenWidth, screenHeight } = data;
            
            // 转换坐标到当前屏幕比例
            const videoElement = videoRef.current;
            if (!videoElement) return;
            
            const videoRect = videoElement.getBoundingClientRect();
            const relativeX = (x / screenWidth) * videoRect.width;
            const relativeY = (y / screenHeight) * videoRect.height;
            
            // 更新鼠标位置
            setOtherCursors(prev => ({
              ...prev,
              [participant.identity]: {
                x: relativeX,
                y: relativeY,
                name: participant.name || participant.identity,
                color: getColorForUser(participant.identity)
              }
            }));
          }
        } catch (e) {
          console.error('解析数据错误:', e);
        }
      };
      
      // 监听数据通道消息
      localParticipant.room?.on('dataReceived', handleDataReceived);
      
      return () => {
        localParticipant.room?.off('dataReceived', handleDataReceived);
      };
    } 
    else if (trackReference.participant.identity !== localParticipant.identity) {
      // 观看者发送鼠标位置
      const videoElement = videoRef.current;
      if (!videoElement) return;
      
      const handleMouseMove = (e: MouseEvent) => {
        const videoRect = videoElement.getBoundingClientRect();
        
        if (
          e.clientX >= videoRect.left && 
          e.clientX <= videoRect.right && 
          e.clientY >= videoRect.top && 
          e.clientY <= videoRect.bottom
        ) {
          const relativeX = e.clientX - videoRect.left;
          const relativeY = e.clientY - videoRect.top;
          
          // 准备数据
          const data = {
            type: 'mouse_position',
            x: relativeX,
            y: relativeY,
            screenWidth: videoRect.width,
            screenHeight: videoRect.height
          };
          
          // 编码数据
          const encoder = new TextEncoder();
          const payload = encoder.encode(JSON.stringify(data));
          
          // 发送数据到演讲者
          localParticipant.room?.localParticipant.publishData(
            payload,
            DataPacket_Kind.RELIABLE, // 可靠传输
            [trackReference.participant.sid] // 只发给演讲者
          );
        }
      };
      
      const throttledMouseMove = throttle(handleMouseMove, 50);
      document.addEventListener('mousemove', throttledMouseMove);
      
      return () => {
        document.removeEventListener('mousemove', throttledMouseMove);
      };
    }
  }
  
  return () => {
    setOtherCursors({});
  };
}, [trackReference.source, trackReference.participant.identity, localParticipant.isSpeaking]);
```

## 改进建议

1. **性能优化**：
   - 使用 `requestAnimationFrame` 来平滑鼠标移动
   - 考虑服务器端节流或批处理来减少网络流量

2. **交互增强**：
   - 添加鼠标点击事件，在点击时显示视觉反馈
   - 实现临时绘图功能，允许用户在屏幕上标注

3. **用户体验**：
   - 添加开关，允许演讲者开启/关闭鼠标指针显示
   - 提供自定义指针样式和颜色选项

4. **安全考虑**：
   - 验证发送的坐标数据以防止恶意输入
   - 限制每个用户的发送频率

## 完整实现示例

以下是一个集成了 Socket.IO 的完整实现：

```tsx
// 在 tile.tsx 中实现

// 添加状态
const [otherCursors, setOtherCursors] = useState<{
  [participantId: string]: { x: number; y: number; name: string; color: string };
}>({});
const [cursorEnabled, setCursorEnabled] = useState(true); // 控制鼠标指针显示

// 处理屏幕共享和鼠标指针逻辑
useEffect(() => {
  if (trackReference.source === Track.Source.ScreenShare) {
    const isSpeakerSharing = trackReference.participant.identity === localParticipant.identity;
    
    if (isSpeakerSharing) {
      console.log("作为演讲者，开始接收其他用户的鼠标位置");
      
      // 监听鼠标位置事件
      socket.on('mouse_position', (data) => {
        if (!cursorEnabled) return;
        
        const { senderId, senderName, x, y, screenWidth, screenHeight } = data;
        const videoElement = videoRef.current;
        if (!videoElement) return;
        
        const videoRect = videoElement.getBoundingClientRect();
        const relativeX = (x / screenWidth) * videoRect.width;
        const relativeY = (y / screenHeight) * videoRect.height;
        
        setOtherCursors(prev => ({
          ...prev,
          [senderId]: {
            x: relativeX,
            y: relativeY,
            name: senderName,
            color: getColorForUser(senderId)
          }
        }));
      });
      
      // 监听鼠标点击事件
      socket.on('mouse_click', (data) => {
        if (!cursorEnabled) return;
        
        const { senderId } = data;
        // 实现点击动画
        const cursor = document.getElementById(`cursor-${senderId}`);
        if (cursor) {
          cursor.classList.add(styles.cursor_click);
          setTimeout(() => {
            cursor.classList.remove(styles.cursor_click);
          }, 500);
        }
      });
      
      // 监听用户离开事件
      socket.on('participant_left', (data) => {
        const { participantId } = data;
        setOtherCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[participantId];
          return newCursors;
        });
      });
      
      // 清理函数
      return () => {
        socket.off('mouse_position');
        socket.off('mouse_click');
        socket.off('participant_left');
      };
    } 
    else {
      console.log("作为观众，开始发送鼠标位置");
      
      const videoElement = videoRef.current;
      if (!videoElement) return;
      
      // 使用 requestAnimationFrame 实现平滑的鼠标追踪
      let mouseX = 0;
      let mouseY = 0;
      let isMouseOverVideo = false;
      
      // 追踪鼠标位置
      const handleMouseMove = (e: MouseEvent) => {
        const videoRect = videoElement.getBoundingClientRect();
        
        if (
          e.clientX >= videoRect.left && 
          e.clientX <= videoRect.right && 
          e.clientY >= videoRect.top && 
          e.clientY <= videoRect.bottom
        ) {
          mouseX = e.clientX - videoRect.left;
          mouseY = e.clientY - videoRect.top;
          isMouseOverVideo = true;
        } else {
          isMouseOverVideo = false;
        }
      };
      
      // 发送鼠标点击事件
      const handleMouseClick = (e: MouseEvent) => {
        if (!isMouseOverVideo) return;
        
        socket.emit('mouse_click', {
          receiverId: trackReference.participant.identity,
          senderId: localParticipant.identity,
        });
      };
      
      // 使用 requestAnimationFrame 控制发送频率
      let animationFrameId: number | null = null;
      const sendMousePosition = () => {
        if (isMouseOverVideo) {
          const videoRect = videoElement.getBoundingClientRect();
          
          socket.emit('mouse_position', {
            receiverId: trackReference.participant.identity,
            senderId: localParticipant.identity,
            senderName: localParticipant.name,
            x: mouseX,
            y: mouseY,
            screenWidth: videoRect.width,
            screenHeight: videoRect.height
          });
        }
        
        animationFrameId = requestAnimationFrame(sendMousePosition);
      };
      
      // 开始追踪
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleMouseClick);
      animationFrameId = requestAnimationFrame(sendMousePosition);
      
      // 清理函数
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleMouseClick);
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }
  
  // 不是屏幕共享，清除所有鼠标指针
  return () => {
    setOtherCursors({});
  };
}, [trackReference.source, trackReference.participant.identity, localParticipant.identity, cursorEnabled]);

// 屏幕共享时，添加鼠标指针控制按钮
const screenShareControls = React.useMemo(() => {
  if (
    trackReference.source === Track.Source.ScreenShare &&
    trackReference.participant.identity === localParticipant.identity
  ) {
    return (
      <button
        className="lk-button"
        style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '0.5rem',
          zIndex: 10,
        }}
        onClick={() => setCursorEnabled(prev => !prev)}
      >
        {cursorEnabled ? '隐藏观众鼠标' : '显示观众鼠标'}
      </button>
    );
  }
  return null;
}, [trackReference, cursorEnabled, localParticipant]);

// 在渲染部分添加鼠标指针显示和控制按钮
return (
  <ParticipantTile ref={ref} trackRef={trackReference}>
    {deviceTrack}
    {/* 渲染其他用户的鼠标指针 */}
    {trackReference.source === Track.Source.ScreenShare && 
     trackReference.participant.identity === localParticipant.identity &&
     cursorEnabled && 
     Object.entries(otherCursors).map(([participantId, cursor]) => (
      <div
        key={participantId}
        id={`cursor-${participantId}`}
        className={styles.remote_cursor}
        style={{
          position: 'absolute',
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          zIndex: 100,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M5 2L18 14H11L5 22V2Z"
            fill={cursor.color}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
        <div
          className={styles.cursor_label}
          style={{ background: cursor.color }}
        >
          {cursor.name}
        </div>
      </div>
    ))}
    {screenShareControls}
    {/* 其他现有组件... */}
  </ParticipantTile>
);
```

这个实现提供了一个完整的解决方案，允许您在屏幕共享期间查看其他用户的鼠标位置，同时还提供了控制开关和交互反馈功能。您可以根据项目需求进一步扩展和定制这个功能。