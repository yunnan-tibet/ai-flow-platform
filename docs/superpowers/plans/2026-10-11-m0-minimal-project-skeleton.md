# M0 Minimal Project Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Vite React、FastAPI 与 PostgreSQL 的最小本地运行链路，并在前端准确展示 API 和数据库健康状态。

**Architecture:** React 开发服务器通过 HTTP 请求 FastAPI 的 `GET /api/health`。FastAPI 使用 SQLAlchemy 异步引擎执行 `SELECT 1`，将 API 与数据库状态分别返回；PostgreSQL 独立运行在 Docker Compose 中。

**Tech Stack:** Vite、React、TypeScript、pnpm、Python 3.12、uv、FastAPI、SQLAlchemy 2、asyncpg、PostgreSQL、Docker Compose、pytest

---

## 文件结构

本计划最终创建或修改以下文件：

```text
ai-flow-platform/
├── .gitignore                         # 全仓库忽略规则
├── frontend/
│   ├── .env.example                   # 前端 API 地址示例
│   ├── src/App.tsx                    # 健康状态请求与展示
│   ├── src/App.css                    # 最小页面样式
│   └── src/index.css                  # 全局样式
├── backend/
│   ├── .env.example                   # 数据库和前端来源配置示例
│   ├── pyproject.toml                 # Python 依赖和 pytest 配置
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI 应用与 CORS
│   │   ├── config.py                  # 环境配置
│   │   ├── db.py                      # SQLAlchemy 引擎及连接检查
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── health.py              # 健康检查路由
│   │   └── schemas/
│   │       ├── __init__.py
│   │       └── health.py              # 健康响应契约
│   └── tests/
│       ├── __init__.py
│       └── test_health.py              # 健康接口的成功和降级测试
└── infra/
    └── compose.yaml                    # 本地 PostgreSQL
```

不为健康检查建立 Service/Repository 层。等 M1 出现首个业务实体时再引入对应分层。

### Task 1：初始化仓库与 Vite React TypeScript 工程

**Files:**
- Create: `.gitignore`
- Create: `frontend/`（由 Vite 官方脚手架生成）
- Create: `frontend/.env.example`

- [ ] **Step 1：确认 `frontend/` 为空**

Run:

```bash
find frontend -mindepth 1 -maxdepth 1 -print
```

Expected：没有输出。如果已有文件，先停止并核对，不能覆盖未知内容。

- [ ] **Step 2：初始化 Git 仓库**

Run:

```bash
git init
git branch -M main
```

Expected：当前目录成为 Git 仓库，默认分支为 `main`。

- [ ] **Step 3：创建 Vite React TypeScript 工程**

Run:

```bash
pnpm create vite@latest frontend --template react-ts
cd frontend
pnpm install
```

Expected：`frontend/package.json` 存在，依赖安装成功。

- [ ] **Step 4：验证脚手架原始状态**

Run:

```bash
pnpm lint
pnpm build
```

Expected：两条命令均成功；`pnpm build` 生成 `frontend/dist/`。

- [ ] **Step 5：添加全仓库忽略规则**

Create `.gitignore`：

```gitignore
.DS_Store
.env
.venv/
__pycache__/
.pytest_cache/
*.py[cod]
node_modules/
dist/
```

Create `frontend/.env.example`：

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 6：提交初始化结果**

Run:

```bash
git add .gitignore frontend docs
git commit -m "chore: initialize FlowInsight AI frontend"
```

Expected：创建第一个 commit，包含已确认的设计/计划文档和 Vite 工程。

### Task 2：启动本地 PostgreSQL

**Files:**
- Create: `infra/compose.yaml`

- [ ] **Step 1：写入 PostgreSQL Compose 配置**

Create `infra/compose.yaml`：

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: flowinsight
      POSTGRES_USER: flowinsight
      POSTGRES_PASSWORD: flowinsight_dev
    ports:
      - "5432:5432"
    volumes:
      - flowinsight_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flowinsight -d flowinsight"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  flowinsight_postgres_data:
```

- [ ] **Step 2：校验 Compose 文件**

Run:

```bash
docker compose -f infra/compose.yaml config
```

Expected：输出规范化配置，无错误。

- [ ] **Step 3：启动并检查 PostgreSQL**

Run:

```bash
docker compose -f infra/compose.yaml up -d postgres
docker compose -f infra/compose.yaml ps
```

Expected：`postgres` 最终显示 `healthy`。如果本机 5432 已占用，先停止并确认现有数据库用途，不擅自终止其他服务。

- [ ] **Step 4：提交基础设施配置**

Run:

```bash
git add infra/compose.yaml
git commit -m "chore: add local PostgreSQL service"
```

### Task 3：用测试驱动实现 FastAPI 健康接口

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/db.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/health.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/health.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_health.py`

- [ ] **Step 1：声明后端依赖**

Create `backend/pyproject.toml`：

