# 使用 ClawWork PWA

ClawWork PWA 是基于浏览器的版本，可在任何设备上运行——桌面、平板或手机。无需安装。

## 什么是 ClawWork PWA？

ClawWork PWA（渐进式 Web 应用）与桌面应用共享相同的核心逻辑——Store、Service 和网关协议。它完全在浏览器中运行，通过 WebSocket 连接 OpenClaw 网关。数据存储在 IndexedDB 中（而非 SQLite），设备密钥由浏览器存储管理。

## 打开与安装

1. 在任意现代浏览器（Chrome、Safari、Edge、Firefox）中打开 [cpwa.pages.dev](https://cpwa.pages.dev)
2. 应用会立即加载——无需安装
3. 移动端安装：点击浏览器的**添加到主屏幕**选项
4. 桌面端安装：点击浏览器地址栏中的安装图标
5. 安装后，ClawWork PWA 可像原生应用一样启动，并支持离线访问

## 连接网关

1. 打开应用，进入**设置**页面
2. 使用与桌面应用相同的方式添加网关（Token、密码或配对码）
3. 输入网关 WebSocket URL——必须从你的浏览器网络可达
4. 本地网关（`ws://127.0.0.1:18789`）需要在同一台机器上使用
5. 远程网关请使用完整 URL（如 `wss://gateway.example.com:18789`）

## PWA 中的配对码

PWA 支持与桌面应用相同的配对码流程，唯一区别是：需要手动粘贴 setup code，无法扫描二维码。

1. 从网关管理员处获取 setup code
2. 粘贴到配对码输入框——URL 和 Token 会自动提取
3. 开始配对流程，等待管理员批准
4. 批准后，设备 Token 保存在浏览器的 IndexedDB 中

## 使用提示

- PWA 支持离线浏览缓存数据，但与网关通信需要网络连接
- 浏览器存储（IndexedDB）绑定到域名——清除浏览器数据会重置网关配置和设备身份
- 为获得最佳移动体验，建议将 PWA 安装到主屏幕，以全屏模式运行
- PWA 和桌面应用可以同时连接同一个网关——各自拥有独立的设备身份
