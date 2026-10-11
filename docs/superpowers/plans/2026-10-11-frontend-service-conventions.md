# 前端 Service 分层与工程约定改造计划（本次授权的代码迁移已验证）

> **For agentic workers:** 2026-10-11 用户已确认项目级 skill，并要求按 best-creating-skills 创建；该部分已落地并只读验证。具体 Axios/XRequest 参数、样式与代码迁移尚未执行，继续前确认本次范围。实施使用 superpowers:executing-plans；不要自动提交、创建工作树或修改后端/参考项目。

**Goal:** 参照用户已有项目建立统一 XRequest、业务 services 和页面组织规范，迁移现有健康检查，保持已验收的行为。

**Architecture:** 页面 → 按领域拆分的 services → 通用 XRequest → Axios。请求基础设施不认识健康检查、页面或 store；服务层处理接口契约；页面负责加载、刷新及展示。

**Tech Stack:** 保留 React、TypeScript、Vite、pnpm；建议新增 Axios 一个运行时依赖。采用 CSS Modules，不为迁移引入 Umi、Less、UI 库、Router 或状态库。

## 1. 参考事实与当前问题

已读取的参考：

- `/Users/burt/frontpros/xinghe/xh.h113.web/src/utils/XRequest.ts`：Axios 实例、对象参数请求入口、通用请求配置、响应/错误处理。
- `src/services/index.ts`：`export * as xxxService from './xxx'`，供页面按领域调用。
- `src/services/dataSource.ts`、`page.ts`：具名接口函数、url/method/params/data、泛型响应类型。
- `src/pages/MapManage/index.tsx`：页面通过 `mapService` 调用接口，页面相关逻辑就近组织。
- `src/layouts/BasicLayout/index.tsx`、`src` 一级目录：layouts/pages/components/services/utils/store/constants/styles/typings/assets 的职责分离。

当前实现有两处需要纠正：

1. `frontend/src/api/health.ts` 将通用传输、超时/取消、接口校验和健康状态映射混在一起，不能作为后续接口的统一请求层。
2. `frontend/src/App.tsx` 同时承担应用入口、布局、页面、局部组件及检查交互，没有按用户已有的页面组织习惯分层。

当前已有的接口契约、11 个请求测试、刷新/取消行为和故障判断仍然有效，不能因为结构改造丢掉。

## 2. 方案选择

推荐：沿用 Axios + XRequest + services 的调用模式，迁移到 Vite 下的显式入口及路径别名。这样与用户已有代码习惯一致，新增接口有明确落点。

备选：保留 fetch 作为 XRequest 内部实现，同样可以完成分层，少一个依赖，但超时、参数编码、错误归一化仍需自行维护，与指定参考的实现习惯不完全一致。

不采用：复制整个旧 XRequest 或迁回 Umi。旧代码中的身份认证、续签、CEF、xinherc、NProgress、业务包解包等依赖当前并不存在。目录与服务分层可以沿用，Umi 的路由/运行时及构建配置不能当成 Vite 自带能力。

## 3. 目录及职责

本次建议落地以下真实有用途的文件；不先创建空 store、constants 或 typings。

```text
frontend/
├── AGENTS.md                       # 简短常驻约定，指向项目 skill
├── src/
│   ├── main.tsx                    # React 挂载及全局样式
│   ├── App.tsx                     # 组合布局与当前页面，不写接口逻辑
│   ├── layouts/BasicLayout/
│   │   ├── index.tsx               # 现有 header/footer 与应用容器
│   │   └── index.module.css
│   ├── pages/SystemStatus/
│   │   ├── index.tsx               # 首次检查、手动刷新、取消及展示
│   │   ├── index.module.css
│   │   └── components/StatusRow.tsx # 仅属于当前页面，先不放全局 components
│   ├── services/
│   │   ├── index.ts                # export * as healthService from './health'
│   │   ├── health.ts               # health/ready 请求、校验及并发汇总
│   │   └── health.types.ts         # 显式导出的契约与检查结果类型
│   ├── utils/
│   │   ├── XRequest.ts             # 唯一通用请求实现
│   │   └── abortController.ts      # 已迁移的取消管理工具，待 XRequest 接入
│   └── styles/global.css           # 现有全局 reset、基础字体等
└── tests/
    ├── XRequest.test.ts            # 请求层测试
    └── health.test.ts              # 保留并迁移当前场景测试
```

后续约定：

- `components/` 只放跨页面复用组件；页面私有组件放在对应页面的 components。
- `services/<domain>.ts` 按业务领域拆分，不按 GET/POST 拆分；统一从 services/index.ts 导出 service 命名空间。
- `store/` 只在确有跨页面状态时建立，不把所有局部 state 全局化。
- `constants/` 放有复用意义的常量；`typings/` 只用于确实需要的环境/第三方类型声明。业务 DTO 就近显式导出，不照搬大文件全局 declare。
- 页面/布局采用 PascalCase 目录 + index.tsx，service 模块及具名函数采用 camelCase；通用请求保留 XRequest 名称。
- 前端保持两空格、单引号、无分号；样式使用模块作用域，不因此修改 Python 四空格约定。
- Vite alias 与 TypeScript paths 一起配置 `@/* → src/*`；编辑器能识别不能替代构建通过。

