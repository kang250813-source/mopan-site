#!/usr/bin/env python3
"""Copy three large Wukong games into mopan-site/static/wukong/."""

from __future__ import annotations

import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

TARGET = ROOT / "static" / "wukong"
GAMES = ("civ", "life", "army")
PACKS = ("common", "civ", "life", "army")
LOCALES = ("zh-CN", "en-US")


def source_root() -> Path:
    env = os.getenv("WUKONG_SOURCE", "").strip()
    if env:
        path = Path(env).expanduser()
        if path.is_dir():
            return path
    fallback = Path.home() / "wukong.lol"
    if fallback.is_dir():
        return fallback
    raise SystemExit("Wukong source not found. Set WUKONG_SOURCE or use ~/wukong.lol")


def patch_html(html: str) -> str:
    html = html.replace("../../assets/", "/static/wukong/assets/")
    html = re.sub(r'href="\.\./\.\./"', 'href="/game/"', html)
    return html


def patch_common_json(text: str) -> str:
    return (
        text.replace("← 返回大厅", "← 魔盘游戏大厅")
        .replace("← Back to Hub", "← Mopan games")
        .replace("← Back to hub", "← Mopan games")
    )


def sync() -> None:
    source = source_root()
    if TARGET.exists():
        shutil.rmtree(TARGET)
    (TARGET / "assets" / "i18n" / "locales").mkdir(parents=True)

    shutil.copy2(source / "assets" / "i18n" / "i18n.js", TARGET / "assets" / "i18n" / "i18n.js")
    js_src = source / "assets" / "js" / "leaderboard.js"
    if js_src.exists():
        (TARGET / "assets" / "js").mkdir(parents=True, exist_ok=True)
        shutil.copy2(js_src, TARGET / "assets" / "js" / "leaderboard.js")
    for locale in LOCALES:
        for pack in PACKS:
            src = source / "assets" / "i18n" / "locales" / locale / f"{pack}.json"
            if not src.exists():
                continue
            dst = TARGET / "assets" / "i18n" / "locales" / locale / f"{pack}.json"
            dst.parent.mkdir(parents=True, exist_ok=True)
            content = src.read_text(encoding="utf-8")
            if pack == "common":
                content = patch_common_json(content)
            dst.write_text(content, encoding="utf-8")

    for slug in GAMES:
        src_html = source / "games" / slug / "index.html"
        if not src_html.exists():
            raise SystemExit(f"Missing game: {src_html}")
        dst_dir = TARGET / slug
        dst_dir.mkdir(parents=True, exist_ok=True)
        (dst_dir / "index.html").write_text(patch_html(src_html.read_text(encoding="utf-8")), encoding="utf-8")

    print(f"Synced {len(GAMES)} Wukong games -> {TARGET}")


if __name__ == "__main__":
    sync()
