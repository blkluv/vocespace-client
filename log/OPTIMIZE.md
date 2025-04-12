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