# M0 Health Page Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. No subagents, no automatic commit, no backend changes.

**Goal:** 前端调用现有健康接口，正确展示成功、数据库故障和请求失败。

**Architecture:** 独立的 typed fetch 模块处理契约、超时和取消；React 页面处理检查状态及手动刷新；Vite 代理保持同源相对路径。

**Tech Stack:** React、TypeScript、CSS、Vite；Node 内置测试与 TypeScript stripping，不新增依赖。

## 文件职责与步骤

- [x] 请求逻辑测试：创建 `frontend/tests/health.test.ts`，添加 `package.json` test 入口 `node --experimental-strip-types --test tests/*.test.ts`；先执行 `pnpm test`，确认模块尚未实现导致失败。
- [x] 请求逻辑：创建 `frontend/src/api/health.ts`；只接受约定的状态码及 JSON 字段；并发独立检查，8 秒超时，AbortController 取消和清理；再次执行 `pnpm test`，所有用例通过。
- [x] UI：替换 `frontend/src/App.tsx`、`App.css`、`index.css`；无后端改动和新框架；初始化及手动检查、加载态、取消与状态文字。
- [x] 开发代理：修改 `frontend/vite.config.ts`，`/api` 转发到 `http://127.0.0.1:8000`，无 rewrite。
- [x] 验证：执行 `pnpm test`、`pnpm lint`、`pnpm build`；浏览器核验正常、数据库 503、网络/代理失败、恢复、窄屏；不停止用户正在运行的服务。
- [x] 文档：记录启动与代理的生产边界，更新 LEARNING_STATE/DECISIONS；只声明实际验证结果，不自动提交。

## 验证记录

- 2026-10-11：请求测试先红后绿，最终 11/11 通过；lint、TypeScript 编译与 Vite build 通过，git diff --check 通过。
- 真实 health/ready 经开发代理均为 200。浏览器拦截模拟 ready 503、代理 502、网络失败，均显示预期状态；手动刷新恢复真实 200，加载按钮禁用，检查时间更新。
- 桌面与 390px 手机布局截图已检查；手机文档宽度等于视口，无横向溢出。测试拦截已移除，不影响正常预览。
- 本次任务实现验收通过；用户页面 Review 待确认。M0 整体未宣告完成，未部署、未提交 Git。
