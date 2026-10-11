# LEARNING_STATE

## Project / Version

FlowInsight AI；PRD v1.3。长期目标：标准化、系统化、企业化；V1.0 不等于商用就绪。

## Current Milestone

M0 项目基线，进行中；尚无完整里程碑通过 Gate 的记录。

## Current Goal

完成 M0 最小工程基线；健康页请求/service/页面/布局分层已实现。本次按用户反馈将业务共用类型归入 typings，简单状态与请求协调合回页面，并优化通用 creating-react-page 的业务页面规范。下一步仍只汇总统一启动说明并做 M0 Gate Review，不开始新业务模块。

## Budget & Actual

M0 初始估算 8–16h；实际投入未提供，不推算。V1.0 363–656h；后续企业化另行估算。

## Gate Criteria

- 前端 test/lint/build：XRequest 12 项 + 健康 service 11 项 + 取消工具 11 项 + 结构 2 项，共 36 项通过；测试文件类型检查、lint/build 通过，取消管理器已接入真实 Axios 传输。
- PostgreSQL 容器健康、SQL 查询与应用连接：已核验通过。
- `/api/health` 与 pytest：实现已敲入、测试通过；服务启动用户确认成功。
- API 检查数据库：已实现，自动测试通过；用户确认真实 HTTP 正常、数据库停止及恢复场景验收通过，恢复时未重启 API。
- 前端调用 API 并展示状态：已按 XRequest/services/pages/layouts 返工，真实代理 health/ready 均为 200；前次浏览器模拟数据库 503、代理 502/503、网络失败、8 秒超时与恢复通过。本次逻辑合回页面后复测正常代理、模拟 ready 503/恢复、加载、键盘和 390px；额外挂载两个实际页面实例，卸载取消隔离与 finally 登记清理通过。
- 统一启动说明、仓库级质量规则与文档：部分完成，M0 尚未整体验收。

## Completed

- M0 最小骨架方案已讨论；前端脚手架与数据库 Compose 已提交。
- uv 已安装，复用 Python 3.11.1 建立环境并锁定后端依赖。
- 用户手写健康接口与测试，修复路由 404 后测试通过。
- 数据库健康检查任务完成：用户手写配置读取、异步引擎、生命周期和 ready 接口；当前自动测试 8 passed；用户确认数据库停止时 ready=503、health=200，数据库恢复后 API 无需重启即 ready=200。
- 前端健康页方案已确认，由 Codex 实现请求模块、状态页、开发代理及测试；11 个请求测试、lint/build 通过。浏览器故障通过响应拦截模拟，本次未停止数据库或更改后端。
- 前端规范后续按用户要求改为用户级 creating-react-page：覆盖整个 src 组织，中文 description，不包含 LEARNING_STATE 或项目绑定；旧 flowinsight-frontend 已移出活动目录并备份。best-creating-skills 的中文约定与通用/项目边界已优化，验证记录见 creating-react-page-plan。
- 用户指定的 abortController 通用模式已迁为 TypeScript；setFlag/abort/clearController、独立实例与 abortKey 隔离已实现，现已通过 XRequest 接入。相关工具/真实 HTTP 测试、浏览器消费方取消隔离及清理验证通过。
- 健康页分层返工：用户明确确认新增 Axios 及去掉续签；Codex 完成请求/service/页面/布局/CSS Modules/@ alias，36 项测试、lint/build 及浏览器验证通过；独立只读 Review 未发现需修复的问题。未改后端、未提交或部署。
- 前端组织纠偏：用户要求业务类型放 typings、当前页面不拆 useHealthStatus；已迁移类型并将 hook 合回页面，结构测试先失败后通过，36 项测试/类型检查、lint/build 和相关浏览器回归通过。通用 skill 按参考业务页面规则提炼，排除来源框架/UI库绑定，记录见 `2026-10-11-react-page-skill-refinement.md`。
- VS Code Python 使用四空格与 Ruff 保存格式化；不代表已建立项目 CI 门禁。
- 长期目标已写入 PRD、学习规则、路线图与决策记录；企业能力未实现。

## Current Implementation

