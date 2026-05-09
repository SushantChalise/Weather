#!/usr/bin/env python3
"""
Himawari-9 cloud overlay pipeline — science half.

Downloads Band 13 (10.4 µm thermal IR, 2 km) for the Nepal-covering segments
from the public AWS S3 bucket, reprojects GEOS→EPSG:3857 via satpy + pyresample,
colourises by brightness temperature, generates XYZ PNG tiles z5-z8.

Output: ./himawari-output/{timestamp}/ tiles + ./himawari-output/meta.json
The upload step (Node.js / @vercel/blob) reads meta.json and pushes everything.

Run via GitHub Actions (.github/workflows/himawari.yml).
"""

import json
import math
import os
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
import shutil

import boto3
import numpy as np
from PIL import Image

# ── configuration ─────────────────────────────────────────────────────────────

BUCKET    = "noaa-himawari9"
S3_PREFIX = "AHI-L1b-FLDK"
SATELLITE = "H09"

NEPAL_WEST, NEPAL_EAST   = 78.0, 92.0
NEPAL_SOUTH, NEPAL_NORTH = 23.0, 32.5
NEPAL_SEGMENTS = [3, 4, 5]

def _mx(lon): return lon * 20037508.34 / 180
def _my(lat): return math.log(math.tan((90 + lat) * math.pi / 360)) * 6378137

MERC_WEST, MERC_EAST   = _mx(NEPAL_WEST),  _mx(NEPAL_EAST)
MERC_SOUTH, MERC_NORTH = _my(NEPAL_SOUTH), _my(NEPAL_NORTH)

RASTER_WIDTH, RASTER_HEIGHT = 1024, 512
MIN_ZOOM, MAX_ZOOM = 5, 8
TILE_SIZE = 256
BT_CLEAR, BT_DEEP = 295, 240

OUTPUT_DIR = Path("./himawari-output")


# ── S3 ────────────────────────────────────────────────────────────────────────

def _s3():
    from botocore import UNSIGNED
    from botocore.config import Config
    return boto3.client("s3", region_name="us-east-1",
                        config=Config(signature_version=UNSIGNED))


def find_latest_slot(lookback: int = 90) -> datetime:
    s3 = _s3()
    now = datetime.now(timezone.utc)
    for delta in range(0, lookback, 10):
        t = (now - timedelta(minutes=delta))
        t = t.replace(minute=(t.minute // 10) * 10, second=0, microsecond=0)
        prefix = (f"{S3_PREFIX}/{t.strftime('%Y/%m/%d/%H%M')}/"
                  f"HS_{SATELLITE}_{t.strftime('%Y%m%d_%H%M')}_B13_FLDK")
        if s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, MaxKeys=1).get("KeyCount", 0) > 0:
            print(f"Latest slot: {t.strftime('%Y-%m-%dT%H:%M')} UTC")
            return t
    raise RuntimeError(f"No B13 data in last {lookback} min")


def download_segments(slot: datetime, out_dir: Path) -> list[Path]:
    import bz2
    s3 = _s3()
    files = []
    ts = slot.strftime("%Y%m%d_%H%M")
    for seg in NEPAL_SEGMENTS:
        fname = f"HS_{SATELLITE}_{ts}_B13_FLDK_R20_S{seg:02d}10.DAT.bz2"
        key   = f"{S3_PREFIX}/{slot.strftime('%Y/%m/%d/%H%M')}/{fname}"
        bz2p  = out_dir / fname
        datp  = bz2p.with_suffix("")
        print(f"  {fname}")
        s3.download_file(BUCKET, key, str(bz2p))
        with bz2.open(bz2p) as fi, open(datp, "wb") as fo:
            fo.write(fi.read())
        bz2p.unlink()
        files.append(datp)
    return files


# ── satpy ─────────────────────────────────────────────────────────────────────

def load_bt_nepal(seg_files: list[Path]) -> np.ndarray:
    from satpy import Scene
    from pyresample import create_area_def

    nepal_area = create_area_def(
        "nepal_merc",
        {"proj": "merc", "datum": "WGS84"},
        width=RASTER_WIDTH, height=RASTER_HEIGHT,
        area_extent=[MERC_WEST, MERC_SOUTH, MERC_EAST, MERC_NORTH],
        units="m",
    )
    print("  loading AHI HSD via satpy …")
    scene = Scene(filenames=[str(f) for f in seg_files], reader="ahi_hsd")
    scene.load(["B13"])
    print("  reprojecting GEOS → Web Mercator …")
    local = scene.resample(nepal_area, resampler="nearest", radius_of_influence=5000)
    bt = local["B13"].values.astype(np.float32)
    print(f"  BT shape {bt.shape}  range {np.nanmin(bt):.1f}–{np.nanmax(bt):.1f} K")
    return bt


# ── colourisation ─────────────────────────────────────────────────────────────

def bt_to_rgba(bt: np.ndarray) -> np.ndarray:
    h, w = bt.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    t = np.clip((BT_CLEAR - bt) / (BT_CLEAR - BT_DEEP), 0, 1)
    valid = ~np.isnan(bt)
    rgba[valid, 0] = (220 + t[valid] * 35).astype(np.uint8)
    rgba[valid, 1] = (220 + t[valid] * 35).astype(np.uint8)
    rgba[valid, 2] = (220 + t[valid] * 35).astype(np.uint8)
    rgba[valid, 3] = (t[valid] * 210).astype(np.uint8)
    return rgba


# ── tiling ────────────────────────────────────────────────────────────────────

def _tile_merc(tx, ty, zoom):
    n = 2 ** zoom
    lon_w = tx / n * 360 - 180;  lon_e = (tx + 1) / n * 360 - 180
    lat_n = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * ty / n))))
    lat_s = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (ty + 1) / n))))
    return _mx(lon_w), _my(lat_s), _mx(lon_e), _my(lat_n)


