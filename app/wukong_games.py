"""Large Wukong browser games vendored under static/wukong/."""

from __future__ import annotations

from pathlib import Path

from app.config import STATIC_DIR

WUKONG_DIR = STATIC_DIR / "wukong"
WUKONG_SLUGS = ("civ", "life", "army")


def wukong_games_available() -> bool:
    return all((WUKONG_DIR / slug / "index.html").exists() for slug in WUKONG_SLUGS)
