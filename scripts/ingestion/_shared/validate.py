"""Shared validation helpers for ingestion scripts."""

import sys
from pathlib import Path
from typing import Callable

NEPAL_BBOX = (78.0, 23.0, 92.0, 32.5)  # W, S, E, N


def run_checks(checks: list[Callable]) -> None:
    """Run each check function. Print failures and exit non-zero if any fail."""
    errors: list[str] = []
    for check in checks:
        try:
            check()
        except Exception as exc:
            errors.append(f"{check.__name__}: {exc}")
    if errors:
        for e in errors:
            print(f"FAIL  {e}", file=sys.stderr)
        sys.exit(1)
    print("All validation checks passed.")


def assert_files_present(raw_dir: Path) -> None:
    if not raw_dir.exists() or not any(raw_dir.iterdir()):
        raise ValueError(f"No files in {raw_dir}. Run scrape.py first.")


def assert_missing_below(values: list[float | None], max_pct: float = 0.2) -> None:
    if not values:
        return
    missing = sum(1 for v in values if v is None)
    pct = missing / len(values)
    if pct > max_pct:
        raise ValueError(f"Missing data {pct:.1%} exceeds threshold {max_pct:.1%}")


def assert_in_bbox(lons: list[float], lats: list[float], bbox=NEPAL_BBOX) -> None:
    w, s, e, n = bbox
    out = [(lon, lat) for lon, lat in zip(lons, lats) if not (w <= lon <= e and s <= lat <= n)]
    if out:
        raise ValueError(f"{len(out)} point(s) outside bbox {bbox}: first={out[0]}")
