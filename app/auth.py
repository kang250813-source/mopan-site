"""Simple session-based admin authentication (local-only, hidden path)."""

from __future__ import annotations

from fastapi import HTTPException, Request

from app.admin_urls import admin_href
from app.config import ADMIN_PASSWORD, ADMIN_USER

_LOCAL_HOSTS = frozenset({"127.0.0.1", "::1", "localhost"})


def _norm_passphrase(value: str) -> str:
    return " ".join((value or "").split())


def client_host(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return ""


def is_local_request(request: Request) -> bool:
    return client_host(request) in _LOCAL_HOSTS


def require_local_admin(request: Request) -> None:
    if not is_local_request(request):
        raise HTTPException(status_code=404, detail="Not Found")


def verify_credentials(username: str, password: str) -> bool:
    if not ADMIN_PASSWORD:
        return False
    return (
        username == ADMIN_USER
        and _norm_passphrase(password) == _norm_passphrase(ADMIN_PASSWORD)
    )


def login(request: Request, username: str, password: str) -> bool:
    require_local_admin(request)
    if not verify_credentials(username, password):
        return False
    request.session["admin"] = True
    return True


def logout(request: Request) -> None:
    request.session.clear()


def is_admin(request: Request) -> bool:
    return bool(request.session.get("admin"))


def require_admin(request: Request) -> None:
    require_local_admin(request)
    if not is_admin(request):
        raise HTTPException(status_code=303, headers={"Location": admin_href("login")})
