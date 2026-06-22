#!/usr/bin/env python3
"""Build full static site (all channels) into docs/ for GitHub Pages."""

from __future__ import annotations

import json
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.classics import library_label, library_subtitle  # noqa: E402
from app.classics_shuffle import daily_shuffle_seed, hourly_shuffle_seed, shuffle_sequence  # noqa: E402
from app.i18n import (  # noqa: E402
    I18n,
    LOCALES,
    category_label,
    classic_library_label,
    classic_subtitle_label,
    drama_tag_label,
    get_i18n,
    set_active_i18n,
)
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
    PUBLIC_SITE_URL,
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
from app.site_wheel import build_home_wheel_picks, build_site_wheel_picks, home_wheel_json, site_wheel_json  # noqa: E402
from app.game_picks import build_wheel_picks, wheel_picks_json  # noqa: E402
from app.pagination import page_window, total_pages as calc_total_pages  # noqa: E402
from app.static_urls import category_href, channel_href, drama_href, drama_tag_href, resource_href  # noqa: E402

TEMPLATES_DIR = ROOT / "app" / "templates"
DOCS_DIR = ROOT / "docs"
SITE_EXPORT_JSON = ROOT / "data" / "site_export.json"
EXPORT_DIR = ROOT / "data" / "export"
EXPORT_MANIFEST = EXPORT_DIR / "manifest.json"
DISCOVER_JSON = ROOT / "data" / "discover.json"
COVERS_DATA_DIR = ROOT / "data" / "jupan-covers"

RESOURCE_CHANNELS = ("discover", "media", "other", "k12", "ai_video", "classics")


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
        pan_source=raw.get("pan_source", "main"),
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


def _load_payload_from_export_dir() -> SitePayload | None:
    if not EXPORT_MANIFEST.exists():
        return None
    manifest = json.loads(EXPORT_MANIFEST.read_text(encoding="utf-8"))
    channel_counts = dict(manifest.get("channel_counts") or {})
    channels: dict[str, dict] = {}
    for channel in RESOURCE_CHANNELS:
        path = EXPORT_DIR / f"{channel}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        channels[channel] = {
            "resources": list(data.get("resources") or []),
            "category_counts": dict(data.get("category_counts") or {}),
        }
    dramas: list[dict] = []
    drama_path = EXPORT_DIR / "drama.json"
    if drama_path.exists():
        dramas = list(json.loads(drama_path.read_text(encoding="utf-8")).get("dramas") or [])
    return SitePayload(channel_counts=channel_counts, channels=channels, dramas=dramas)


def _validate_export_payload(payload: SitePayload) -> None:
    counts = payload.channel_counts or {}
    classics = payload.channels.get("classics", {}).get("resources") or []
    if counts.get("classics") and not classics:
        raise SystemExit(
            "data/export/classics.json is empty but manifest lists "
            f"{counts['classics']} classics — run scripts/export_data.py"
        )
    if counts.get("drama") and not payload.dramas:
        raise SystemExit(
            "data/export/drama.json is empty but manifest lists "
            f"{counts['drama']} dramas — run scripts/export_data.py"
        )


def load_payload() -> SitePayload:
    payload = _load_payload_from_export_dir()
    if payload is not None:
        _validate_export_payload(payload)
        return payload
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
    raise SystemExit(f"缺少数据源：{EXPORT_DIR}/ 或 {SITE_EXPORT_JSON} 或 {DB_PATH}")


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


def _filter_dramas_by_tag(dramas: list[jupan_bridge.JupanDrama], tag: str) -> list[jupan_bridge.JupanDrama]:
    tag_name = tag.strip()
    if not tag_name:
        return dramas
    tag_lower = tag_name.casefold()
    out: list[jupan_bridge.JupanDrama] = []
    for drama in dramas:
        if any(t.casefold() == tag_lower for t in drama.tags):
            out.append(drama)
        elif tag_name in drama.title:
            out.append(drama)
    return out


