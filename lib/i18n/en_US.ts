export default {
  common: {
    confirm: '确认',
    cancel: '取消',
    alert: '提示',
    attention: '注意',
    warning: '警告',
    error: '错误',
    success: '成功',
    info: '信息',
    unknown: '未知',
    loading: '加载中...',
    no_data: '暂无数据',
    no_more: '没有更多了',
    demo: '演示',
    custom: '自定义',
    start_metting: 'Start Meeting',
    join_room: "Join Room",
    passphrase: "Passphrase",
    device: {
        microphone: "Mircophone",
        camera: "Camera",
        screen: "Screen",
    }
  },
  msg: {
    info: {
      title: 'Self-hosted open source video conferencing app built on LiveKit, By Privoce',
      contact: 'Contact',
      learn_more: 'to learn more',
      try_free: 'Try Voce Space for free with our live demo project.',
      connect_with_server: "Connect Voce Space with a custom server using Voce Space Server.",
      enabled_e2ee: 'Enable end-to-end encryption',
    },
    error: {
      e2ee: {
        unsupport: '您正在尝试加入加密会议，但您的浏览器不支持该功能。请将其更新至最新版本并重试。',
      },
      room: {
        unexpect: '遇到意外错误，请检查控制台日志了解详细信息。',
        network: '连接错误，请检查您的网络连接并重试。',
      },
      device: {
        in_use: '设备已被占用，请检查其他应用程序是否正在使用它。',
        not_found: '未找到设备，请检查设备是否连接并重试。',
        permission_denied: '权限访问被拒绝',
        permission_denied_desc: '未获得设备访问权限，请检查浏览器设置。',
        permission_denied_title: '设备访问权限被拒绝',
        other: '设备错误，请检查设备连接并重试。',
        granted: '权限被拒绝。请在浏览器设置中手动允许访问摄像头, 麦克风以及屏幕共享。',
      },
      other: {
        permission: '请求权限失败。',
      },
    },
    request: {
      device: {
        title: '设备访问权限',
        desc: '若您需要开启设备访问权限，请点击下方`允许授权`按钮。',
        allow: '允许授权',
        deny: '拒绝授权',
        waiting: '请求中...',
        ask: '需要访问您的摄像头和麦克风，请选择`允许`授权以继续使用。',
        permission: {
          how: '如何开启权限？',
          changed_with_reload: '权限更改后，您可能需要刷新页面才能生效。',
          set_on_hand: '如果您之前拒绝了权限，您可能需要在浏览器设置中手动允许它们。',
          chrome_edge: [
            '点击浏览器地址栏左侧的锁定图标',
            '选择`网站设置`',
            '在`摄像头`和`麦克风`下拉菜单中选择`允许`',
            '刷新页面',
          ],
          firefox: [
            '点击浏览器地址栏左侧的锁定图标',
            '点击`连接安全`',
            '选择`更多信息`',
            '在`权限`下拉菜单中选择`允许`',
            '刷新页面',
          ],
          safari: [
            '打开 Safari 偏好设置 (Safari菜单或右上角的齿轮图标)',
            '选择`网站`选项卡',
            '在`摄像头`和`麦克风`下拉菜单中选择`允许`',
            '刷新页面',
          ],
          other: '请查看浏览器帮助文档以获取更多信息。',
        },
      },
    },
    success: {
      device: {
        granted: '已成功授予媒体权限。',
      },
    },
  },
};
