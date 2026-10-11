# FlowInsight AI

**智能业务监控与分析工作流平台｜产品需求说明书（PRD）**

**版本：** v1.3（全阶段工作量与里程碑复核）  
**日期：** 2026-10-10  
**目标：** 根据真实产品范围完成可运行、可演示、可讲解的核心版本；不设人为总工时上限。2027 年春招期间根据已完成的实际功能展示，不为赶进度牺牲核心架构、可靠性与理解  
**项目属性：** 个人学习与作品项目；未来保留独立商用可能性  
**状态：** 需求基线，项目代码进度尚未核验；工时区间是规划估算而非承诺，需随实际进展修正  

> 一句话定位：一个**业务无关、用户可配置**的智能监控与分析平台。用户通过 React Flow 定义数据源、触发条件、计算规则、Agent 分析和结果输出；系统使用 Python 执行工作流、持续监测业务数据，并维护指标历史、预警、报告与运行记录。

## 0. 阅读指南与需求边界

本文是**当前重新确认的 FlowInsight AI 需求基线**，取代先前围绕 LabFlow/LIS 固定业务流程的草案。文档中的 LIS 标本、库存、医院收入、API 异常仅是**演示用例**，不是内置的行业模块，更不是平台只能支持的三四种业务。

本项目的两个核心价值必须同时成立：

1. **轻量级 AI Workflow 平台**：可视化编辑、确定性节点执行、通用 Agent 节点、Tool/MCP 资源管理、触发方式及 Trace。
2. **智能业务监控与分析产品**：业务数据取数、指标历史、监控规则、持续异常跟踪、AI 解释、报告与处置，而非每次只返回一个 LLM 答案。

**产品承诺的“通用”不是任意系统开箱即用**。新业务必须能提供平台已支持的数据源或适配器、合法的数据访问权限，以及可配置的字段/指标映射；否则需扩展 Connector/Tool。平台禁止默认赋予 Agent 任意外部系统访问或任意代码执行能力。

### 0.1 第一阶段交付术语

| 版本 | 含义 | 约束 |
|---|---|---|
| 春招展示版（Career Demo） | 端到端跑通“配置 → 触发 → 执行 → 分析 → 可视化 → 追踪”的独立作品 | 优先于功能数量，可根据 2027 春招进度展示迭代版本 |
| V1.0 核心版 | 形成可复用的数据源/工作流/Agent/监控抽象，支持三类触发与两种不同业务数据结构 | 非企业级商用成品 |
| V1.1 扩展版 | 更稳定的运行恢复、权限/隔离、更多 Connector、审批与运营能力 | 根据时间和真实需求推进 |

## 1. 项目背景、用户和目标

### 1.1 目标用户

| 角色 | 目标 | 典型操作 |
|---|---|---|
| 业务分析人员 | 长期关注业务状态和变化 | 配置收入趋势、库存风险、日常指标报告 |
| 运营/管理人员 | 及时获知异常与处理进展 | 查看看板、预警、分析报告、处理结果 |
| 技术管理员 | 接入数据和工具、保障运行 | 注册 HTTP/Webhook/MCP、管理凭证、查看 Trace |
| 流程设计人员 | 将监控与分析逻辑复用成流程 | React Flow 编排、调试、发布任务 |

个人项目 V1.0 只需基础单工作区和两类权限（管理员/普通用户）；真正多租户 SaaS 和复杂 RBAC 后置。

### 1.2 用户要完成的关键工作

- 无需修改后端核心代码，就能基于现有节点与已授权数据源创建一个新的业务监控/分析任务。
- 允许三种主要启动方式：手动触发、定时触发、数据监控触发。
- 监控结果可以形成**持久化历史**，而不只是一次性的文本答复。
- 在分析需要判断、解释或跨数据源调查时启动 Agent；确定性数值计算必须由程序执行。
- 查看每次执行的流程节点状态、工具调用、数据依据、报告和失败原因。

### 1.3 产品成功标准

1. 用户能在网页创建、保存、校验和发布一条有效的监控分析工作流。
2. **手动、Schedule、Monitor** 三种触发都进入统一的 WorkflowRun 体系。
3. 同一个通用引擎成功运行至少两条不同数据结构、不同业务目标的演示流程；不为每种业务新增核心引擎分支。
4. Agent 节点可按配置动态加载平台工具；支持通过 UI 注册 MCP Server 和刷新工具，不重启 API 服务即可用于后续新 Run。
5. 业务指标、监控检测结果、分析报告、告警和执行历史可以重新打开；可查看其来源。
6. 完成基础测试、部署与可公开演示的说明；不依赖真实医院或其他敏感业务数据。

### 1.4 明确不做

- 不开发完整的 Dify/Coze 克隆、Agent 插件市场、通用浏览器/编码 Agent、多 Agent 社会化系统。
- 不承诺接入所有数据库、所有 MCP 传输方式和所有行业专有协议。
- V1.0 不执行用户随意提交的 Python/JS 代码，不允许未知来源的任意命令执行。
- 不做复杂循环图、动态并发图改写、分布式高可用执行集群。
- 不把临床诊断、医疗报告签发、危急值决策交给未经验证的 AI；演示业务使用原创模拟数据。
- Coze/Dify **只作为产品与架构参考，不在 FlowInsight 内集成或复用其受许可证保护的源码**。

