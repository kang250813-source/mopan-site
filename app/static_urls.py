"""URL helpers for static and dynamic rendering."""

from __future__ import annotations

from urllib.parse import quote


def _static_href(base_path: str, path: str) -> str:
    """Root-relative URL for static export (always absolute from site root)."""
    root = base_path.rstrip("/")
    clean = path.lstrip("/")
    if root:
        return f"{root}/{clean}"
    return f"/{clean}"


def resource_href(base_path: str, resource_id: int, *, static_site: bool = False) -> str:
    root = base_path.rstrip("/")
    if static_site:
        return _static_href(base_path, f"resource/{resource_id}.html")
    path = f"/resource/{resource_id}"
    return f"{root}{path}" if root else path


def drama_href(base_path: str, drama_id: int, *, static_site: bool = False) -> str:
    root = base_path.rstrip("/")
    if static_site:
        return _static_href(base_path, f"drama/{drama_id}.html")
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
                return _static_href(base_path, "index.html")
            return _static_href(base_path, f"page/{page}/index.html")
        if page <= 1:
            return _static_href(base_path, f"channel/{channel}/index.html")
        return _static_href(base_path, f"channel/{channel}/page/{page}/index.html")
    params = f"?channel={channel}"
    if page > 1:
        params += f"&page={page}"
    return f"{root}/{params}" if root else f"/{params}"


def static_index_href(base_path: str, page: int, *, channel: str = "discover") -> str:
    return channel_href(base_path, channel, static_site=True, page=page)


def drama_tag_href(
    base_path: str,
    tag: str,
    *,
    static_site: bool = False,
    page: int = 1,
) -> str:
    root = base_path.rstrip("/")
    encoded = quote(tag.strip(), safe="")
    if static_site:
        if page <= 1:
            return _static_href(base_path, f"channel/drama/tag/{encoded}/index.html")
        return _static_href(base_path, f"channel/drama/tag/{encoded}/page/{page}/index.html")
    params = f"?channel=drama&tag={encoded}"
    if page > 1:
        params += f"&page={page}"
    return f"{root}/{params}" if root else f"/{params}"


def category_href(
    base_path: str,
    channel: str,
    category: str,
    *,
    static_site: bool = False,
    page: int = 1,
) -> str:
    root = base_path.rstrip("/")
    encoded = quote(category.strip(), safe="")
    if static_site:
        if channel == "discover":
            if page <= 1:
                return _static_href(base_path, f"category/{encoded}/index.html")
            return _static_href(base_path, f"category/{encoded}/page/{page}/index.html")
        if page <= 1:
            return _static_href(base_path, f"channel/{channel}/category/{encoded}/index.html")
        return _static_href(base_path, f"channel/{channel}/category/{encoded}/page/{page}/index.html")
    params = f"?channel={channel}&category={encoded}"
    if page > 1:
        params += f"&page={page}"
    return f"{root}/{params}" if root else f"/{params}"
