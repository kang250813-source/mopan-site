"""Generate QR code data URLs for Quark share links."""

from __future__ import annotations

import base64
import io

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def quark_qr_data_url(url: str, *, box_size: int = 8) -> str:
    text = (url or "").strip()
    if not text:
        return ""
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=2,
    )
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1a1033", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