## 2. 核心概念和系统分层

### 2.1 六个独立概念

| 概念 | 职责 | 不能混淆为 |
|---|---|---|
| WorkflowDefinition | 定义节点、连线、变量和任务目标 | 某次运行状态 |
| TriggerDefinition | 定义什么时候启动某工作流 | 工作流本身 |
| WorkflowRun | 每次实际执行的记录，绑定已发布版本 | 可编辑草稿 |
| AgentDefinition / Runtime | 模型、上下文、记忆、计划、Tool Calling、验证等通用执行能力 | 某个行业写死的智能体 |
| Tool Registry / MCP Manager | 注册、发现、授权和实际调用工具 | 默认注入给所有 Agent 的工具集合 |
| Metric / Monitor | 保存指标历史、检测规则及告警状态 | LLM 的一段文字输出 |

### 2.2 高层处理流程

```text
React Flow Workflow Studio ──发布 DSL──> Workflow Service (FastAPI)
                                                  │
Manual / Schedule / Monitor / Webhook ───> Trigger Manager
                                                  │
                                       WorkflowRun (版本快照)
                                                  │
                                         Workflow Runner
                                          /           \
                             Deterministic Nodes    Agent Node
                             HTTP / Rule / Metric     Agent Runtime
                                   │                     │
                              Data / Metrics        Tool Registry
                                                         │
                                               Built-in / HTTP / MCP
                                          \           /
                                      Report / Alert / Review
                                                  │
                               Dashboard / Metrics / Runs / Trace
```

运行引擎可先部署在同一个 Python 服务进程，职责逻辑分层；不强制第一期拆微服务。

## 3. 主要页面与交互设计

| 页面 ID | 页面 | 主要功能 | 交付级别 |
|---|---|---|---|
| P-01 | 总览 Dashboard | 任务数量、最近执行、异常计数、关键指标趋势、快速运行 | P0 |
| P-02 | 任务中心 | 新建/编辑/启停任务、查看触发方式、运行频率、任务历史 | P0 |
| P-03 | Workflow Studio | React Flow 画布、节点栏、属性面板、变量映射、校验、调试、发布 | P0 |
| P-04 | 执行详情与 Trace | DAG 节点状态、时间线、输入输出摘要、Tool 调用、错误重试信息 | P0 |
| P-05 | 指标与报告 | 指标历史、时间范围选择、图表、AI 分析报告、证据链接 | P0 |
| P-06 | 数据源与资源中心 | HTTP 数据源/Webhook、工具/MCP 注册、测试连接 | P0 |
| P-07 | Agent 配置中心 | 通用 Agent 定义、模型/Prompt、可用工具、Context 策略 | P0（简版） |
| P-08 | 告警与处理 | 告警状态、去重、确认、基础备注/关闭 | P0（简版） |
| P-09 | 审批与高级运营 | Human-in-the-loop、复杂权限、执行恢复运营面板 | P1 |

### 3.1 Workflow Studio 的交互要求

- **三栏结构**：节点物料栏 / 中央 React Flow 画布 / 节点属性配置。顶部包含保存、校验、调试、发布、历史。
- 支持选择、拖拽、连线、删除、复制节点、缩放、适配画布；边上可展示数据流向。
- 属性面板根据节点类型显示不同表单，支持类型校验、必填提示、输入变量选择和上游结果映射。
- 调试模式显示每个节点 pending/running/succeeded/failed/skipped 状态；选择节点展示运行输入和输出。
- Agent 节点属性中选择“Agent Definition”和“允许使用的工具”。**MCP Tool 不必须靠画布连线才能供 Agent 使用。**
- 普通 Tool 节点表示 Workflow 明确执行一次工具；Agent 内部的工具调用展示在子 Trace 中，避免画布图意不清。
- 保存为 Draft，发布后生成不可变 WorkflowVersion；已启动 Run 固定引用自己的版本。

### 3.2 Dashboard 与指标分析体验

- 核心指标卡：按数据源与任务查看当前值、上次值、变化百分比、异常状态。
- 指标趋势：支持时间范围和分组维度；点击异常点查看对应 MonitorEvaluation 和 AgentRun。
- 结果输出：支持普通文本、表格、折线/柱状图和分析报告；第一期使用受约束的 Chart Schema，不让模型输出任意 React 代码。
- 报告需区分“计算事实 / Agent 推断 / 建议动作”，并关联数据或工具证据 ID。

## 4. 通用流程 DSL 和节点目录

### 4.1 V1.0 支持的节点

