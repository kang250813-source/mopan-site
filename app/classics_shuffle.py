"""Deterministic list shuffle helpers (classics hourly, drama daily)."""

from __future__ import annotations

import random
import time
from datetime import datetime, timedelta, timezone
from typing import TypeVar

T = TypeVar("T")

_BEIJING = timezone(timedelta(hours=8))


def hourly_shuffle_seed() -> int:
    return int(time.time()) // 3600


def daily_shuffle_seed() -> int:
    """Calendar day in Asia/Shanghai as YYYYMMDD."""
    return int(datetime.now(_BEIJING).strftime("%Y%m%d"))


def shuffle_sequence(items: list[T], seed: int) -> list[T]:
    out = list(items)
    random.Random(seed).shuffle(out)
    return out
