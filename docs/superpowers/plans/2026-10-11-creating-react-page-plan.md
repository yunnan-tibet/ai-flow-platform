# creating-react-page 通用前端规范重建计划

> 执行说明：用户已确认实施，并进一步确认采用用户级目录。使用 superpowers:executing-plans 分步推进；skill 编写与验证采用 best-creating-skills、skill-creator 和 superpowers:writing-skills。不得自动提交、修改业务代码或参考项目。原始设计和历史盘点保留，实际证据见文末执行记录。

**Goal:** 将偏重 service、绑定项目进度的 flowinsight-frontend 重建为通用 creating-react-page，覆盖 React 页面生成和整个 src 的结构组织。

**Architecture:** 从参考项目的全部目录结构和各层代表实现中提炼可移植规范，区分保留、调整、排除的规则。主 SKILL 编排任务，按需引用结构、页面写法和数据访问说明；项目进度和具体接口不属于 skill。

**Tech Stack:** React、TypeScript、Markdown/YAML；构建工具、路由、状态、样式和测试方案从目标仓库核对，不绑定 Umi 或固定依赖版本。

## 1. 已核查的问题与证据

- 旧 SKILL 的 description 以英文开头，并限定 FlowInsight；执行清单要求读取 docs/LEARNING_STATE.md、更新项目进度。
- 旧 conventions 包含健康接口、8 秒超时、工具已迁移但未接入等项目事实；MAINTAIN 的工作流和验证记录也依赖本项目。这些不是通用页面技能。
- best-creating-skills 已要求描述使用真实请求词、区分稳定规则与时效事实、引用不依赖创建者电脑的绝对路径；但没有明确规定中文优先，也没有足够明确的“通用 skill 与项目进度隔离”验收项。
- 之前主要讨论 XRequest/services，不能据此认为其他目录的组织规范已充分提炼。

本次已盘点参考 src 的全部 683 个文件路径与目录层级，并阅读各层代表实现和依赖关系；不是逐行审查全部 683 个文件，也不需要把图片或全部业务源码复制进 skill。

参考位置（仅用于本计划的溯源，不成为新 skill 的运行依赖）：

- /Users/burt/frontpros/xinghe/xh.h113.web/src
- /Users/burt/frontpros/xinghe/XH.SDM.WEB/src/utils/abortController.js

| 范围 | 路径数量 | 已观察到的组织方式 | 提炼方向 |
| --- | ---: | --- | --- |
| pages | 218 | PascalCase 页面目录、index.tsx、页面私有 components；复杂模块下就近 utils/config/const 与测试 | 页面为功能入口，私有内容就近，按真实职责拆分 |
| components | 400 | 独立组件目录，index.tsx 与样式、类型、配置并置；内部 components/hooks；另有低代码 atom 组件族 | 共享与私有分界；复杂组件内部自治；atom 仅作为特定场景组织示例 |
| layouts | 5 | BasicLayout、CommonLayout；外壳/导航/Provider 与页面内容分离 | 保留布局职责，不保留 Umi 路由接线 |
| services | 13 | 领域文件、具名函数、index 的 service 命名空间、XRequest 对象参数 | 领域接口入口与统一传输分离 |
| store | 9 | Zustand 领域状态、actions、selectors；部分 persist/devtools | 区分局部、共享和持久化状态；按已选状态方案落实 |
| utils | 8 | 请求、格式化、文件、modal、hook 等模块 | 明确纯工具、React hook、基础设施边界，不形成万能工具文件 |
| constants | 12 | 领域常量、选项、主题、正则与导出入口 | 局部常量并置、共享常量分域，不全部堆入 index |
| typings | 3 | 领域全局 namespace/声明；services/store 也有 typing.d.ts | 学习类型归属，但普通业务类型优先显式导出并就近存放 |
| styles | 4 | mixin、滚动条、第三方样式调整；局部 index.less/styles.less | 全局/局部/第三方覆盖分界；保留局部 styles 对象使用习惯 |
| assets | 8 | logo 和 img 静态资源 | 共享资源集中、功能私有资源就近，不绑定原业务品牌 |
| src 根文件 | 3 | app.ts、global.less、loading.tsx | 保留初始化、全局样式、加载回退的职责，不保留框架自动发现规则 |

