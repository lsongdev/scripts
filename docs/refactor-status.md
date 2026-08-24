# 重构执行状态

更新日期：2026-08-24

本文记录 [`web-stdlib-roadmap.md`](./web-stdlib-roadmap.md) 的执行结果。路线图第 1—4 节保留重构前基线；当前可信事实以本文和 [`modules.md`](./modules.md) 为准。

## 当前距离

“目标”需要分成两个阶段，否则百分比会混淆：

| 目标 | 当前完成度 | 尚缺的决定性证据 |
| --- | ---: | --- |
| 最小可信 v0.x | 约 80% | 删除模块恢复审计、首次 CI 证据、最终 stable 裁决、不可变发布 URL |
| 成熟 v1 stdlib | 约 45% | 多下游验证、长期版本治理、完整权限/设备/资源清理证据 |

这些百分比不是代码量。目录和核心实现已经越过最危险的混杂阶段，但“测试过的 candidate”仍不等于“承诺长期维护的 stable”。现在最大的距离是发布证据和真实下游使用，而不是继续扩充 helper。

## 已完成

- 根目录 JavaScript 入口已清零，能力代码按 Web capability 归档。
- `elements/`、`adapters/preact/`、`integrations/`、`labs/` 与 `vendor/` 已和核心分层。
- 删除根级转发文件、空模块、语言原生能力重实现、XHR Fetch 仿制、旧硬件壳和浏览器前缀 fallback；原残缺 MD5 已由完整、明确非安全用途的实现替换。
- 核心不再依赖可选层、实验层或 vendor；仓库检查会阻止该依赖方向回退。
- DOM 核心已拆为 query、events、nodes、form-data、dialog 叶子模块；尚未解决定位与多指针契约的 movable/resizable 已迁至 `labs/dom/`。
- router、WebSocket、media capture、files、geolocation、serial、notifications、storage、streams、encoding 和 Web Crypto 已按标准对象语义重写。
- 原 `audio.js` 已恢复并拆层：通用 Web Audio 原语进入 `media/audio.js` candidate，游戏/环境音配方进入 `labs/audio/`；零增益、pink-noise 状态和清理句柄问题已修正。
- `time.js` 已恢复为 `datetime/format.js`：无效日期显式失败、UTC/IANA 时区统一走 Intl，duration 保留方向；UI 改为跨引擎 autonomous `x-time` 并显式注册。
- camera/video 已恢复为 `media/video.js` 与 autonomous `camera-view`：导入和连接 DOM 都不请求权限，只有显式 `start()` 获取标准 MediaStream，停止与断开会释放资源。
- 长生命周期 API 优先采用 `AbortSignal`，订阅型 API 同时返回 disposer。
- 普通 DOM 构造默认接受文本或 Node；字符串 HTML 只通过名称含 `Unsafe` 的显式入口进入。
- Web Components 改为显式 `defineXxx()`；导入不再自动注册。
- Preact 依赖改为 bare specifier，由下游 import map 明确固定版本；核心不暗中选择 CDN。
- 第三方 `marked` 源码已隔离并记录版本与许可证；来源不清或证据不足的实现留在 `labs/`。
- 首轮曾以“仓内无使用方”为理由删除若干模块；维护者确认存在外部 URL 使用后，该推断已撤回，逐文件恢复状态见 [`deleted-module-audit.md`](./deleted-module-audit.md)。
- `elements/` 已收缩为经过浏览器 smoke test 的 define/icon/progressbar/tabs；`labs/elements/` 只保留依赖精确 vendor snapshot 的 QR 实验，其余无使用方 UI 草稿已删除。
- 修改过且无法准确标识版本的 QR 源码副本已替换为 `vendor/qr/` 中未修改的 `qr@0.6.0` 发布快照，并记录 tarball integrity、逐文件哈希和双许可证。
- audio、time、camera/video、YAML 与 MD5 已按新边界恢复；graphics、Bech32、CSR、HTML runtime、animation 和其余 UI/应用能力进入恢复队列，不把历史缺陷原样带回。
- customized built-in table/copy 实验在 Chromium 成功、WebKit 不升级；因此已连同示例删除，不添加引擎分支或第二套兼容组件模型。受限浏览器矩阵或 autonomous component 的选择由下游承担。
- 已建立 57 个 Node 契约测试和 17 个浏览器契约测试；19 个代表性示例页进入自动 smoke test。新增真实 timer/AbortSignal、Web Crypto/Web Audio、datetime、MediaStream/video/camera 生命周期、ShadowRoot/Document XPath、History/URLPattern、File、Web Streams、本地 WebSocket server 与授权 Geolocation 引擎证据。
- `npm run check` 统一执行语法、相对导入、HTML 本地资源、根目录结构、核心依赖方向、Node 契约测试和 Chromium/WebKit 测试。
- CI workflow 使用锁定 commit 的 Actions，配置为在 Firefox 上补充执行同一套跨浏览器测试并保留报告；首次远端运行结果仍待观察。

