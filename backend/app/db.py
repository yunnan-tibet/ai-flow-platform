import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


def create_db_engine(database_url) -> AsyncEngine:
    return create_async_engine(
        database_url,
        pool_pre_ping=True,  # 借用连接前检查它是否还有效，帮助处理数据库重启后的旧连接。
        pool_timeout=3,  # 连接池忙满时，最多等待 3 秒获取连接。
        connect_args={
            "timeout": 3,  # 新建数据库连接的超时。
            "command_timeout": 3,  # 数据库命令执行的超时。
        },
    )


async def check_database(engine: AsyncEngine) -> None:
    async with asyncio.timeout(
        3
    ):  # 设置整个检查操作的 3 秒超时，超时会取消操作并抛出 TimeoutError。
        async with engine.connect() as connection:  # 从连接池借出连接。
            await connection.execute(text("SELECT 1"))  # 执行只读 SELECT 1。
