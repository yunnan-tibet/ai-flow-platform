from collections.abc import Iterator
from unittest.mock import AsyncMock

import pytest
from app import main
from fastapi.testclient import TestClient


# @pytest.fixture：这个函数不是测试，是一个叫 client 的测试准备工具。
@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    # ① 准备测试配置
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+asyncpg://user:password@127.0.0.1:1/test_db",
    )
    # ② 打开客户端
    with TestClient(main.app) as test_client:
        # ③ 把客户端交给测试，暂停在这里
        yield test_client
    # ④ 测试结束后继续执行，退出 with，关闭客户端


# 看到client就会去找fixture，monkeypatch 是 pytest 内置的 fixture
def test_health_returns_api_ok(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"api": "ok"}


def test_ready_returns_ok_when_database_available(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    # raising=False允许这个尚未实现的函数暂时不存在。
    monkeypatch.setattr(
        main,
        "check_database",
        AsyncMock(  # 相当于async def fake_check_database(engine):return None
            return_value=None
        ),
        raising=False,
    )
    response = client.get("/api/ready")

    assert response.status_code == 200
    assert response.json() == {"api": "ok", "database": "ok"}


def test_ready_returns_503_when_database_unavailable(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    # 把 main.check_database 临时替换成一个“调用后会报数据库连接错误”的异步函数。
    monkeypatch.setattr(
        main,  # 修改哪个模块
        "check_database",  # 修改模块里的哪个属性/函数
        AsyncMock(  # 替换成什么，让模拟函数抛出异常，不是返回这个异常对象。
            # 相当于async def fake_check_database(*args, **kwargs):
            # raise ConnectionError("database unavailable")
            side_effect=ConnectionError("database unavailable")
        ),
        raising=False,  # 属性目前不存在，也允许临时设置
    )
    response = client.get("/api/ready")

    assert response.status_code == 503
    assert response.json() == {"api": "ok", "database": "unavailable"}
