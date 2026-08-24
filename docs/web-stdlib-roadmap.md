# Web Standard Library：现状评估与演进规划

> 评估基准：**Use the Web. Fill the gaps. Own nothing.**  
> 设计原则：按照“应该如何做、怎样才是最好”定义核心；现实兼容冲突只登记为下游 TODO，不进入核心实现。

> 本文第 1—4 节记录重构启动时的基线。当前模块状态与已经完成的迁移以 [`modules.md`](./modules.md) 为准。

## 1. 结论

这个仓库的**方向是对的，代码形态却还没有收敛成一个可信的 Web 标准库**。

它已经具备理想目标最难获得的部分：长期稳定的价值判断。代码确实普遍采用原生 ESM、原生 DOM/Web API、细粒度文件和直接 URL 引入，没有强制应用入口、构建流程或全局框架运行时。仓库不是“伪装成工具库的框架”。

当前主要差距不是需要更多功能，而是需要完成一次明确的**减法、分层和可信化**：六年来形成的标准库候选、实验代码、UI 组件、框架适配器、第三方源码、废弃入口和兼容逻辑仍共享同一个发布面。使用者无法从目录和文档判断一个模块究竟是稳定基础设施、可选扩展、实验品还是历史遗留。

按不同维度估算目前的位置：

| 维度 | 完成度 | 判断 |
| --- | ---: | --- |
| 理念与方向 | 80% | 与目标高度一致，边界意识已经存在 |
| 模块形态与可组合性 | 55% | 多数是独立 ESM，但 barrel、顶层副作用和跨层依赖破坏了独立性 |
| API 设计一致性 | 40% | 有优秀苗头，但返回值、错误、取消、命名和生命周期尚无统一契约 |
| 实现正确性 | 30% | 有可确定的运行时错误、空实现和失效示例 |
| 发布与版本治理 | 10% | 没有稳定面、版本标签、不可变 URL、变更策略或模块清单 |
| 测试与文档可信度 | 10% | 缺少根文档、自动测试、CI 和可执行 API 文档 |

综合而言，仓库距离“理念原型”已经很近，距离“可以放心依赖的 v1 stdlib”仍有约 **60%—70% 的工程工作**。这里的百分比表示待完成的结构与质量门槛，不是代码量或工期。正确路线很可能会先删除、移动和收缩大量内容，而不是增加 60% 的代码。

## 2. 初始评估看到的仓库事实

- 约 108 个非示例 JavaScript 文件、59 个示例文件；43 个 JavaScript 文件平铺在仓库根目录。
- 7 个 JavaScript 文件为空；另有多个显式空实现或未实现导出。
- `components/` 与 `react/components/` 共 27 个文件，已成为显著的 UI 产品层。
- 没有根级 README、公开模块清单、测试入口、CI、版本标签、许可证说明或发布规则。
- 存在 5 个指向不存在文件的相对导入示例；另有示例调用当前模块并未导出的 API。
- 存在直接依赖浮动 CDN URL、仓库自身线上 URL和无法由浏览器原生解析的 bare specifier。
- `marked.js`、`qrcode/` 等大块第三方或衍生实现与本项目源码处在同一命名空间，未显式隔离来源、许可证和升级责任。
- 全部 JavaScript 文件通过语法检查；问题主要位于运行时语义、API 契约和模块边界，而不是语法层面。

## 3. 已经符合目标的部分

### 3.1 原生平台是默认语言

`dom/`、`media.js`、`file.js`、`stream.js`、`crypto/` 等模块的基本出发点都是直接操作标准对象。`querySelector()` 返回 Element，媒体函数返回 MediaStream，密码学函数围绕 Web Crypto 展开。这与“调用辅助函数后立刻把控制权还给平台”一致。

### 3.2 ESM 文件天然细粒度

大多数能力可以通过具体文件直接引入，不需要安装、编译或启动应用运行时。这比依赖打包器 tree shaking 更接近真正的 URL-addressable stdlib。

### 3.3 已有正确的现代化苗头