| 节点类型 | 典型实例 | 执行器 | P0 边界 |
|---|---|---|---|
| Trigger | Manual / Schedule / Monitor（含 Webhook） | Trigger Manager | Trigger 是入口配置，不作为普通中间节点多次执行 |
| HTTP Data | GET API 请求并抽取字段 | Deterministic Executor | 仅访问授权地址，超时限制 |
| Transform / Aggregate | 字段映射、筛选、求和、分组、增长率 | Deterministic Executor | 使用受控表达式/预置算子，无任意代码 |
| Condition | 比较、AND/OR、阈值判断 | Deterministic Executor | 基础条件分支，不做无限循环 |
| Agent | 分析数据、解释异常、选择工具 | Agent Runtime | 输入目标、Context、可用工具、输出 Schema |
| Tool | 调用注册的 Python/HTTP/MCP Tool | Tool Executor | 工作流显式调用，参数按 Schema 校验 |
| Output | Report / Metric / Alert | Output Executor | 保存结构化报告、指标点、告警记录 |

节点类别允许以后扩展；V1.0 图以 DAG 为主。节点端口必须声明输入输出类型，边连接要校验类型与可达性。

### 4.2 Workflow DSL 示例（概念协议）

```json
{
  "workflowId": "wf-inventory-monitor",
  "version": 1,
  "triggers": [{"type": "schedule", "cron": "0 9 * * *", "timezone": "Asia/Shanghai"}],
  "nodes": [
    {"id": "fetch", "type": "http_data", "config": {"dataSourceId": "inventory-api"}},
    {"id": "calc", "type": "aggregate", "config": {"operation": "days_to_expiry"}},
    {"id": "risk", "type": "condition", "config": {"field": "minDays", "op": "lte", "value": 15}},
    {"id": "analyse", "type": "agent", "config": {"agentId": "risk-analyst", "allowedToolIds": ["inventory.history"]}},
    {"id": "alert", "type": "output", "config": {"outputType": "alert"}}
  ],
  "edges": [
    {"source": "fetch", "target": "calc"},
    {"source": "calc", "target": "risk"},
    {"source": "risk", "target": "analyse", "branch": "true"},
    {"source": "analyse", "target": "alert"}
  ]
}
```

该 JSON 仅作为 API/Schema 设计草案；正式实现时需要由 Pydantic 定义判别联合、节点类型与数据契约，并同步生成前端 TS 类型。

### 4.3 变量、分支与失败语义

- 每个节点输出写入 Run Context 的独立命名空间（如 `nodes.fetch.output`），下游通过显式映射读取。
- 对未命中分支的节点标记 skipped，而不是无故停留 pending。
- 节点执行异常应记录错误类型、可安全展示的消息、attempt、latency；默认停止流程，少量读取节点允许有限重试。
- 有副作用的 Tool/Output 必须使用幂等键或提交保护；不能简单地依靠整个工作流重试。
- 图执行顺序由合法 DAG 决定，不直接信任浏览器提交的节点顺序。

## 5. 触发与监控机制

### 5.1 三种正式触发类型

| Trigger | 方式 | 示例 | V1.0 行为 |
|---|---|---|---|
| Manual | 用户点击“立即执行”或 API 手动调用 | 临时运行收入分析 | 创建 WorkflowRun 并保存发起人与参数 |
| Schedule | 按 Cron 和时区运行 | 每月 1 日输出上月报告 | 调度器创建新 Run；记录计划时间 |
| Monitor | 根据指标或事件的检测结果触发 | 标本超时、库存临期、错误率超阈值 | 基于轮询或 Webhook 输入检测；命中后启动指定 Workflow |

数据监控 **不是**“Agent 每隔几分钟无条件思考一次”。优先用确定性数据获取与计算规则形成 MonitorEvaluation；只在条件命中、周期分析或人工请求时再运行 Agent。

### 5.2 Monitor 的两个输入模式

- **Polling**：定时器先采集外部数据并计算规则，再创建监控事件；适合库存/指标 API。底层可复用 Schedule 调度，但 Monitor 独立管理状态、阈值、去重、恢复条件。
- **Webhook**：外部系统主动推送事件，平台先校验签名/令牌和幂等键，再提交 MonitorEvaluation；适合标本状态变化、业务告警。

### 5.3 防抖与事件生命周期

MonitorPolicy 至少支持 `rule`、`cooldown`、`dedupKey`、`recoveryRule` 四个字段。建议告警状态：`open → acknowledged → resolved`，可选 `suppressed`。同一对象持续超阈值时，不得每个采样点都产生新告警和昂贵 Agent 调用；恢复后再次异常允许重新开单。

### 5.4 调度安全边界

- 作业时区明确，服务重启后避免重复执行；支持同一任务是否允许并发的策略。
- 定时错过、Webhook 重投、接口超时需要记录，不承诺 V1.0 全场景严格 exactly-once；采用幂等键和可观测的至少一次处理策略。

## 6. Agent 应用设计与 Tool / MCP 规范

### 6.1 通用 Agent Runtime

Runtime 不包含 LIS、库存或财务的写死 Prompt。关注：模型调用、消息历史、Context 裁剪、可选 Memory、可选 Planning、Tool Calling、受约束输出、执行状态、Trace、Token 与 Cost。V1.0 Memory 先使用会话上下文与可选摘要；跨任务长期记忆不作为必备能力。

