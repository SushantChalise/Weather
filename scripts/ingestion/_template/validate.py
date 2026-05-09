#!/usr/bin/env python3
"""Stage 2 — Validate: check raw files before any DB writes.

Runs four checks and exits non-zero if any fail so the pipeline aborts
before bad data reaches Postgres.

Usage: python validate.py
"""

import sys
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw"

EXPECTED_VARIABLES: list[str] = []
BBOX = (78.0, 23.0, 92.0, 32.5)  # Nepal bounding box (W, S, E, N)


def check_files_present() -> None:
    if not any(RAW_DIR.iterdir()):
        raise ValueError(f"No files in {RAW_DIR}. Run scrape.py first.")


def check_schema() -> None:
    # TODO: verify expected columns / keys exist in raw files
    pass


def check_spatial_bounds() -> None:
    # TODO: assert coordinates fall within BBOX
    pass


def check_missing_data_threshold(max_pct: float = 0.2) -> None:
    # TODO: assert missing-value fraction < max_pct
    pass


def main() -> None:
    errors: list[str] = []
    for check in (check_files_present, check_schema, check_spatial_bounds, check_missing_data_threshold):
        try:
            check()
        except Exception as exc:
            errors.append(f"{check.__name__}: {exc}")

    if errors:
        for e in errors:
            print(f"FAIL  {e}", file=sys.stderr)
        sys.exit(1)

    print("All validation checks passed.")


if __name__ == "__main__":
    main()
