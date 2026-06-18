"""Hourly shuffle helpers for the classics channel."""

from __future__ import annotations

import random
import time
from typing import TypeVar

T = TypeVar("T")


def hourly_shuffle_seed() -> int:
    return int(time.time()) // 3600


def shuffle_sequence(items: list[T], seed: int) -> list[T]:
    out = list(items)
    random.Random(seed).shuffle(out)
    return out
