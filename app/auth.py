"""Simple session-based admin authentication."""

from __future__ import annotations

from fastapi import HTTPException, Request

from app.config import ADMIN_PASSWORD, ADMIN_USER


def verify_credentials(username: str, password: str) -> bool:
    return username == ADMIN_USER and password == ADMIN_PASSWORD


def login(request: Request, username: str, password: str) -> bool:
    if not verify_credentials(username, password):
        return False
    request.session["admin"] = True
    return True


def logout(request: Request) -> None:
    request.session.clear()


def is_admin(request: Request) -> bool:
    return bool(request.session.get("admin"))


def require_admin(request: Request) -> None:
    if not is_admin(request):
        raise HTTPException(status_code=303, headers={"Location": "/admin/login"})
