# FlowInsight AI 技术决策

## D-001：长期工程方向

- 日期：2026-10-11。
- 状态：用户确认长期目标；企业能力具体设计待逐项讨论。
- 决策：持续走向标准化、系统化、企业化，不以学习 Demo 为终点。工程规范随模块引入，可靠性和企业能力分阶段验收。
- 边界：保持 V1.0 范围与 M0–M7；企业化扩展另行估算，不提前默认微服务、Kubernetes 或复杂多租户。
- 协作：Python、Workflow、Agent、MCP 核心代码仍由 AI 提供参考实现，用户手敲理解；前端可按确认方案使用 Codex。
- 影响：后续设计说明契约、状态、错误、安全与验证方式；统一短命令作为工程入口，但不隐藏关键行为或代替测试。

## D-002：当前 M0 环境基线

- 状态：已采用；不代表全部 M0 验收通过。
- 前端：Vite + React + TypeScript，pnpm；暂不引入 Umi。
- 后端：Python + FastAPI，uv 管理依赖；复用现有 Python 3.11.1，`requires-python = ">=3.11"`。此前 Python 3.12 建议不代表已安装或升级。
- 数据库：本地 Docker Compose PostgreSQL，命名卷持久化；SQLAlchemy 异步引擎 + asyncpg 应用连接已实现，业务表和迁移尚未实现。
- 测试：pytest + FastAPI TestClient，当前使用 httpx2。
- 编辑器兼容：pip 作为开发依赖保留，支持 Python Environments 的依赖列表刷新；仍统一使用 uv 管理项目，pip 不作为生产依赖。原报错命令已复测成功。
- 短命令：用户已创建 Makefile；`make test` 已核验通过，用户确认 `make dev` 启动及健康接口验收通过。统一开发入口任务完成。

## D-003：数据库健康检查边界

- 日期：2026-10-11；状态：设计已确认、用户手写实现、自动测试及真实故障/恢复验收通过。
- `/api/health`：不访问数据库，应用能响应则返回 200 与 `{"api":"ok"}`。
- `/api/ready`：只读 SELECT 1；成功返回 200，数据库连接/查询的预期故障返回 503；不暴露凭证或内部错误详情。
- 资源管理：lifespan 创建共享异步引擎，按需连接，退出时释放；连接池检查旧连接，检查设置超时。数据库停止不要求 API 退出，恢复后无需重启 API。
- 配置：通过环境变量 DATABASE_URL 提供；本地 `make dev` 使用 `--env-file .env.local`，本地实际配置不提交，公开模板使用 `.env.example`。缺失配置明确报错，不与运行时数据库不可用混淆。
- 验证边界：接口单元测试模拟数据库检查，真实连接及容器停止/恢复分别验证；不证明业务表、迁移、完整执行恢复或企业级可用性。

## D-004：M0 前端健康状态联调

- 日期：2026-10-11；状态：用户确认设计并授权 Codex 实现前端，自动测试及浏览器检查通过；等待用户页面 Review，未部署。
- 请求：初版使用原生 fetch；现已按 D-007 改为 Axios/XRequest + 领域 service，并发调用相同相对路径。Vite 开发代理转发到本地 API，不改后端 CORS。生产反向代理另行设计。
- 状态：同时校验 HTTP 状态码和 JSON 字段；只有符合 ready 契约的 503 才表示数据库不可用。网络、超时、无效 JSON、通用代理故障表示未知，不伪装成数据库故障。
- 交互：首次加载检查一次，支持手动刷新，无轮询；每个请求 8 秒超时，卸载或替换检查时取消旧请求，避免旧结果覆盖。
- 范围：React/TypeScript/CSS；无 Router、状态库、UI 库或新测试框架。Node 内置请求逻辑测试 11 项通过；真实代理正常，浏览器故障响应通过拦截模拟，不停止用户服务。

## D-005：前端工作规范（项目级初版已被通用 skill 替代）

- 日期：2026-10-11；状态：用户指定参考项目分层并确认项目级 skill，要求按 best-creating-skills 创建；规范文件及常驻约定已落地。
- 位置：初版为仓库 `.agents/skills/flowinsight-frontend`；用户后续确认改为用户级 `creating-react-page` 通用 skill，描述以中文为主，不包含本项目状态或私人源码路径。旧 skill 已移出活动目录并可恢复；frontend/AGENTS.md 现指向通用 skill。验证见 `2026-10-11-creating-react-page-plan.md`。
- 方向：页面 → 领域 services → XRequest；services/index 以 xxxService namespace 导出，页面/私有组件、共享布局和通用组件分职责；借鉴原项目组织方式，不复制业务源码和身份认证实现。
- 工具分工：AGENTS 承载常驻边界；SKILL 承载开发/Debug/Review 流程；conventions 承载具体目标规范；MAINTAIN 承载维护说明与执行流程图。不把文字规则说成 CI/ESLint 已执行的门禁。
- 验证：格式与引用检查、无 skill 基线及带 skill 只读试跑通过；新上下文实际发现。描述正反例选择与显式使用已验证，未验证自然无提示自动触发可靠率。
- 实现边界：规范创建时并未迁移代码；用户本次确认业务代码改造及新增 Axios 后，按 D-007 落地。通用 skill 不携带 LEARNING_STATE 或当前实现状态。