`async/delay.js` 接受 `AbortSignal`，是整个项目应推广的范式。`dom/dialog.js` 使用原生 `<dialog>`、DOM 节点和一次性事件监听，也比重新创造弹窗组件模型更贴近目标。

### 3.4 可选 UI 技术没有接管核心

Preact、Web Components、动画和二维码功能目前仍是可辨认的独立区域，没有形成强制所有模块服从的应用架构。这个基础应保留，但需要通过发布分层把边界固定下来。

## 4. 与目标的关键偏差

### 4.1 发布面没有表达可信度

空文件、草稿、稳定候选和大体量第三方实现都能被同样地从 URL 导入。仓库中的“存在”被误当成“公开支持”。标准库首先需要的是可信的选择面，而不是更大的选择面。

已观察到的典型问题包括：

- `promise.js` 的 `any()`、`some()`、`race()` 和 `retry()` 未实现。
- `math.js` 有多个空函数。
- 若干组件入口为空。
- hardware wrapper 中存在只有类名而无有效行为的壳。

**目标状态：** 每个公开 URL 都属于明确的 `stable`、`candidate` 或 `experimental` 状态；草稿不进入公开模块清单。稳定入口绝不导出空实现。

### 4.2 一部分代码在重新实现已经足够好的平台能力

`array.js`、`object.js`、`promise.js`、`query.js`、`fetch.js` 和部分 `math.js` 与现代标准库高度重叠。其中一些实现比原生语义更弱或不同，例如自制数组判断、对象枚举、Promise 组合、URL 参数解析，以及用 XHR 仿造一个不完整的 Fetch Response。

这正是项目理念要求避免的方向：包装的不是重复胶水，而是标准本身。

**目标状态：** 删除原生能力的平行实现。只有当一个操作稳定地组合多个 Web API、消除真实生命周期负担或表达常见流程时，才进入库。

### 4.3 模块导入并不总是无副作用

以下行为会让 `import` 变成隐式启动：

- `router.js` 在模块顶层注册全局 `popstate`。
- `query.js` 在模块求值时读取全局 `location` 并固化快照。
- 多数 `components/` 模块在顶层调用 `customElements.define()`。
- `dom/movable.js`、`dom/resizable.js` 根据页面状态自动初始化全局监听器。
- `dom/index.js` 又把这些模块通过 barrel 暴露，使一次宽泛导入可能带入无关行为。

**目标状态：** 默认导入必须是 inert 的。监听、注册、挂载、权限请求和网络连接只能由显式函数触发，并返回标准资源或取消手段。Web Component 模块应导出类和 `defineXxx()`，不能在导入时自行注册。

### 4.4 生命周期没有统一落到 AbortSignal

仓库同时使用 disposer、`destroy()`、全局 listener 数组、对象方法和不可取消监听。很多异步函数也无法由调用方终止。

**目标状态：** 所有长生命周期操作统一接受 `{ signal }`；事件订阅可同时返回 disposer，但 `AbortSignal` 是跨模块的共同协议。不得再引入项目私有的全局 application lifecycle。

### 4.5 核心、UI、适配器、集成和 vendor 混在一起

`dom/` 是平台 helper；`components/` 是具有样式和交互意见的 UI；`react/` 是框架适配层；`services/` 是具体供应商 API；`marked.js` 和 `qrcode/` 更像独立第三方包；`html/` 则已经开始实现模板解析、Part、缓存和 render lifecycle。

它们都可能有价值，但不应共同定义“stdlib”。尤其 `html/` 已经跨过 utility 边界，进入渲染运行时领域。它不是必须删除，但必须被标记为独立实验或独立项目，不能成为核心依赖。

**目标状态：** 核心只按 Web capability 划分；有产品意见或运行时模型的东西进入可选层。

### 4.6 存在可确定的正确性缺陷

本次静态审查已能确定若干问题，不需要浏览器兼容性解释：