阅读样本包括 Cockpit 与 Pages/SearchCards、Designer 与私有模块、MapManage/mapTree、SchemaForm、GlobalModal、ErrorBoundary、atom/Button 与 Table/hooks、store/global 与 buBinding/selectors、services/map 与 index、typings/mapManager、utils/hook/modal/XRequest、global.less/mixin、layouts 及就近工具测试。

## 2. 设计选择

采用“通用工作流 + 用户偏好的默认组织规范”，不采用仅改名的方案，也不直接复制整个旧项目作为脚手架。

- 仅改名仍会保留项目耦合与 service 偏重，不能解决当前问题。
- 整项目复制会带入 Umi、业务组件、认证和内部依赖，也会过度约束小页面。
- 提炼规则能够保留熟悉的写法，同时用于不同 React 仓库；新项目提供默认组织，已有项目先核对差异，本次仅变更授权范围。

名称与目录固定为 creating-react-page。用户进一步确认采用用户级存放位置：

/Users/burt/.agents/skills/creating-react-page/

内容必须可整体复制到其他位置使用。通用内容与安装位置是两个问题；本次用户明确授权写入上述用户级目录，不维护项目级重复副本。

拟用元数据：

```yaml
name: creating-react-page
description: 用于创建或修改 React/TypeScript 页面、拆分组件，以及组织 src 中的页面、布局、共享组件、状态、服务、工具、类型和样式；当用户要求按既有前端规范生成页面或调整目录职责时使用。不用于纯后端实现、非 React 页面或仅讨论视觉风格。
```

技术名称可以保留英文；主要触发描述用中文。不在 description 中塞入执行步骤或项目进度。

## 3. 通用规范应覆盖的内容

### 3.1 目录归属与文件写法

- src 根入口只负责挂载、初始化与应用组合；不固定要求文件叫 app.ts 或位于 frontend/src。
- pages/<PageName>/index.tsx 为页面入口。仅本页面使用的组件、hooks、工具、常量、类型、配置、测试与资源就近组织；文件少时不制造空子目录。
- components/<ComponentName>/index.tsx 为共享组件入口。何时提取共享组件、何时保留页面私有实现，要有具体判断示例。
- layouts 承担外壳与共享布局。导航接入当前路由方案，不因创建页面而自动安装 Router。
- services、store、utils、constants、typings、styles、assets 各自有落点与依赖约束，不能只画目录树。
- 组件/页面目录使用 PascalCase；普通模块和函数用 camelCase；hook 用 use 前缀。index 用作入口，类型/配置/逻辑按职责命名。
- 推荐两空格、单引号、无分号作为默认写法；已有仓库尊重实际格式配置，不扩大格式化范围。
- 同目录相对导入，跨层采用目标仓库已配置的 alias；统一导出入口不得制造循环依赖。

### 3.2 页面与组件执行模式

- 页面按“类型与常量、状态、派生数据、事件、effect、渲染”等职责保持可读，不将固定行数或机械函数顺序当通用硬门槛。
- 覆盖列表查询、筛选/分页、详情、表单/弹窗的常见拆分，以及 loading、empty、error、disabled、重试和成功回调。
- 简单状态留在页面/组件；复杂且可复用的交互再提取 hook。props 与事件类型显式，避免把 any 和全局声明当默认写法。
- effect 说明外部同步与依赖，清理计时器、监听器、observer 和请求；处理卸载、切换参数和旧结果覆盖新结果。
- memo/useMemo/useCallback 按实际收益使用，不照搬全组件 React.memo。
- 用一个完整的中性页面例子展示组织与调用，不复制原业务 UI 或使用真实服务地址。未知接口只设计边界，不虚构为实际契约。

### 3.3 数据、状态、类型与取消

