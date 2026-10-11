import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_database_url
from app.db import check_database, create_db_engine

logger = logging.getLogger(__name__)


# 负责整个应用的启动准备和退出清理，不是每个请求都执行一次。其实就是和async with：使用这个管理器。配套
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # 启动时：创建共享引擎
    engine = create_db_engine(get_database_url())
    app.state.db_engine = engine
    try:
        yield  # 准备完成，让应用开始处理请求
    finally:
        # 退出时：释放连接池
        await engine.dispose()


app = FastAPI(title="FlowInsight AI API", lifespan=lifespan)


@app.get("/api/health")
async def read_health() -> dict[str, str]:
    return {"api": "ok"}


@app.get("/api/ready")
async def read_ready(request: Request) -> JSONResponse:
    try:
        await check_database(request.app.state.db_engine)
    except (SQLAlchemyError, OSError) as exc:
        logger.warning("Database readiness check failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=503, content={"api": "ok", "database": "unavailable"}
        )

    return JSONResponse(status_code=200, content={"api": "ok", "database": "ok"})
