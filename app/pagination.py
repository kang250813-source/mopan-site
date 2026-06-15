"""Pagination helpers."""

from __future__ import annotations

import math
from urllib.parse import urlencode


def total_pages(total: int, page_size: int) -> int:
    if total <= 0:
        return 1
    return max(1, math.ceil(total / page_size))


def clamp_page(page: int, pages: int) -> int:
    return max(1, min(page, pages))


def page_window(current: int, pages: int, *, radius: int = 2) -> list[int | str]:
    if pages <= 1:
        return [1]
    nums = {1, pages, current}
    for delta in range(1, radius + 1):
        nums.add(current - delta)
        nums.add(current + delta)
    ordered = sorted(n for n in nums if 1 <= n <= pages)
    out: list[int | str] = []
    prev = 0
    for num in ordered:
        if prev and num - prev > 1:
            out.append("…")
        out.append(num)
        prev = num
    return out


def build_page_url(
    base_path: str,
    page: int,
    *,
    q: str = "",
    category: str = "",
    channel: str = "",
    tag: str = "",
) -> str:
    params: dict[str, str | int] = {}
    if channel:
        params["channel"] = channel
    if q:
        params["q"] = q
    if category:
        params["category"] = category
    if tag:
        params["tag"] = tag
    if page > 1:
        params["page"] = page
    root = base_path.rstrip("/") or ""
    path = f"{root}/" if root else "/"
    if not params:
        return path
    return f"{path}?{urlencode(params)}"
