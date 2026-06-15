"""Highlight key terms in article HTML."""

from __future__ import annotations

import re

_TAG_SPLIT = re.compile(r"(<[^>]+>)")
_PAN_WORD = re.compile(r"网盘")


def highlight_pan_words(html: str | None) -> str:
    """Wrap standalone「网盘」in visible highlight marks (text nodes only)."""
    if not html:
        return ""
    parts: list[str] = []
    for chunk in _TAG_SPLIT.split(html):
        if not chunk:
            continue
        if chunk.startswith("<") and chunk.endswith(">"):
            parts.append(chunk)
        else:
            parts.append(
                _PAN_WORD.sub(
                    r'<mark class="mp-pan-hl">\g<0></mark>',
                    chunk,
                )
            )
    return "".join(parts)
