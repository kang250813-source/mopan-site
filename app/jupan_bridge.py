"""Read 剧盘 drama catalog and resolve 网盘1 (main Quark) share links."""

from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from app.config import (
    JUPAN_HOT_TAGS,
    JUPAN_MAIN_SHARE_CACHE,
    JUPAN_PUBLIC_URL,
    JUPAN_SITE_DB,
    JUPAN_SYNC_DB,
)

_RELATED_ORDER = "COALESCE(d.published_at, d.created_at) DESC, d.id DESC"
_EXTERNAL_SHARE_IDS = frozenset({"d54031d2ebce"})
_SHARE_ID_RE = re.compile(r"/s/([0-9a-fA-F]+)", re.IGNORECASE)


@dataclass
class JupanDrama:
    id: int
    title: str
    pan_url: str
    published_at: str | None = None
    cover_url: str | None = None
    tags: list[str] = field(default_factory=list)
    pan_source: str = "main"  # main | external | source


def normalize_pan_url(url: str) -> str:
    """Strip internal fragments/query used only for DB uniqueness."""
    return (url or "").split("#")[0].split("?")[0].strip()


def _share_id(url: str) -> str | None:
    match = _SHARE_ID_RE.search(url or "")
    return match.group(1).lower() if match else None


def classify_pan_source(title: str, site_url: str, resolved_url: str) -> str:
    site_norm = normalize_pan_url(site_url)
    resolved_norm = normalize_pan_url(resolved_url)
    share_id = _share_id(site_norm) or _share_id(resolved_norm)
    if share_id and share_id in _EXTERNAL_SHARE_IDS:
        return "external"
    cache = _load_share_cache()
    save_path = _load_save_paths().get(title)
    if save_path and save_path in cache:
        return "main"
    if resolved_norm in {normalize_pan_url(v) for v in cache.values()}:
        return "main"
    if site_norm and resolved_norm != site_norm:
        return "main"
    if site_norm:
        return "source"
    return "main"


def _connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


@lru_cache(maxsize=1)
def _load_share_cache() -> dict[str, str]:
    path = JUPAN_MAIN_SHARE_CACHE
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {str(k): str(v).split("?")[0].strip() for k, v in data.items()}


@lru_cache(maxsize=1)
def _load_save_paths() -> dict[str, str]:
    if not JUPAN_SYNC_DB.exists():
        return {}
    with _connect(JUPAN_SYNC_DB) as conn:
        rows = conn.execute(
            "SELECT title, quark_save_path FROM dramas WHERE quark_save_path IS NOT NULL"
        ).fetchall()
    return {row["title"]: row["quark_save_path"] for row in rows}


def refresh_pan_cache() -> None:
    _load_share_cache.cache_clear()
    _load_save_paths.cache_clear()


def resolve_main_pan_url(title: str, fallback: str) -> str:
    """Prefer 网盘1 share from duanjuku-sync cache; else keep site fallback."""
    cache = _load_share_cache()
    save_path = _load_save_paths().get(title)
    if save_path and save_path in cache:
        return cache[save_path]
    if save_path:
        for path, url in cache.items():
            if path.endswith(title) or path.rstrip("/").endswith(title.rstrip()):
                return url
    return normalize_pan_url(fallback)


def _make_drama(row: sqlite3.Row, *, pan_url: str | None = None) -> JupanDrama:
    site_url = row["quark_url"] or ""
    resolved = pan_url or resolve_main_pan_url(row["title"], site_url)
    display_url = normalize_pan_url(resolved)
    return JupanDrama(
        id=int(row["id"]),
        title=row["title"],
        pan_url=display_url,
        published_at=row["published_at"],
        cover_url=row["cover_url"],
        pan_source=classify_pan_source(row["title"], site_url, resolved),
    )


def _row_to_drama(row: sqlite3.Row, *, pan_url: str | None = None) -> JupanDrama:
    return _make_drama(row, pan_url=pan_url)


