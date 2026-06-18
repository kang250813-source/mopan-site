"""Admin URL helpers (hidden path prefix)."""

from __future__ import annotations

from app.config import ADMIN_PATH, BASE_PATH


def admin_root() -> str:
    base = BASE_PATH.rstrip("/")
    return f"{base}{ADMIN_PATH}" if base else ADMIN_PATH


def admin_href(path: str = "") -> str:
    root = admin_root()
    if not path:
        return root
    return f"{root}/{path.lstrip('/')}"
