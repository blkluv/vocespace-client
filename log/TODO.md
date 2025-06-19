- [x] 服务器落地页更新脚本
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

- [x] 用户状态同步失败
- [x] 鼠标移除，用户10s超时移除
- [x] 设置音量绑定失效
- [x] 退出设置后关闭视频获取
- [x] 限制虚拟形象对比
- [x] 本地模糊 (webGL)

- [x] css虚化
- [x] 虚拟形象暂停追踪(该用动画)
- [x] 服务器room数据接口 http://localhost:3000/chat/api/room-settings?all="true"
- [x] 搜索时www.会加上 (在DNS设置中，添加一个CNAME记录，将www.vocespace.com指向vocespace.com)

--- 0.1.4

- [x] 客户端性能检测
- [x] 服务端性能检测
- [x] 聊天传输文件
  - [x] 重写Chat组件
  - [x] socket传输

- [x] 离开按钮移动到最右边
- [x] 状态图标没有正确修改 (设置时正常的，状态没有同步)
- [x] 虚拟形象是否可以去除视频 (实际是不行的，因为虚拟视频的流替换需要原始视频流持续流入)
- [x] 名字修改后没有同步到组件上
- [x] 测试服务器瓶颈

--- 

- [x] 切换布局或开启摄像头时有一瞬间清晰 ❗️
- [x] Blur布局切换时异常 ❗️
- [x] 模型在切换背景后消失 ❗️
- [x] 虚拟形象设置和视频合并 ❗️
- [x] 房间区分
- [x] API用户下线清理
- [x] 完善chat-file

- [x] 屏幕分享其他人首次加载事件很长
由于布局进行切换，通道会进行重新订阅，元素会进行重新加载因此会导致加载延时
- [x] Screen增加video相同滤镜切换效果

- [x] 重新增加虚拟形象切换时的遮罩
- [x] 更换压缩率较低的编解码器
- [x] 调整chat时图片大小 = 文件大小
- [x] 用户自定义状态，提供其他用户被选，其他用户只有可读，不可写 (socket)
- [x] tradition环境进行速度缓慢
- [x] video blur 预览
- [x] 编辑用户名字图标，位置调整
- [x] 按钮外边距调整

- [x] chat输入部分ui调整（b站）
- [x] 新用户新状态同步
- [x] 持续遮罩当切换虚拟形象时
- [x] 虚拟形象移除对比，保留None时blur的对比
- [x] 首页骨架屏
- [x] 重连机制 -> webrtc turn
- [x] 禁止输入框enter事件
- [x] 状态点击事件

- [x] 首页骨架屏调整为400ms, logo png -> insert svg
- [x] 回车直接发送消息 (Chrome)
- [x] 开启后重新加载虚拟形象(setting)
- [x] 虚拟形象替换时，使用遮罩
- [x] focus布局时点击状态修改事件丢失
- [x] Turn 测试 https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/ （测试成功）
- [x] 进入link regex  (特殊字符)

Time 	Type 	Foundation 	Protocol 	Address 	Port 	Priority 	URL (if present) 	relayProtocol (if present)
0.001	host	0	udp	192.168.31.211	52248	126 | 32512 | 255		
0.001	host	3	tcp	192.168.31.211	9	125 | 32704 | 255		
0.002	host	0	udp	192.168.31.211	57546	126 | 32512 | 254		
0.002	host	3	tcp	192.168.31.211	9	125 | 32704 | 254		
0.658	srflx	1	udp	101.83.176.123	57546	100 | 32543 | 254		
0.658	relay	2	udp	158.247.198.2	53072	5 | 32543 | 254		
0.886	Done


- [x] Docker部署
- [x] 视频加载两次（prejoin）video track
- [x] Caddy 
- [x] 自定义错误页面
- [x] 视频教程
- [x] 部署测试基础版本
  
- [x] license服务
- [x] chat增加link跳转 ->hover 之后
- [x] docker - 无虚化 （tradition）
- [x] 时间戳转正常时间

