import os


def get_database_url() -> str:
    # 读取当前进程的环境变量，未设置时返回 None。
    database_url = os.getenv("DATABASE_URL")
    # or就是 ||
    if database_url is None or not database_url.strip():
        raise ValueError("DATABASE_URL must be configured")

    return database_url