def _attach_tags(conn: sqlite3.Connection, dramas: list[JupanDrama]) -> list[JupanDrama]:
    if not dramas:
        return dramas
    ids = [d.id for d in dramas]
    placeholders = ",".join("?" * len(ids))
    rows = conn.execute(
        f"""
        SELECT dt.drama_id, t.name
        FROM drama_tags dt
        JOIN tags t ON t.id = dt.tag_id
        WHERE dt.drama_id IN ({placeholders})
        ORDER BY t.sort_order, t.name
        """,
        ids,
    ).fetchall()
    tag_map: dict[int, list[str]] = {drama_id: [] for drama_id in ids}
    for row in rows:
        tag_map[int(row["drama_id"])].append(row["name"])
    return [
        JupanDrama(
            id=d.id,
            title=d.title,
            pan_url=d.pan_url,
            published_at=d.published_at,
            cover_url=d.cover_url,
            tags=tag_map.get(d.id, []),
            pan_source=d.pan_source,
        )
        for d in dramas
    ]


def _tag_clause(tag: str) -> tuple[str, list[object]]:
    tag_name = tag.strip()
    clause = """
        EXISTS (
            SELECT 1 FROM drama_tags dt
            JOIN tags t ON t.id = dt.tag_id
            WHERE dt.drama_id = d.id AND t.name = ? COLLATE NOCASE
        ) OR d.title LIKE ?
    """
    return clause, [tag_name, f"%{tag_name}%"]


def list_dramas(
    *,
    q: str | None = None,
    tag: str | None = None,
    limit: int = 24,
    offset: int = 0,
) -> list[JupanDrama]:
    if not JUPAN_SITE_DB.exists():
        return []
    query = "SELECT DISTINCT d.* FROM dramas d"
    params: list[object] = []
    where: list[str] = []
    if tag:
        clause, clause_params = _tag_clause(tag)
        where.append(f"({clause})")
        params.extend(clause_params)
    if q:
        where.append("d.title LIKE ?")
        params.append(f"%{q.strip()}%")
    if where:
        query += " WHERE " + " AND ".join(where)
    query += f" ORDER BY {_RELATED_ORDER} LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    with _connect(JUPAN_SITE_DB) as conn:
        rows = conn.execute(query, params).fetchall()
        dramas = [_row_to_drama(row) for row in rows]
        return _attach_tags(conn, dramas)


def count_dramas(*, q: str | None = None, tag: str | None = None) -> int:
    if not JUPAN_SITE_DB.exists():
        return 0
    query = "SELECT COUNT(DISTINCT d.id) FROM dramas d"
    params: list[object] = []
    where: list[str] = []
    if tag:
        clause, clause_params = _tag_clause(tag)
        where.append(f"({clause})")
        params.extend(clause_params)
    if q:
        where.append("d.title LIKE ?")
        params.append(f"%{q.strip()}%")
    if where:
        query += " WHERE " + " AND ".join(where)
    with _connect(JUPAN_SITE_DB) as conn:
        return int(conn.execute(query, params).fetchone()[0])


def get_drama(drama_id: int) -> JupanDrama | None:
    if not JUPAN_SITE_DB.exists():
        return None
    with _connect(JUPAN_SITE_DB) as conn:
        row = conn.execute("SELECT * FROM dramas WHERE id = ?", (drama_id,)).fetchone()
        if not row:
            return None
        drama = _row_to_drama(row)
        attached = _attach_tags(conn, [drama])
        return attached[0]


def cover_src(cover_url: str | None) -> str | None:
    if not cover_url:
        return None
    name = cover_url.rsplit("/", 1)[-1]
    return f"/jupan-covers/{name}" if name else None


_EPISODE_RE = re.compile(r"[（(](\d+)集[）)]")
_TITLE_PREFIX_RE = re.compile(r"^\d+\.\s*")


def episode_count(title: str) -> int | None:
    match = _EPISODE_RE.search(title)
    return int(match.group(1)) if match else None


def clean_title(title: str) -> str:
    return _TITLE_PREFIX_RE.sub("", title).strip()
