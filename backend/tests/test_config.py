import pytest


# monkeypatch：临时修改环境变量，测试后自动恢复，不修改你的系统配置。
def test_database_url_reads_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import get_database_url

    expected = "postgresql+asyncpg://user:password@localhost:5432/test_db"
    # 相当于设置环境变量
    monkeypatch.setenv("DATABASE_URL", expected)
    assert get_database_url() == expected


def test_database_url_missing_raises_error(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import get_database_url

    monkeypatch.delenv("DATABASE_URL", raising=False)
    # pytest.raises类似“断言函数会抛出异常，文字匹配到DATABASE_URL”
    with pytest.raises(ValueError, match="DATABASE_URL"):
        get_database_url()


# parametrize 用空字符串、纯空格分别运行一次测试。
@pytest.mark.parametrize("value", ["", "   "])
def test_database_url_blank_raises_error(
    monkeypatch: pytest.MonkeyPatch, value: str
) -> None:
    from app.config import get_database_url

    monkeypatch.setenv("DATABASE_URL", value)
    with pytest.raises(ValueError, match="DATABASE_URL"):
        get_database_url()