`AgentDefinition` 保存模型配置、Prompt/目标、Context 策略、规划开关、输出 Schema、默认工具白名单。Workflow 中的 Agent 节点引用已发布版本并提供运行时输入。Tool 配置与工作流变量可以合并，但**最终调用权限必须取用户权限、Agent 允许列表、Workflow 权限的交集**。

### 6.2 工具两种调用方式

| 模式 | 由谁决定 | 典型用途 | 记录方式 |
|---|---|---|---|
| Workflow Tool Node | Workflow Runner 依配置执行 | 每次必查特定 API | 独立 NodeExecution |
| Agent Tool Calling | LLM 在可用白名单中动态选择 | 根据异常调查需要选择历史数据或知识查询 | AgentRun 内部 ToolTrace |

不要把 Tool Registry 和 MCP 混为一谈：平台内部统一工具描述，MCP 是一种外部发现/调用协议；内置 Python Tools 无需伪装成 MCP Server。

### 6.3 MCP 动态注册与生效

1. 管理员通过资源管理界面注册 MCP Server URL、认证方式、可用环境，并测试连通性。
2. MCP Manager 调用 `tools/list` 获取工具名、描述、输入 Schema，并将**元数据**存入持久化 Tool Registry。
3. 用户在 Agent 配置中选择允许的工具并发布新 Agent 版本。
4. **下一次新建 AgentRun 时**，从注册中心解析 Tool，按权限装配执行环境；不需重启 FastAPI 服务。
5. 同一 Run 锁定工具定义与 Agent 配置快照；但权限撤销、Server 停用、凭证失效必须在真实调用前实时阻断。
6. 工具可能下线或 Schema 变化；注册中心提供刷新、禁用与版本变更提示，不允许静默改变旧运行的语义。

V1.0 优先支持一种远程 MCP 传输与认证模式；后续才支持更多协议、复杂 OAuth 和大规模连接池。不得将 MCP Tool 全局默认注入每个 Agent。

### 6.4 Agent 分析结果约定

```json
{
  "summary": "某业务指标出现明显变化",
  "facts": [{"metric": "month_income", "value": 186.4, "unit": "万元", "sourceRef": "metric:income:2026-09"}],
  "hypotheses": [{"text": "可能与业务量下降有关", "confidence": "low", "evidenceRefs": ["metric:volume:2026-09"]}],
  "recommendedActions": [{"action": "review_volume", "requiresApproval": false}],
  "limitations": ["尚未获得价格结构数据，不能确认原因"]
}
```

事实来自可信数据/计算工具；LLM 只能提出推断及建议，必须注明未证实的部分。服务端验证结构、引用是否存在及工具返回的一致性。

## 7. 数据源、指标与分析模型

### 7.1 可扩展数据接入

- **V1.0**：HTTP GET JSON、受约束的模拟/种子数据集、Webhook JSON；通过统一 `DataSourceAdapter` 接口扩展。
- **V1.1**：只读 SQL 数据源（独立凭证与查询限制）、文件数据集、更多 SaaS Connector。
- 连接配置持久化，密钥只保存加密引用，不直接暴露给前端或 Agent Prompt。
- 数据源测试应反馈字段结构预览、可用性、超时、错误；提供字段映射和类型配置。

### 7.2 通用指标模型

`MetricDefinition` 至少定义：指标编码、来源、数值计算表达式、时间字段、维度字段、采样策略、单位和统计口径。`MetricPoint` 记录测量时间、业务维度、原始来源引用、数值和所属定义版本。

支持基础：count/sum/avg/min/max、阈值比较、环比/同比（仅在时间窗足够时）、简单移动窗口比较。复杂预测和通用 BI 查询语言后置。

### 7.3 智能分析不等于数值计算

- Python/SQL 工具计算实际数量、增长率、临期天数、错误率等确定性指标。
- Agent 根据多个指标调用工具分析原因、解释影响、建议后续检查。
- 报告记录数据区间、计算口径、生成时间、模型版本和证据引用，避免历史结果不可复现。

## 8. 功能需求清单（带验收条件）