- `router.js` 声明 `const listeners` 后又在取消监听时重新赋值。
- `fetch.js` 在 `xhr.open()` 之前设置请求头，并返回一个不完整的伪 `Response`。
- `serialport.js` 的派生类构造器没有调用 `super()`，且 `open()` 引用了错误变量。
- `stream.js` 的 `readText()` 把 `reader.read()` 返回的 Promise 当作同步 iterable；流结束时还可能多 yield 一次 `undefined`。
- `events.js` 在 listener 不存在时会 `splice(-1, 1)`，误删最后一个监听器。
- `object.js` 的 `omit()` 遍历了错误的 key 集合。
- `array.js` 的 `isArray()` 不是数组判断，`fromAsync()` 忽略 `mapFn`。
- `storage.js` 的 namespaced storage 在 `clear()` 时会清空整个底层 store，且没有同步清理内部 cache。
- 多个示例引用已不存在的文件或已不存在的 API。

这些问题说明当前仓库不能通过“代码很小、容易看懂”替代测试。越接近基础库，越需要用自动化验证细节语义。

### 4.7 安全语义没有成为 API 名称的一部分

存在把字符串交给 `innerHTML` 的通用 helper，以及 `string.js` 中基于 `new Function` 的格式化实现。即使调用方承诺只传可信内容，普通名称也隐藏了能力的安全边界。

**目标状态：** 默认 API 使用 `textContent`、Node、DocumentFragment 和标准 DOM 构造；确有必要解析 HTML 时使用带有明确危险语义的名字，例如 `parseTrustedHTML()` 或 `setHTMLUnsafe()`，并在契约中写清输入必须可信。动态代码执行不属于核心标准库。

### 4.8 URL 依赖和版本还不可复现

直接使用 ESM CDN 是合理的消费方式，但浮动 URL 不是可靠的包身份。当前还存在：

- 未固定版本的 `esm.sh` 依赖。
- 从线上 `lsong.org/scripts/events.js` 反向依赖自身，而不是相对模块。
- `qrcode/index.js` 的 bare specifier `qr`，原生浏览器没有 import map 时无法解析。
- 没有 Git tag、稳定版本目录或不可变发布 URL。

**目标状态：** 所有稳定依赖和稳定发布 URL 均不可变；`latest` 只能是方便入口，不能出现在生产示例中。依赖要么使用带版本的绝对 URL，要么由应用 import map 显式提供，核心库不能暗中决定依赖解析。

## 5. 目标架构

推荐采用以下概念分层。实际目录名可以调整，但依赖方向必须固定：

```text
core / capabilities
  async/       delay, retry, timeout, queue
  dom/         query, events, forms, observe, dialog
  streams/     lines, json-lines, text
  storage/     namespaced-store, idb helpers
  media/       capture, session, recorder
  crypto/      focused Web Crypto workflows
  files/       read/write/download workflows

elements/      optional Web Components；不被 core 依赖
adapters/      preact 等框架适配；只依赖 core
integrations/  github、itunes、bing 等服务；只依赖 core
labs/          html renderer、动画实验、未稳定硬件封装
vendor/        原则上不发布；必须保留时记录来源、版本和许可证
examples/      只引用真实、公开、不可变的 API
docs/          原则、模块状态、API 契约、决策记录
```

依赖方向：

```text
Web Platform <- core <- elements / adapters / integrations / examples
```

禁止反向依赖；core 不能依赖 UI、框架、供应商服务或 labs。

### 5.1 一个模块进入 core 的准入问题

以下问题必须全部得到满意答案：

1. 现代 Web API 是否已经足够直接？如果是，不增加该模块。
2. 该能力是否在多个真实应用中重复出现，而不是只服务一个组件？
3. 它是否组合了标准能力，而不是复制或弱化标准能力？
4. 输入和返回值是否优先使用标准对象？
5. 是否可以只导入这一个文件，不启动任何无关行为？
6. 长生命周期工作是否接受 `AbortSignal`？
7. 失败是否使用标准 Error/DOMException 或一个有必要且明确的领域错误？
8. 使用者是否可以用少量原生代码替换它，而不推翻应用架构？
9. 是否不需要 compiler、runtime、全局 registry 或隐式配置？
10. 是否有契约测试和一个可直接运行的示例？

