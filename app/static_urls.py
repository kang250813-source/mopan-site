"""URL helpers for static and dynamic rendering."""

from __future__ import annotations


def resource_href(base_path: str, resource_id: int, *, static_site: bool = False) -> str:
    root = base_path.rstrip("/")
    if static_site:
        path = f"resource/{resource_id}.html"
        return f"{root}/{path}" if root else path
    path = f"/resource/{resource_id}"
    return f"{root}{path}" if root else path


def drama_href(base_path: str, drama_id: int, *, static_site: bool = False) -> str:
    root = base_path.rstrip("/")
    if static_site:
        path = f"drama/{drama_id}.html"
        return f"{root}/{path}" if root else path
    path = f"/drama/{drama_id}"
    return f"{root}{path}" if root else path


def channel_href(
    base_path: str,
    channel: str,
    *,
    static_site: bool = False,
    page: int = 1,
) -> str:
    root = base_path.rstrip("/")
    if static_site:
        if channel == "discover":
            if page <= 1:
                return f"{root}/index.html" if root else "index.html"
            path = f"page/{page}/index.html"
            return f"{root}/{path}" if root else path
        if page <= 1:
            path = f"channel/{channel}/index.html"
            return f"{root}/{path}" if root else path
        path = f"channel/{channel}/page/{page}/index.html"
        return f"{root}/{path}" if root else path
    params = f"?channel={channel}"
    if page > 1:
        params += f"&page={page}"
    return f"{root}/{params}" if root else f"/{params}"


def static_index_href(base_path: str, page: int, *, channel: str = "discover") -> str:
    return channel_href(base_path, channel, static_site=True, page=page)
