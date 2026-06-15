"""Public URL helpers for share links."""

from __future__ import annotations

from app.config import BASE_PATH, PUBLIC_SITE_URL


def page_share_url(path: str, *, request_base: str = "") -> str:
    """Absolute URL for sharing. Uses PUBLIC_SITE_URL when set, else current request origin."""
    prefix = BASE_PATH.rstrip("/")
    full_path = f"{prefix}{path}" if prefix else path
    if PUBLIC_SITE_URL:
        return f"{PUBLIC_SITE_URL.rstrip('/')}{full_path}"
    base = request_base.rstrip("/")
    if base:
        return f"{base}{full_path}"
    return full_path


def resource_share_url(resource_id: int, *, request_base: str = "") -> str:
    return page_share_url(f"/resource/{resource_id}", request_base=request_base)


def drama_share_url(drama_id: int, *, request_base: str = "") -> str:
    return page_share_url(f"/drama/{drama_id}", request_base=request_base)
