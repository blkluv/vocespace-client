- [x] 服务器落地页更新脚本
- [ ] 录屏 https://docs.livekit.io/home/egress/outputs/#supported-outputs
- [ ] 聊天，文件传输
- [ ] 少参与者，多观察者 (Egress 实时传输，站点构建)

- [x] 用户状态使用用户id隔离 (服务器)
- [x] wave hand该用服务器通信
- [x] select 组件hover效果
- [x] 虚拟形象去除开始启动

- [x] 用户名改为 User [01~99]
- [x] 用户状态通过服务器同步
- [x] 虚拟视频使用用户id隔离


- [x] 虚拟形象页面UI优化
- [x] 虚拟形象丢失（重更新后消失）

- [x] 屏幕分享时传输其他用户鼠标位置
- [x] 区分用户显示虚拟形象
- [x] 同步修改用户视频模糊
- [x] 同步修改用户屏幕分享模糊度

- [x] focus视图无需点击就能传输用户鼠标位置
- [x] 让所有人共享鼠标位置视图
- [x] 开启虚拟形象之后其他用户会变黑
- [x] 开启按钮改为model - none

- [x] 鼠标位置同步(cover content获取video组件的宽高进行映射比例)
- [x] wave 双方都要发出声音提示
- [x] 设置页，点击外部遮罩关闭
- [x] 声音改为用户输入声音音量
- [x] 进入房间i18n修改

- [x] 鼠标离开去除
- [x] 默认prejoin页面聚焦用户名输入框
- [x] 虚拟形象层级低于触发层
- [x] 用户状态处理
- [x] PreJoin骨架屏
- [x] tradition，去除Screen Share模糊度
- [x] 用户鼠标颜色

- [x] 多个人开启虚拟形象之后，上一个人的会消失
- [ ] 聊天传输文件
  - [x] 重写Chat组件
  - [ ] socket传输
- [ ] 视图模糊同步问题 可能是identity判断有问题或者是视图切换时同步不及时 (尝试本地模糊后传输视频流)
- [ ] 用户自定义状态，提供其他用户被选，其他用户只有可读，不可写 (socket)
- [ ] 根据状态区分不同的room （同一状态能看到对方）(tandem)

- [x] 用户状态同步失败
- [x] 鼠标移除，用户10s超时移除
- [x] 设置音量绑定失效
- [ ] 退出设置后关闭视频获取

原始  -> 跟踪本地用户的脸 -> 模型 -> texture + canvas  -> 虚拟视频流 -> 替换原始视频流

远程流 -> (跟踪本地用户的脸 -> 模型 -> texture + canvas  -> 虚拟视频流 ) -> 顶掉本地用户

判断 远程｜原始

WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
WebGL warning: bindTexture: `tex` is from a different (or lost) WebGL context.
WebGL warning: bindBuffer: `buffer` is from a different (or lost) WebGL context. 3
After reporting 32, no further warnings will be reported for this WebGL context.
WebGL warning: drawElementsInstanced: Index buffer not bound. 32
After reporting 32, no further warnings will be reported for this WebGL context.
Failed to loadMotionSync(). Use default fallback. 2 stream.es.js:147
virtualEnabled false bar.tsx:210:14
WebGL context was lost.