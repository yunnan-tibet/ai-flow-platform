# React 页面规范优化与当前页面纠偏

日期：2026-10-11。仅推进用户本次反馈，不重新规划项目。

## 范围与落实

- [x] 参考规则盘点与代表性实现阅读，按保留/调整/排除归类。
- [x] 改前独立基线试跑；以实际行为确定需要修正的默认规则。
- [x] 通用 creating-react-page 更新中文触发、按需引用与 MAINTAIN 流程图。
- [x] 业务类型迁入 frontend/src/typings/health.ts；简单请求/状态合回 SystemStatus，移除 useHealthStatus。
- [x] 结构测试先失败后通过；现有 36 项测试、类型检查、lint/build。
- [x] 新上下文前向试跑、引用/耦合检查、示例严格编译与整目录复制验证。
- [x] 实际页面相关浏览器回归与文档同步；不改后端/依赖、不提交或部署。

## 来源覆盖与取舍

来源：`/Users/burt/frontpros/xinghe/surgical-anesthesia/.agent/skills/building-react-business-pages`。已盘点完整文件清单；不声称逐文件读完所有组件库 API 和示例。

| 来源组 | 阅读范围 | 提炼去向 / 取舍 |
| --- | --- | --- |
| SKILL、hard-rules | 全文 | 通用执行关口、范围、真实契约与渐进实现 |
| code-organization 的 page/components、hooks/store、services/typings、constants/utils、field-spec | 全文 | structure、data-access、fields-and-config；接口类型集中但默认显式导入 |
| module-input、complexity-control、code-style、review-checklist | 全文 | workflow、review-checklist；不按区块数机械定复杂、不强制 memo/注释/新依赖 |
| logic-guidelines 的 state-flow、interactions、error-loading | 全文 | 页面内聚、独立区块闭环、焦点推导、保存刷新、竞态和输入保护 |
| 六类 page-patterns | 全文 | 查询表格、主从编辑、详情、选择表单、弹窗、复合工作台，增加简单只读页路径 |
| ui-guidelines 的 layout、tables-forms、feedback-modals | 全文 | 沿用项目 UI 基线，适配窄屏/焦点/loading；去固定间距、桌面最小宽度和组件名要求 |
| composite-workspace 代表示例 | README、页面入口、service、typings | 确认轻量上下文/主控平铺与独立面板边界；不复制业务字段、全局声明或组件库调用 |
| 组件库专用引用、其他整页/区块示例、agent UI metadata | 清单盘点；未逐文件阅读 | 排除来源 UI 包装 API、框架路由与配置；不搬运全量模板，保留按需阅读方法 |

保留功能就近、共享分层和单向依赖。调整强制 ahooks、全组件 memo、全局业务 namespace、枚举全转字符串、通篇强制注释、统一状态上移和缺接口时伪接通。排除 Umi、xinherc、原业务模块/接口、进度文档和个人路径；这些来源信息只在本项目记录，不进入通用 skill。

## 行为验证轨迹

1. **旧版独立基线**：一次 GET 状态页选择 `services/ping.types.ts`，不符合用户要求的集中类型落点。简单页本来已选择内联而非抽 hook，不能虚构该项失败；旧规则的状态表默认 page hook、完整例子默认独立 hook，与内聚原则存在张力。主从页方案有主控包装/hook 倾向，确认需要更明确独立闭环标准。
2. **新版前向试跑**：独立上下文读取主文件和六个引用；简单页选择 `typings/ping.ts`、状态/请求协调内聚页面，不添 hook/库。主从页轻量主控可平铺，独立面板持自己的状态；缺路径/字段且拒绝 mock 时停止接入，不编造契约。只读审查不写；纯后端排除。
3. **评测反馈修订**：完整示例补身份保护的 finally 清理；“短类型可就近”限定为 UI 私有类型，不能推翻 DTO 的 typings 规则。
4. **格式/引用/可移植性**：官方 quick_validate 通过；8 个 Markdown 文件引用有效，超过 100 行的引用有目录，无来源框架/项目/私人路径耦合。整个目录复制到临时位置后验证通过。
5. **示例编译**：从 page-patterns 抽取完整 TSX，用已有 TypeScript 严格检查；临时检查配置最初使用 baseUrl 触发 TS 版本弃用错误，改用直接 paths 后通过。未改变目标项目 TS 配置或依赖。
6. **新上下文保留场景**：原生 fetch 仓库、已知 GET 但未知响应字段、只读详情页、催促交付且拒绝 mock。试跑保持原有传输，不增加 hook/库/写操作，只交付不受阻骨架与设计，停止真实接入；确认修订后的 finally 与类型例外无冲突。反馈也提示简单稳定 loader 示例不能直接替代 recordId 切换，已补充该适用边界并明确首次/刷新反馈按需求处理。此为静态方案审查，不冒充 UI 运行。

## 当前页面的运行验证

- 结构测试先改为页面→healthService、类型→typings、无旧类型/hook；改前因页面没有 service 调用而失败，改后通过。结构断言只证明组织，不证明运行时行为。
- `pnpm test`：36 passed，包括测试类型检查；`pnpm lint`、`pnpm build` 通过。
- 独立浏览器会话：真实开发代理 health/ready 均 HTTP 200；拦截 ready 为真实字段的 503，页面显示不可用，撤销拦截后键盘 Enter 刷新恢复。390px 无横向溢出。
- 额外挂载两个实际 SystemStatus 页面：同时请求登记为两组；卸载 A 后 B 仍在请求并正常完成；完成后登记归零；B 再刷新后卸载，登记归零，loading 按钮禁用。
- 浏览器一条 503 resource error 对应故障模拟，不是应用异常；未停止用户数据库/开发服务。

## 限制与恢复

未重新覆盖上一轮全部代理/超时组合；本次聚焦类型和页面内聚的相关回归。未运行忽略 signal 的迟到响应竞态、生产部署或其他宿主的长期自动触发。通用技能方案试跑不是页面执行测试，格式/编译也不代表业务接通。

临时备份 `/tmp/react-page-skill-refinement.oHoXkO/` 保留旧 skill、旧类型/hook/页面及验证脚本；不替代 Git。通用 skill 在用户级目录，不随本项目提交，跨机器需另行安装。当前 M0 Gate 状态不变。