- 页面/页面 hook 或状态 action 调用领域 service，service 调用统一传输入口；通用请求不得反向依赖页面或业务 store。
- 保留 service 命名空间与对象参数请求的熟悉模式；XRequest 是该组织模式的默认名称，已存在入口时先适配，不擅自重建基础设施。
- 输入/输出语义、错误码、包体解包、状态码、认证、超时与重试以目标接口和已有封装为准。不把任意旧响应包或本项目健康契约写成通用要求。
- 把取消的参与范围、外部 signal、消费方隔离、finally 清理和旧结果保护写成可复用约束，不包含“已迁移”“22 项测试”“下一步接入”等状态。
- 区分组件状态、跨组件共享状态、服务端数据和持久化状态；沿用仓库状态方案。Zustand/actions/selectors 作为已选 Zustand 时的参考，不强制安装。
- 类型就近显式导出；typings/.d.ts 主要用于环境、第三方补充和确需的声明，不汇集所有 DTO。

### 3.4 样式与框架边界

- 保留局部样式对象 import 与组件样式并置的习惯。沿用目标仓库 CSS Modules/Less/CSS 等方案，不擅自改用另一套 CSS 或 UI 库。
- 参考项目 import styles from './index.less' 依赖其构建处理；非 Umi 项目核对实际支持，必要时采用对应的显式 module 文件命名，不直接照搬自动模块行为。
- 全局样式负责 reset、字体、主题、共享基础规则；页面样式不污染其他页面，第三方覆盖有范围。
- 排除 umi/@umijs/max、withRouter、框架 history、自动发现 app/loading、Umi 编译常量、旧认证/CEF/内部 UI 依赖和业务配置。
- 不把 components/atom 与 configJson 强制套给普通 React 页面；只有动态组件/低代码配置需求时才参考这种并置方式。

## 4. 新 skill 文件职责

计划创建以下非空、直接可用的文件，不预先制造 scripts/assets 等占位目录：

```text
creating-react-page/
├── SKILL.md
├── references/
│   ├── structure.md
│   ├── page-patterns.md
│   └── data-access.md
└── MAINTAIN.md
```

- SKILL.md：中文触发、输入、先识别目标 src 和配置、任务分支、文件落点、按需读取、验证与停止条件。
- structure.md：完整目录职责、私有/共享边界、命名/导入、状态/类型/样式/资源归属，包含保留/调整/排除说明。
- page-patterns.md：页面与组件写法，列表/表单/详情交互，effect 与资源清理，一个中性完整例子。
- data-access.md：service/XRequest 分层、真实契约、错误与取消，按当前实现接入，不依赖本项目接口。
- MAINTAIN.md：通用用途、文件职责、依赖、验证方法、已知限制、当前流程对应的 Mermaid 图。不得链接本项目 docs 作为运行或维护必需输入。

新 skill 的执行依据只允许是用户任务、目标仓库相关代码/配置/接口和 skill 内资源。不能要求存在 LEARNING_STATE、DECISIONS、FastAPI、pnpm、Node 内置测试、固定端口或创建者绝对路径；检查命令从目标 package/config 获取。

## 5. best-creating-skills 的优化计划

修改目标：

- /Users/burt/.agents/skills/best-creating-skills/SKILL.md
- /Users/burt/.agents/skills/best-creating-skills/MAINTAIN.md
- /Users/burt/.agents/skills/best-creating-skills/agents/openai.yaml：只检查一致性，现有中文展示正确时不改。

拟补规则：

