"""URL helpers for static and dynamic rendering."""

from __future__ import annotations


def resource_href(base_path: str, resource_id: int, *, static_site: bool = False) -> str:
    root = base_path.rstrip("/")
    if static_site:
        path = f"resource/{resource_id}.html"
        return f"{root}/{path}" if root else path
    path = f"/resource/{resource_id}"
    return f"{root}{path}" if root else path


def static_index_href(base_path: str, page: int) -> str:
    root = base_path.rstrip("/")
    if page <= 1:
        return f"{root}/index.html" if root else "index.html"
    path = f"page/{page}/index.html"
    return f"{root}/{path}" if root else path
