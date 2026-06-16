#!/usr/bin/env python3
"""Build full static site (all channels) into docs/ for GitHub Pages."""

from __future__ import annotations

import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.classics import library_label, library_subtitle  # noqa: E402
from app.config import (  # noqa: E402
    CHANNELS,
    CLASSICS_GITHUB_USER,
    DB_PATH,
    DEFAULT_CHANNEL,
    JUPAN_COVERS_DIR,
    JUPAN_HOT_TAGS,
    JUPAN_HOT_TAGS_VISIBLE,
    JUPAN_PUBLIC_URL,
    PAGE_SIZE,
    PAN_LABEL,
    QKDUANJU_PUBLIC_URL,
    SITE_SLOGAN,
    SITE_TITLE,
    STATIC_DIR,
    STATIC_VERSION,
)
from app.database import (  # noqa: E402
    Resource,
    init_db,
    list_category_counts,
    list_classics_library_counts,
    list_resources,
)
from app.highlight import highlight_pan_words  # noqa: E402
from app.qr_util import quark_qr_data_url  # noqa: E402
from app import jupan_bridge  # noqa: E402
from app.pagination import page_window, total_pages as calc_total_pages  # noqa: E402
from app.static_urls import channel_href, drama_href, resource_href  # noqa: E402

TEMPLATES_DIR = ROOT / "app" / "templates"
DOCS_DIR = ROOT / "docs"
SITE_EXPORT_JSON = ROOT / "data" / "site_export.json"
DISCOVER_JSON = ROOT / "data" / "discover.json"
COVERS_DATA_DIR = ROOT / "data" / "jupan-covers"

RESOURCE_CHANNELS = ("discover", "k12", "ai_video", "classics")


@dataclass
class SitePayload:
    channel_counts: dict[str, int]
    channels: dict[str, dict]
    dramas: list[dict]


def _fake_request(path: str) -> SimpleNamespace:
    return SimpleNamespace(url=SimpleNamespace(path=path))


def _resource_from_dict(raw: dict) -> Resource:
    return Resource(
        id=int(raw["id"]),
        title=raw["title"],
        pan_url=raw.get("pan_url", ""),
        pan_type=raw.get("pan_type", "quark"),
        channel=raw.get("channel", "discover"),
        wp_id=raw.get("wp_id"),
        category=raw.get("category"),
        excerpt=raw.get("excerpt"),
        content_html=raw.get("content_html"),
        source_ref=raw.get("source_ref"),
        pan_save_path=raw.get("pan_save_path"),
        pan_branches_json=(
            json.dumps(raw["pan_branches"], ensure_ascii=False)
            if isinstance(raw.get("pan_branches"), list)
            else raw.get("pan_branches_json")
        ),
        published_at=raw.get("published_at"),
        link_status=raw.get("link_status", "pending"),
        created_at=raw.get("created_at"),
        updated_at=raw.get("updated_at"),
    )


def _drama_from_dict(raw: dict) -> jupan_bridge.JupanDrama:
    return jupan_bridge.JupanDrama(
        id=int(raw["id"]),
        title=raw["title"],
        pan_url=raw.get("pan_url", ""),
        published_at=raw.get("published_at"),
        cover_url=raw.get("cover_url"),
        tags=list(raw.get("tags") or []),
    )


def _load_payload_from_db() -> SitePayload:
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
            "resources": rows,
            "category_counts": category_counts,
        }
        channel_counts[channel] = len(rows)
    drama_total = jupan_bridge.count_dramas()
    dramas = jupan_bridge.list_dramas(limit=max(drama_total, 1), offset=0)
    channel_counts["drama"] = drama_total
    return SitePayload(channel_counts=channel_counts, channels=channels, dramas=dramas)  # type: ignore[arg-type]


