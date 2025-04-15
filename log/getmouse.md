# 获取用户鼠标位置用于传输

要获取用户鼠标位置并在 Socket.IO 中传输这些数据，您需要添加鼠标事件监听器并提取相对坐标。以下是实现这一功能的步骤：

## 1. 监听鼠标移动事件

在屏幕共享视图中添加鼠标位置监听：

```tsx
// 处理当前用户如果是演讲者并且当前track source是screen share，那么就需要获取其他用户的鼠标位置
useEffect(() => {
  // 只在以下情况处理：
  // 1. 当前轨道是屏幕共享
  // 2. 不是当前用户自己的屏幕共享（即观看他人屏幕）
  if (trackReference.source === Track.Source.ScreenShare && 
      trackReference.participant.identity !== localParticipant.identity) {
    
    console.log("正在观看他人的屏幕共享，开始跟踪鼠标位置");
    
    // 获取视频元素，用于计算相对坐标
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // 鼠标移动处理函数
    const handleMouseMove = (e: MouseEvent) => {
      // 获取视频元素的位置和尺寸
      const videoRect = videoElement.getBoundingClientRect();
      
      // 检查鼠标是否在视频元素上
      if (
        e.clientX >= videoRect.left && 
        e.clientX <= videoRect.right && 
        e.clientY >= videoRect.top && 
        e.clientY <= videoRect.bottom
      ) {
        // 计算相对于视频元素的坐标（像素值）
        const relativeX = e.clientX - videoRect.left;
        const relativeY = e.clientY - videoRect.top;
        
        // 计算归一化坐标（0-1范围，便于不同屏幕尺寸之间传输）
        const normalizedX = relativeX / videoRect.width;
        const normalizedY = relativeY / videoRect.height;
        
        // 发送到演讲者（屏幕共享者）
        socket.emit('mouse_position', {
          receiverId: trackReference.participant.identity, // 屏幕共享者的ID
          senderId: localParticipant.identity,
          senderName: localParticipant.name,
          x: normalizedX,
          y: normalizedY,
          timestamp: Date.now()
        });
      }
    };
    
    // 添加节流以减少事件触发频率
    const throttledMouseMove = throttle(handleMouseMove, 50); // 每50ms最多发送一次
    
    // 添加鼠标移动事件监听
    document.addEventListener('mousemove', throttledMouseMove);
    
    // 清理函数
    return () => {
      document.removeEventListener('mousemove', throttledMouseMove);
      console.log("停止跟踪鼠标位置");
    };
  }
  
  // 对于演讲者，可以在这里添加接收和显示其他用户鼠标位置的逻辑
  if (localParticipant.isSpeaking && 
      trackReference.source === Track.Source.ScreenShare &&
      trackReference.participant.identity === localParticipant.identity) {
    console.log("您正在共享屏幕，可以接收其他用户的鼠标位置");
    
    // 在这里可以添加接收鼠标位置的代码
    // socket.on('mouse_position', (data) => {...})
  }
}, [trackReference.source, trackReference.participant.identity, localParticipant.isSpeaking, localParticipant.identity]);

// 节流函数 - 限制函数调用频率
function throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();
    
    if (now - lastRan >= limit) {
      func.apply(context, args);
      lastRan = now;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (now - lastRan));
    }
  };
}
```

## 2. 获取和转换鼠标坐标的不同方法

根据您的需求，以下是几种获取鼠标坐标的方法：

### 2.1 获取相对于视频元素的像素坐标（最常用）

```typescript
// 获取相对于视频元素的坐标（像素值）
const relativeX = e.clientX - videoRect.left;
const relativeY = e.clientY - videoRect.top;
```

### 2.2 获取归一化坐标（便于不同屏幕大小间传输）

```typescript
// 计算归一化坐标（0-1范围）
const normalizedX = relativeX / videoRect.width;
const normalizedY = relativeY / videoRect.height;
```

### 2.3 获取鼠标在视频内的百分比位置

```typescript
// 计算百分比位置（0-100%）
const percentX = (relativeX / videoRect.width) * 100;
const percentY = (relativeY / videoRect.height) * 100;
```

### 2.4 获取相对于视口的坐标

```typescript
// 视口坐标
const viewportX = e.clientX;
const viewportY = e.clientY;
```

### 2.5 获取相对于文档的坐标（考虑滚动）

```typescript
// 文档坐标（考虑页面滚动）
const documentX = e.pageX;
const documentY = e.pageY;
```

## 3. 在 Socket.IO 中发送鼠标位置信息

将鼠标位置信息发送给屏幕共享者:

