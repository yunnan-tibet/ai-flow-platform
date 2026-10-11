# M0 最小工程骨架设计

> 执行修订：以下保留初始化时的原始方案，不能作为最新实现事实。实际采用 Python 3.11.1；health/ready 已分离；前端使用 Vite 开发代理，未添加 CORS；Alembic/业务迁移未实现。最新契约见 `docs/DECISIONS.md` D-002～D-004、`docs/superpowers/specs/2026-10-11-m0-health-page-design.md`，实际进度以 `docs/LEARNING_STATE.md` 为准。

## 目标

在一个 60–120 分钟的学习任务内建立 FlowInsight AI 的最小全栈运行基线，验证 React、FastAPI 与 PostgreSQL 的本地连接链路。该任务只解决工程启动和连通性问题，不进入数据源、Workflow、Agent 或 MCP 功能开发。

## 技术选型

- 前端：Vite 官方 `react-ts` 模板、React、TypeScript、pnpm。
- 后端：Python 3.12、FastAPI、SQLAlchemy 2、Alembic、uv。
- 数据库：PostgreSQL，由 Docker Compose 承载。
- 本地运行：前端和后端使用本机开发进程，Docker 仅运行 PostgreSQL。

选择 Vite 是因为 FlowInsight AI 当前是以客户端交互为主的工作台，不依赖 SEO、SSR 或 React 服务端组件。它能保持 React 与 FastAPI 的职责边界清晰，也不会在 M0 引入 Next.js 的额外服务端抽象。

## 本次范围

### 前端

- 在 `frontend/` 初始化 Vite React TypeScript 工程。
- 提供一个最小健康状态页面。
- 页面请求后端 `GET /api/health`，分别显示 API 和数据库状态。
- 请求中和请求失败时显示明确状态。

本次不引入 React Flow、Zustand、UI 组件库、图表或业务页面。React Router 和 TanStack Query 只有在本任务确实需要相应能力时才加入；健康检查不得借机扩张为完整应用框架。

### 后端

- 在 `backend/` 建立最小 FastAPI 应用。
- 提供 `GET /api/health`。
- 使用 SQLAlchemy 连接 PostgreSQL，并执行轻量连接检查。
- 配置允许本地前端开发地址调用 API 的 CORS 策略。

本次不建立业务表，不实现 Repository/Service，不创建数据源 API，也不实现认证。

### 基础设施

- Docker Compose 只负责 PostgreSQL。
- 数据库连接信息由本地环境变量提供，不把密码写入业务代码。
- 提供可复制的示例环境配置；真实本地配置不提交。

## 目录职责

```text
ai-flow-platform/
├── frontend/       # React 客户端
├── backend/        # FastAPI 应用及数据库连接
├── docs/           # 产品、决策、学习状态与设计记录
└── infra/          # PostgreSQL 等本地基础设施配置
```

M0 保持目录最小化。后端的 Router/Service/Repository 分层在出现第一个真实业务能力时建立，避免为了空架构提前制造文件。

## 数据流

```text
React 健康页面
    ↓ GET /api/health
FastAPI health 路由
    ↓ 执行轻量 SQL 连接检查
PostgreSQL
    ↓
FastAPI 返回 API 与数据库的独立状态
    ↓
React 显示结果
```

建议的响应语义：API 进程能处理请求时，响应中始终明确 `api` 状态；数据库检查结果单独放在 `database` 字段中。数据库不可用不能被伪装成整体健康。

## 失败处理

- 后端未启动：前端显示 API 请求失败。
- 后端可用、数据库不可用：后端返回明确的数据库异常状态；前端分别展示 API 可用和数据库不可用。
- 数据库错误不得把连接串、密码或内部异常堆栈返回前端。
- 本次不加入重试、熔断或复杂健康检查框架。

## 验收方式

1. PostgreSQL、FastAPI 和 React 开发服务均能启动。
2. 浏览器打开前端页面后，能看到 API 与数据库均为可用状态。
3. 停止 PostgreSQL 后重新检查，页面显示 API 可访问、数据库不可用。
4. 后端日志保留可诊断信息，前端响应不泄露凭证或完整堆栈。
5. 恢复 PostgreSQL 后，无需修改代码即可重新得到健康状态。

只有实际运行得到上述结果，才能把本任务标记为“本地已运行/验收通过”。创建文件或给出代码不等于完成。

## 实施和学习方式

- 前端脚手架和健康页可以由 Codex 加速，但本次按用户要求先从手动初始化开始。
- FastAPI、SQLAlchemy 和数据库检查代码由 ChatGPT 分批提供，用户亲手敲写、运行并理解。
- 实施顺序为：前端脚手架 → PostgreSQL → FastAPI 最小应用 → 数据库检查 → 前后端联调 → 失败场景验收。
- 每完成一小步再进入下一步，不一次输出整个后端模块。

## 明确后置

- 数据源注册、采样和指标历史属于 M1。
- React Flow、Workflow DSL 和图校验属于 M2。
- Workflow Runner 属于 M3。
- Trigger/Monitor、Agent、Tool 和 MCP 均不在本次范围。