任何一项不满足，都应留在 `labs/`、可选层或下游应用，而不是通过兼容代码降低 core 标准。

### 5.2 统一 API 契约

- **标准对象优先：** Element、Event、URL、Request、Response、ReadableStream、Blob、File、CryptoKey、AbortSignal 等原样流动。
- **无默认副作用：** import 只声明能力；显式调用才启动行为。
- **取消优先：** 监听、计时器、observer、请求、连接和循环接受 `{ signal }`。
- **错误透明：** 不吞错，不返回含糊的 `undefined` 表示权限拒绝或能力缺失。
- **能力缺失直接失败：** 使用清晰的错误或独立 `supportsXxx()` 查询，不在实现内部走旧 API fallback。
- **选项使用对象：** 多于一个可选参数时使用 options，并避免与平台同名但语义不同。
- **不修改输入对象：** 除非函数名称和文档明确表达 mutation。
- **危险操作显式命名：** HTML 注入、动态执行、权限请求、持久化清空必须在名称与文档上可见。
- **模块自包含：** 相对依赖可追踪；不反向引用线上自身；不要求调用方猜测隐藏的 import map。

## 6. 兼容性政策

### 6.1 核心态度

核心库不承担旧浏览器、厂商前缀、历史签名、废弃入口或错误行为的兼容责任。支持基线由目标 API 本身定义，而不是先列浏览器名单再塞入 fallback。

例如：

- 媒体采集直接使用 `navigator.mediaDevices.getUserMedia()`，不回退到 `webkitGetUserMedia` 或 `mozGetUserMedia`。
- WebRTC 直接使用标准构造器，不导出厂商前缀别名。
- 剪贴板使用 Clipboard API；`execCommand('copy')` 不进入 core。
- Page Visibility 只使用标准事件和属性。
- 废弃路径不保留打印 warning 的永久 forwarding module。

### 6.2 现实冲突如何处理

现实需求登记为明确的 downstream TODO，包含：缺失能力、受影响环境、标准方案、下游替代策略和删除条件。解决方式按优先级为：

1. 下游选择支持的运行环境或提示用户升级。
2. 下游在应用入口按需加载独立 adapter/polyfill。
3. 针对特定设备或宿主建立单独 compatibility package。
4. 等待平台实现。

兼容包不得成为 core 的传递依赖，不得改变 core API，也不得以“以后再删”为理由进入核心路径。

### 6.3 对本仓库历史入口的处理

`dom.js`、`form.js`、`crypto.js`、`service-worker.js` 等 forwarding 文件应在下一次破坏性版本整理时直接移除。迁移说明保留在文档，而不是保留在运行时代码。Git tag 和不可变旧 URL 本身就是历史版本的兼容方案。

## 7. 分阶段路线

### Phase 0：定义边界并冻结扩张

目标：先知道什么是库，再继续写库。

- 写根 README：设计纲领、non-goals、支持政策、目录分层和最小示例。
- 建立 `docs/modules.md`，为每个现有模块标记 `stable-candidate`、`experimental`、`move`、`retire` 或 `vendor`。
- 暂停向根目录增加新文件，暂停新增 umbrella export。
- 明确 core 不包含：UI component system、模板 runtime、框架 hooks、供应商 API、polyfill、原生 Array/Object/Promise 的替代实现。
- 删除空文件和显式空实现；尚未决定的能力移动到 labs，而不是占用公开名字。

**退出标准：** 仓库中的每个非示例文件都有归属和状态；使用者能在一分钟内知道哪些 URL 值得依赖。

### Phase 1：建立正确性底线

目标：任何进入候选清单的模块都可被验证。