def _collect_drama_tags(dramas: list[jupan_bridge.JupanDrama]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for tag in JUPAN_HOT_TAGS:
        if tag not in seen:
            seen.add(tag)
            ordered.append(tag)
    for drama in dramas:
        for tag in drama.tags:
            if tag not in seen:
                seen.add(tag)
                ordered.append(tag)
    return ordered


def _filter_resources_by_category(
    resources: list[Resource],
    channel: str,
    category_name: str,
) -> list[Resource]:
    cat = category_name.strip()
    if not cat:
        return resources
    if channel == "classics":
        return [
            r for r in resources
            if r.category and (r.category == cat or r.category.startswith(f"{cat} >"))
        ]
    return [r for r in resources if (r.category or "其他") == cat]


def _list_out_path(docs_root: Path, channel: str, page: int) -> Path:
    if channel == "discover":
        return docs_root / "index.html" if page == 1 else docs_root / "page" / str(page) / "index.html"
    if page == 1:
        return docs_root / "channel" / channel / "index.html"
    return docs_root / "channel" / channel / "page" / str(page) / "index.html"


def _category_out_path(docs_root: Path, channel: str, category_name: str, page: int) -> Path:
    if channel == "discover":
        base = docs_root / "category" / category_name
    else:
        base = docs_root / "channel" / channel / "category" / category_name
    if page <= 1:
        return base / "index.html"
    return base / "page" / str(page) / "index.html"


def _page_url_path(base_path: str, out_file: Path, docs_root: Path) -> str:
    rel = out_file.relative_to(docs_root).as_posix()
    prefix = base_path.rstrip("/")
    if rel == "index.html":
        return f"{prefix}/" if prefix else "/"
    url = f"{prefix}/{rel}" if prefix else f"/{rel}"
    return url.replace("//", "/")


def _docs_root(locale: str) -> Path:
    return DOCS_DIR if locale == "zh" else DOCS_DIR / "en"


def _make_env(i18n: I18n, base_path: str, channel_counts: dict[str, int]) -> Environment:
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
    env.filters["cat_label"] = category_label
    env.filters["lib_label"] = classic_library_label
    env.filters["lib_subtitle"] = classic_subtitle_label
    env.filters["drama_tag_label"] = drama_tag_label
    env.globals.update(
        t=i18n.t,
        locale=i18n.locale,
        html_lang=i18n.html_lang,
        base_path=base_path,
        asset_base=i18n.asset_base_path,
        static_site=True,
        site_title=i18n.site_title,
        site_slogan=i18n.site_slogan,
        site_version="static",
        static_version=STATIC_VERSION,
        channels=i18n.channels(),
        default_channel=DEFAULT_CHANNEL,
        contact_email="",
        public_site_url=PUBLIC_SITE_URL,
        pan_label=i18n.pan_label,
        jupan_public_url=JUPAN_PUBLIC_URL,
        qkduanju_public_url=QKDUANJU_PUBLIC_URL,
        hot_tags=JUPAN_HOT_TAGS,
        hot_tags_visible=JUPAN_HOT_TAGS_VISIBLE,
        classics_github_user=CLASSICS_GITHUB_USER,
        js_messages=i18n.js_messages(),
        resource_href=lambda rid: resource_href(base_path, rid, static_site=True),
        drama_href=lambda did: drama_href(base_path, did, static_site=True),
        drama_tag_href=lambda tag, page=1: drama_tag_href(base_path, tag, static_site=True, page=page),
        category_href=lambda ch, cat, page=1: category_href(base_path, ch, cat, static_site=True, page=page),
        channel_href=lambda ch, page=1: channel_href(base_path, ch, static_site=True, page=page),
        page_url=lambda page, q="", category="", channel="discover", tag="": (
            drama_tag_href(base_path, tag, static_site=True, page=page)
            if tag and channel == "drama"
            else category_href(base_path, channel or "discover", category, static_site=True, page=page)
            if category
            else channel_href(base_path, channel or "discover", static_site=True, page=page)
        ),
    )
    return env


def _build_locale(i18n: I18n, payload: SitePayload, channel_counts: dict[str, int]) -> dict[str, int]:
    set_active_i18n(i18n.locale)
    base_path = i18n.locale_base_path
    docs_root = _docs_root(i18n.locale)
    docs_root.mkdir(parents=True, exist_ok=True)
    env = _make_env(i18n, base_path, channel_counts)
    stats = {"resources": 0, "list_pages": 0, "dramas": 0}

    def write(name: str, path: Path, **ctx) -> None:
        tpl = env.get_template(name)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            tpl.render(locale_switch_href=i18n.locale_switch_href(_page_url_path(base_path, path, docs_root)), **ctx),
            encoding="utf-8",
        )

    for channel in RESOURCE_CHANNELS:
        resources = _resources_for_channel(payload, channel)
        if not resources:
            continue
        classics_hourly = channel == "classics"
        if classics_hourly:
            resources = shuffle_sequence(resources, hourly_shuffle_seed())
        ch_data = payload.channels.get(channel, {})
        category_counts = dict(ch_data.get("category_counts") or {})
        channel_meta = i18n.channel(channel)
        total = len(resources)
        pages = calc_total_pages(total, PAGE_SIZE)
        hero_desc = i18n.hero(channel, github_user=CLASSICS_GITHUB_USER)

        for page_num in range(1, pages + 1):
            offset = (page_num - 1) * PAGE_SIZE
            page_items = resources[offset : offset + PAGE_SIZE]
            write(
                "index.html",
                _list_out_path(docs_root, channel, page_num),
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
                hero_desc=hero_desc,
                classics_hourly_shuffle=classics_hourly,
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
                docs_root / "resource" / f"{resource.id}.html",
                request=_fake_request(f"/resource/{resource.id}"),
                resource=resource,
                related=related,
                share_page_url=resource_href(base_path, resource.id, static_site=True),
            )
            stats["resources"] += 1

        for cat_name in category_counts:
            filtered = _filter_resources_by_category(resources, channel, cat_name)
            if not filtered:
                continue
            cat_total = len(filtered)
            cat_pages = calc_total_pages(cat_total, PAGE_SIZE)
            for page_num in range(1, cat_pages + 1):
                offset = (page_num - 1) * PAGE_SIZE
                page_items = filtered[offset : offset + PAGE_SIZE]
                write(
                    "index.html",
                    _category_out_path(docs_root, channel, cat_name, page_num),
                    request=_fake_request("/"),
                    resources=page_items,
                    q="",
                    category=cat_name,
                    channel=channel,
                    channel_meta=channel_meta,
                    channel_counts=channel_counts,
                    category_counts=category_counts,
                    total=cat_total,
                    total_all=channel_counts.get(channel, total),
                    page=page_num,
                    total_pages=cat_pages,
                    page_items=page_window(page_num, cat_pages),
                    hero_desc=hero_desc,
                    classics_hourly_shuffle=classics_hourly,
                )
                stats["list_pages"] += 1

    dramas = _dramas(payload)
    if dramas:
        channel_meta = i18n.channel("drama")
        dramas = shuffle_sequence(dramas, daily_shuffle_seed())
        total = len(dramas)
        pages = calc_total_pages(total, PAGE_SIZE)
        for page_num in range(1, pages + 1):
            offset = (page_num - 1) * PAGE_SIZE
            page_items = dramas[offset : offset + PAGE_SIZE]
            out = _list_out_path(docs_root, "drama", page_num)
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
                hero_desc=i18n.hero("drama"),
            )
            stats["list_pages"] += 1

        for drama in dramas:
            related = [d for d in dramas if d.id != drama.id][:5]
            write(
                "drama_detail.html",
                docs_root / "drama" / f"{drama.id}.html",
                request=_fake_request(f"/drama/{drama.id}"),
                drama=drama,
                related=related,
                share_page_url=drama_href(base_path, drama.id, static_site=True),
            )
            stats["dramas"] += 1

        for tag_name in _collect_drama_tags(dramas):
            tagged = _filter_dramas_by_tag(dramas, tag_name)
            if not tagged:
                continue
            tag_total = len(tagged)
            tag_pages = calc_total_pages(tag_total, PAGE_SIZE)
            for page_num in range(1, tag_pages + 1):
                offset = (page_num - 1) * PAGE_SIZE
                page_items = tagged[offset : offset + PAGE_SIZE]
                tag_dir = docs_root / "channel" / "drama" / "tag" / tag_name
                out = tag_dir / "index.html" if page_num == 1 else tag_dir / "page" / str(page_num) / "index.html"
                write(
                    "drama_channel.html",
                    out,
                    request=_fake_request("/"),
                    dramas=page_items,
                    q="",
                    tag=tag_name,
                    channel="drama",
                    channel_meta=channel_meta,
                    channel_counts=channel_counts,
                    total=tag_total,
                    total_all=channel_counts.get("drama", len(dramas)),
                    page=page_num,
                    total_pages=tag_pages,
                    page_items=page_window(page_num, tag_pages),
                    hero_desc=i18n.hero("drama", tag=tag_name),
                )
                stats["list_pages"] += 1

    _build_games(i18n, base_path, docs_root, payload, write)
    return stats


