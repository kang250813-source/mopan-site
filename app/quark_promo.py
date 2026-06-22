"""Configurable Quark Drive promotion landing (任推邦-compliant)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from app.config import DATA_DIR

PROMO_PATH = Path(
    __import__("os").environ.get("QUARK_PROMO_CONFIG", str(DATA_DIR / "quark_promo.json"))
).expanduser()


@dataclass
class QuarkPromoBundle:
    title: str
    description: str
    command: str
    url: str


@dataclass
class QuarkPromoConfig:
    enabled: bool
    primary: QuarkPromoBundle
    bundles: list[QuarkPromoBundle] = field(default_factory=list)
    featured_resource_ids: list[int] = field(default_factory=list)
    drama_overrides: dict[int, QuarkPromoBundle] = field(default_factory=dict)

    @property
    def active(self) -> bool:
        if not self.enabled:
            return False
        primary = self.primary
        return bool((primary.command or "").strip() or (primary.url or "").strip())


def drama_promo_override(drama_id: int) -> QuarkPromoBundle | None:
    cfg = load_quark_promo()
    if not cfg:
        return None
    return cfg.drama_overrides.get(int(drama_id))


def apply_drama_override(drama) -> tuple[object, QuarkPromoBundle | None]:
    """Return (drama, optional promo bundle with command) for templates."""
    from dataclasses import replace

    from app.jupan_bridge import JupanDrama, normalize_pan_url

    override = drama_promo_override(drama.id)
    if not override:
        return drama, None
    if override.url:
        drama = replace(drama, pan_url=normalize_pan_url(override.url), pan_source="main")
    return drama, override


def _bundle(raw: dict | None) -> QuarkPromoBundle:
    data = raw or {}
    return QuarkPromoBundle(
        title=str(data.get("title") or "").strip(),
        description=str(data.get("description") or "").strip(),
        command=str(data.get("command") or "").strip(),
        url=str(data.get("url") or "").strip(),
    )


def load_quark_promo() -> QuarkPromoConfig | None:
    if not PROMO_PATH.is_file():
        return None
    try:
        data = json.loads(PROMO_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    bundles = [_bundle(item) for item in data.get("bundles") or [] if isinstance(item, dict)]
    bundles = [b for b in bundles if b.command or b.url]
    ids: list[int] = []
    for raw_id in data.get("featured_resource_ids") or []:
        try:
            ids.append(int(raw_id))
        except (TypeError, ValueError):
            continue
    drama_overrides: dict[int, QuarkPromoBundle] = {}
    for key, raw in (data.get("drama_overrides") or {}).items():
        if not isinstance(raw, dict):
            continue
        try:
            drama_id = int(key)
        except (TypeError, ValueError):
            continue
        bundle = _bundle(raw)
        if bundle.command or bundle.url:
            drama_overrides[drama_id] = bundle
    return QuarkPromoConfig(
        enabled=bool(data.get("enabled")),
        primary=_bundle(data.get("primary")),
        bundles=bundles,
        featured_resource_ids=ids,
        drama_overrides=drama_overrides,
    )


def promo_href(base_path: str) -> str:
    base = (base_path or "").rstrip("/")
    return f"{base}/promo/quark/" if base else "/promo/quark/"


def is_promo_active() -> bool:
    cfg = load_quark_promo()
    return bool(cfg and cfg.active)