- 为 pure modules 建立无需构建的 ESM 单元测试。
- 为 DOM/Web API 模块建立真实浏览器测试；开发工具可以使用 Node/Playwright，但发布物保持零构建。
- CI 至少执行：语法检查、所有公开入口 import smoke test、单元测试、浏览器测试、示例链接完整性检查。
- 修复或移除第 4.6 节的已知错误。
- 每个公开函数至少覆盖正常路径、失败路径、取消路径（适用时）和资源清理。
- 示例只能引用公开清单中的 API，并作为测试的一部分启动。

**退出标准：** 公开候选入口不存在空实现、断链 import 或已知确定性运行时错误；CI 全绿。

### Phase 2：完成架构分层与 API 收敛

目标：让目录结构真实表达设计哲学。

- 将 components、adapters、integrations、labs、vendor 与 core 分离。
- 移除所有 import-time 注册、全局监听和 auto-init。
- barrel 只允许重导出无副作用模块；推荐文档直接指向叶子文件。
- 删除对原生能力的低价值重实现和全部核心兼容 fallback。
- 为事件、observer、timer、socket、route listener 等统一 `{ signal }`。
- 统一命名、错误、options 和返回值规范；避免自制伪标准对象。
- HTML renderer 独立为 labs 或单独项目，禁止 core 依赖。

**退出标准：** 任意 core 文件可单独 import，且不注册监听、不访问页面状态、不发请求、不注册组件；依赖图只沿允许方向流动。

### Phase 3：发布最小可信版本

目标：发布小而可靠的 v0.x，而不是把整个仓库宣布为标准库。

建议首批只选择约 15—25 个被多个项目验证过的能力，优先考虑：

- `async/delay`、`async/debounce`，以及完成后的 `retry`、`timeout`。
- DOM 查询别名、带 disposer/signal 的事件绑定和 delegation。
- 原生 `<dialog>` 的无样式生命周期 helper。
- stream 的 text、line、JSON Lines 流程。
- 少量 File、Clipboard、Media、Web Crypto 的高频组合流程。

首批不应包含：Array/Object/Promise 替代品、模板 renderer、UI components、供应商 services、巨型二维码实现、兼容别名和半成品硬件 class。

- 为每个模块提供签名、标准对象语义、错误、取消、权限和安全说明。
- 创建语义化 Git tag，并公布不可变 URL 示例。
- 提供 import map 示例，但不要求 import map 才能解析模块内部依赖。
- 建立变更日志；破坏性变化通过新不可变版本解决，不在旧实现中累积条件分支。

**退出标准：** 一个空白 HTML 文件能够通过固定版本 URL 使用每个 v0.x 模块；无需 install/build；文档示例全部可执行。

### Phase 4：按真实重复劳动扩展

目标：只从实际应用反哺能力。

- 新候选先在至少两个下游应用中使用，再申请进入 core。
- 记录进入理由：替代了哪段重复代码、涉及哪些标准 API、为何原生 API 尚不足够。
- IndexedDB、WebSocket reconnect、upload progress、media recorder、permission flow 等复杂能力逐个设计，不一次建立大而全 facade。
- 每个模块独立升级和测试；避免为了目录整齐而制造空模块。

**退出标准：** 新增功能由重复证据驱动，核心规模增长慢于下游应用能力增长。

### Phase 5：可选生态

目标：允许有意见的体验存在，但不改变核心性质。

- `elements/` 可以提供高质量 Web Components，但注册必须显式。
- `adapters/preact/` 可以把 core 能力映射为 hooks/components。
- `integrations/` 可以封装具体服务 API。
- 大型独立能力如 QR、Markdown、模板 renderer 可以成为独立仓库或独立版本域。

**退出标准：** 删除任何可选层都不会影响 core，使用 core 也不会隐式下载这些层。

## 8. 初步模块处置建议

这不是最终逐文件裁决，而是 Phase 0 清单的起点。