## 当前目录契约

```text
Web Platform
    ↑
async browser crypto devices dom encoding files media navigation net storage streams
    ↑
elements adapters integrations examples

labs    未获得发布承诺的实验（包括 UI movement/resize 与 QR）
vendor  隔离的第三方源码
```

核心目录中的文件只能依赖核心目录或 Web Platform。`labs/` 不是依赖地基；可选组件若暂时依赖实验实现，该组件也不能被视为稳定适配器。

## 下一阶段计划

### P0：形成可发布的最小表面

1. 复核 [`api-contracts.md`](./api-contracts.md) 中收敛出的首批 16 个叶子模块；在发布条件满足前仍保持 candidate。
2. 把统一契约拆成每个 stable 文件的最终 API 文档和可执行示例。
3. 观察首次 CI 的三引擎结果，修复运行环境或标准行为问题；不以兼容分支吞掉差异。
4. 保持公开入口清单和全部可执行示例与 smoke test manifest 同步。
5. 项目许可证已确定并写入 MIT；发布前继续核对所有 vendor/依赖的许可证边界。
6. 确定不可变发布方案和版本号，发布首个语义化 tag。

### P1：补足浏览器特有证据

1. 深化 Web Streams backpressure 与异常清理用例；ShadowRoot/Document XPath、History API、File 和基础 Web Streams 已有真实浏览器证据。
2. 为 Notification、Geolocation、MediaDevices、Serial 等权限能力建立可控制的测试策略。
3. 深化真实 WebSocket server 的连接失败、异常关闭与背压用例；连接、消息事件和 AbortSignal 正常关闭已有浏览器证据。
4. 深化 movable/resizable 的 pointer capture、多指针、边界与清理测试；证据不足前继续标为 experimental。

当前 Playwright harness 接受 Notification permission grant，但 Chromium/WebKit 页面中的 `Notification.permission` 并未变为 `granted`。这不算真实权限证据；在测试环境能提供原生状态前保持 deferred，不以 mock 冒充浏览器覆盖。

### P2：缩减实验与可选层

1. 逐个审查剩余 `labs/elements/`；QR 在满足独立契约前保持 experimental。
2. 评估 QR elements 是否应迁出独立版本域；第三方算法本身只以精确 vendor snapshot 存在。
3. 继续删除已被平台或核心模块覆盖、且没有独立下游证据的实验代码。
4. 为 integrations 明确分页、限流、认证和 API 版本责任；它们不进入 stdlib core。

### P3：用下游证据决定 v1

1. 每个新增核心能力至少收集两个真实项目中的重复使用证据。
2. 记录破坏性变化，使用新版本 URL 解决；不在核心里叠加旧签名、旧路径或旧浏览器分支。
3. 连续多个版本验证核心规模稳定、可选层可删除、文档示例全部可执行后，再讨论 v1。

## 下游兼容 TODO

这些冲突不能反向改变核心设计：

- 仍引用旧根路径的应用迁移到新叶子 URL；不恢复 forwarding 文件。
- 仍需要旧浏览器或前缀 API 的应用自行维护 compatibility adapter/polyfill。
- 依赖组件自动注册的页面显式调用 `defineXxx()`。
- 依赖字符串 `innerHTML` helper 的代码改为 Node/DocumentFragment，或显式承担 unsafe HTML 净化责任。
- 依赖 customized built-in elements 的宿主自行评估浏览器部署条件；核心不为其制造另一套组件模型。
- 需要 Preact、YAML、ASN.1 等外部依赖的应用通过 import map 或独立包锁定精确版本。

## 完成定义

本次目录重构已经完成；API 重构进入“候选验证”阶段。只有 P0 全部完成，项目才可称为最小可信版本；只有 P1—P3 形成长期证据，才接近理想的成熟 stdlib。