| ID | 级别 | 功能 | 最低验收标准 |
|---|---|---|---|
| FR-01 | P0 | Workflow 草稿与发布 | 新建/修改/保存/发布流程；非法节点边被拒绝 |
| FR-02 | P0 | React Flow 编辑器 | 至少 6 类节点可配置，连线与变量映射正常 |
| FR-03 | P0 | Workflow Run | 能执行合法 DAG、持久化节点状态和输出、查看失败 |
| FR-04 | P0 | Manual Trigger | 支持“立即执行”，重复点击不会无控制地重复创建任务 |
| FR-05 | P0 | Schedule Trigger | 配置 Cron/时区，按配置启动 Run，记录调度历史 |
| FR-06 | P0 | Monitor Trigger | 轮询或 Webhook 数据经规则命中触发 Run，支持去重/冷却 |
| FR-07 | P0 | 数据源中心 | 注册/测试 HTTP 数据源与模拟 Dataset，字段映射可用 |
| FR-08 | P0 | 指标历史 | 保存数值、时间、维度；可用图表查看与筛选 |
| FR-09 | P0 | Agent 节点 | 接收上游变量、返回结构化报告、记录模型/工具调用 |
| FR-10 | P0 | Tool Registry | 内置 Python/HTTP Tool 注册并能在 Workflow/Agent 调用 |
| FR-11 | P0 | MCP 注册 | 页面动态新增 Server、发现工具、新 AgentRun 生效、无需重启 |
| FR-12 | P0 | Tool 级权限 | 未授权工具不会进入模型工具表；撤权后阻断后续执行 |
| FR-13 | P0 | 智能报告 | 区分事实/推断/建议；保存报告并关联指标证据 |
| FR-14 | P0 | Dashboard/Trace | 能查看最近运行、节点时间线、Agent ToolTrace、错误 |
| FR-15 | P0 | 监控告警 | 同一个异常去重、确认、关闭并可查历史 |
| FR-16 | P0 | 跨场景验证 | 至少两条不同结构的数据任务复用相同 Workflow/Monitor/Agent 引擎 |
| FR-17 | P1 | Human-in-the-loop | 暂停、审批、恢复，刷新和后端重启后状态可继续 |
| FR-18 | P1 | SQL/文件 Connector | 可控接入额外来源，限制权限与计算资源 |
| FR-19 | P1 | 工程强化 | 指数退避、幂等治理、更多测试、版本差异对比 |
| FR-20 | P2 | 企业化功能 | 多租户、细粒度 RBAC、插件市场、复杂图执行 |

**P0 是完整 V1.0 的核心范围，不等同春招展示版的全部范围，更不是春招前必须无条件全部交付的承诺。** 应按下文里程碑先完成最有求职价值的端到端演示，再补齐可靠性与扩展性。

## 9. 典型业务演示：证明平台不与行业绑定

| 演示用例 | 触发 | 数据 | 规则与计算 | Agent 工作 | 结果 |
|---|---|---|---|---|---|
| 标本流转超时 | Webhook / Monitor | 标本事件列表 | 流转耗时超过 30 分钟 | 查询相关事件，解释可能瓶颈 | 告警 + 证据报告 |
| 实验室物资监控 | Schedule / Monitor | 库存/有效期 JSON | 库存阈值、临期天数 | 结合消耗历史建议复核 | 库存风险报告 |
| 科室收入分析 | Schedule / Manual | 月度收入和业务量 | 同比、环比、项目结构 | 解释变化并提示数据缺口 | 月度分析图表 |
| API 错误率监控 | Monitor | API 指标 JSON | 错误率/延迟阈值 | 汇总波动时间段和证据 | 告警与调查报告 |

验收优先选其中**至少两条异构任务**：一条事件/异常监控、一条定期指标分析。其余作为演示数据或扩展，不写死成平台菜单与领域表结构。

## 10. 数据模型与接口草案

### 10.1 核心实体

| 领域 | 主要实体 | 关键关系 |
|---|---|---|
| 用户配置 | User, Workspace | 所属工作区与访问权限 |
| 编排 | Workflow, WorkflowVersion, WorkflowNode, TriggerDefinition | WorkflowVersion 不可变；Trigger 指向发布版本 |
| 执行 | WorkflowRun, NodeExecution, RunEvent | Run 指向发布版本和触发来源 |
| 数据源 | DataSource, DataSourceCredentialRef, DatasetSchema | 字段映射与安全凭证 |
| 监控指标 | MetricDefinition, MetricPoint, MonitorPolicy, MonitorEvaluation | 指标、采样、检测、异常判定 |
| AI 资源 | AgentDefinition, AgentVersion, MCPServer, ToolDefinition, AgentRun, ToolExecution | 工具与 Agent 各自版本化 |
| 结果运营 | Alert, AnalysisReport, ApprovalTask, AuditLog | 报告、告警、审批和审计 |

优先建立最小但清晰的表结构；过度拆表可在后续迭代，不要一次性实现全部 P1/P2 实体。

### 10.2 核心 REST API（草案）

```text
POST   /api/workflows                    创建草稿
PUT    /api/workflows/{id}               保存草稿
POST   /api/workflows/{id}/validate      校验节点、边、引用和权限
POST   /api/workflows/{id}/publish       发布版本
POST   /api/workflows/{id}/runs          手动执行
GET    /api/workflow-runs/{id}           运行状态
GET    /api/workflow-runs/{id}/events    SSE 运行事件
POST   /api/data-sources                 注册数据源
POST   /api/data-sources/{id}/test       测试连接
POST   /api/mcp-servers                  注册 MCP Server
POST   /api/mcp-servers/{id}/refresh     刷新工具目录
GET    /api/tools                        查询可用工具
POST   /api/agents                       创建 Agent 定义
GET    /api/metrics/{id}/points          获取指标历史
GET    /api/alerts                       告警列表
GET    /api/reports/{id}                 结构化分析报告
```

