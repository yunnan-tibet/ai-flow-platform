import asyncio

from sqlalchemy.ext.asyncio import AsyncEngine


def test_create_db_engine_without_connecting() -> None:
    from app.db import create_db_engine

    # 故意不用真实数据库地址，创建引擎不应要求数据库在线。
    database_url = "postgresql+asyncpg://user:password@127.0.0.1:1/test_db"
    engine = create_db_engine(database_url)
    assert isinstance(engine, AsyncEngine)

    try:
        assert engine.url.drivername == "postgresql+asyncpg"
        assert engine.url.database == "test_db"
    finally:
        asyncio.run(engine.dispose())