def _build_games(
    i18n: I18n,
    base_path: str,
    docs_root: Path,
    payload: SitePayload,
    write,
) -> None:
    picks = build_wheel_picks(
        locale=i18n.locale,
        base_path=base_path,
        static_site=True,
        payload=payload,
    )
    picks_json = wheel_picks_json(picks)
    write("games_hub.html", docs_root / "game" / "index.html", request=_fake_request("/game/"))
    write("game_stack.html", docs_root / "game" / "stack" / "index.html", request=_fake_request("/game/stack/"))
    write(
        "game_wheel.html",
        docs_root / "game" / "wheel" / "index.html",
        request=_fake_request("/game/wheel/"),
        wheel_picks_json=picks_json,
    )
    write("game_match.html", docs_root / "game" / "match" / "index.html", request=_fake_request("/game/match/"))
    write("game_croc.html", docs_root / "game" / "croc" / "index.html", request=_fake_request("/game/croc/"))
    write("game_bomb.html", docs_root / "game" / "bomb" / "index.html", request=_fake_request("/game/bomb/"))
    write("game_dice.html", docs_root / "game" / "dice" / "index.html", request=_fake_request("/game/dice/"))
    write("game_finger.html", docs_root / "game" / "finger" / "index.html", request=_fake_request("/game/finger/"))
    write("game_bobing.html", docs_root / "game" / "bobing" / "index.html", request=_fake_request("/game/bobing/"))
    write("game_chore.html", docs_root / "game" / "chore" / "index.html", request=_fake_request("/game/chore/"))
    write("game_who.html", docs_root / "game" / "who" / "index.html", request=_fake_request("/game/who/"))
    write("game_topic.html", docs_root / "game" / "topic" / "index.html", request=_fake_request("/game/topic/"))
    write("game_tictactoe.html", docs_root / "game" / "tictactoe" / "index.html", request=_fake_request("/game/tictactoe/"))
    site_picks = build_site_wheel_picks(locale=i18n.locale, base_path=base_path)
    today_picks = build_home_wheel_picks(locale=i18n.locale, base_path=base_path)
    write(
        "game_today.html",
        docs_root / "game" / "today" / "index.html",
        request=_fake_request("/game/today/"),
        today_wheel_json=home_wheel_json(today_picks),
    )
    write(
        "game_site_wheel.html",
        docs_root / "game" / "site-wheel" / "index.html",
        request=_fake_request("/game/site-wheel/"),
        site_wheel_json=site_wheel_json(site_picks),
    )
    if i18n.locale == "zh":
        (DOCS_DIR / "static" / "game-picks.json").write_text(picks_json + "\n", encoding="utf-8")


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
    _ = base_path.rstrip("/")
    payload = load_payload()
    channel_counts = dict(payload.channel_counts)

    if DOCS_DIR.exists():
        shutil.rmtree(DOCS_DIR)
    DOCS_DIR.mkdir(parents=True)
    shutil.copytree(STATIC_DIR, DOCS_DIR / "static", dirs_exist_ok=True)
    (DOCS_DIR / ".nojekyll").touch()
    _copy_covers()

    totals = {"resources": 0, "list_pages": 0, "dramas": 0}
    for locale in LOCALES:
        stats = _build_locale(get_i18n(locale), payload, channel_counts)
        for key in totals:
            totals[key] += stats[key]
        print(f"  locale {locale}: resources={stats['resources']}, dramas={stats['dramas']}, lists={stats['list_pages']}")

    print(f"Built static site -> {DOCS_DIR}")
    print(f"  channels: {', '.join(f'{k}={v}' for k, v in channel_counts.items())}")
    print(f"  resource pages: {totals['resources']}")
    print(f"  drama pages: {totals['dramas']}")
    print(f"  list pages: {totals['list_pages']}")
    domain = os.getenv("CUSTOM_DOMAIN", "").strip()
    if domain:
        (DOCS_DIR / "CNAME").write_text(domain + "\n", encoding="utf-8")
        print(f"  CNAME: {domain}")


if __name__ == "__main__":
    build(os.getenv("BASE_PATH", ""))