接口均为规划，不保证最终路径和字段完全不变；实现时使用 OpenAPI/Pydantic 并生成前端调用类型。

### 10.3 SSE 事件（建议）

`run_started`、`node_started`、`node_succeeded`、`node_failed`、`agent_tool_started`、`agent_tool_finished`、`run_completed`、`run_failed`。每条事件具有 `runId`、`eventId`、`timestamp` 和 `sequence`，用于断线后通过服务端历史补齐。客户端不能把 SSE 当成唯一持久化状态源。

## 11. 非功能需求与安全原则

| 维度 | V1.0 验收目标（拟定） |
|---|---|
| 可靠性 | 后端运行记录持久化；重复监控事件可去重；失败可定位；重要写操作防重复 |
| 可观测性 | 每个 Run 可查节点状态、耗时、错误、Tool 调用、模型及 Token 使用量 |
| 性能 | 演示环境下支持几十条任务定义、数百条运行历史和基础折线图；用实测数据确定指标 |
| 安全 | 数据源 URL 做出站访问限制，防 SSRF；凭证后端加密存储；HTTP/SQL/MCP 工具执行前校验授权 |
| 数据隔离 | 初期单工作区，但表结构保留 workspace_id 与调用身份字段 |
| AI 质量 | 结构化输出校验；模型事实不得替代指标计算；报告标注引用和推断不确定性 |
| 合规 | 全部演示数据原创/合成；不上传医院患者信息、公司私有代码和未授权财务数据 |
| 测试 | 核心 DAG、Condition、Trigger、工具权限、指标口径有自动测试；Agent 有小型 Eval Case 集 |

安全细节：禁止任意 SQL 写入、限制 HTTP 出站域名、敏感值不进入日志/Prompt、工具参数进行服务器端 Schema 校验、MCP 工具变更须刷新与审核。Agent 配置快照不覆盖即时撤权策略。

## 12. 真实工作量评估与迭代交付（v1.3）

### 12.1 估算口径和原则

- **不设 200h/260h 硬上限**。需求、设计讨论、React/Codex 协同、ChatGPT 给出 Python 代码后本人手动敲写理解、联调、自动测试、排障、重构和文档均计入真实项目投入。
- 工时采用**区间**而不是精确承诺。下限表示采用成熟库、对功能做清晰边界控制且未遇重大重构；上限包含正常学习曲线、架构调整和跨模块集成。超出区间也不意味着必须砍功能，应先分析偏差。
- 下表只针对**个人可交付的完整 V1.0**，不是企业级 SaaS 商用就绪。不包含复杂多租户、专有协议接入、严格高可用或所有行业的通用能力。
- **工作量不可简单理解成八段顺序开发**：M2/M3、M4/M6、M5/M6 强耦合，按纵向切片交错推进；下列分项避免重复计算同一项功能。

### 12.2 分阶段工时评估（不作为截止限制）

| 里程碑 | 包含的实际工作 | 工时区间 | 验收门槛 |
|---|---|---:|---|
| M0 项目基线与架构 | Repo、依赖、环境/配置、开发部署、文档、技术 Spike、数据契约初稿 | 8–16h | 本地前后端、DB 可启动；路线与架构决策可追踪 |
| M1 Python 后端与数据源 | FastAPI/SQLAlchemy/Alembic、基础数据结构/API、认证基线、HTTP/Mock 数据接入、Schema 预览、字段映射、采样与测试 | 35–60h | 可注册/测试数据源、采集并持久化样例，前后端联通 |
| M2 React Flow Workflow Studio | 节点物料/端口、画布/属性表单、输入输出 Schema、变量引用、校验、草稿/发布、编辑 UX、基础运行状态映射 | 55–95h | 创建、修改、校验并发布有效图；错误引用/无效边得到反馈 |
| M3 Python Workflow Runner | DSL 解析、DAG/分支、参数解析、Node Executor、Run Context/状态机、持久化、错误/重试、幂等基础、运行事件、测试 | 60–110h | 一条带条件分支的确定性流程可执行、追踪和稳定重放；异常可解释 |
| M4 Trigger & Monitor | Manual/Schedule、Webhook 接收、Polling 采样、规则评价、时区/并发、去重冷却、恢复状态、重投防护、测试 | 40–75h | 三类触发统一创建 Run；重复事件不会无限重复告警 |
| M5 Agent Runtime / Tools / MCP | 模型接入、Context/State、LLM Tool Calling、Agent 配置及版本、Built-in/HTTP Tool、动态 MCP 注册/发现、授权/撤权、结构化输出、Trace、测试 | 75–135h | Agent 使用授权工具；MCP 动态注册无需重启；行为可追踪 |
| M6 Monitoring / Metrics / Analytics UI | 通用指标定义/口径、历史采样与时间窗口、图表、告警生命周期、分析报告/证据、业务工作台、异构场景演示及联调 | 55–100h | 至少两个差异化业务场景复用同一执行与分析底座；数据与报告可追溯 |
| M7 质量工程、部署与求职展示 | 单测/集成/E2E 补全、失败案例、Agent Eval 小集、性能与安全基本检查、Docker/CI、演示、架构说明和复盘 | 35–65h | 可复现部署、稳定演示、测试通过，关键取舍可解释 |
| **合计** | **完整 V1.0 粗略估算（非工时上限）** | **363–656h** | **以 Gate Review 和实际证据为准** |

