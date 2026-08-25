#!/usr/bin/env python3
"""Seed site.db from committed data/export when CI starts without a database."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import DB_PATH  # noqa: E402
from app.database import init_db, list_resources, upsert_resource  # noqa: E402

EXPORT_DIR = ROOT / "data" / "export"
RESOURCE_CHANNELS = ("discover", "media", "other", "k12", "ai_video", "classics")
MIN_RESOURCES = 500


def _manifest_total() -> int:
    manifest_path = EXPORT_DIR / "manifest.json"
    if not manifest_path.is_file():
        return 0
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    counts = manifest.get("channel_counts") or {}
    # Dramas are read directly from duanjuku-site; site.db only contains resources.
    return sum(int(counts.get(channel, 0)) for channel in RESOURCE_CHANNELS)


def _db_total() -> int:
    if not DB_PATH.is_file():
        return 0
    init_db(DB_PATH)
    return sum(len(list_resources(channel=ch, limit=1_000_000, offset=0)) for ch in RESOURCE_CHANNELS)


def bootstrap(force: bool = False) -> int:
    manifest_total = _manifest_total()
    if manifest_total < MIN_RESOURCES:
        print(f"skip bootstrap: manifest total {manifest_total} < {MIN_RESOURCES}")
        return 0

    db_total = _db_total()
    if not force and db_total >= manifest_total * 0.8:
        print(f"skip bootstrap: site.db already has {db_total} resources")
        return 0

    print(f"bootstrap site.db from export ({db_total} -> target ~{manifest_total})")
    init_db(DB_PATH)

    imported = 0
    for channel in RESOURCE_CHANNELS:
        channel_path = EXPORT_DIR / f"{channel}.json"
        if not channel_path.is_file():
            continue
        payload = json.loads(channel_path.read_text(encoding="utf-8"))
        for row in payload.get("resources") or []:
            upsert_resource(
                title=row["title"],
                content_html=row.get("content_html"),
                pan_url=row.get("pan_url") or "",
                pan_password=row.get("pan_password") or "",
                pan_type=row.get("pan_type"),
                category=row.get("category"),
                excerpt=row.get("excerpt"),
                published_at=row.get("published_at"),
                link_status=row.get("link_status") or "own",
                wp_id=row.get("wp_id"),
                channel=row.get("channel") or channel,
                source_ref=row.get("source_ref"),
                pan_branches=row.get("pan_branches"),
                replace_content=bool(row.get("content_html")),
            )
            imported += 1
        print(f"  {channel}: {len(payload.get('resources') or [])}")

    print(f"bootstrap complete: imported {imported} rows, db total={_db_total()}")
    return 0


def main() -> int:
    force = "--force" in sys.argv
    return bootstrap(force=force)


if __name__ == "__main__":
    raise SystemExit(main())