## 4. XRequest 约定

沿用 `XRequest<T>({ url, method, params, data, headers, axiosOptions })` 的熟悉形式：

- 默认 GET；普通请求返回完整 JSON body，不默认取 body.data，因为现有 FastAPI 返回的是 `{api, database}`，没有旧项目的 success/code/data 包。
- 需要 HTTP 状态的调用使用明确的 `returnResponse: true`，返回包含 status/data/headers 的响应，TS 重载保证返回类型正确。这里不照搬 `getResponse`：旧项目该选项返回的是 res.data，而非 HTTP response，避免同名含义冲突。
- 支持 AbortSignal 和每次请求的超时配置；健康检查仍为 8 秒，通用默认也先采用 8 秒，可按接口需求调整。
- 取消管理使用已迁入的 utils/abortController.ts：保留 setFlag/abort/clearController；对参与管理的请求登记，finally 清理。保留外部 signal，跨消费者同 URL 以唯一 abortKey 或独立管理器隔离，不在页面卸载时全局 abort()。
- 默认 HTTP 非 2xx 失败；仅 ready 调用允许 200/503 进入接口契约判断，不能在全局 validateStatus 放行全部错误。
- 统一为 Error 对象，区分 http/network/timeout/cancelled/invalid-response；携带安全的状态信息，不抛字符串，不打印凭证或完整请求配置。
- JSON 响应按 unknown 进入运行时校验；泛型不等于验证。明确拒绝无法解析的 JSON，不能让 Axios 的宽松解析悄悄将 HTML 当成有效 DTO。
- 不认识 health/ready 字段，不 import services、页面或 store；不内置业务弹窗，不形成 `XRequest → services → XRequest` 反向依赖。
- 使用 async/await，不套一层不必要的 new Promise；任何异常/取消最终都能结束请求，不遗留悬空 Promise。
- 暂不实现认证、续签、重试、下载、全局进度条或业务响应包。以后有对应需求再设计，不从参考项目整段搬入。

## 5. Service 与页面边界

- `services/health.ts` 提供具名函数 `getApiHealth`、`getDatabaseReadiness`、`checkHealth`，全部通过 XRequest 调用。
- service 校验 HTTP 与 JSON，并生成强类型检查结果；健康页只通过 `healthService.checkHealth(...)` 获取结果，不直接 fetch/Axios，也不直接调用 XRequest。
- 仅 ready=503 且 api=ok/database=unavailable 表示数据库不可用。代理 503、其他状态、无效 JSON、网络失败仍表示未知。
- 两个请求独立并发，一个失败不丢掉另一个结果；取消整个检查可取消两个请求。
- 页面保留首次检查、手动刷新、按钮禁用、最近检查时间与旧请求失效保护；展示文案属于页面，不放在通用请求层。
- App 仅组合 BasicLayout 与 SystemStatus；只有一个页面，暂不引入 Router。页面私有逻辑是否再拆 hook 取决于迁移后的实际复杂度，不先制造空抽象。

## 6. 初版历史方案：常驻约定 + 项目 Skill（已被通用 skill 替代）

建议在本仓库根目录创建 `.agents/skills/flowinsight-frontend/`，不安装到用户全局目录。

```text
.agents/skills/flowinsight-frontend/
├── SKILL.md                   # 触发、工作步骤、边界、验收
├── MAINTAIN.md                # 维护说明与执行流程图
└── references/conventions.md  # 本计划确认后的结构、请求及 service 示例
```

分工：

- `frontend/AGENTS.md` 放常驻边界：先读规范、页面走 service、service 走 XRequest、禁止随意增依赖/改后端；详细规则只在 skill 引用中维护，不复制两套长文。
- skill 用于 FlowInsight 前端页面、接口接入、结构重构与 Review。纯后端任务、只问 Python 语法不触发。
- 流程为读取真实接口和相邻代码 → 判断文件落点 → 按已确认结构实现 → 测试/类型/lint/build → 记录验证证据；契约不明时停止询问，不编造响应。
- 引用使用 skill 内相对路径及当前仓库代码，不依赖另一台机器上的参考项目绝对路径。
- 只提炼目录和开发模式，使用本项目原创健康接口示例；不复制参考项目业务代码、Token 逻辑、配置或敏感数据。
- 验证应触发“新增 FlowInsight service”、不应触发“解释后端 lifespan”；还要覆盖“ready 503”“要求偷偷改后端适配旧响应包”的失败边界。文件格式校验不能替代实际发现和行为验证。
- 本次不创建全局通用前端 skill，也不让项目 skill 把所有页面改成健康页模板。

## 7. 执行顺序与验收

以下都在用户确认后执行，不以本计划存在为已完成。