**粗略量级约为 360–660 小时。** 这是在现有范围不大幅膨胀、允许使用 React Flow、LangGraph、MCP SDK、Codex 等成熟工具前提下的经验估算，并非逐项测量的精准项目报价。用户实际掌握程度、方案选择和 Debug 难度会影响结果。工时不衡量项目质量。

### 12.3 容易被遗漏但必须安排的工作

1. **跨端契约**：Pydantic JSON Schema/TS 类型、节点端口和变量映射的兼容性、工作流版本冻结。
2. **持久化语义**：Draft/Published/WorkflowRun 分离、节点输出持久化、重启后“历史可见”与“执行可继续”是不同验收项。
3. **触发一致性**：Cron 时区、Webhook 身份校验、事件幂等、Monitor 开启/恢复/冷却的状态机。
4. **工具安全**：数据源出站白名单/SSRF、凭证保存、MCP Schema 漂移、Agent 工具白名单与即时撤权。MCP 结果属于不可信外部内容。
5. **分析正确性**：指标口径、聚合和时间窗口测试、原始证据引用、事实与模型假设分离。
6. **用户体验与工程收尾**：运行调试界面、SSE 断线恢复、失败提示、测试数据、部署和可重复 Demo。

以上工作已在 M1–M7 区间中分配，不作为最后才发现的“额外 0 小时任务”。新增超出 V1.0 的高级功能须单独估算。

### 12.4 纵向演进与春招策略

| 检查点 | 真实功能目标 | 说明 |
|---|---|---|
| S1 全栈数据闭环 | 数据源注册/查询、采样入库、前端趋势显示 | 不等复杂画布完成才建立第一个联通结果 |
| S2 Mini Workflow | Studio 编辑/发布、Manual、HTTP/Transform/Condition/Output、Run 状态和 Trace | 一个可以给面试官实际操作的最小工作流系统 |
| S3 AI 分析闭环 | 增加 Agent + 内置 Tool、结构化分析、指标证据和报告 | 先验证 AI 端到端，再扩充 MCP 与复杂触发 |
| S4 完整监控闭环 | Schedule、Monitor Polling/Webhook、指标历史、告警去重/恢复、MCP 动态工具、两种异构案例 | 满足完整 V1.0 的核心承诺 |
| S5 完整交付 | 测试集、基础安全、部署文档、演示与项目复盘 | 不将临时 Demo 误称为生产级产品 |

**春招是作品展示和求职节点，不是砍掉 P0 功能的强制截止日。** 可以在任一已通过 Gate 的检查点准备简历、录屏和演示，不把尚未实现的能力写成完成。若每周只投入约 8 小时，完整 V1.0 可能跨越多个季度；可主动加时，但不要求机械按周数结束项目。

### 12.5 与 ChatGPT Chat / Codex 的协作方式

先讨论当前模块需求、架构、数据契约、取舍和风险，再实现和持续修订设计。Python/后端/Workflow/Agent/MCP 的核心代码由 ChatGPT 在讨论方案后**分文件、分步骤提供参考实现**，用户亲手敲入、理解、运行并调试；前端核心可采用相同方式，熟悉的 React UI、CRUD 和部分 React Flow 功能可由 Codex 按已确认需求加速开发，用户负责 Review 和联调。

每次 60–120 分钟只推进一个明确的可验收小任务。区分：已讨论、ChatGPT 已给代码、已敲入、已运行、已测试、已部署。不因新增工时预算就无限制增加节点种类或重复造 SDK。

### 12.6 完成定义及商业化边界

**完整 V1.0 DoD**：用户能配置/发布有类型校验的工作流；三种触发均可执行；通用 Runner 可执行确定性节点与 Agent 节点；授权 Tool/MCP 能动态注册并调用；可保存指标、异常、报告、Run 和 Trace；两条异构案例可复现，关键失败场景有测试和部署说明。

**春招阶段作品 DoD**：只声明已经跑通且能真实展示的能力，不因完整 V1.0 未结束而影响投递。

**商用准备另行评估**：服务可靠性、多用户权限与租户隔离、安全审计、合规、依赖许可证、运维及 SLA 都不是上述个人 V1.0 的自动结果。严禁用“源码自研”推导“已具备商用可靠性”。

### 12.7 长期方向：标准化、系统化、企业化

**项目是持续演进的正式产品，不是完成演示后丢弃的练习工程。** 长期目标是可维护、可扩展、可运营、可审计的企业级业务监控与分析平台；求职演示是阶段检查点，不是质量上限。

