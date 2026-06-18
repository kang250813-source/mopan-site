"""SQLite storage for mopan resources."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from app.classics import CLASSIC_LIBRARY_ORDER, github_urls
from app.classics_shuffle import shuffle_sequence
from app.config import CATEGORIES, CLASSICS_GITHUB_USER, DB_PATH, DEFAULT_CHANNEL, PAN_LABEL, PAN_TYPE

SCHEMA = """
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  published_at TEXT,
  link_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


@dataclass
class Resource:
    id: int
    title: str
    pan_url: str = ""
    pan_type: str = "quark"
    channel: str = DEFAULT_CHANNEL
    wp_id: int | None = None
    category: str | None = None
    excerpt: str | None = None
    content_html: str | None = None
    source_ref: str | None = None
    pan_save_path: str | None = None
    pan_branches_json: str | None = None
    published_at: str | None = None
    link_status: str = "pending"
    created_at: str | None = None
    updated_at: str | None = None

    @property
    def has_download(self) -> bool:
        return self.link_status == "own" and bool(self.pan_url.strip())

    @property
    def has_github(self) -> bool:
        return self.link_status == "preview" and self.pan_type == "github" and bool(self.pan_url.strip())

    @property
    def is_preview(self) -> bool:
        return self.link_status == "preview"

    @property
    def is_on_site(self) -> bool:
        return bool(self.content_html) and self.link_status in ("on-site", "own", "pending")

    @property
    def github(self) -> dict[str, str] | None:
        if not self.has_github and not self.source_ref:
            return None
        links = github_urls(self.source_ref, user=CLASSICS_GITHUB_USER)
        if not links:
            return None
        if self.pan_url.strip():
            links = dict(links)
            links["blob"] = self.pan_url.split("?")[0].strip()
        return links

    @property
    def pan_branches(self) -> list[str]:
        if not self.pan_branches_json:
            return []
        try:
            data = json.loads(self.pan_branches_json)
        except json.JSONDecodeError:
            return []
        return [str(x).strip() for x in data if str(x).strip()]


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


@contextmanager
def _connect(db_path: Path | None = None) -> Iterator[sqlite3.Connection]:
    path = db_path or DB_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _ensure_schema(conn: sqlite3.Connection) -> None:
    cols = {row[1] for row in conn.execute("PRAGMA table_info(resources)")}
    additions = [
        ("wp_id", "INTEGER"),
        ("pan_url", "TEXT NOT NULL DEFAULT ''"),
        ("pan_type", "TEXT NOT NULL DEFAULT 'quark'"),
        ("category", "TEXT"),
        ("excerpt", "TEXT"),
        ("content_html", "TEXT"),
        ("channel", "TEXT NOT NULL DEFAULT 'discover'"),
        ("source_ref", "TEXT"),
        ("pan_save_path", "TEXT"),
        ("pan_branches", "TEXT"),
    ]
    for name, typedef in additions:
        if name not in cols:
            conn.execute(f"ALTER TABLE resources ADD COLUMN {name} {typedef}")
    cols = {row[1] for row in conn.execute("PRAGMA table_info(resources)")}
    if "quark_url" in cols and "pan_url" in cols:
        conn.execute(
            "UPDATE resources SET pan_url = quark_url WHERE (pan_url IS NULL OR pan_url = '') AND quark_url IS NOT NULL"
        )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_resources_published ON resources(published_at DESC)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category)"
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_resources_wp_id ON resources(wp_id)")
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_wp_id_unique ON resources(wp_id) WHERE wp_id IS NOT NULL"
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_resources_channel ON resources(channel)")
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_source_ref ON resources(source_ref) WHERE source_ref IS NOT NULL"
    )
    conn.execute(
        "UPDATE resources SET channel = 'discover' WHERE channel IS NULL OR channel = ''"
    )


def init_db(db_path: Path | None = None) -> None:
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    with _connect(path) as conn:
        conn.executescript(SCHEMA)
        _ensure_schema(conn)