- [x] 固化已确认的结构与边界：创建 frontend/AGENTS.md 和项目 skill，格式/引用检查通过；新上下文实际发现并进行显式只读试跑，正反例及失败边界通过。自然自动触发可靠率、实际 service 迁移未验证，见 2026-10-11-frontend-skill-validation.md。
- [x] 用户追加的取消工具迁移：utils/abortController.ts 与 11 项专用测试已实现，22 项总测试、lint/build 通过；仅工具落地，未接入 XRequest 或健康页面。
- [x] 请求层先测后写：新增 XRequest 测试，覆盖 GET params、POST data、默认 body 返回、HTTP 元信息、非 2xx、非法 JSON、网络、8 秒配置/短测试超时、主动取消；先看到预期失败，再添加 Axios 依赖、实现 XRequest 并更新 pnpm-lock.yaml。
- [x] 迁移 service：保留现有 11 项场景，先改测试入口和请求适配使其失败，再实现 health service 与显式类型。测试不能依赖真实 Docker。
- [x] 迁移页面及布局：保留现有视觉及交互，App 变薄、局部组件就近放置、CSS Modules 隔离样式，配置 Vite/TS 的 @ alias。
- [x] 解决 Node 测试与 alias 的边界：Node 内置 TS stripping 不读取 Vite alias。纯请求模块使用能直接运行的相对导入；测试直接导入模块，生产页面采用 @/services。不为绕过此问题额外引入测试框架。
- [x] 验证无回归：在 frontend 执行 `pnpm test`、`pnpm lint`、`pnpm build`；全部通过。浏览器核验真实 200、模拟 ready 503、通用代理错误、网络失败、加载、手动恢复与手机布局；不停止用户服务。
- [x] 检查结构：页面无 fetch/Axios/XRequest 直连；services 统一调用 XRequest；XRequest 无页面/service/store 依赖；没有重复的旧 src/api/health.ts 实现。
- [x] 只在引用全部迁移并验证后，用明确文件范围移除本次替代的旧 src/api/health.ts、App.css、index.css；不清理其他用户文件。
- [x] 更新 frontend/README.md、DECISIONS.md、LEARNING_STATE.md 及原健康页设计中的 fetch 决策。记录此任务完成证据，不宣告 M0 整体完成，不自动提交。

完成标准：用户能按原项目习惯从页面找到 service，再找到唯一请求入口；现有健康检查行为不回退；类型/lint/build/test 全通过；后续开发有可读取、可验证的约定。

## 8. 确认点与范围

项目级 skill + frontend/AGENTS.md 已创建；其规范采用用户指定的分层方向。首次代码迁移继续确认 Axios/XRequest 的具体接口及 CSS Modules 改动范围，不由 skill 创建推定全部实现授权。

这是对既有 M0 前端切片的结构返工，不新增业务模块、不重新规划整个项目、不变更后端 API。当前代码仍是上一版，尚未按本计划迁移。

依据官方资料核对的工具边界：

- Codex 仓库级 `.agents/skills` 发现及触发：[官方技能文档](https://learn.chatgpt.com/docs/build-skills)。实际创建后仍需核验本地发现。
- Axios 的状态码判定：[官方错误处理](https://axios-http.com/docs/handling_errors)；Signal 取消：[官方取消说明](https://axios-http.com/docs/cancellation)。安装时再核对实际版本与类型。

## 9. 本次执行记录（2026-10-11）

用户已明确要求改造前端业务代码、允许去掉 XRequest 续签，随后确认新增 Axios。因此首次迁移的授权范围已满足，不再处于第 8 节的待确认状态。第 6 节保留初版设计历史：当前实际规范是用户级 creating-react-page，旧 flowinsight-frontend 已备份并移出活动目录。

- 新增 Axios 1.20.0 并更新锁文件；XRequest、health services、BasicLayout、SystemStatus、私有 StatusRow/useHealthStatus、CSS Modules、全局样式与 @ alias 已实现。页面不直接发 HTTP，XRequest 不反向依赖页面/service。
- 请求 12 项和 service 11 项先看到明确的缺失入口断言失败，再实现并转绿；结构测试在 App 尚未拆分时失败，迁移后通过。取消工具原有 11 项保留；总计 36 项，测试文件类型检查、lint/build 通过。Node 测试使用相对 .ts 导入；生产页面 alias 已通过构建与实际浏览器解析。
- 真实代理 health/ready=200。Playwright CLI 验证数据库 503、代理 502/503、网络失败、加载禁用、8 秒超时与恢复、手动刷新、键盘与 390px 无溢出；额外挂载两个真实 hook 消费方，卸载一个不取消另一个，完成/卸载后登记归零。故障由浏览器拦截模拟，没有停止用户服务。
- 独立只读代码 Review 未发现需修复的问题；忽略 signal 的迟到响应竞争未专门运行验证，代码保留取消与身份双重保护，不用结构测试冒充该覆盖。
- 旧 api/health.ts、App.css、index.css 的引用已迁移，旧内容在移除前备份于 /tmp/flowinsight-frontend-before-refactor.8aiQLo/。README、DECISIONS、LEARNING_STATE 与原健康页设计已同步。
- 未改后端、未提交、未部署，不宣告整个 M0 通过。