def generate_tiles(rgba: np.ndarray, out_dir: Path) -> int:
    count = 0
    for zoom in range(MIN_ZOOM, MAX_ZOOM + 1):
        n = 2 ** zoom
        tx_min = int((NEPAL_WEST  + 180) / 360 * n)
        tx_max = int((NEPAL_EAST  + 180) / 360 * n)
        def _ty(lat):
            return int((1 - math.log(math.tan(math.radians(lat)) +
                        1/math.cos(math.radians(lat))) / math.pi) / 2 * n)
        ty_min = _ty(NEPAL_NORTH);  ty_max = _ty(NEPAL_SOUTH)
        zoom_count = 0
        for tx in range(tx_min, tx_max + 1):
            for ty in range(ty_min, ty_max + 1):
                tw, ts, te, tn = _tile_merc(tx, ty, zoom)
                def px(mx): return (mx - MERC_WEST) / (MERC_EAST - MERC_WEST) * RASTER_WIDTH
                def row(my): return (1-(my - MERC_SOUTH)/(MERC_NORTH - MERC_SOUTH)) * RASTER_HEIGHT
                r0 = max(0, int(row(tn)));  r1 = min(RASTER_HEIGHT, int(math.ceil(row(ts))))
                c0 = max(0, int(px(tw)));   c1 = min(RASTER_WIDTH,  int(math.ceil(px(te))))
                if r0 >= r1 or c0 >= c1: continue
                crop = rgba[r0:r1, c0:c1]
                if crop[:, :, 3].max() == 0: continue
                tile = Image.fromarray(
                    np.array(Image.fromarray(crop, "RGBA").resize(
                        (TILE_SIZE, TILE_SIZE), Image.BILINEAR)), "RGBA")
                path = out_dir / str(zoom) / str(tx) / f"{ty}.png"
                path.parent.mkdir(parents=True, exist_ok=True)
                tile.save(path, "PNG", optimize=True)
                zoom_count += 1
        count += zoom_count
        print(f"    zoom {zoom}: {zoom_count} tiles")
    return count


# ── entrypoint ────────────────────────────────────────────────────────────────

def main():
    t0 = time.time()
    print("=== Himawari-9 B13 Pipeline (science half) ===")

    # Clean output dir
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)

        print("[1/4] Finding latest slot …")
        slot = find_latest_slot()
        ts = slot.strftime("%Y%m%d%H%M%S")

        print("[2/4] Downloading B13 segments …")
        seg_files = download_segments(slot, tmp_path)

        print("[3/4] satpy load + reproject …")
        bt = load_bt_nepal(seg_files)

        print("[4/4] Colourising + tiling …")
        rgba = bt_to_rgba(bt)
        tile_dir = OUTPUT_DIR / ts
        n_tiles = generate_tiles(rgba, tile_dir)
        print(f"  {n_tiles} tiles written to {tile_dir}")

    processed_at = datetime.now(timezone.utc)
    meta = {
        "satellite": "Himawari-9",
        "band": "B13 — 10.4 µm thermal IR",
        "capturedAt": slot.isoformat().replace("+00:00", "Z"),
        "processedAt": processed_at.isoformat().replace("+00:00", "Z"),
        "ageMinutes": int((processed_at - slot).total_seconds() / 60),
        "timestamp": ts,
        "tileTemplate": "{z}/{x}/{y}.png",
        "minZoom": MIN_ZOOM,
        "maxZoom": MAX_ZOOM,
        "bbox": [NEPAL_WEST, NEPAL_SOUTH, NEPAL_EAST, NEPAL_NORTH],
        "tileDir": str(tile_dir),
    }
    (OUTPUT_DIR / "meta.json").write_text(json.dumps(meta, indent=2))
    print(f"=== Science done in {time.time() - t0:.0f}s — {n_tiles} tiles ready ===")


if __name__ == "__main__":
    main()
