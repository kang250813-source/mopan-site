"""Sample site links for the wheel mini-game."""

from __future__ import annotations

import json
from typing import Any

from app import jupan_bridge
from app.database import Resource, list_resources
from app.i18n import get_i18n
from app.static_urls import channel_href, drama_href, resource_href

WHEEL_CHANNELS = ("discover", "drama", "media", "other", "k12", "ai_video")
PICKS_PER_CHANNEL = 12


def _item(title: str, url: str) -> dict[str, str]:
    return {"title": title.strip(), "url": url}


def _resources_for_channel_db(channel: str, limit: int = 80) -> list[Resource]:
    return list_resources(channel=channel, limit=limit, offset=0)


def _resources_for_channel_payload(payload: Any, channel: str) -> list[Resource]:
    ch = payload.channels.get(channel, {})
    raw_items = ch.get("resources") or []
    items: list[Resource] = []
    for raw in raw_items:
        if isinstance(raw, Resource):
            items.append(raw)
        elif isinstance(raw, dict):
            items.append(
                Resource(
                    id=int(raw["id"]),
                    title=raw["title"],
                    pan_url=raw.get("pan_url", ""),
                    pan_type=raw.get("pan_type", "quark"),
                    channel=raw.get("channel", channel),
                    wp_id=raw.get("wp_id"),
                    category=raw.get("category"),
                    excerpt=raw.get("excerpt"),
                    content_html=raw.get("content_html"),
                    source_ref=raw.get("source_ref"),
                    pan_save_path=raw.get("pan_save_path"),
                    pan_branches_json=raw.get("pan_branches_json"),
                    published_at=raw.get("published_at"),
                    link_status=raw.get("link_status", "pending"),
                    created_at=raw.get("created_at"),
                    updated_at=raw.get("updated_at"),
                )
            )
    return items


def _pick_items(
    *,
    locale: str,
    base_path: str,
    static_site: bool,
    channel: str,
    resources: list[Resource] | None = None,
    dramas: list | None = None,
) -> list[dict[str, str]]:
    i18n = get_i18n(locale)
    items: list[dict[str, str]] = []
    if channel == "drama":
        pool = dramas or []
        for drama in pool[:PICKS_PER_CHANNEL]:
            title = jupan_bridge.clean_title(getattr(drama, "title", "") or drama.get("title", ""))
            did = int(getattr(drama, "id", None) or drama.get("id", 0))
            if not title or not did:
                continue
            items.append(_item(title, drama_href(base_path, did, static_site=static_site)))
        if not items:
            items.append(_item(i18n.channel("drama")["label"], channel_href(base_path, "drama", static_site=static_site)))
        return items

    pool = resources or _resources_for_channel_db(channel)
    for resource in pool[:PICKS_PER_CHANNEL]:
        title = (resource.title or "").strip()
        if not title:
            continue
        items.append(_item(title, resource_href(base_path, resource.id, static_site=static_site)))
    if not items:
        label = i18n.channel(channel)["label"]
        items.append(_item(label, channel_href(base_path, channel, static_site=static_site)))
    return items


def build_wheel_picks(
    *,
    locale: str = "zh",
    base_path: str = "",
    static_site: bool = False,
    payload: Any | None = None,
) -> dict[str, Any]:
    i18n = get_i18n(locale)
    segments: list[dict[str, Any]] = []
    dramas = None
    if payload is not None:
        dramas = getattr(payload, "dramas", None) or []

    for ch in WHEEL_CHANNELS:
        resources = None
        if payload is not None and ch != "drama":
            resources = _resources_for_channel_payload(payload, ch)
        meta = i18n.channel(ch)
        segments.append(
            {
                "id": ch,
                "label": meta["label"],
                "hint": meta.get("hint", ""),
                "color": _segment_color(ch),
                "items": _pick_items(
                    locale=locale,
                    base_path=base_path,
                    static_site=static_site,
                    channel=ch,
                    resources=resources,
                    dramas=dramas,
                ),
            }
        )
    return {"locale": locale, "segments": segments}


def _segment_color(channel: str) -> str:
    return {
        "discover": "#7c3aed",
        "drama": "#e11d48",
        "media": "#0891b2",
        "other": "#64748b",
        "k12": "#059669",
        "ai_video": "#d97706",
    }.get(channel, "#7c3aed")


def live_wheel_picks(locale: str, base_path: str) -> dict[str, Any]:
    jupan_bridge.refresh_pan_cache()

    class _Payload:
        channels: dict = {}
        dramas = jupan_bridge.list_dramas(limit=PICKS_PER_CHANNEL * 3, offset=0)

    return build_wheel_picks(locale=locale, base_path=base_path, static_site=False, payload=_Payload())


def wheel_picks_json(picks: dict[str, Any]) -> str:
    return json.dumps(picks, ensure_ascii=False)