```toml
[project]
name = "flowinsight-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "asyncpg",
  "fastapi",
  "pydantic-settings",
  "sqlalchemy[asyncio]",
  "uvicorn[standard]",
]

[dependency-groups]
dev = [
  "httpx",
  "pytest",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

Run:

```bash
cd backend
uv sync --dev
```

Expected：生成 `backend/uv.lock` 和 `backend/.venv/`，依赖安装成功。

- [ ] **Step 2：写健康接口的失败测试**

Create empty package marker files:

```text
backend/app/__init__.py
backend/app/api/__init__.py
backend/app/schemas/__init__.py
backend/tests/__init__.py
```

Create `backend/tests/test_health.py`：

```python
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.health import get_database_health
from app.main import app


@pytest.fixture(autouse=True)
def clear_dependency_overrides() -> Iterator[None]:
    yield
    app.dependency_overrides.clear()


def test_health_returns_healthy_when_database_is_available() -> None:
    app.dependency_overrides[get_database_health] = lambda: True

    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "api": "ok",
        "database": "ok",
    }


def test_health_returns_degraded_when_database_is_unavailable() -> None:
    app.dependency_overrides[get_database_health] = lambda: False

    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {
        "status": "degraded",
        "api": "ok",
        "database": "unavailable",
    }
```

- [ ] **Step 3：运行测试并确认先失败**

Run from `backend/`:

```bash
uv run pytest -q
```

Expected：测试收集阶段失败，提示 `app.api.health` 或 `app.main` 尚不存在。失败原因必须是待实现模块缺失，而不是 Python 环境错误。

- [ ] **Step 4：实现配置和数据库连接检查**

Create `backend/.env.example`：

```dotenv
DATABASE_URL=postgresql+asyncpg://flowinsight:flowinsight_dev@localhost:5432/flowinsight
FRONTEND_ORIGIN=http://localhost:5173
```

Copy it for local use:

```bash
cp .env.example .env
```

Create `backend/app/config.py`：

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
```

Create `backend/app/db.py`：

```python
import logging

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

logger = logging.getLogger(__name__)
engine = create_async_engine(settings.database_url, pool_pre_ping=True)


async def check_database_connection() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        logger.exception("Database health check failed")
        return False
```

- [ ] **Step 5：实现响应 Schema 和健康路由**

Create `backend/app/schemas/health.py`：

```python
from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded"]
    api: Literal["ok"]
    database: Literal["ok", "unavailable"]
```

Create `backend/app/api/health.py`：

```python
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.db import check_database_connection
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


async def get_database_health() -> bool:
    return await check_database_connection()


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={503: {"model": HealthResponse}},
)
async def read_health(
    database_ok: Annotated[bool, Depends(get_database_health)],
) -> HealthResponse | JSONResponse:
    if database_ok:
        return HealthResponse(status="healthy", api="ok", database="ok")

    response = HealthResponse(
        status="degraded",
        api="ok",
        database="unavailable",
    )
    return JSONResponse(status_code=503, content=response.model_dump())
```

- [ ] **Step 6：创建 FastAPI 应用并限制本地 CORS**

Create `backend/app/main.py`：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.config import settings