1. **语言选择：** 优先遵循用户明确语言要求；本地默认 name 用合规英文标识，description、正文和展示说明以中文为主，技术关键词保留原文。目标宿主或受众另有要求时明确例外；标注这是本地约定，不冒充开放格式要求。
2. **通用性判定：** 设计前明确是通用 skill 还是项目专用 skill。通用 skill 不绑定项目名、进度文档、当前里程碑、私有路径、固定接口或“已经实现”的状态；这些留在项目指令/记录中。
3. **来源覆盖：** 用户要求参考完整目录时先做完整清单，再按各层阅读代表实现和调用关系；记录未覆盖项。不能只读最初提到的工具就宣称已提炼整个目录。
4. **提炼而非照搬：** 对来源区分稳定组织规则、框架适配、业务特例和应改善的耦合，形成保留/调整/排除清单。
5. **验收补充：** description 语言与真实措辞、项目耦合扫描、迁移后资源解析、不同 src 根与依赖组合、无进度文档执行均需验证。

同步维护图中相关判断和检查节点，不另造庞大的研究文件；修改范围仅覆盖这次证实的遗漏。

## 6. 执行顺序与验收关口

- [x] 1. 用户确认本计划的范围、名称与默认组织方式；进一步确认用户级安装位置。
- [x] 2. 在改写前固定旧版失败基线：项目限定、进度依赖、缺少其他目录的具体组织步骤、中文触发不足。准备同输入的新版回归案例。
- [x] 3. 先实施并验证 best-creating-skills 的窄范围优化，确认语言/通用性/来源覆盖规则可实际执行，再用于创建新的 creating-react-page。
- [x] 4. 创建新 skill 与直接引用资源；逐项核对 10 个目录和根入口职责均有具体规则，没有 Umi、旧业务或项目状态残留。
- [x] 5. 做格式、目录/frontmatter 同名、引用、描述长度、内容耦合检查；再做实际只读方案任务试跑，核对轨迹与产物。
- [x] 6. 新 skill 验收通过后切换 /Users/burt/frontpros/ai/ai-flow-platform/frontend/AGENTS.md 的活动入口；项目自己的学习/进度规则留在项目指令，不塞进通用 skill。
- [x] 7. 核对活动引用后，将旧 flowinsight-frontend 从技能发现目录移出并保留可恢复副本，避免两个入口重复触发。旧项目文档作为历史记录保留，不批量改写学习进度。
- [x] 8. 交付新文件、来源提炼范围、实测与未验证项；不自动提交，不顺带做 service 或页面迁移。

每一项必须有产物或检查证据；新 skill 未通过前不得移除旧活动入口。

### 行为验证案例

| 输入场景 | 通过标准 |
| --- | --- |
| 显式使用 creating-react-page 创建 React 列表页 | 实际读取 skill，页面/私有组件/service/样式落点清楚，交互状态完整 |
| “按我们规范加个 React 编辑页”，未点名 skill | 检查是否被发现和选中，与执行质量分别记录，不保证永久自动命中 |
| 已有 React 项目，只要求拆分一个页面 | 尊重已有构建/路由/状态/样式，不擅自整体重构或安装依赖 |
| 新项目 src 在根目录，没有 frontend 与进度文档 | 正常识别入口并工作，不查找本项目 docs 或本地参考源码 |
| 两个页面共享组件，各自有私有组件和状态 | 共享组件不反向 import pages；局部状态不全部提升到 store |
| 带筛选请求的页面，旧请求晚于新请求返回 | 支持取消/旧结果保护，分组隔离，清理不误取消其他消费方 |
| 没有已确认的 API 契约 | 不编造真实接口、DTO 或响应包；给出缺口和可执行设计边界 |
| 只读结构 Review | 给有证据的发现，不自动编辑代码 |
| 纯 Python 后端、纯 HTML、仅视觉风格问题 | 不因“页面/接口”词汇误触发本组织技能 |
| skill 复制到另一临时目录/仓库 | 相对引用仍有效，不依赖创建者路径、FlowInsight 或参考项目存在 |

只读方案试跑使用独立新上下文；示例编译与可移植性检查在临时目录执行，不写入业务源码或参考项目。较大 skill 改写按 writing-skills 做独立基线/新版对照；实际证据和未测试项见执行记录。

## 7. 最初计划阶段的交付边界（历史）

最初计划阶段只交付总体计划与源代码盘点，没有实施。用户后续确认后，按下述执行记录完成 skill 优化、创建与入口切换；业务代码与学习进度不在本次实施范围。

