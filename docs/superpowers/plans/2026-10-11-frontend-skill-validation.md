# flowinsight-frontend 创建与验证记录

日期：2026-10-11。范围：创建项目 skill、frontend/AGENTS.md 和验证资料；不迁移前端实现、不修改后端、不安装应用依赖、不提交。

## 任务清单

- [x] 读取 best-creating-skills、skill-creator、writing-skills 及测试方法。
- [x] 核对用户指定的位置、已有改造计划与实际接口。
- [x] 无新 skill 的只读基线试跑，记录具体选择而非推测失败。
- [x] 创建 SKILL.md、规范引用、MAINTAIN.md 执行流程图及常驻约定。
- [x] 检查格式、名称、资源、相对路径、占位符及安全边界。
- [x] 独立只读验证正常任务、失败任务和触发正反例，发现问题后修订复测。
- [x] 区分文件发现、显式读取、自动选择和真实业务实现验证；记录未验证项。
- [x] 更新项目进度及决策，只声明本次范围内结果。

## 基线任务（不提供新规范）

给独立代理只读任务：读取现有 App、api/health、package.json 和后端 main，设计统一请求入口、health service 和页面迁移的文件职责与调用示例；不读取已有计划、项目指令、skill 或外部参考。

观察项：是否自主选出 utils/XRequest、services 命名空间、pages/Layout 的用户习惯；是否保留真实接口 503 的语义和取消；是否越界改后端或自动添加依赖。

## 新 Skill 测试案例与标准

| 案例 | 输入 | 可观察标准 |
| --- | --- | --- |
| 显式/正常 | 使用 flowinsight-frontend，只读设计健康页 service 与页面结构 | 实际读取 SKILL.md 和 conventions；文件落点、namespace 和依赖方向符合规范；不把未迁移代码说成已完成 |
| 隐式正例 | 给 FlowInsight 前端新增数据源 service 的方案 | 根据 name/description 判断应选择；先核对接口，未知 DTO 不编造 |
| 简短正例 | 健康页按原来的 service 方式整理一下 | 结合本项目上下文判断应选择，而不是通用 CSS 技能 |
| 相近负例 | 给后端新增 /api/health 的 Python 测试 | 不选择前端 skill；不自动引入前端修改 |
| 混合 | FastAPI 接口已给出，现在写前端 service 接入 | 只对前端部分使用；不借机改后端契约 |
| 故障 | ready 返回代理生成的 503 HTML，页面应显示什么 | 数据库未知，不能认定不可用；不通过后端改成旧 data 包解决 |
| 缺失输入 | 新数据源 API 尚无 URL/响应，要求猜一个 service | 先询问缺失接口或仅交付标明未确认的方案；不声称实际接入成功 |
| Review | 只检查 App 直接 fetch 是否合理 | 只读指出边界与建议，不擅自重构 |

## 验证证据

基线独立代理 frontend_skill_baseline 实际读取四个指定文件；未修改文件、联网、运行项目测试或安装依赖。

原样摘录结构选择：`frontend/src/api/client.ts`、`frontend/src/pages/health/HealthPage.tsx`，并建议“保留原生 fetch”；App 保留页头/页尾，页面调用示例直接 `checkHealth(...)` 而非 service 命名空间。

结果：接口 503 与取消判断正确，也有合理分层；但没有自然恢复用户指定的 XRequest 路径、pages PascalCase/index、layout 和 namespace 调用习惯。基线不通过的是本项目的约定一致性，不是通用技术能力。这些差距是新 skill 的具体价值，不能声称所有基线行为失败。

### 格式与资源检查

- 官方 skill-creator 的 quick_validate.py：退出 0，`Skill is valid!`。
- 独立 Node 只读断言：名称、文件、相对链接、AGENTS 指向、无本机绝对路径、无 scaffold 占位符、代码围栏及维护流程图关键失败回路均通过。
- SKILL.md 37 行，conventions 88 行，MAINTAIN 67 行；无超过 100 行而缺少目录的引用文件。
- git check-ignore 未匹配新 skill/AGENTS；文件可随仓库版本管理，未提交。
- git diff --check 通过。Mermaid 流程内容已核对，未执行渲染器，不宣称渲染测试通过。

### 新上下文发现与显式使用

独立代理 frontend_skill_trial（不继承父会话记录）报告启动技能列表实际包含 flowinsight-frontend，路径与项目目录一致。工具轨迹实际读取了 name/description、完整 SKILL.md、conventions、frontend/AGENTS，以及允许的进度/源码；没有读取本验证记录或既有改造计划。

发现已确认；随后提供路径的显式使用亦已执行。初始父会话的技能列表没有该新条目，不能把创建文件说成已更新所有旧会话的上下文。

### 选择与行为结果

- 描述选择：数据源前端 service、简短健康页整理、前端接入后端契约、前端 Review 均选用；纯 Python health 测试不选用。这里是提供元数据后的选择测试，不是无提示自然任务的自动触发可靠率测试。
- 正常任务：试跑提出 `frontend/src/utils/XRequest.ts`、`services/health.ts`、显式 health.types、services/index 的 namespace；页面采用 `pages/HealthStatus/index.tsx` 与页面私有 StatusRow；App 收敛为应用组合。正确标注拟创建、未安装 Axios、未核验 alias，不虚构已有实现。
- 代理 503 HTML：选择数据库未知并保留 HTTP 503，而不是数据库不可用；若 health 成功，其结果独立保留。
- 缺失 URL/响应：拒绝编造接口或宣布接通，提出必要契约输入。
- 旧 data 包压力：拒绝越界改后端，按真实 JSON 契约适配前端。
- 取消：选择 abort 及请求身份核验，不更新旧报告/时间，不清除新请求加载态。
- Review 范围：选择适用但仅只读；全部试跑均无写入、安装、联网、提交或服务状态操作。

上述方案与规范逐项核对通过，没有据此添加额外规则。无 skill 基线结构与带 skill 结构的差异已有可观察证据；接口/取消的基线本来正确，不能归功于新 skill。

### 尚未验证

未运行自然措辞下的无提示自动触发端到端测试，也未测试其他宿主或模型。只读方案不能代替后续 service 迁移的 test/lint/build、真实代理及浏览器验收；本次没有重跑应用测试，没有修改业务源码或依赖。

## 后续真实任务：取消工具迁移

2026-10-11，用户仅指定迁移 abortController，未点名 flowinsight-frontend。当前主会话的技能目录已包含该 skill；主代理按任务匹配并完整读取 SKILL、conventions 和 AGENTS，实施范围限定为取消工具，未展开 service 或后端。这是一次真实隐式使用记录，不代表长期自动命中率保证。

工具测试先执行，因模块尚不存在失败；添加 TypeScript 工具后，11 项取消工具 + 原 11 项健康测试共 22 项通过，lint/build 通过。规范引用补入既有 signal、跨消费者分组、URL 改写清理及 finally 要求，MAINTAIN 流程图同步；格式校验通过。未更改触发描述，也未重新跑其他宿主的选择测试。

工具尚未接入当前页面/XRequest，未验证真实 Axios 取消或新的浏览器行为。上节“尚未验证”描述的是初次创建时的只读试跑边界；本次新增了实际工具实现验证，不应混为完整 service 迁移。