- `frontend/src/utils/abortController.ts` / 测试：保留 signal、不修改 options、身份清理与分组隔离，11 项工具测试通过；XRequest 在 finally 清理登记。
- `frontend/AGENTS.md`：指向用户级 creating-react-page 通用 skill。该技能在独立上下文的发现/只读组织行为已验证；本次按技能约定实施实际前端代码。技能不是项目运行时依赖，跨机器需另行安装。
- `docs/superpowers/plans/2026-10-11-frontend-service-conventions.md`：本次用户确认范围后的请求/service/页面迁移与验证已执行，历史项目级 skill 方案由通用 skill 替代。
- `frontend/src/utils/XRequest.ts`：Axios 1.20.0（已锁定），对象参数、默认完整 body、returnResponse 重载、8 秒超时、signal/abortKey、统一安全 RequestError；没有认证、续签、登录跳转或重试。
- `frontend/src/services/health.ts` / `index.ts` 与 `frontend/src/typings/health.ts`：具名健康接口函数和 healthService namespace；接口及领域共用类型显式导出/导入。unknown 运行时契约校验，两项独立并发，只有约定 ready 503 表示数据库不可用。原因码返回 service，中文文案属于页面。
- `frontend/src/App.tsx` / `layouts/BasicLayout` / `pages/SystemStatus`：App 只组合；简单查询、状态和刷新内聚在页面，已移除 useHealthStatus；私有 StatusRow 就近组织，CSS Modules，根入口显式导入 styles/global.css。保留加载、手动刷新、HTTP 码和最近时间，旧请求身份保护，卸载只取消自己的请求；390px 无横向溢出。
- 被替代的 `src/api/health.ts`、`App.css`、`index.css` 已移除/迁移；移除前内容备份于 `/tmp/flowinsight-frontend-before-refactor.8aiQLo/`（临时备份，不替代 Git）。
- `frontend/vite.config.ts`：开发时 `/api` 代理到 `http://127.0.0.1:8000`，保留路径；生产代理未配置，未部署。
- `frontend/tests/`：Node 内置测试运行器，36 项通过；请求/service 测试经临时真实 HTTP 服务运行，不依赖 Docker。`pnpm test` 同时执行 tsconfig.tests.json 类型检查；结构测试只验证源码组织，不当作页面运行时覆盖。本次卸载/隔离已另用浏览器实际挂载两个页面实例验证；忽略 signal 的传输导致旧响应竞争尚未专门运行验证（代码有身份保护）。
- `frontend/README.md`：本地启动、验证命令、状态语义及开发代理的生产边界说明。
- `infra/compose.yaml`：本地 PostgreSQL 与持久卷，无业务表/迁移。
- `backend/app/main.py`：保留 `/api/health`；用户已手写 lifespan 管理引擎及 `/api/ready` 的 200/503 响应，返回类型使用 AsyncGenerator[None, None]。
- `backend/tests/test_health.py`：health 正常响应、模拟数据库检查成功与失败的 ready 响应，共 3 个测试；普通自动测试不依赖 Docker。
- `backend/app/config.py`：调用时读取 `DATABASE_URL`，缺失或空白抛出 ValueError；配置与健康测试合计已核验 5 passed（0.41s）。用户确认 `.env.local` 配置读取成功；Makefile 开发命令已加入 `--env-file .env.local`。
- `backend/app/db.py`：创建异步引擎、连接池检查与超时；check_database 执行 SELECT 1。全部自动测试已重新核验 8 passed（0.90s）；真实数据库直接查询亦已核验成功。
- 真实 HTTP 联调：旧开发服务请求超时问题已通过重启解决，用户确认 health/ready 正常；数据库停止及恢复验收用户确认通过。此处是用户验收证据，不是助手执行停止数据库的记录。
- `backend/pyproject.toml` / `uv.lock`：FastAPI、Uvicorn、SQLAlchemy（asyncio）、asyncpg；应用数据库连接已实现。开发依赖 pytest、httpx2、pip。
- 编辑器兼容修复：Python Environments 刷新依赖时调用 pip，但环境原先无 pip；已将 pip 纳入开发依赖并核验两条原报错命令成功。现有测试 1 passed；编辑器界面刷新结果待用户确认。
- `backend/Makefile`：用户已敲入；`make test` 已核验为 1 passed（0.52s）；用户确认 `make dev` 启动及健康接口验收通过。统一开发入口任务完成；项目尚未部署。

## Key Concepts Learned

已讲解并结合当前代码练习：uv、pytest、容器与持久卷、Python 命名与缩进、Git 忽略；环境变量、fixture 的名称注入、monkeypatch、异常断言、AsyncMock；with/yield/finally、应用 lifespan、Request 类型注入、动态 state 与类型提示。后续仍按需要复习，不把代码通过等同于全部掌握。

## Decisions

见 `DECISIONS.md`。沿用既定路线，质量逐步落实，不改变手写学习方式。

## Problems / Unclear

前端结构返工已实现并验证，仍待用户 Review。统一根目录启动说明及 M0 最终 Gate Review 尚未完成；后端仓库级格式化/静态检查、CI、部署及迁移尚未建立。未验证生产代理/部署，也未专门模拟忽略 signal 的迟到响应。后端和本次修改仍未自动提交；实际工时未提供。

## Next Task

汇总根目录统一启动/验证说明，并对 M0 工程基线做一次真实 Gate Review；不重复健康页迁移，不同时进入 M1 数据源模块。

## Next Session Start Here

先读取本状态与根 README、frontend/README.md、backend/Makefile、infra/compose.yaml；检查启动命令能否由新环境复现、当前 M0 Gate 是否仍有必要缺口。前端结构为 App→SystemStatus→healthService→XRequest，业务共用类型在 typings/health.ts；若仅解释代码，不新增模块或依赖。

## Do Not Learn Yet

微服务、Kubernetes、复杂多租户、完整企业 RBAC、分布式调度、Agent/MCP 大模块；到对应场景再讨论。

## Last Updated

2026-10-11。本次依据类型归属/页面内聚结构测试先红后绿、36 项前端测试与类型检查、lint/build、真实代理 200、模拟 ready 503/恢复、键盘、390px 与两个实际页面实例的卸载隔离。技能按基线/前向试跑优化；后端未改，未新增依赖、提交 Git 或部署，未记录实际工时。
