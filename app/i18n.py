"""UI internationalization for 魔盘 (zh / en shell)."""

from __future__ import annotations

import json
from contextvars import ContextVar
from functools import lru_cache
from pathlib import Path
from typing import Any

from markupsafe import Markup

LOCALES = ("zh", "en")
DEFAULT_LOCALE = "zh"
LOCALE_DIR = Path(__file__).resolve().parent / "locales"

CHANNEL_IDS = ("discover", "drama", "media", "other", "k12", "ai_video", "classics")

_current: ContextVar["I18n | None"] = ContextVar("mopan_i18n", default=None)


@lru_cache(maxsize=8)
def _load_messages(locale: str) -> dict[str, Any]:
    path = LOCALE_DIR / f"{locale}.json"
    if not path.exists():
        path = LOCALE_DIR / f"{DEFAULT_LOCALE}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _lookup(node: Any, key: str) -> Any:
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


class I18n:
    def __init__(self, locale: str = DEFAULT_LOCALE) -> None:
        self.locale = locale if locale in LOCALES else DEFAULT_LOCALE
        self._messages = _load_messages(self.locale)

    def t(self, key: str, *, html: bool = False, **kwargs: Any) -> str | Markup:
        raw = _lookup(self._messages, key)
        if raw is None:
            return Markup(key) if html else key
        text = str(raw).format(**kwargs) if kwargs else str(raw)
        return Markup(text) if html else text

    @property
    def html_lang(self) -> str:
        return str(_lookup(self._messages, "meta.html_lang") or "zh-CN")

    @property
    def site_title(self) -> str:
        return str(_lookup(self._messages, "meta.site_title") or "魔盘")

    @property
    def site_slogan(self) -> str:
        return str(_lookup(self._messages, "meta.site_slogan") or "")

    @property
    def pan_label(self) -> str:
        return str(_lookup(self._messages, "meta.pan_label") or "夸克网盘")

    @property
    def locale_base_path(self) -> str:
        return "" if self.locale == DEFAULT_LOCALE else f"/{self.locale}"

    @property
    def asset_base_path(self) -> str:
        return ""

    def channels(self) -> list[dict[str, str]]:
        out: list[dict[str, str]] = []
        ch_map = _lookup(self._messages, "channels") or {}
        for cid in CHANNEL_IDS:
            meta = ch_map.get(cid) if isinstance(ch_map, dict) else None
            if isinstance(meta, dict):
                out.append({"id": cid, "label": str(meta.get("label") or cid), "hint": str(meta.get("hint") or "")})
            else:
                out.append({"id": cid, "label": cid, "hint": ""})
        return out

    def channel(self, channel_id: str) -> dict[str, str]:
        for ch in self.channels():
            if ch["id"] == channel_id:
                return ch
        return {"id": channel_id, "label": channel_id, "hint": ""}

    def category(self, name: str | None) -> str:
        if not name:
            return ""
        cats = _lookup(self._messages, "categories") or {}
        if isinstance(cats, dict) and name in cats:
            return str(cats[name])
        return name

    def classic_library(self, category: str | None) -> str:
        if not category:
            return ""
        root = category.split(" > ", 1)[0].strip()
        libs = _lookup(self._messages, "classic_libraries") or {}
        if isinstance(libs, dict) and root in libs:
            return str(libs[root])
        return root

    def classic_subtitle(self, category: str | None) -> str:
        if not category or " > " not in category:
            return ""
        return category.split(" > ", 1)[1].strip()

    def drama_tag(self, tag: str) -> str:
        tags = _lookup(self._messages, "drama_tags") or {}
        if isinstance(tags, dict) and tag in tags:
            return str(tags[tag])
        return tag

    def js_messages(self) -> dict[str, str]:
        js = _lookup(self._messages, "js") or {}
        return dict(js) if isinstance(js, dict) else {}

    def locale_switch_href(self, page_path: str) -> str:
        path = page_path if page_path.startswith("/") else f"/{page_path}"
        if self.locale == DEFAULT_LOCALE:
            return "/en" + (path if path != "/" else "/")
        if path.startswith("/en"):
            alt = path[3:] or "/"
            return alt if alt.startswith("/") else f"/{alt}"
        return path

    def hero(self, channel: str, *, tag: str = "", github_user: str = "") -> str | Markup:
        if channel == "drama":
            key = "hero.drama_foreign" if tag == "国外短剧" else "hero.drama_default" if tag else "hero.drama"
        else:
            key = f"hero.{channel}"
        return self.t(key, html=True, github_user=github_user)


def get_i18n(locale: str = DEFAULT_LOCALE) -> I18n:
    return I18n(locale)


def active_i18n() -> I18n:
    current = _current.get()
    return current if current is not None else get_i18n(DEFAULT_LOCALE)


def set_active_i18n(locale: str) -> I18n:
    i18n = get_i18n(locale)
    _current.set(i18n)
    return i18n


def category_label(name: str | None) -> str:
    return active_i18n().category(name)


def classic_library_label(category: str | None) -> str:
    return active_i18n().classic_library(category)


def classic_subtitle_label(category: str | None) -> str:
    return active_i18n().classic_subtitle(category)


def drama_tag_label(tag: str) -> str:
    return active_i18n().drama_tag(tag)
