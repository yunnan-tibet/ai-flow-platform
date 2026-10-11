.PHONY: dev test

dev: ; uv run --env-file .env.local uvicorn app.main:app --reload --port 8000
test: ; uv run python -m pytest -q