def load_payload() -> SitePayload:
    if SITE_EXPORT_JSON.exists():
        data = json.loads(SITE_EXPORT_JSON.read_text(encoding="utf-8"))
        return SitePayload(
            channel_counts=dict(data.get("channel_counts") or {}),
            channels=dict(data.get("channels") or {}),
            dramas=list(data.get("dramas") or []),
        )
    if DB_PATH.exists():
        return _load_payload_from_db()
    if DISCOVER_JSON.exists():
        data = json.loads(DISCOVER_JSON.read_text(encoding="utf-8"))
        return SitePayload(
            channel_counts={"discover": int(data.get("total") or 0)},
            channels={
                "discover": {
                    "resources": list(data.get("resources") or []),
                    "category_counts": dict(data.get("category_counts") or {}),
                }
            },
            dramas=[],
        )
    raise SystemExit(f"缺少数据源：{SITE_EXPORT_JSON} 或 {DB_PATH}")


def _resources_for_channel(payload: SitePayload, channel: str) -> list[Resource]:
    raw = payload.channels.get(channel, {}).get("resources", [])
    out: list[Resource] = []
    for item in raw:
        if isinstance(item, Resource):
            out.append(item)
        else:
            out.append(_resource_from_dict(item))
    return out


def _dramas(payload: SitePayload) -> list[jupan_bridge.JupanDrama]:
    return [_drama_from_dict(d) if isinstance(d, dict) else d for d in payload.dramas]


def _related_resources(current: Resource, pool: list[Resource], limit: int = 5) -> list[Resource]:
    same = [r for r in pool if r.id != current.id and r.category == current.category][:limit]
    if len(same) >= limit:
        return same
    seen = {r.id for r in same}
    for r in pool:
        if r.id == current.id or r.id in seen:
            continue
        same.append(r)
        if len(same) >= limit:
            break
    return same


def _list_out_path(channel: str, page: int) -> Path:
    if channel == "discover":
        return DOCS_DIR / "index.html" if page == 1 else DOCS_DIR / "page" / str(page) / "index.html"
    if page == 1:
        return DOCS_DIR / "channel" / channel / "index.html"
    return DOCS_DIR / "channel" / channel / "page" / str(page) / "index.html"


def _copy_covers() -> None:
    dst = DOCS_DIR / "jupan-covers"
    dst.mkdir(parents=True, exist_ok=True)
    for src in (COVERS_DATA_DIR, JUPAN_COVERS_DIR):
        if not src.is_dir():
            continue
        for file in src.iterdir():
            if file.is_file():
                shutil.copy2(file, dst / file.name)
        if any(dst.iterdir()):
            return