| 当前区域 | 建议 |
| --- | --- |
| `async/delay.js`、`async/debounce.js` | 保留为 core candidate，补齐测试和统一 signal 语义 |
| `dom/dialog.js` | 保留为 core candidate；去除默认 unsafe HTML，完善 signal/cleanup |
| `dom/dom.js` | 拆分；只保留有真实收益的 query/event/template 叶子能力，移出 UI-specific factory |
| `dom/form.js` | 拆分 serialization、validation、request、persistence、UI field factory；只让少数流程进入 core |
| `stream.js` | 概念值得保留，重写正确性和取消/锁释放语义 |
| `crypto/` | 按具体 Web Crypto workflow 保留；CSR 外部依赖必须固定且隔离 |
| `media.js`、`file.js`、`clipboard.js` | 保留候选，删除兼容 fallback，明确权限、错误和 signal |
| `array.js`、`object.js`、`promise.js`、部分 `math.js` | 大部分 retire；不要与标准语言能力竞争 |
| `fetch.js` | retire；使用原生 fetch，只保留真正高频的 request workflow |
| `query.js`、`url.js` | 优先使用 URL/URLSearchParams；若保留，只做标准 API 未覆盖的明确流程 |
| `events.js` | 不作为 DOM lifecycle 基础；优先 EventTarget/Event/AbortSignal，必要的 emitter 放 labs |
| `router.js` | 重新设计为显式 `createRouter()`，无顶层 listener，route context 带 signal；在稳定前放 labs |
| `components/` | 移到 `elements/`，全部改为显式 define；不属于 core |
| `react/` | 移到 `adapters/preact/`；固定外部依赖版本；不属于 core |
| `services/` | 移到 `integrations/`；不属于 core |
| `html/` | 独立 labs/项目；它是模板 runtime，不是 stdlib core |
| `animate/`、`audio.js` | labs 或独立 capability package；避免把 demo-oriented opinion 放进 core |
| `qrcode/`、`marked.js` | 独立包或外部固定依赖；补来源与许可证，不与自有 core 混发 |
| 顶层 deprecated forwarding 文件 | 下一破坏性版本删除；迁移信息只留文档 |

## 9. 当前最高优先级 TODO

这些事项会影响下游，但不应以兼容代码留在 core：

- [ ] 下游仍引用 `dom.js`、`form.js`、`crypto.js`、`service-worker.js` 时，迁移到新的固定版本叶子 URL。
- [ ] 需要旧式 Clipboard、WebRTC、getUserMedia 或 Page Visibility API 的下游，自行引入独立 compatibility adapter。
- [ ] 使用 customized built-in elements（例如扩展 `table`、`select`、`button`）的下游，评估是否改为 autonomous custom elements 或保留在特定宿主适配层。
- [ ] 依赖当前组件自动注册行为的页面，改为显式调用 `defineXxx()`。
- [ ] 依赖当前 `innerHTML` 字符串入口的下游，改传 Node/DocumentFragment；确需 HTML 时显式调用 unsafe API 并承担净化责任。
- [ ] 依赖浮动 `esm.sh`、bare specifier 或 `latest` URL 的应用，使用 import map 固定具体版本。
- [ ] 修复现有示例的断链引用，或删除不能代表当前公开 API 的示例。

## 10. 判断项目已经到达理想目标的信号

不是“文件很多”或“覆盖了全部 Web API”，而是同时满足以下信号：

- 新用户只看目录和模块清单，就能区分 core 与所有可选层。
- 任意 core URL 可单独、直接、固定版本导入，且 import 本身无副作用。
- API 的输入输出主要是标准对象，没有 `LibElement`、伪 Response 或 application runtime。
- 所有长生命周期能力都能由 AbortSignal 统一终止并验证资源已经释放。
- 没有为旧浏览器、旧签名或旧路径存在的核心分支。
- 删除某个 helper 后，下游可以用少量原生代码替换，而不需要重构架构。
- 测试和示例证明每个公开承诺，而不是让使用者从源码猜测成熟度。
- 核心新增速度很慢；更多创新发生在下游、elements、adapters、integrations 和 labs。

达到这些条件时，这个项目才真正从“个人多年积累的 scripts 集合”跨越成“有清晰宪法、可被他人放心依赖的 Web stdlib”。仓库已经拥有正确的宪法思想，下一阶段的主要工作是让发布结构和每一条公开 API 都服从它。