def _row_to_resource(row: sqlite3.Row) -> Resource:
    keys = set(row.keys())
    pan_url = row["pan_url"] if "pan_url" in keys else (row["quark_url"] if "quark_url" in keys else "")
    return Resource(
        id=int(row["id"]),
        title=row["title"],
        pan_url=pan_url or "",
        pan_type=row["pan_type"] if "pan_type" in keys else PAN_TYPE,
        channel=row["channel"] if "channel" in keys and row["channel"] else DEFAULT_CHANNEL,
        wp_id=int(row["wp_id"]) if "wp_id" in keys and row["wp_id"] is not None else None,
        category=row["category"],
        excerpt=row["excerpt"],
        content_html=row["content_html"] if "content_html" in keys else None,
        source_ref=row["source_ref"] if "source_ref" in keys else None,
        pan_save_path=row["pan_save_path"] if "pan_save_path" in keys else None,
        pan_branches_json=row["pan_branches"] if "pan_branches" in keys else None,
        published_at=row["published_at"],
        link_status=row["link_status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def upsert_resource(
    *,
    title: str,
    content_html: str | None = None,
    pan_url: str = "",
    pan_type: str | None = None,
    category: str | None = None,
    excerpt: str | None = None,
    published_at: str | None = None,
    link_status: str = "pending",
    wp_id: int | None = None,
    channel: str | None = None,
    source_ref: str | None = None,
    pan_save_path: str | None = None,
    pan_branches: list[str] | None = None,
    replace_content: bool = False,
    db_path: Path | None = None,
) -> str:
    init_db(db_path)
    pan = pan_url.split("?")[0].strip() if pan_url else ""
    ptype = pan_type or PAN_TYPE
    ch = channel or DEFAULT_CHANNEL
    now = _now()
    branches_json = json.dumps(pan_branches, ensure_ascii=False) if pan_branches is not None else None
    with _connect(db_path) as conn:
        row = None
        if source_ref:
            row = conn.execute(
                "SELECT id FROM resources WHERE source_ref = ?",
                (source_ref,),
            ).fetchone()
        if not row and wp_id is not None:
            row = conn.execute(
                "SELECT id FROM resources WHERE wp_id = ?",
                (wp_id,),
            ).fetchone()
        if not row:
            row = conn.execute(
                "SELECT id FROM resources WHERE channel = ? AND title = ?",
                (ch, title.strip()),
            ).fetchone()

        if row:
            content_sql = "content_html = ?" if replace_content else "content_html = COALESCE(?, content_html)"
            conn.execute(
                f"""
                UPDATE resources
                SET title = ?, {content_sql},
                    pan_url = CASE WHEN ? != '' THEN ? ELSE pan_url END,
                    pan_type = ?, category = COALESCE(?, category),
                    excerpt = COALESCE(?, excerpt),
                    published_at = COALESCE(?, published_at),
                    link_status = ?, channel = ?,
                    source_ref = COALESCE(?, source_ref),
                    pan_save_path = COALESCE(?, pan_save_path),
                    pan_branches = COALESCE(?, pan_branches),
                    wp_id = COALESCE(?, wp_id), updated_at = ?
                WHERE id = ?
                """,
                (
                    title.strip(),
                    content_html,
                    pan,
                    pan,
                    ptype,
                    category,
                    excerpt,
                    published_at,
                    link_status,
                    ch,
                    source_ref,
                    pan_save_path,
                    branches_json,
                    wp_id,
                    now,
                    row["id"],
                ),
            )
            return "updated"

        conn.execute(
            """
            INSERT INTO resources (
              wp_id, title, pan_url, pan_type, channel, category, excerpt,
              content_html, source_ref, pan_save_path, pan_branches, published_at,
              link_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                wp_id,
                title.strip(),
                pan,
                ptype,
                ch,
                category,
                excerpt,
                content_html,
                source_ref,
                pan_save_path,
                branches_json,
                published_at,
                link_status,
                now,
                now,
            ),
        )
        return "inserted"


def count_resources(
    *,
    q: str | None = None,
    category: str | None = None,
    channel: str | None = None,
    category_prefix: bool = False,
) -> int:
    where, params = _filters(q, category, channel, category_prefix=category_prefix)
    with _connect() as conn:
        row = conn.execute(
            f"SELECT COUNT(*) AS c FROM resources {where}",
            params,
        ).fetchone()
        return int(row["c"])


def _filters(
    q: str | None,
    category: str | None,
    channel: str | None = None,
    *,
    category_prefix: bool = False,
) -> tuple[str, list[str]]:
    clauses: list[str] = []
    params: list[str] = []
    if channel:
        clauses.append("channel = ?")
        params.append(channel.strip())
    if q:
        clauses.append("(title LIKE ? OR excerpt LIKE ? OR content_html LIKE ?)")
        like = f"%{q.strip()}%"
        params.extend([like, like, like])
    if category:
        cat = category.strip()
        if category_prefix:
            clauses.append("(category = ? OR category LIKE ?)")
            params.extend([cat, f"{cat} > %"])
        else:
            clauses.append("category = ?")
            params.append(cat)
    if not clauses:
        return "", params
    return "WHERE " + " AND ".join(clauses), params


def list_resources(
    *,
    q: str | None = None,
    category: str | None = None,
    channel: str | None = None,
    category_prefix: bool = False,
    limit: int = 100,
    offset: int = 0,
    shuffle_seed: int | None = None,
) -> list[Resource]:
    where, params = _filters(q, category, channel, category_prefix=category_prefix)
    order_sql = "" if shuffle_seed is not None else "ORDER BY published_at DESC, id DESC"
    with _connect() as conn:
        if shuffle_seed is not None:
            rows = conn.execute(
                f"""
                SELECT * FROM resources
                {where}
                """,
                params,
            ).fetchall()
            resources = [_row_to_resource(row) for row in rows]
            resources = shuffle_sequence(resources, shuffle_seed)
            return resources[offset : offset + limit]
        rows = conn.execute(
            f"""
            SELECT * FROM resources
            {where}
            {order_sql}
            LIMIT ? OFFSET ?
            """,
            [*params, limit, offset],
        ).fetchall()
    return [_row_to_resource(row) for row in rows]


def get_resource(resource_id: int) -> Resource | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM resources WHERE id = ?",
            (resource_id,),
        ).fetchone()
    return _row_to_resource(row) if row else None


def create_resource(
    title: str,
    pan_url: str = "",
    category: str | None = None,
    excerpt: str | None = None,
    content_html: str | None = None,
    published_at: str | None = None,
    link_status: str = "own",
    pan_type: str | None = None,
) -> int:
    upsert_resource(
        title=title,
        pan_url=pan_url,
        pan_type=pan_type,
        category=category,
        excerpt=excerpt,
        content_html=content_html,
        published_at=published_at,
        link_status=link_status,
    )
    with _connect() as conn:
        row = conn.execute(
            "SELECT id FROM resources WHERE title = ?",
            (title.strip(),),
        ).fetchone()
    if not row:
        raise RuntimeError("create failed")
    return int(row["id"])


def update_resource(
    resource_id: int,
    title: str,
    pan_url: str = "",
    category: str | None = None,
    excerpt: str | None = None,
    content_html: str | None = None,
    published_at: str | None = None,
    link_status: str | None = None,
    pan_type: str | None = None,
) -> None:
    now = _now()
    with _connect() as conn:
        conn.execute(
            """
            UPDATE resources
            SET title = ?, pan_url = ?, pan_type = COALESCE(?, pan_type),
                category = ?, excerpt = ?, content_html = ?,
                published_at = ?, link_status = COALESCE(?, link_status),
                updated_at = ?
            WHERE id = ?
            """,
            (
                title.strip(),
                pan_url.split("?")[0].strip() if pan_url else "",
                pan_type,
                category,
                excerpt,
                content_html,
                published_at,
                link_status,
                now,
                resource_id,
            ),
        )


def delete_resource(resource_id: int) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM resources WHERE id = ?", (resource_id,))


def list_category_counts(*, channel: str | None = None) -> dict[str, int]:
    clauses: list[str] = []
    params: list[str] = []
    if channel:
        clauses.append("channel = ?")
        params.append(channel)
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    with _connect() as conn:
        rows = conn.execute(
            f"""
            SELECT COALESCE(category, '其他') AS category, COUNT(*) AS c
            FROM resources
            {where}
            GROUP BY COALESCE(category, '其他')
            ORDER BY c DESC
            """,
            params,
        ).fetchall()
    return {row["category"]: int(row["c"]) for row in rows}


def list_classics_library_counts() -> dict[str, int]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT
              CASE
                WHEN instr(category, ' > ') > 0 THEN substr(category, 1, instr(category, ' > ') - 1)
                ELSE COALESCE(category, '其他')
              END AS lib,
              COUNT(*) AS c
            FROM resources
            WHERE channel = 'classics'
            GROUP BY lib
            ORDER BY c DESC
            """
        ).fetchall()
    counts = {row["lib"]: int(row["c"]) for row in rows}
    ordered: dict[str, int] = {}
    for lib in CLASSIC_LIBRARY_ORDER:
        if lib in counts:
            ordered[lib] = counts[lib]
    for lib, count in counts.items():
        if lib not in ordered:
            ordered[lib] = count
    return ordered


def list_channel_counts() -> dict[str, int]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT channel, COUNT(*) AS c
            FROM resources
            GROUP BY channel
            """
        ).fetchall()
    return {row["channel"]: int(row["c"]) for row in rows}


def all_categories(*, channel: str | None = None) -> list[str]:
    counts = list_category_counts(channel=channel)
    ordered = [c for c in CATEGORIES if c in counts]
    for name in counts:
        if name not in ordered:
            ordered.append(name)
    return ordered