- [x] 文件拖拽发送
- [x] 多次接收文件
- [ ] 模糊混用
- [x] 主持人功能(腾讯视频 参考)
  - [x] 增加房间用户数据 (ownerId)
  - [x] 房间首个用户作为主持人
  - [x] 主持人管理房间
    - [x] 同步成员数据
    - [x] 分离权限
    - [x] 会议成员
    - [x] 成员管理
      - [x] 转让主持人
      - [x] 修改名称
      - [x] 静音
      - [x] 关闭视频
      - [x] 音量调节
      - [x] 视频虚化
      - [x] 屏幕虚化
    - [x] 邀请
      - [x] 视频
      - [x] 音频
      - [x] 屏幕
      - [x] 提醒 wave hand
    - [x] 安全
      - [x] 移除用户
    - [x] 搜索用户 + 用户首字母排序
    - [x] 分享房间
- [x] 优化进入prejoin时间
- [x] 去除face-api.js模型
- [x] 去除未使用资源
- [x] 去除用户部分搜索框上的分割线
- [x] 主持人（host） -> 管理员
- [x] 去除用户之间的分割线
- [x] 头像名称 3个字母
- [x] state i18n
- [x] 录屏 https://docs.livekit.io/home/egress/outputs/#supported-outputs
  - [x] S3账号并构建存储桶
  - [x] 录屏前端功能部分
    - [x] 录屏按钮
    - [x] 录屏请求
      - [x] 主持人直接录屏
      - [x] 参与者请求录屏，主持人同意进行录屏
      - [x] 录屏通知其他人
    - [x] 停止录屏
    - [x] 录屏数据同步
    - [x] 录屏数据记录到room-setting中
    - [x] egress server部署
    - [x] 后端服务
      - [x] 请求egress server
      - [x] 视频存储s3
      - [x] 视频下载链接(需要接入aws s3 api进行链接请求)
      - [x] 视频可下载周期，超过下载周期自动清理 (3天)
        - [x] 设置上传时的标签
- [ ] 清理用户时，意外清理所有房间数据 (暂未排查出原因)
- [ ] 少参与者，多观察者 (Egress 实时传输，站点构建)
- [ ] 用户自定义虚拟形象: 用户提交虚拟形象图片 -> live2d cubism 自动处理 (代码尝试) -> 生成完整动画效果 + 模型数据 -> 存储 -> 返回
- [ ] 录制时无法应用模糊 (录制是直接获取通道的，我们的模糊并没有替换视频而是css模糊)

- [x] server s3
  - [x] 构建客户端
  - [x] 连接
  - [x] 加载配置
  - [x] 列出文件对象
  - [x] 对某个对象生成下载链接
  - [x] 删除
  - [x] 设置自动生命周期策略
  - [x] 请求响应连接到前端
- [x] 使用docker部署egress服务 新服务器
- [x] 将设置按钮移动到more中
- [x] Dashboard显示用户数据
  - [x] 当前活跃房间数据
  - [x] 历史使用记录
    - [x] redis中增加使用记录 
    - [x] roomManager 类管理使用记录 
    - [x] 使用记录api

- [x] 统一主题
  - [x] 鼠标
  - [x] device 按钮
  - [x] 录屏 (无法更改系统录屏方案)
  - [x] leave按钮
- [x] 修复按钮高度差异
- [x] record直接下载 (preview -> download)
- [x] 手机端录屏 (增加手机端允许录屏检测)
- [x] 录屏权限允许会开启声音，指向错误
- [x] chat 自动下滑 失效
  
- [x] socket断开连接导致数据丢失 (转为使用redis)
  - 特点：
    - 房间快速构建，快速关闭
    - 数据无需持久化存储
- [ ] 根据状态区分不同的room （同一状态能看到对方）(tandem)
  - [ ] 尝试Room内对用户之间的通道进行分割 （A <-> B <-> C | D <-> E）
- [ ] 重写MicrophoneTraggle组件
- [ ] 增加复制链接(records)
- [ ] records -> recording
- [ ] 房间（ 设置内 ）内嵌入recording页面表单部分
- [ ] chat，对话位置交换 √