## D-006：统一请求取消管理

- 日期：2026-10-11；状态：用户指定参考取消工具并允许迁移；已适配 TypeScript，现已通过 D-007 接入 XRequest。
- 位置：frontend/src/utils/abortController.ts；保留 setFlag、abort、clearController，默认共享管理器，同时提供独立实例工厂。
- 范围：只借鉴通用 Map/Set 登记、分组取消和结束清理；不迁入原业务 URL 白名单或页面依赖。跨页面同 URL 以唯一 abortKey/独立实例隔离，页面不做全局取消。
- 安全边界：不修改调用者 options，不丢失原 signal；按 controller 身份清理避免 URL 改写后漏删；取消立即移除登记和监听，finally 重复清理安全；取消回调中新建请求不进入旧取消集合。
- 验证：初版 11 项工具测试 + 11 项健康请求测试共 22 项通过；本次接入后的验证与边界见 D-007，未改后端或提交。

## D-007：健康页分层返工与无续签 XRequest

- 日期：2026-10-11；状态：用户确认新增 Axios 及代码迁移，由 Codex 直接实施前端；不新增业务功能。
- 请求：Axios 1.20.0 已锁定；XRequest 对象参数沿用熟悉的 url/method/params/data/headers/axiosOptions 模式。完整 JSON body 为默认返回值，`returnResponse: true` 提供 HTTP 元信息；不复制旧业务响应包、续签、认证、登录跳转、重试或全局提示。
- 分层：App 组合布局与页面；页面/hook → healthService → XRequest → Axios。DTO 显式导出，service 以 unknown 校验，中文 UI 提示在页面私有组件；CSS Modules 隔离，@ alias 同时配置 Vite 与 TS。
- 故障：只有 ready 的真实 503 契约表示数据库不可用；其他故障未知，两项检查独立保留结果。默认 8 秒超时，取消登记/监听最终清理，signal 与独立 abortKey 隔离消费方。
- 验证：先红后绿；36 项前端测试、测试文件类型检查、lint/build 通过。真实代理 health/ready=200；浏览器拦截模拟 503、代理错误、网络失败、加载和恢复，键盘及 390px 布局通过，8 秒超时/恢复通过。独立只读代码 Review 未发现需修复的问题。
- 生命周期验证：浏览器额外挂载两个实际 hook 消费方，卸载一个不取消另一个，完成/卸载时取消登记归零；未专门运行忽略 signal 的迟到响应竞争，不将源码结构测试等同于该覆盖。
- 边界：没有引入 Router、状态库或 UI 库，没有更改后端，生产代理/部署及整个 M0 Gate 仍待验收。旧请求与样式文件在移除前已备份；不自动提交。

## D-008：业务类型集中与简单页面内聚

- 日期：2026-10-11；状态：按用户明确反馈实施，不新增业务功能或依赖。
- 类型：`services/health.types.ts` 迁入 `typings/health.ts`，接口与领域共用类型显式 export/import type；不是全局 namespace。组件 props/UI-only 类型就近。
- 页面：当前一次并发健康检查及刷新可在 `SystemStatus/index.tsx` 清楚表达，移除 `useHealthStatus`。保留 service/统一传输边界、取消和旧请求保护；不把“不拆 hook”推广为永远不能拆。
- 规范：用户级 creating-react-page 按 best-creating-skills 优化，提炼参考 skill 的复杂度分流、字段配置、主从/工作台状态归属、交互闭环与模式验收；排除来源框架/UI库及项目绑定，不强装 ahooks 或机械 memo。
- 验证：结构测试先红后绿；36 项测试及类型检查、lint/build 通过。浏览器真实代理正常，模拟 ready 503/恢复、键盘、390px、两个实际页面实例的卸载隔离和登记清理通过。未专门验证忽略 signal 的迟到响应或生产部署；通用技能试跑证据单独记录。
- 恢复：被替代的类型/hook/页面和旧 skill 已备份于 `/tmp/react-page-skill-refinement.oHoXkO/`；临时备份不替代 Git。后端未改，未自动提交。