- **标准化**：逐步统一目录与命名、依赖锁定、配置与密钥管理、开发命令、格式化/静态检查、接口与错误契约、数据库迁移、测试、CI 和文档。个人编辑器设置不能替代仓库级质量规则。
- **系统化**：保持领域边界，让数据接入、Workflow、触发、Agent、Tool/MCP、指标与告警形成可追踪闭环；明确职责、版本、状态、失败语义和扩展契约，不堆砌互不关联的示例功能。
- **企业化**：基于真实用户、负载和部署需求，验证身份与权限、工作空间/租户隔离、审计、安全、任务恢复、监控告警、备份恢复、发布回滚、容量和成本治理。未验证前不得宣称商用就绪。

基础工程规范伴随 M0–M7 落实，M7 做综合验证而非首次补质量。V1.1/后续企业能力分别讨论设计、范围、预算和验收；现有 363–656h 仍仅是完整 V1.0 估算，不包含全部企业化目标。不得仅因“企业级”提前引入微服务、Kubernetes、复杂多租户或无业务依据的抽象。

阶段路线见 [ROADMAP.md](ROADMAP.md)，决策与真实实施状态分别维护在 `DECISIONS.md`、`LEARNING_STATE.md`。

## 13. 验收案例与失败边界

| 测试 ID | 用例 | 预期 |
|---|---|---|
| AT-01 | 用户创建流程并连出环路 | 服务端校验失败，标明问题节点 |
| AT-02 | 手动触发合法图 | 按 DAG 正确执行并保存每步结果 |
| AT-03 | 定时触发已发布图 | 创建带 schedule 溯源的 WorkflowRun |
| AT-04 | Monitor 连续 3 次命中同一对象 | 冷却期内不重复建 3 条独立告警 |
| AT-05 | Webhook 相同事件重复投递 | 以事件幂等键避免重复处理 |
| AT-06 | Agent 需要工具但未授权 | 工具不可见或拒绝调用，记录受控错误 |
| AT-07 | 新 MCP Server 注册后绑定 Agent | 无需重启，下一次 Run 能发现并调用工具 |
| AT-08 | MCP Tool 权限执行中撤销 | 后续实际 Tool 调用被拒绝 |
| AT-09 | HTTP 节点超时 | 节点失败可追踪；按策略有限重试 |
| AT-10 | 月度收入环比计算 | Python 计算与预设结果一致，LLM 不自行编造数字 |
| AT-11 | Agent 输出引用不存在的数据 | 结构校验或证据校验失败，标记不可信 |
| AT-12 | 页面刷新期间运行继续 | 页面重新加载后能从 DB/SSE 恢复可见状态 |
| AT-13 | 两种业务场景使用同一 Runner | 无需修改 Runner 核心分支即可运行 |
| AT-14 | 有副作用 Tool 被重复执行 | 经幂等策略不会重复写入业务记录（P1 强化） |

## 14. 关键技术决策与待验证问题

### 14.1 已确认

- 前端 React + TypeScript；React Flow 为核心可视化编排；Zustand 可按需做编辑器状态。
- 后端 Python + FastAPI、SQLAlchemy、PostgreSQL；不要为了语言学习重新做独立练习项目。
- Workflow Runner 核心逻辑自己实现，但 Agent 基础能力允许使用 LangGraph、成熟 LLM SDK；不得照搬 Dify 源码并宣称原创。
- Coze / Dify 仅供产品和架构参考，不在本项目内集成。
- Agent Runtime 通用；Agent Definition/实例可专用；MCP 工具平台动态注册、Agent 按权限装配，服务无需因注册新工具而重启。
- 平台领域无关；LIS、库存、收入等仅是可替换的验证数据与场景。

### 14.2 必须通过 Spike/ADR 决定

1. V1.0 Workflow Runner 的状态恢复深度：仅恢复展示与重试，还是支持跨重启续执行。
2. Monitor 轮询调度器采用何种库/部署方案，以及多实例情况下的任务所有权。
3. Agent SDK / LangGraph 的版本、工具运行装配方案与流式事件格式。
4. MCP 具体首选传输方式、身份认证和 Server Schema 变更策略。
5. Workflow DSL 的数据契约、受限表达式引擎与防循环校验方案。
6. 长期历史数据量增长后的存储、保留期与按时间分区策略（V1.0 先小规模验证）。

## 15. 交付物清单

- 可运行的前端/后端源码、环境配置和样例数据。
- `docs/PRD.md`、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/ROADMAP.md`、`docs/LEARNING_STATE.md`。
- Workflow DSL Schema、Tool Definition、Agent Config、RunEvent 等接口契约。
- 两条异构案例的可重现 Demo 脚本、测试报告与部分失败案例。
- 演示短视频/截图、部署说明、2027 春招简历项目说明。

**产品路线判断标准：** 若工作重心变成复制 Dify 的通用节点数量或 UI 外观，应停止横向扩张，把时间重新投入“持续业务监控 + 指标历史 + AI 解释 + 可靠执行”这条核心差异化链路。