- [x] 翻页功能失效，在小尺寸窗口下(livekit问题)
- [ ] chat增加消息提醒 √
- [ ] chat内容无法追溯历史 (使用redis) √ 
- [x] 共享屏幕系统色
- [x] 去除无用文件和代码  
- [ ] safari浏览器显示标签页概览截图丢失模糊度： 缩小化模糊度丢失 (模糊度只是用css进行处理，后续处理为GPU渲染)


chat 合 space.voce.chat
- [ ] screen share audio 关闭 （放入设置）
- [ ] 设置持久化到localstorage
- [ ] 设置，新用户加入时的提醒音

- [ ] 性能测试:
```
lk load-test \
  --url <YOUR-SERVER-URL> \
  --api-key <YOUR-KEY> \
  --api-secret <YOUR-SECRET> \
  --room load-test \
  --video-publishers 30 \
  --subscribers 30

lk load-test \
  --url wss://meeting.vocespace.com \
  --api-key API6pvau5u8DWf4 \
  --api-secret x7KIub0p6OKmzYzhlXYeJnAQX1VVkHk0ahIRUdzLp0J \
  --room load-test \
  --video-publishers 30 \
  --subscribers 30

```

```
Track loading:
┌────────┬───────────────────┬───────┬───────┬───────────┬────────────────┐
│ Tester │ Track             │ Kind  │ Pkts. │ Bitrate   │ Pkt. Loss      │
├────────┼───────────────────┼───────┼───────┼───────────┼────────────────┤
│ Sub 0  │ TR_VCngHdnMLgaND5 │ video │ 60    │ 727bps    │ 7 (10.448%)    │
│        │ TR_VCgQBu3GWRg8ZC │ video │ 98    │ 1.5kbps   │ 302 (75.5%)    │
│        │ TR_VCZYBXWxtdCaCX │ video │ 270   │ 6.3kbps   │ 97 (26.431%)   │
│        │ TR_VCKmPkcHhch7N4 │ video │ 19    │ 0bps      │ 0 (0%)         │
│        │ TR_VCmAwFX6X3ZdvQ │ video │ 28    │ 421bps    │ 100 (78.125%)  │
│        │                   │       │       │           │                │
│ Sub 1  │ TR_VCgQBu3GWRg8ZC │ video │ 10    │ 0bps      │ 0 (0%)         │
│        │ TR_VCDKrVZhvfHKYm │ video │ 302   │ 12.1kbps  │ 4 (1.307%)     │
│        │ TR_VChHAEpr7xPyxR │ video │ 116   │ 2.7kbps   │ 10 (7.937%)    │
│        │ TR_VCe5nXPRAXaRaA │ video │ 109   │ 3.5kbps   │ 49 (31.013%)   │
│        │ TR_VCaQQYtQEAEnCc │ video │ 2     │ 0bps      │ 0 (0%)         │
│        │ TR_VCngHdnMLgaND5 │ video │ 64    │ 977bps    │ 6 (8.571%)     │
│        │ TR_VCZYBXWxtdCaCX │ video │ 74    │ 1.4kbps   │ 4 (5.128%)     │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 11 │ TR_VCiL4cpmyB4PpT │ video │ 212   │ 9.3kbps   │ 373 (63.761%)  │
│        │ TR_VCe5nXPRAXaRaA │ video │ 419   │ 22.3kbps  │ 177 (29.698%)  │
│        │                   │       │       │           │                │
│ Sub 12 │ TR_VCagk6nXQCmK7N │ video │ 178   │ 3.5kbps   │ 143 (44.548%)  │
│        │ TR_VCHpPnNke5vPa9 │ video │ 111   │ 2.3kbps   │ 0 (0%)         │
│        │ TR_VC2B6AJRSADbs7 │ video │ 46    │ 1.2kbps   │ 34 (42.5%)     │
│        │ TR_VCp9RWEe5Y8tnU │ video │ 101   │ 1.2kbps   │ 12 (10.619%)   │
│        │ TR_VCiEg5KeY8b44Z │ video │ 210   │ 4.2kbps   │ 184 (46.701%)  │
│        │                   │       │       │           │                │
│ Sub 13 │ TR_VC9QuYFKd4Lqug │ video │ 319   │ 6.8kbps   │ 570 (64.117%)  │
│        │ TR_VCe5nXPRAXaRaA │ video │ 25    │ 246bps    │ 17 (40.476%)   │
│        │ TR_VCagk6nXQCmK7N │ video │ 85    │ 826bps    │ 22 (20.561%)   │
│        │ TR_VC9nRWxuRDuPJg │ video │ 67    │ 344bps    │ 16 (19.277%)   │
│        │ TR_VCPrGr7hskXWWq │ video │ 163   │ 3.0kbps   │ 120 (42.403%)  │
│        │ TR_VCdFKPpwTJNZEM │ video │ 33    │ 0bps      │ 0 (0%)         │
│        │ TR_VC7MG9MvAtV5Eu │ video │ 35    │ 122bps    │ 0 (0%)         │
│        │ TR_VCiL4cpmyB4PpT │ video │ 143   │ 4.4kbps   │ 91 (38.889%)   │
│        │                   │       │       │           │                │
│ Sub 14 │ TR_VC67Wx8CDmCzUo │ video │ 188   │ 10.2kbps  │ 25 (11.737%)   │
│        │ TR_VCRzZoYgn5Taye │ video │ 346   │ 8.0kbps   │ 178 (33.969%)  │
│        │ TR_VCagk6nXQCmK7N │ video │ 35    │ 294bps    │ 7 (16.667%)    │
│        │                   │       │       │           │                │
│ Sub 15 │ TR_VCMpvY3TRFPDu4 │ video │ 4     │ 0bps      │ 0 (0%)         │
│        │ TR_VCe6UVt2d9Wz6q │ video │ 161   │ 7.4kbps   │ 298 (64.924%)  │
│        │ TR_VC2B6AJRSADbs7 │ video │ 138   │ 5.8kbps   │ 247 (64.156%)  │
│        │ TR_VCZNfHpqsfku2F │ video │ 124   │ 4.9kbps   │ 48 (27.907%)   │
│        │ TR_VChHAEpr7xPyxR │ video │ 78    │ 2.0kbps   │ 51 (39.535%)   │
│        │                   │       │       │           │                │
│ Sub 16 │ TR_VCp9RWEe5Y8tnU │ video │ 834   │ 17.8kbps  │ 793 (48.74%)   │
│        │ TR_VCiEg5KeY8b44Z │ video │ 1329  │ 31.1kbps  │ 2880 (68.425%) │
│        │ TR_VC9nRWxuRDuPJg │ video │ 383   │ 6.3kbps   │ 107 (21.837%)  │
│        │ TR_VCHpPnNke5vPa9 │ video │ 902   │ 19.6kbps  │ 818 (47.558%)  │
│        │ TR_VCgQBu3GWRg8ZC │ video │ 1648  │ 38.6kbps  │ 3284 (66.586%) │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 18 │ TR_VCDKrVZhvfHKYm │ video │ 653   │ 33.3kbps  │ 48 (6.847%)    │
│        │ TR_VCbVE6ChzcKcUG │ video │ 1936  │ 80.7kbps  │ 4371 (69.304%) │
│        │ TR_VCMpvY3TRFPDu4 │ video │ 2409  │ 103.7kbps │ 5182 (68.265%) │
│        │ TR_VCca3CDPthSmJv │ video │ 545   │ 18.2kbps  │ 189 (25.749%)  │
│        │                   │       │       │           │                │
│ Sub 19 │ TR_VCgS4DwZnhGhKi │ video │ 112   │ 6.4kbps   │ 213 (65.538%)  │
│        │ TR_VCx8qPG5xTpPhE │ video │ 3     │ 0bps      │ 0 (0%)         │
│        │ TR_VCiKKyqddz2Lae │ video │ 539   │ 23.5kbps  │ 1301 (70.707%) │
│        │ TR_VCagk6nXQCmK7N │ video │ 158   │ 3.7kbps   │ 244 (60.697%)  │
│        │ TR_VCca3CDPthSmJv │ video │ 573   │ 25.4kbps  │ 599 (51.109%)  │
│        │ TR_VCbVE6ChzcKcUG │ video │ 810   │ 36.0kbps  │ 1832 (69.341%) │
│        │                   │       │       │           │                │
│ Sub 2  │ TR_VCp9RWEe5Y8tnU │ video │ 93    │ 1.3kbps   │ 11 (10.577%)   │
│        │ TR_VCZNfHpqsfku2F │ video │ 18    │ 0bps      │ 0 (0%)         │
│        │ TR_VChHAEpr7xPyxR │ video │ 4     │ 0bps      │ 0 (0%)         │
│        │ TR_VCgQBu3GWRg8ZC │ video │ 8     │ 0bps      │ 0 (0%)         │
│        │ TR_VCmAwFX6X3ZdvQ │ video │ 1     │ 0bps      │ 0 (0%)         │
│        │ TR_VCaQQYtQEAEnCc │ video │ 10    │ 0bps      │ 0 (0%)         │
│        │ TR_VCiL4cpmyB4PpT │ video │ 9     │ 571bps    │ 0 (0%)         │
│        │ TR_VCKmPkcHhch7N4 │ video │ 64    │ 231bps    │ 0 (0%)         │
│        │ TR_VCMpvY3TRFPDu4 │ video │ 10    │ 0bps      │ 0 (0%)         │
│        │ TR_VChvzLeLHtiKLQ │ video │ 335   │ 6.9kbps   │ 805 (70.614%)  │
│        │ TR_VCrjcrUc8NZMtv │ video │ 254   │ 4.1kbps   │ 16 (5.926%)    │
│        │ TR_VCZYBXWxtdCaCX │ video │ 38    │ 0bps      │ 0 (0%)         │
│        │ TR_VCDKrVZhvfHKYm │ video │ 3     │ 123bps    │ 0 (0%)         │
│        │ TR_VCngHdnMLgaND5 │ video │ 201   │ 3.1kbps   │ 10 (4.739%)    │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 21 │ TR_VC2AKkmVuwMPYZ │ video │ 106   │ 1.3kbps   │ 1 (0.935%)     │
│        │ TR_VC67Wx8CDmCzUo │ video │ 128   │ 4.3kbps   │ 25 (16.34%)    │
│        │ TR_VCPrGr7hskXWWq │ video │ 240   │ 5.0kbps   │ 202 (45.701%)  │
│        │ TR_VCTrxLsgVbCztV │ video │ 192   │ 3.2kbps   │ 12 (5.882%)    │
│        │ TR_VCquN83ahZGCee │ video │ 323   │ 5.4kbps   │ 17 (5%)        │
│        │ TR_VCNEeFw5eKNjgc │ video │ 127   │ 1.5kbps   │ 32 (20.126%)   │
│        │ TR_VCGoVmzPrvgVJQ │ video │ 59    │ 1.5kbps   │ 0 (0%)         │
│        │ TR_VCdFKPpwTJNZEM │ video │ 32    │ 0bps      │ 0 (0%)         │
│        │ TR_VCTupThvVtMDPz │ video │ 114   │ 1.9kbps   │ 245 (68.245%)  │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 24 │ TR_VCiEg5KeY8b44Z │ video │ 210   │ 3.5kbps   │ 44 (17.323%)   │
│        │ TR_VCHpPnNke5vPa9 │ video │ 428   │ 8.9kbps   │ 422 (49.647%)  │
│        │ TR_VCTNQN7A6kWzyp │ video │ 402   │ 8.1kbps   │ 78 (16.25%)    │
│        │ TR_VCsrBNXRjnysrG │ video │ 484   │ 11.1kbps  │ 1128 (69.975%) │
│        │ TR_VCgQBu3GWRg8ZC │ video │ 256   │ 4.0kbps   │ 20 (7.246%)    │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 26 │ TR_VCiKKyqddz2Lae │ video │ 174   │ 4.7kbps   │ 330 (65.476%)  │
│        │ TR_VCHpPnNke5vPa9 │ video │ 165   │ 3.5kbps   │ 132 (44.444%)  │
│        │ TR_VCaQQYtQEAEnCc │ video │ 210   │ 13.5kbps  │ 520 (71.233%)  │
│        │ TR_VCSzvmBcarWiL5 │ video │ 15    │ 214bps    │ 0 (0%)         │
│        │ TR_VCgQBu3GWRg8ZC │ video │ 113   │ 2.5kbps   │ 18 (13.74%)    │
│        │ TR_VCHLPYubHgvsMt │ video │ 116   │ 2.5kbps   │ 10 (7.937%)    │
│        │ TR_VCTNQN7A6kWzyp │ video │ 102   │ 1.8kbps   │ 1 (0.971%)     │
│        │ TR_VCiEg5KeY8b44Z │ video │ 107   │ 1.6kbps   │ 63 (37.059%)   │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 28 │ TR_VCx8qPG5xTpPhE │ video │ 48    │ 24bps     │ 0 (0%)         │
│        │ TR_VCwcAy7dYDAyqy │ video │ 63    │ 1.3kbps   │ 12 (16%)       │
│        │                   │       │       │           │                │
│ Sub 29 │ TR_VCiKKyqddz2Lae │ video │ 139   │ 3.6kbps   │ 222 (61.496%)  │
│        │ TR_VCgS4DwZnhGhKi │ video │ 661   │ 45.1kbps  │ 1378 (67.582%) │
│        │ TR_VCiL4cpmyB4PpT │ video │ 920   │ 30.7kbps  │ 84 (8.367%)    │
│        │                   │       │       │           │                │
│ Sub 3  │ TR_VCagk6nXQCmK7N │ video │ 588   │ 12.9kbps  │ 1431 (70.877%) │
│        │                   │       │       │           │                │
│ Sub 4  │ TR_VCSzvmBcarWiL5 │ video │ 38    │ 187bps    │ 0 (0%)         │
│        │ TR_VC67Wx8CDmCzUo │ video │ 91    │ 2.5kbps   │ 4 (4.211%)     │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 6  │ TR_VCp9RWEe5Y8tnU │ video │ 16    │ 195bps    │ 0 (0%)         │
│        │ TR_VCMpvY3TRFPDu4 │ video │ 3     │ 123bps    │ 0 (0%)         │
│        │ TR_VCe6UVt2d9Wz6q │ video │ 6     │ 0bps      │ 0 (0%)         │
│        │ TR_VC2B6AJRSADbs7 │ video │ 35    │ 0bps      │ 0 (0%)         │
│        │ TR_VCZNfHpqsfku2F │ video │ 3     │ 1bps      │ 0 (0%)         │
│        │ TR_VCiEg5KeY8b44Z │ video │ 21    │ 0bps      │ 0 (0%)         │
│        │ TR_VCLoUXc3dgjs6L │ video │ 1770  │ 75.2kbps  │ 4192 (70.312%) │
│        │ TR_VC9nRWxuRDuPJg │ video │ 60    │ 1.1kbps   │ 66 (52.381%)   │
│        │ TR_VCHpPnNke5vPa9 │ video │ 6     │ 0bps      │ 0 (0%)         │
│        │ TR_VChHAEpr7xPyxR │ video │ 36    │ 0bps      │ 0 (0%)         │
│        │                   │       │       │           │                │
│        │                   │       │       │           │                │
│ Sub 8  │ TR_VCRzZoYgn5Taye │ video │ 13    │ 0bps      │ 0 (0%)         │
│        │                   │       │       │           │                │
│ Sub 9  │ TR_VCHpPnNke5vPa9 │ video │ 878   │ 18.6kbps  │ 829 (48.565%)  │
│        │ TR_VCaQQYtQEAEnCc │ video │ 89    │ 3.0kbps   │ 139 (60.965%)  │
│        │ TR_VC7MG9MvAtV5Eu │ video │ 775   │ 27.8kbps  │ 1569 (66.937%) │
│        │ TR_VCx8qPG5xTpPhE │ video │ 52    │ 337bps    │ 43 (45.263%)   │
│        │ TR_VCiEg5KeY8b44Z │ video │ 1120  │ 25.4kbps  │ 2398 (68.164%) │
│        │ TR_VCagk6nXQCmK7N │ video │ 275   │ 4.7kbps   │ 101 (26.862%)  │
│        │ TR_VCgQBu3GWRg8ZC │ video │ 1389  │ 32.4kbps  │ 2837 (67.132%) │
└────────┴───────────────────┴───────┴───────┴───────────┴────────────────┘

Subscriber summaries:
┌────────┬─────────┬──────────────────────────┬─────────────────┬─────────────────────────────────┐
│ Tester │ Tracks  │ Bitrate                  │ Total Pkt. Loss │ Error                           │
├────────┼─────────┼──────────────────────────┼─────────────────┼─────────────────────────────────┤
│ Sub 0  │ 5/30    │ 7.3kbps                  │ 506 (51.58%)    │ -                               │
│ Sub 1  │ 7/30    │ 10.0kbps                 │ 73 (9.733%)     │ -                               │
│ Sub 10 │ 0/30    │ NaNmbps                  │  -              │ -                               │
│ Sub 11 │ 2/30    │ 31.6kbps                 │ 550 (46.571%)   │ -                               │
│ Sub 12 │ 5/30    │ 11.0kbps                 │ 373 (36.605%)   │ -                               │
│ Sub 13 │ 8/30    │ 14.0kbps                 │ 836 (49.004%)   │ -                               │
│ Sub 14 │ 3/30    │ 11.6kbps                 │ 210 (26.958%)   │ -                               │
│ Sub 15 │ 5/30    │ 12.7kbps                 │ 644 (56.049%)   │ -                               │
│ Sub 16 │ 5/30    │ 113.5kbps                │ 7882 (60.734%)  │ -                               │
│ Sub 17 │ 0/30    │ NaNmbps                  │  -              │ -                               │
│ Sub 18 │ 4/30    │ 226.1kbps                │ 9790 (63.849%)  │ -                               │
│ Sub 19 │ 6/30    │ 45.6kbps                 │ 4189 (65.617%)  │ -                               │
│ Sub 2  │ 14/30   │ 15.4kbps                 │ 842 (44.55%)    │ -                               │
│ Sub 20 │ 0/30    │ NaNmbps                  │  -              │ -                               │
│ Sub 21 │ 9/30    │ 21.2kbps                 │ 534 (28.787%)   │ -                               │
│ Sub 22 │ 0/30    │ NaNmbps                  │  -              │ could not connect after timeout │
│ Sub 23 │ 0/30    │ NaNmbps                  │  -              │ -                               │
│ Sub 24 │ 5/30    │ 35.6kbps                 │ 1692 (48.733%)  │ -                               │
│ Sub 25 │ 0/30    │ NaNmbps                  │  -              │ -                               │
│ Sub 26 │ 8/30    │ 21.8kbps                 │ 1074 (51.734%)  │ -                               │
│ Sub 27 │ 0/30    │ NaNmbps                  │  -              │ -                               │
│ Sub 28 │ 2/30    │ 1.1kbps                  │ 12 (9.756%)     │ -                               │
│ Sub 29 │ 3/30    │ 52.4kbps                 │ 1684 (49.471%)  │ -                               │
│ Sub 3  │ 1/30    │ 12.9kbps                 │ 1431 (70.877%)  │ -                               │
│ Sub 4  │ 2/30    │ 2.7kbps                  │ 4 (3.008%)      │ -                               │
│ Sub 5  │ 0/30    │ NaNmbps                  │  -              │ could not connect after timeout │
│ Sub 6  │ 10/30   │ 53.1kbps                 │ 4258 (68.523%)  │ -                               │
│ Sub 7  │ 0/30    │ NaNmbps                  │  -              │ could not connect after timeout │
│ Sub 8  │ 1/30    │ 0bps                     │ 0 (0%)          │ -                               │
│ Sub 9  │ 7/30    │ 98.5kbps                 │ 7916 (63.358%)  │ -                               │
│ Total  │ 112/900 │ 561.5kbps (18.7kbps avg) │ 44500 (58.589%) │                                 │
└────────┴─────────┴──────────────────────────┴─────────────────┴─────────────────────────────────┘
```