def build(base_path: str = "") -> None:
    base_path = base_path.rstrip("/")
    payload = load_payload()
    channel_counts = dict(payload.channel_counts)

    if DOCS_DIR.exists():
        shutil.rmtree(DOCS_DIR)
    DOCS_DIR.mkdir(parents=True)
    (DOCS_DIR / "static").mkdir()
    shutil.copytree(STATIC_DIR, DOCS_DIR / "static", dirs_exist_ok=True)
    (DOCS_DIR / ".nojekyll").touch()
    _copy_covers()

    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    env.filters["library_label"] = library_label
    env.filters["library_subtitle"] = library_subtitle
    env.filters["highlight_pan"] = highlight_pan_words
    env.filters["episode_count"] = jupan_bridge.episode_count
    env.filters["clean_title"] = jupan_bridge.clean_title
    env.filters["cover_src"] = jupan_bridge.cover_src
    env.filters["qr_data_url"] = quark_qr_data_url
    env.globals.update(
        base_path=base_path,
        static_site=True,
        site_title=SITE_TITLE,
        site_slogan=SITE_SLOGAN,
        site_version="static",
        static_version=STATIC_VERSION,
        channels=CHANNELS,
        default_channel=DEFAULT_CHANNEL,
        contact_email="",
        public_site_url="",
        pan_label=PAN_LABEL,
        jupan_public_url=JUPAN_PUBLIC_URL,
        qkduanju_public_url=QKDUANJU_PUBLIC_URL,
        hot_tags=JUPAN_HOT_TAGS,
        hot_tags_visible=JUPAN_HOT_TAGS_VISIBLE,
        classics_github_user=CLASSICS_GITHUB_USER,
        resource_href=lambda rid: resource_href(base_path, rid, static_site=True),
        drama_href=lambda did: drama_href(base_path, did, static_site=True),
        channel_href=lambda ch, page=1: channel_href(base_path, ch, static_site=True, page=page),
        page_url=lambda page, q="", category="", channel="discover", tag="": channel_href(
            base_path, channel or "discover", static_site=True, page=page
        ),
    )

    def write(name: str, path: Path, **ctx) -> None:
        tpl = env.get_template(name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(tpl.render(**ctx), encoding="utf-8")

    stats = {"resources": 0, "list_pages": 0, "dramas": 0}

    for channel in RESOURCE_CHANNELS:
        resources = _resources_for_channel(payload, channel)
        if not resources:
            continue
        ch_data = payload.channels.get(channel, {})
        category_counts = dict(ch_data.get("category_counts") or {})
        channel_meta = next(c for c in CHANNELS if c["id"] == channel)
        total = len(resources)
        pages = calc_total_pages(total, PAGE_SIZE)
        classics_prefix = channel == "classics"

        for page_num in range(1, pages + 1):
            offset = (page_num - 1) * PAGE_SIZE
            page_items = resources[offset : offset + PAGE_SIZE]
            write(
                "index.html",
                _list_out_path(channel, page_num),
                request=_fake_request("/"),
                resources=page_items,
                q="",
                category="",
                channel=channel,
                channel_meta=channel_meta,
                channel_counts=channel_counts,
                category_counts=category_counts,
                total=total,
                total_all=channel_counts.get(channel, total),
                page=page_num,
                total_pages=pages,
                page_items=page_window(page_num, pages),
            )
            stats["list_pages"] += 1

        for resource in resources:
            if channel == "classics":
                lib = library_label(resource.category)
                related = [
                    r for r in resources
                    if r.id != resource.id and lib and (r.category or "").startswith(lib)
                ][:5]
            else:
                related = _related_resources(resource, resources)
            write(
                "detail.html",
                DOCS_DIR / "resource" / f"{resource.id}.html",
                request=_fake_request(f"/resource/{resource.id}"),
                resource=resource,
                related=related,
                share_page_url=resource_href(base_path, resource.id, static_site=True),
            )
            stats["resources"] += 1

    dramas = _dramas(payload)
    if dramas:
        channel_meta = next(c for c in CHANNELS if c["id"] == "drama")
        total = len(dramas)
        pages = calc_total_pages(total, PAGE_SIZE)
        for page_num in range(1, pages + 1):
            offset = (page_num - 1) * PAGE_SIZE
            page_items = dramas[offset : offset + PAGE_SIZE]
            out = DOCS_DIR / "channel" / "drama" / "index.html" if page_num == 1 else (
                DOCS_DIR / "channel" / "drama" / "page" / str(page_num) / "index.html"
            )
            write(
                "drama_channel.html",
                out,
                request=_fake_request("/"),
                dramas=page_items,
                q="",
                tag="",
                channel="drama",
                channel_meta=channel_meta,
                channel_counts=channel_counts,
                total=total,
                total_all=channel_counts.get("drama", total),
                page=page_num,
                total_pages=pages,
                page_items=page_window(page_num, pages),
            )
            stats["list_pages"] += 1

        for drama in dramas:
            related = [d for d in dramas if d.id != drama.id][:5]
            write(
                "drama_detail.html",
                DOCS_DIR / "drama" / f"{drama.id}.html",
                request=_fake_request(f"/drama/{drama.id}"),
                drama=drama,
                related=related,
                share_page_url=drama_href(base_path, drama.id, static_site=True),
            )
            stats["dramas"] += 1

    print(f"Built static site -> {DOCS_DIR}")
    print(f"  channels: {', '.join(f'{k}={v}' for k, v in channel_counts.items())}")
    print(f"  resource pages: {stats['resources']}")
    print(f"  drama pages: {stats['dramas']}")
    print(f"  list pages: {stats['list_pages']}")
    domain = os.getenv("CUSTOM_DOMAIN", "").strip()
    if domain:
        (DOCS_DIR / "CNAME").write_text(domain + "\n", encoding="utf-8")
        print(f"  CNAME: {domain}")
    if base_path:
        print(f"  preview: https://kang250813-source.github.io{base_path}/")


if __name__ == "__main__":
    import os

    build(os.getenv("BASE_PATH", ""))
