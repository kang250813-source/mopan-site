#!/usr/bin/env python3
"""Export site.db -> data/export/ for GitHub Pages build."""

from __future__ import annotations

import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import jupan_bridge  # noqa: E402
from app.config import DB_PATH, JUPAN_COVERS_DIR  # noqa: E402
from app.database import (  # noqa: E402
    init_db,
    list_category_counts,
    list_classics_library_counts,
    list_resources,
)

RESOURCE_CHANNELS = ("discover", "media", "other", "k12", "ai_video", "classics")
EXPORT_DIR = ROOT / "data" / "export"


def _resource_dict(resource) -> dict:
    return {
        "id": resource.id,
        "wp_id": resource.wp_id,
        "title": resource.title,
        "category": resource.category,
        "excerpt": resource.excerpt,
        "content_html": resource.content_html,
        "published_at": resource.published_at,
        "link_status": resource.link_status,
        "pan_url": resource.pan_url,
        "pan_type": resource.pan_type,
        "channel": resource.channel,
        "source_ref": resource.source_ref,
        "pan_branches": resource.pan_branches,
        "updated_at": resource.updated_at,
    }


def _drama_dict(drama) -> dict:
    return {
        "id": drama.id,
        "title": drama.title,
        "pan_url": drama.pan_url,
        "published_at": drama.published_at,
        "cover_url": drama.cover_url,
        "tags": list(drama.tags or []),
        "pan_source": getattr(drama, "pan_source", "main"),
    }


def export_site_data() -> dict[str, int]:
    init_db(DB_PATH)
    channels: dict[str, dict] = {}
    channel_counts: dict[str, int] = {}

    for channel in RESOURCE_CHANNELS:
        rows = list_resources(channel=channel, limit=500_000, offset=0)
        if channel == "classics":
            category_counts = list_classics_library_counts()
        else:
            category_counts = list_category_counts(channel=channel)
        channels[channel] = {
            "resources": [_resource_dict(r) for r in rows],
            "category_counts": category_counts,
        }
        channel_counts[channel] = len(rows)
        print(f"  {channel}: {len(rows)}")

    drama_total = jupan_bridge.count_dramas()
    dramas = jupan_bridge.list_dramas(limit=max(drama_total, 1), offset=0)
    channel_counts["drama"] = drama_total
    print(f"  drama: {drama_total}")

    exported_at = datetime.now(timezone.utc).isoformat()
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    for channel in RESOURCE_CHANNELS:
        (EXPORT_DIR / f"{channel}.json").write_text(
            json.dumps(
                {
                    "exported_at": exported_at,
                    "channel": channel,
                    "total": channel_counts[channel],
                    "category_counts": channels[channel]["category_counts"],
                    "resources": channels[channel]["resources"],
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    (EXPORT_DIR / "drama.json").write_text(
        json.dumps(
            {
                "exported_at": exported_at,
                "channel": "drama",
                "total": drama_total,
                "dramas": [_drama_dict(d) for d in dramas],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (EXPORT_DIR / "manifest.json").write_text(
        json.dumps(
            {
                "exported_at": exported_at,
                "channel_counts": channel_counts,
                "files": {
                    **{ch: f"{ch}.json" for ch in RESOURCE_CHANNELS},
                    "drama": "drama.json",
                },
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (ROOT / "data" / "sync_meta.json").write_text(
        json.dumps(
            {
                "last_export": exported_at,
                "channel_counts": channel_counts,
                "source": "mopan-site",
                "export_dir": "data/export",
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    (ROOT / "data" / "discover.json").write_text(
        json.dumps(
            {
                "exported_at": exported_at,
                "channel": "discover",
                "total": channel_counts.get("discover", 0),
                "category_counts": channels["discover"]["category_counts"],
                "resources": channels["discover"]["resources"],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    covers_dst = ROOT / "data" / "jupan-covers"
    if JUPAN_COVERS_DIR.is_dir():
        if covers_dst.exists():
            shutil.rmtree(covers_dst)
        shutil.copytree(JUPAN_COVERS_DIR, covers_dst)
        print(f"  covers: {sum(1 for _ in covers_dst.iterdir() if _.is_file())}")

    print(f"exported -> {EXPORT_DIR}/")
    return channel_counts


def main() -> int:
    if not DB_PATH.exists():
        print(f"missing database: {DB_PATH}", file=sys.stderr)
        return 1
    export_site_data()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