app = FastAPI(title="FlowInsight AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health_router)
```

- [ ] **Step 7：运行测试并确认通过**

Run from `backend/`:

```bash
uv run pytest -q
```

Expected：`2 passed`。

- [ ] **Step 8：用真实 PostgreSQL 验证接口**

Start the API from `backend/`:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

In another terminal:

```bash
curl -i http://localhost:8000/api/health
```

Expected：HTTP `200`，JSON 为：

```json
{"status":"healthy","api":"ok","database":"ok"}
```

- [ ] **Step 9：提交后端健康接口**

Run from repository root:

```bash
git add backend
git commit -m "feat: add API and database health check"
```

### Task 4：实现前端健康状态页

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/index.css`

- [ ] **Step 1：用最小状态机实现健康请求**

Replace `frontend/src/App.tsx` with:

```tsx
import { useCallback, useEffect, useState } from 'react'
import './App.css'

type HealthResponse = {
  status: 'healthy' | 'degraded'
  api: 'ok'
  database: 'ok' | 'unavailable'
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestFailed, setRequestFailed] = useState(false)

  const loadHealth = useCallback(async () => {
    setLoading(true)
    setRequestFailed(false)

    try {
      const response = await fetch(`${API_BASE_URL}/api/health`)
      if (!response.ok && response.status !== 503) {
        throw new Error(`Unexpected health response: ${response.status}`)
      }

      const result = (await response.json()) as HealthResponse
      setHealth(result)
    } catch {
      setHealth(null)
      setRequestFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHealth()
  }, [loadHealth])

  return (
    <main className="health-page">
      <header>
        <p className="eyebrow">FlowInsight AI</p>
        <h1>本地环境状态</h1>
        <p>验证 React、FastAPI 与 PostgreSQL 的最小连接链路。</p>
      </header>

      <section className="status-grid" aria-live="polite">
        <article className="status-item">
          <span>API</span>
          <strong>{requestFailed ? '不可访问' : health?.api === 'ok' ? '正常' : '检查中'}</strong>
        </article>
        <article className="status-item">
          <span>PostgreSQL</span>
          <strong>
            {requestFailed
              ? '未知'
              : health?.database === 'ok'
                ? '正常'
                : health?.database === 'unavailable'
                  ? '不可用'
                  : '检查中'}
          </strong>
        </article>
      </section>

      {loading && <p className="message">正在检查本地服务……</p>}
      {requestFailed && <p className="message error">无法连接 FastAPI 服务。</p>}

      <button type="button" onClick={() => void loadHealth()} disabled={loading}>
        重新检查
      </button>
    </main>
  )
}

export default App
```

- [ ] **Step 2：添加最小页面样式**

Replace `frontend/src/App.css` with:

```css
#root {
  min-height: 100vh;
}

.health-page {
  width: min(720px, calc(100% - 40px));
  margin: 0 auto;
  padding: 12vh 0 64px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #172033;
  font-size: clamp(2.25rem, 7vw, 4.5rem);
  line-height: 1;
}

header > p:last-child {
  max-width: 560px;
  margin: 24px 0 0;
  color: #61708a;
  font-size: 1.05rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 48px 0 24px;
  overflow: hidden;
  border: 1px solid #dce2eb;
  border-radius: 16px;
  background: #dce2eb;
}

.status-item {
  display: flex;
  min-height: 112px;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  background: #fff;
}

.status-item span {
  color: #738098;
  font-size: 0.85rem;
}

.status-item strong {
  color: #172033;
  font-size: 1.35rem;
}

.message {
  min-height: 24px;
  color: #61708a;
}

.message.error {
  color: #b42318;
}

button {
  margin-top: 12px;
  border: 0;
  border-radius: 999px;
  padding: 12px 20px;
  background: #172033;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

@media (max-width: 560px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
```

Replace `frontend/src/index.css` with:

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #172033;
  background: #f6f8fb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button:focus-visible {
  outline: 3px solid #93b4ff;
  outline-offset: 3px;
}
```

- [ ] **Step 3：执行静态验证**

Run from `frontend/`:

```bash
pnpm lint
pnpm build
```

Expected：两条命令均成功。

- [ ] **Step 4：启动并验证正常状态**

Run from `frontend/`:

```bash
pnpm dev
```

Expected：浏览器打开 Vite 提示的本地地址，页面显示 API“正常”、PostgreSQL“正常”。

- [ ] **Step 5：提交健康状态页**

Run from repository root:

```bash
git add frontend
git commit -m "feat: show local service health status"
```

### Task 5：验收数据库异常与恢复场景

**Files:**
- Modify only after verified results: `docs/LEARNING_STATE.md`

- [ ] **Step 1：确认正常链路**

保持 FastAPI 和前端运行，执行：

```bash
curl -i http://localhost:8000/api/health
```

Expected：HTTP `200`；页面显示 API 和 PostgreSQL 均正常。

- [ ] **Step 2：停止 PostgreSQL 并验证降级响应**

Run:

```bash
docker compose -f infra/compose.yaml stop postgres
curl -i http://localhost:8000/api/health
```

Expected：HTTP `503`；响应不包含连接串或堆栈；页面点击“重新检查”后显示 API“正常”、PostgreSQL“不可用”。

- [ ] **Step 3：恢复 PostgreSQL 并再次验证**

Run:

```bash
docker compose -f infra/compose.yaml start postgres
docker compose -f infra/compose.yaml ps
curl -i http://localhost:8000/api/health
```

Expected：容器恢复为 `healthy` 后，接口重新返回 HTTP `200`；页面重新检查后恢复两项正常。

- [ ] **Step 4：执行最终回归**

Run:

```bash
cd backend && uv run pytest -q
cd ../frontend && pnpm lint && pnpm build
```

Expected：后端 `2 passed`，前端 lint 和 build 均成功。

- [ ] **Step 5：根据真实结果更新学习状态**

只有 Step 1–4 实际成功后，才将 `docs/LEARNING_STATE.md` 中本任务记录为“本地已运行、测试通过”。如果某一步失败，记录真实错误和复现方式，并把当前阶段标为 Debug，不提前勾选 Gate。

- [ ] **Step 6：提交验收状态**

Run:

```bash
git add docs/LEARNING_STATE.md
git commit -m "docs: record M0 health slice verification"
```

## 实施边界

- 本计划是一个 M0 可验收任务，不启动 M1 数据源开发。
- 后端代码按用户手写节奏逐文件提供和讲解，不由 Codex 一次性写入仓库。
- 前端如改用 Codex 执行，只允许修改 `frontend/`，不得改动 `backend/`、`infra/` 或核心项目文档。
- 未得到真实命令输出前，不宣称环境已经启动、测试通过或 M0 Gate 已通过。
