"""Site wheel picks — random excellent websites."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.config import BASE_DIR, BASE_PATH, DATA_DIR

PICKS_PATH = DATA_DIR / "site-picks.json"


def _read_json(path: Path, fallback: Any) -> Any:
    if not path.is_file():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback


def load_site_picks() -> dict[str, Any]:
    data = _read_json(PICKS_PATH, {"version": 1, "categories": []})
    if not isinstance(data, dict):
        return {"version": 1, "categories": []}
    data.setdefault("categories", [])
    return data


def _resolve_url(url: str, *, base_path: str = "") -> str:
    raw = (url or "").strip() or "#"
    if raw.startswith("/"):
        root = base_path.rstrip("/")
        return f"{root}{raw}" if root else raw
    return raw


def _site_item(site: dict[str, Any], *, base_path: str = "") -> dict[str, str]:
    title = str(site.get("title") or "").strip()
    return {
        "title": title,
        "url": _resolve_url(str(site.get("url") or ""), base_path=base_path),
        "hint": str(site.get("hint") or "").strip(),
    }


def build_site_wheel_picks(*, locale: str = "zh", base_path: str = "") -> dict[str, Any]:
    data = load_site_picks()
    segments: list[dict[str, Any]] = []
    en = locale == "en"
    bp = base_path or BASE_PATH

    for cat in data.get("categories") or []:
        if not isinstance(cat, dict):
            continue
        sites = [s for s in (cat.get("sites") or []) if isinstance(s, dict) and s.get("title")]
        if not sites:
            continue
        label = cat.get("label_en") if en and cat.get("label_en") else cat.get("label")
        segments.append(
            {
                "id": str(cat.get("id") or label or "site"),
                "label": str(label or "Sites"),
                "color": str(cat.get("color") or "#7c3aed"),
                "icon": str(cat.get("icon") or "🌐"),
                "items": [_site_item(site, base_path=bp) for site in sites],
            }
        )

    return {"locale": locale, "segments": segments}


def build_home_wheel_picks(*, locale: str = "zh", base_path: str = "") -> dict[str, Any]:
    """Flat site list + category segments for the homepage mini wheel."""
    wheel = build_site_wheel_picks(locale=locale, base_path=base_path)
    bp = base_path or BASE_PATH
    root = bp.rstrip("/")
    en = locale == "en"

    internal = [
        {
            "title": "Mopan Mini Games" if en else "魔盘小游戏",
            "url": f"{root}/game/" if root else "/game/",
            "hint": "Stack, wheels, party games" if en else "叠盘、转盘、聚会小游戏",
        },
        {
            "title": "Site Wheel" if en else "好站转盘",
            "url": f"{root}/game/site-wheel/" if root else "/game/site-wheel/",
            "hint": "Random quality sites" if en else "随机优质网站",
        },
        {
            "title": "Mopan Wheel" if en else "魔盘转盘",
            "url": f"{root}/game/wheel/" if root else "/game/wheel/",
            "hint": "Random channel pick" if en else "随机站内频道精选",
        },
        {
            "title": "Short Drama" if en else "短剧频道",
            "url": f"{root}/?channel=drama" if root else "/?channel=drama",
            "hint": "Quark drama index" if en else "夸克短剧索引",
        },
        {
            "title": "Classics" if en else "古典藏书",
            "url": f"{root}/?channel=classics" if root else "/?channel=classics",
            "hint": "Classical texts" if en else "经史子集摘录",
        },
    ]

    sites: list[dict[str, str]] = []
    seen: set[str] = set()
    for seg in wheel.get("segments") or []:
        for item in seg.get("items") or []:
            url = str(item.get("url") or "")
            if not url or url in seen:
                continue
            seen.add(url)
            sites.append(
                {
                    "title": str(item.get("title") or ""),
                    "url": url,
                    "hint": str(item.get("hint") or ""),
                    "category": str(seg.get("label") or ""),
                }
            )
    for item in internal:
        url = item["url"]
        if url in seen:
            continue
        seen.add(url)
        sites.append({**item, "category": "Mopan" if en else "魔盘"})

    return {"locale": locale, "segments": wheel.get("segments") or [], "sites": sites}


def home_wheel_json(picks: dict[str, Any]) -> str:
    return json.dumps(picks, ensure_ascii=False)


def site_wheel_json(picks: dict[str, Any]) -> str:
    return json.dumps(picks, ensure_ascii=False)


def picks_public_path() -> Path:
    return BASE_DIR / "static" / "site-picks.json"
