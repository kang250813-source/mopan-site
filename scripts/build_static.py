#!/usr/bin/env python3
"""Build discover-channel static site into docs/ for GitHub Pages."""

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
    DB_PATH,
    DEFAULT_CHANNEL,
    PAGE_SIZE,
    PAN_LABEL,
    SITE_SLOGAN,
    SITE_TITLE,
    STATIC_DIR,
    STATIC_VERSION,
)
from app.database import Resource, init_db, list_category_counts, list_resources  # noqa: E402
from app.highlight import highlight_pan_words  # noqa: E402
from app.pagination import page_window, total_pages as calc_total_pages  # noqa: E402
from app.static_urls import resource_href, static_index_href  # noqa: E402

TEMPLATES_DIR = ROOT / "app" / "templates"
DOCS_DIR = ROOT / "docs"
DISCOVER_JSON = ROOT / "data" / "discover.json"


@dataclass
class DiscoverPayload:
    resources: list[Resource]
    category_counts: dict[str, int]
    total: int


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
        published_at=raw.get("published_at"),
        link_status=raw.get("link_status", "pending"),
        created_at=raw.get("created_at"),
        updated_at=raw.get("updated_at"),
    )


def _load_discover() -> DiscoverPayload:
    if DB_PATH.exists():
        init_db(DB_PATH)
        resources = list_resources(channel="discover", limit=100_000, offset=0)
        category_counts = list_category_counts(channel="discover")
        return DiscoverPayload(resources=resources, category_counts=category_counts, total=len(resources))

    if DISCOVER_JSON.exists():
        data = json.loads(DISCOVER_JSON.read_text(encoding="utf-8"))
        resources = [_resource_from_dict(item) for item in data.get("resources", [])]
        category_counts = dict(data.get("category_counts") or {})
        return DiscoverPayload(
            resources=resources,
            category_counts=category_counts,
            total=int(data.get("total") or len(resources)),
        )

    raise SystemExit(f"缺少数据源：{DB_PATH} 或 {DISCOVER_JSON}")


def _related(current: Resource, all_resources: list[Resource], limit: int = 5) -> list[Resource]:
    same_cat = [
        r for r in all_resources if r.id != current.id and r.category and r.category == current.category
    ]
    picked = same_cat[:limit]
    if len(picked) >= limit:
        return picked
    seen = {r.id for r in picked}
    for r in all_resources:
        if r.id == current.id or r.id in seen:
            continue
        picked.append(r)
        if len(picked) >= limit:
            break
    return picked


def build(base_path: str = "/mopan-site") -> None:
    base_path = base_path.rstrip("/")
    payload = _load_discover()
    resources = payload.resources
    total = payload.total
    pages = calc_total_pages(total, PAGE_SIZE)
    channel_counts = {"discover": total}

    if DOCS_DIR.exists():
        shutil.rmtree(DOCS_DIR)
    DOCS_DIR.mkdir(parents=True)
    (DOCS_DIR / "static").mkdir()
    shutil.copytree(STATIC_DIR, DOCS_DIR / "static", dirs_exist_ok=True)
    (DOCS_DIR / ".nojekyll").touch()

    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    env.filters["library_label"] = library_label
    env.filters["library_subtitle"] = library_subtitle
    env.filters["highlight_pan"] = highlight_pan_words
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
        resource_href=lambda rid: resource_href(base_path, rid, static_site=True),
        page_url=lambda page, q="", category="", channel="discover", tag="": static_index_href(
            base_path, page
        ),
    )

    def write(name: str, path: Path, **ctx) -> None:
        tpl = env.get_template(name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(tpl.render(**ctx), encoding="utf-8")

    channel_meta = next(ch for ch in CHANNELS if ch["id"] == "discover")

    for page_num in range(1, pages + 1):
        offset = (page_num - 1) * PAGE_SIZE
        page_items = resources[offset : offset + PAGE_SIZE]
        out_path = DOCS_DIR / "index.html" if page_num == 1 else DOCS_DIR / "page" / str(page_num) / "index.html"
        write(
            "index.html",
            out_path,
            request=_fake_request("/"),
            resources=page_items,
            q="",
            category="",
            channel="discover",
            channel_meta=channel_meta,
            channel_counts=channel_counts,
            category_counts=payload.category_counts,
            total=total,
            total_all=total,
            page=page_num,
            total_pages=pages,
            page_items=page_window(page_num, pages),
        )

    for resource in resources:
        write(
            "detail.html",
            DOCS_DIR / "resource" / f"{resource.id}.html",
            request=_fake_request(f"/resource/{resource.id}"),
            resource=resource,
            related=_related(resource, resources),
            share_page_url=resource_href(base_path, resource.id, static_site=True),
        )

    print(f"Built discover static site -> {DOCS_DIR}")
    print(f"  articles: {len(resources)}")
    print(f"  list pages: {pages}")
    if base_path:
        print(f"  preview: https://kang250813-source.github.io{base_path}/")


if __name__ == "__main__":
    import os

    build(os.getenv("BASE_PATH", "/mopan-site"))
