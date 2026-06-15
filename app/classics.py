"""Helpers for wenyuange classical resources."""

from __future__ import annotations


def parse_wenyuange_ref(source_ref: str | None) -> tuple[str, str] | None:
    if not source_ref:
        return None
    parts = source_ref.split("/", 2)
    if len(parts) != 3 or parts[0] != "wenyuange":
        return None
    return parts[1], parts[2]


def github_urls(
    source_ref: str | None,
    *,
    branch: str = "master",
    user: str = "wenyuange",
) -> dict[str, str] | None:
    parsed = parse_wenyuange_ref(source_ref)
    if not parsed:
        return None
    repo, rel = parsed
    base = f"https://github.com/{user}/{repo}"
    return {
        "blob": f"{base}/blob/{branch}/{rel}",
        "raw": f"https://raw.githubusercontent.com/{user}/{repo}/{branch}/{rel}",
        "repo": base,
        "repo_label": REPO_LABELS.get(repo, repo),
    }


CLASSIC_LIBRARY_ORDER = [
    "儒藏", "诗藏", "道藏", "佛藏", "子藏", "易藏", "集藏", "史藏", "医藏", "艺藏",
]


def library_label(category: str | None) -> str:
    if not category:
        return ""
    return category.split(" > ", 1)[0].strip()


def library_subtitle(category: str | None) -> str:
    if not category or " > " not in category:
        return ""
    return category.split(" > ", 1)[1].strip()


REPO_LABELS = {
    "ru": "儒藏",
    "poem": "诗藏",
    "dao": "道藏",
    "fo": "佛藏",
    "zi": "子藏",
    "yi": "易藏",
    "ji": "集藏",
    "history": "史藏",
    "medicine": "医藏",
    "art": "艺藏",
}
