# FlowInsight AI 前端

M0 最小健康状态页：检查 API 和 PostgreSQL 连通性，不包含业务功能。

## 本地启动

当前已验证 Node.js 22.22.2、pnpm；使用仓库锁文件安装依赖。

先在项目根目录启动数据库：

```sh
docker compose -f infra/compose.yaml up -d
```

在 `backend/` 配置本地 `.env.local`（参考 `.env.example`），安装依赖并启动 API：

```sh
uv sync
make dev
```

在另一个终端进入 `frontend/`：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开开发服务输出的地址，默认 http://localhost:5173。

## 验证

```sh
pnpm test
pnpm lint
pnpm build
```

请求逻辑使用 Node 内置测试运行器与 TypeScript stripping，不新增测试框架依赖。`pnpm test` 先检查测试文件类型，再执行 36 项测试：XRequest 12 项、健康 service 11 项、取消工具 11 项、结构约定 2 项。请求测试使用临时本地 HTTP 服务，不依赖 Docker；浏览器交互与布局另外验收。

## 代码组织

- `App.tsx` 只组合 `layouts/BasicLayout` 与 `pages/SystemStatus`。
- 简单状态、请求协调和刷新事件留在 `pages/SystemStatus/index.tsx`，当前不单独抽 hook；私有展示组件 `StatusRow` 就近放置。布局、页面、组件各用 CSS Modules，全局主题放 `styles/global.css`。
- 页面通过 `services/index.ts` 导出的 `healthService` 调用接口；`services/health.ts` 校验真实响应并返回状态、原因码和 HTTP 状态，接口及领域共用类型集中在 `typings/health.ts`，显式导出/导入，不声明为全局类型。组件 props 留在组件旁。
- 唯一 HTTP 入口为 `utils/XRequest.ts`（Axios），不包含认证、续签、登录跳转、重试或旧项目业务解包。
- `@/*` 在 Vite 和 TypeScript 中均指向 `src/*`。Node 测试不读取 Vite alias，请求/service 内部使用相对 `.ts` 导入。
- 前端组织遵循用户级 `creating-react-page` skill；本仓库边界见 `AGENTS.md`，不建空的 store、Router 或 UI 库。

### XRequest 用法

```ts
const body = await XRequest<unknown>({ url: '/api/health' })
const response = await XRequest<unknown>({
  url: '/api/ready',
  returnResponse: true,
  axiosOptions: { validateStatus: status => status === 200 || status === 503 },
})
```

普通调用返回完整 JSON body，不默认解包 `body.data`；`returnResponse: true` 返回 `data/status/headers`，不是旧项目 `getResponse` 的含义。泛型不是运行时校验，领域 service 应以 `unknown` 校验字段。仅接口有真实约定时局部放行特殊状态。

默认 GET、8 秒超时；支持 `params/data/headers/signal/timeoutMs/abortKey/axiosOptions`。204/205 返回空 body；非法 JSON、HTTP、网络、超时和主动取消均归一为 `RequestError`，不携带原始请求配置或凭证。

XRequest 登记取消管理器并在 finally 清理；页面使用外部 signal 和独立 abortKey，卸载只取消自己的请求，不调用全局 `abort()`。

## 接口与状态

- `/api/health`：200 且 JSON 中 `api=ok`，API 显示可用。
- `/api/ready`：200 且 `api=ok,database=ok`，数据库显示可用；503 且 `api=ok,database=unavailable`，显示不可用。
- 网络失败、8 秒超时、无效 JSON 或不符合契约的响应：API 显示请求失败，数据库显示未知。代理返回 503 不自动等于数据库故障。

页面首次打开检查一次，之后手动重新检查；无轮询。检查中按钮禁用，卸载时取消请求。此页不证明数据库迁移或业务能力就绪。

## 开发与部署边界

浏览器使用相对路径 `/api/...`；Vite 开发代理转发到 `http://127.0.0.1:8000`，保留 `/api` 路径，不要求修改后端 CORS。

代理仅供开发。`pnpm build` 产物是静态文件，不包含 API 或开发代理；生产部署需另行配置同源反向代理或明确跨域方案。`pnpm preview` 不能代替生产部署验收。

不要提交 `.env.local`、数据库凭证或构建产物。