计划文件是审阅记录，不属于新 skill 的运行依赖。

## 8. 执行与验证记录

日期：2026-10-11。未提交、未创建分支/工作树、未安装依赖、未修改后端/前端业务源码或参考项目、未停止服务。

### 实际改动

- 用户级 creating-react-page：SKILL.md + structure/page-patterns/data-access 三个直接引用 + MAINTAIN.md。主文件 43 行，description 中文为主，引用中无本项目/原参考仓库状态与创建者路径。
- best-creating-skills：仅调整 SKILL.md 和 MAINTAIN.md 的语言、复用边界、来源覆盖与验证要求；中文 agents/openai.yaml 无需改动。
- frontend/AGENTS.md：使用通用 skill 名称与宿主发现目录解析，不写死个人路径；项目学习/进度约束仍留在该项目指令中。
- 旧 skill 已从项目发现目录移入 /Users/burt/.agents/skill-backups/2026-10-11-react-skill.unJCO4/flowinsight-frontend。三个文件 SHA-256 与移动前完全一致，可恢复。
- 同一备份目录还保存修改前的 best-creating-skills 和 frontend-AGENTS.md。活动发现路径中只有用户级 creating-react-page，没有项目重复副本或旧活动 skill。

### RED → GREEN 与独立轨迹

1. 旧版结构检查：creator 的三个新增关口均失败；旧 frontend 的通用命名/状态隔离/层覆盖/引用结构四组检查失败。缺 assets 职责；这是结构检查，不当作行为测试。
2. 独立 baseline：旧 skill 处理另一个项目的根 src 列表页设计时明确退出“不适用”，引用项目限定与进度依赖；未假装可跨项目指导。旧 creator 核查确认三项要求未明文规定。
3. creator 修订后：三个新增关口和官方 quick_validate.py 通过；独立方案试跑按通用范围排除“已完成商品列表”的状态，遵守用户明确英文例外、只读范围与纯审查边界，不假装已读完整 src。
4. 新版结构：五组检查通过，quick_validate.py 通过；整体复制到临时 creating-react-page 目录后同样通过。检查覆盖名称/描述、项目耦合、全部层、直接引用与维护图/占位。
5. 显式新版试跑：启动技能目录实际包含新 skill；读取完整主文件和三个资源。同输入的 Products 设计不依赖学习进度，给出各层落点，沿用 fetch/CSS Modules 与已有路由，不强加全局 store。
6. 未点名试跑：独立上下文仅依据技能目录为“按我的前端规范加编辑页”选择 creating-react-page，再读取资源并交付方案。后端、纯配色、静态 HTML 为负例，React 结构 Review 为正例。
7. 关键分支：两个页面同 URL 取消按消费方隔离，旧结果/清理不影响新请求；Review 不改文件；缺接口不宣布接通；无 Zustand/Axios 不安装；普通 index.less 不冒充自动 CSS Modules。
8. 示例代码从 page-patterns 的四个代码块抽取到临时项目，使用当前已有 TypeScript/React 类型严格编译（strict、noUnusedLocals、noEmit）；退出码 0。没有安装测试或浏览器依赖。

临时检查及示例位置：/tmp/creating-react-page-validation.DxZ4pY。结构回归脚本 check-skills.mjs、复制的 skill 与 example/tsconfig.json 可复核本次检查；它们不是新 skill 的运行依赖。

最终复核运行：两个 skill 的 quick_validate.py、creator/react 结构检查、示例 tsc、git diff --check，以及活动目录和旧版备份身份核对，均通过。

### 验证限制

独立任务实测的是发现/选择、完整读取和只读设计产物；没有在另一个真实业务仓库实现 Products 页面，也没有浏览器交互或真实 API/取消传输的端到端测试。一次隐式选择不证明长期可靠率，其他宿主未测。示例编译通过不等于 hook 运行时与 UI 已验收；skill 明确要求实际页面实现时补相关验证。