```typescript
// 发送鼠标位置数据
socket.emit('mouse_position', {
  // 接收者信息
  receiverId: trackReference.participant.identity, // 屏幕共享者的ID
  receiverSocketId: settings[trackReference.participant.identity]?.socketId,
  
  // 发送者信息
  senderId: localParticipant.identity,
  senderName: localParticipant.name,
  
  // 鼠标位置信息
  x: normalizedX,         // X坐标（0-1范围）
  y: normalizedY,         // Y坐标（0-1范围）
  screenWidth: videoRect.width,   // 屏幕宽度
  screenHeight: videoRect.height, // 屏幕高度
  
  // 其他可能需要的信息
  timestamp: Date.now(),  // 时间戳
  click: false            // 是否点击（可以通过click事件另外发送）
});
```

## 4. 完整代码示例

结合以上内容，以下是一个完整的实现，包括发送鼠标位置和点击事件：

```tsx
// 处理当前用户如果是演讲者并且当前track source是screen share，那么就需要获取其他用户的鼠标位置
useEffect(() => {
  // 观看者：监听并发送鼠标位置
  if (trackReference.source === Track.Source.ScreenShare && 
      trackReference.participant.identity !== localParticipant.identity) {
    
    console.log("正在观看他人的屏幕共享，开始跟踪鼠标位置");
    
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // 发送鼠标位置的函数
    const sendMousePosition = (e: MouseEvent, isClick: boolean = false) => {
      const videoRect = videoElement.getBoundingClientRect();
      
      // 检查鼠标是否在视频元素上
      if (
        e.clientX >= videoRect.left && 
        e.clientX <= videoRect.right && 
        e.clientY >= videoRect.top && 
        e.clientY <= videoRect.bottom
      ) {
        // 计算相对坐标
        const relativeX = e.clientX - videoRect.left;
        const relativeY = e.clientY - videoRect.top;
        
        // 计算归一化坐标
        const normalizedX = relativeX / videoRect.width;
        const normalizedY = relativeY / videoRect.height;
        
        // 发送到演讲者
        socket.emit('mouse_position', {
          receiverId: trackReference.participant.identity,
          receiverSocketId: settings[trackReference.participant.identity]?.socketId,
          senderId: localParticipant.identity,
          senderName: localParticipant.name,
          x: normalizedX,
          y: normalizedY,
          screenWidth: videoRect.width,
          screenHeight: videoRect.height,
          click: isClick,
          timestamp: Date.now()
        });
      }
    };
    
    // 鼠标移动处理（节流版本）
    const handleMouseMove = throttle((e: MouseEvent) => {
      sendMousePosition(e, false);
    }, 50);
    
    // 鼠标点击处理
    const handleMouseClick = (e: MouseEvent) => {
      sendMousePosition(e, true);
    };
    
    // 添加事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);
    
    // 清理函数
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
      console.log("停止跟踪鼠标位置");
    };
  }
  
  // 演讲者：接收其他用户的鼠标位置
  if (trackReference.source === Track.Source.ScreenShare &&
      trackReference.participant.identity === localParticipant.identity) {
    console.log("您正在共享屏幕，可以接收其他用户的鼠标位置");
    
    // 监听鼠标位置事件
    socket.on('mouse_position', (data) => {
      console.log("收到用户鼠标位置:", data);
      
      // 这里可以根据需要处理收到的鼠标位置数据
      // 例如：显示其他用户的鼠标指针
    });
    
    // 清理函数
    return () => {
      socket.off('mouse_position');
    };
  }
}, [trackReference.source, trackReference.participant.identity, localParticipant.identity, settings]);
```

## 5. 获取鼠标位置的其他事件和属性

除了基本的 mousemove 事件外，您还可以捕获这些事件来获取更丰富的交互信息：

```typescript
// 鼠标按下事件
document.addEventListener('mousedown', (e) => {
  // 发送鼠标按下信息，包括按下的按钮
  // e.button: 0=左键, 1=中键, 2=右键
});

// 鼠标抬起事件
document.addEventListener('mouseup', (e) => {
  // 发送鼠标抬起信息
});

// 鼠标双击事件
document.addEventListener('dblclick', (e) => {
  // 发送双击信息
});

// 鼠标移入视频区域
videoElement.addEventListener('mouseenter', (e) => {
  // 鼠标进入视频区域
});

// 鼠标移出视频区域
videoElement.addEventListener('mouseleave', (e) => {
  // 鼠标离开视频区域，可以发送一个特殊事件
  // 告诉演讲者隐藏该用户的鼠标指针
});
```

以上代码展示了如何获取用户鼠标位置并通过 Socket.IO 发送到屏幕共享者。您可以根据实际需求调整代码和数据格式，适应您的应用场景。