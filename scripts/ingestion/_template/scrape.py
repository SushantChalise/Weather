#!/usr/bin/env python3
"""Stage 1 — Scrape: download raw data from the upstream source.

Writes raw files to ./raw/. Does not transform or validate;
validate.py will catch any format surprises.

Usage: python scrape.py [--start YYYY-MM-DD] [--end YYYY-MM-DD]
"""

import argparse
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw"


def scrape(start: str, end: str) -> None:
    RAW_DIR.mkdir(exist_ok=True)
    # TODO: implement download logic
    # Examples:
    #   requests.get(url) → RAW_DIR / filename
    #   boto3 S3 download
    #   FTP / SFTP retrieval
    raise NotImplementedError("Implement scrape() for this dataset")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2020-01-01")
    ap.add_argument("--end", default="2020-12-31")
    args = ap.parse_args()
    scrape(args.start, args.end)
    print("Scrape complete.")


if __name__ == "__main__":
    main()
