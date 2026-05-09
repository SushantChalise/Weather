#!/usr/bin/env python3
"""
Himawari-9 cloud overlay pipeline for Nepal Mountain Weather Decision Map.

Downloads Band 13 (10.4 µm thermal IR, 2 km) for the segments covering Nepal
from the public AWS S3 bucket, reprojects GEOS→EPSG:3857 via satpy + pyresample,
colourises by brightness temperature, generates XYZ PNG tiles z5-z8 covering
the Nepal bbox, and uploads tiles + manifest.json to Vercel Blob.

Run via GitHub Actions (.github/workflows/himawari.yml).

Dependencies (scripts/requirements-himawari.txt):
  boto3 botocore numpy Pillow requests satpy pyresample
"""

import json
import math
import os
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import boto3
import numpy as np
import requests
from PIL import Image

# ── configuration ─────────────────────────────────────────────────────────────

BUCKET    = "noaa-himawari9"
S3_PREFIX = "AHI-L1b-FLDK"
SATELLITE = "H09"

# Nepal bbox (with buffer) in geographic degrees
NEPAL_WEST, NEPAL_EAST   = 78.0, 92.0
NEPAL_SOUTH, NEPAL_NORTH = 23.0, 32.5

# Segments covering Nepal: full-disk has 10 horizontal strips (S01–S10).
# Approximate mapping: Nepal sits in segment rows 3–5.
NEPAL_SEGMENTS = [3, 4, 5]

# Nepal bounding box in EPSG:3857 Web Mercator (metres)
# Computed from the geographic bounds above
def _merc_x(lon):  return lon * 20037508.34 / 180
def _merc_y(lat):  return math.log(math.tan((90 + lat) * math.pi / 360)) * 6378137
MERC_WEST  = _merc_x(NEPAL_WEST)
MERC_EAST  = _merc_x(NEPAL_EAST)
MERC_SOUTH = _merc_y(NEPAL_SOUTH)
MERC_NORTH = _merc_y(NEPAL_NORTH)

# Output raster size (pixels) for the Nepal area
RASTER_WIDTH  = 1024
RASTER_HEIGHT = 512

# Tile config
MIN_ZOOM  = 5
MAX_ZOOM  = 8
TILE_SIZE = 256

# Cloud colourisation — brightness temperature thresholds in Kelvin
BT_CLEAR = 295   # above → transparent (warm surface, no cloud)
BT_DEEP  = 240   # below → fully opaque white (deep convective cloud)

# Vercel Blob REST API
BLOB_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
# Correct Vercel Blob REST API endpoint (from SDK source):
# PUT https://vercel.com/api/blob/?pathname={path}
BLOB_API   = "https://vercel.com/api/blob"


# ── S3 helpers ────────────────────────────────────────────────────────────────

def _s3():
    from botocore import UNSIGNED
    from botocore.config import Config
    return boto3.client("s3", region_name="us-east-1",
                        config=Config(signature_version=UNSIGNED))


def find_latest_slot(lookback_minutes: int = 90) -> datetime:
    s3 = _s3()
    now = datetime.now(timezone.utc)
    for delta in range(0, lookback_minutes, 10):
        t = now - timedelta(minutes=delta)
        t = t.replace(minute=(t.minute // 10) * 10, second=0, microsecond=0)
        prefix = (f"{S3_PREFIX}/{t.strftime('%Y/%m/%d/%H%M')}/"
                  f"HS_{SATELLITE}_{t.strftime('%Y%m%d_%H%M')}_B13_FLDK")
        resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, MaxKeys=1)
        if resp.get("KeyCount", 0) > 0:
            print(f"Latest slot: {t.strftime('%Y-%m-%dT%H:%M')} UTC")
            return t
    raise RuntimeError(f"No B13 data in last {lookback_minutes} min")


def download_segments(slot: datetime, out_dir: Path) -> list[Path]:
    """Download Band 13 bz2 files for Nepal segments and decompress them."""
    import bz2
    s3 = _s3()
    files = []
    ts = slot.strftime("%Y%m%d_%H%M")
    for seg in NEPAL_SEGMENTS:
        filename = f"HS_{SATELLITE}_{ts}_B13_FLDK_R20_S{seg:02d}10.DAT.bz2"
        key = f"{S3_PREFIX}/{slot.strftime('%Y/%m/%d/%H%M')}/{filename}"
        bz2_path = out_dir / filename
        dat_path = bz2_path.with_suffix("")
        print(f"  s3://{BUCKET}/{key}")
        s3.download_file(BUCKET, key, str(bz2_path))
        with bz2.open(bz2_path) as fin, open(dat_path, "wb") as fout:
            fout.write(fin.read())
        bz2_path.unlink()
        files.append(dat_path)
    return files


# ── satpy processing ──────────────────────────────────────────────────────────

def load_bt_nepal(seg_files: list[Path]) -> np.ndarray:
    """
    Use satpy to load AHI Band 13, reproject to the Nepal Web Mercator area,
    and return brightness temperature as a (RASTER_HEIGHT, RASTER_WIDTH) float array.
    """
    from satpy import Scene
    from pyresample import create_area_def

    # Define target area: Nepal in EPSG:3857
    nepal_area = create_area_def(
        "nepal_merc",
        {"proj": "merc", "datum": "WGS84"},
        width=RASTER_WIDTH,
        height=RASTER_HEIGHT,
        area_extent=[MERC_WEST, MERC_SOUTH, MERC_EAST, MERC_NORTH],
        units="m",
    )

    print("  loading AHI HSD via satpy …")
    scene = Scene(filenames=[str(f) for f in seg_files], reader="ahi_hsd")
    scene.load(["B13"])

    print("  reprojecting GEOS → Web Mercator …")
    local = scene.resample(nepal_area, resampler="nearest", radius_of_influence=5000)

    bt = local["B13"].values  # numpy array (H, W), brightness temperature in K
    print(f"  BT shape: {bt.shape}, range: {np.nanmin(bt):.1f}–{np.nanmax(bt):.1f} K")
    return bt.astype(np.float32)


# ── colourisation ─────────────────────────────────────────────────────────────

def bt_to_rgba(bt: np.ndarray) -> np.ndarray:
    """
    Map brightness temperature (K) → RGBA cloud overlay.
    Cold cloud tops → white / high opacity.
    Warm surface → fully transparent.
    """
    h, w = bt.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)

    # Normalise 0→1 from warm (clear) to cold (cloud)
    t = np.clip((BT_CLEAR - bt) / (BT_CLEAR - BT_DEEP), 0, 1)

    # Opacity 0→210 (don't go fully opaque — terrain shows through)
    alpha = (t * 210).astype(np.uint8)

    # Brightness 220→255 (thin cloud = light gray, deep cloud = white)
    brightness = (220 + t * 35).astype(np.uint8)

    valid = ~np.isnan(bt)
    rgba[valid, 0] = brightness[valid]
    rgba[valid, 1] = brightness[valid]
    rgba[valid, 2] = brightness[valid]
    rgba[valid, 3] = alpha[valid]

    return rgba


# ── XYZ tile generation ───────────────────────────────────────────────────────

def _tile_to_merc(tx: int, ty: int, zoom: int) -> tuple:
    """Convert tile (x, y, z) to (west, south, east, north) in Web Mercator metres."""
    n = 2 ** zoom
    # Tile edges in normalised [0,1] space
    x0 = tx / n;  x1 = (tx + 1) / n
    y0 = ty / n;  y1 = (ty + 1) / n
    # Convert to lon/lat
    lon_w = x0 * 360 - 180;  lon_e = x1 * 360 - 180
    lat_n = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y0))))
    lat_s = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y1))))
    # Convert to metres
    return _merc_x(lon_w), _merc_y(lat_s), _merc_x(lon_e), _merc_y(lat_n)


def generate_tiles(rgba: np.ndarray, out_dir: Path) -> list[tuple]:
    """
    Slice the (H, W, 4) RGBA array into 256×256 XYZ PNG tiles for z5–z8.
    Returns list of (z, x, y, Path).
    """
    written = []

    for zoom in range(MIN_ZOOM, MAX_ZOOM + 1):
        # Tile range covering Nepal bbox
        n = 2 ** zoom
        tx_min = int((NEPAL_WEST  + 180) / 360 * n)
        tx_max = int((NEPAL_EAST  + 180) / 360 * n)

        def _lat_to_ty(lat):
            return int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)

        ty_min = _lat_to_ty(NEPAL_NORTH)
        ty_max = _lat_to_ty(NEPAL_SOUTH)

        for tx in range(tx_min, tx_max + 1):
            for ty in range(ty_min, ty_max + 1):
                t_west, t_south, t_east, t_north = _tile_to_merc(tx, ty, zoom)

                # Map tile extent to raster pixel coordinates
                def _x_to_px(mx):
                    return (mx - MERC_WEST) / (MERC_EAST - MERC_WEST) * RASTER_WIDTH

                def _y_to_row(my):
                    return (1 - (my - MERC_SOUTH) / (MERC_NORTH - MERC_SOUTH)) * RASTER_HEIGHT

                r0 = max(0, int(_y_to_row(t_north)))
                r1 = min(RASTER_HEIGHT, int(math.ceil(_y_to_row(t_south))))
                c0 = max(0, int(_x_to_px(t_west)))
                c1 = min(RASTER_WIDTH, int(math.ceil(_x_to_px(t_east))))

                if r0 >= r1 or c0 >= c1:
                    continue

                crop = rgba[r0:r1, c0:c1]
                if crop[:, :, 3].max() == 0:
                    continue  # fully transparent — skip

                tile_img = Image.fromarray(
                    np.array(Image.fromarray(crop, "RGBA").resize(
                        (TILE_SIZE, TILE_SIZE), Image.BILINEAR
                    )),
                    "RGBA",
                )

                path = out_dir / str(zoom) / str(tx) / f"{ty}.png"
                path.parent.mkdir(parents=True, exist_ok=True)
                tile_img.save(path, "PNG", optimize=True)
                written.append((zoom, tx, ty, path))

        print(f"    zoom {zoom}: {sum(1 for t in written if t[0] == zoom)} tiles")

    return written


# ── Vercel Blob upload ────────────────────────────────────────────────────────

def _blob_store_id() -> str:
    """Extract store ID from token: vercel_blob_rw_{storeId}_{hash}"""
    parts = BLOB_TOKEN.split("_")
    return parts[3] if len(parts) > 3 else ""


def _blob_put(path: str, data: bytes, ctype: str) -> str:
    """
    Upload bytes to Vercel Blob REST API.
    Endpoint: PUT https://vercel.com/api/blob/?pathname={path}
    Discovered from @vercel/blob SDK source:
      - x-api-version: 12  (not 7)
      - x-api-blob-request-id: {storeId}:{ts}:{rand}  (API uses this for routing)
      - x-vercel-blob-access: public
      - x-add-random-suffix: 0
      - x-allow-overwrite: 1
    """
    import random
    store_id = _blob_store_id()
    request_id = f"{store_id}:{int(time.time() * 1000)}:{random.randrange(0, 2**32):08x}"

    resp = requests.put(
        f"{BLOB_API}/",
        params={"pathname": path},
        data=data,
        headers={
            "Authorization": f"Bearer {BLOB_TOKEN}",
            "Content-Type": ctype,
            "x-api-version": "12",
            "x-api-blob-request-id": request_id,
            "x-api-blob-request-attempt": "0",
            "x-vercel-blob-access": "public",
            "x-add-random-suffix": "0",
            "x-allow-overwrite": "1",
        },
        timeout=60,
    )
    if not resp.ok:
        print(f"  Blob PUT {path!r} → {resp.status_code}: {resp.text[:500]}")
        resp.raise_for_status()
    return resp.json()["url"]


def upload_all(tiles: list[tuple], slot: datetime) -> str:
    ts = slot.strftime("%Y%m%d%H%M%S")
    print(f"  uploading {len(tiles)} tiles …")
    base_url = None
    for z, x, y, path in tiles:
        blob_path = f"himawari/{ts}/{z}/{x}/{y}.png"
        with open(path, "rb") as f:
            url = _blob_put(blob_path, f.read(), "image/png")
        if base_url is None:
            base_url = url.rsplit(f"/{z}/{x}/{y}.png", 1)[0]

    processed_at = datetime.now(timezone.utc)
    manifest = {
        "satellite": "Himawari-9",
        "band": "B13 — 10.4 µm thermal IR",
        "capturedAt": slot.isoformat().replace("+00:00", "Z"),
        "processedAt": processed_at.isoformat().replace("+00:00", "Z"),
        "ageMinutes": int((processed_at - slot).total_seconds() / 60),
        "tileBaseUrl": base_url,
        "tileTemplate": "{z}/{x}/{y}.png",
        "minZoom": MIN_ZOOM,
        "maxZoom": MAX_ZOOM,
        "bbox": [NEPAL_WEST, NEPAL_SOUTH, NEPAL_EAST, NEPAL_NORTH],
    }
    _blob_put("himawari/manifest.json",
              json.dumps(manifest, indent=2).encode(),
              "application/json")
    print(f"  manifest.json uploaded — age {manifest['ageMinutes']} min")
    return base_url or ""


# ── entrypoint ────────────────────────────────────────────────────────────────

def main():
    if not BLOB_TOKEN:
        print("ERROR: BLOB_READ_WRITE_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    # Diagnostic: show token structure without revealing the actual value
    parts = BLOB_TOKEN.split("_")
    store_id = _blob_store_id()
    print(f"Token: {len(parts)} segments, lengths={[len(p) for p in parts]}")
    print(f"Inferred storeId (index 3): len={len(store_id)}, prefix={store_id[:4]}...")
    print(f"Token prefix: {BLOB_TOKEN[:20]}...")

    t0 = time.time()
    print("=== Himawari-9 B13 Pipeline ===")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)

        print("[1/5] Finding latest slot …")
        slot = find_latest_slot()

        print("[2/5] Downloading B13 segments for Nepal …")
        seg_files = download_segments(slot, tmp_path)

        print("[3/5] satpy load + reproject → Web Mercator …")
        bt = load_bt_nepal(seg_files)

        print("[4/5] Colourising + tiling …")
        rgba = bt_to_rgba(bt)
        tile_dir = tmp_path / "tiles"
        tiles = generate_tiles(rgba, tile_dir)
        print(f"  {len(tiles)} non-empty tiles")

        print("[5/5] Uploading to Vercel Blob …")
        upload_all(tiles, slot)

    print(f"=== Done in {time.time() - t0:.0f}s ===")


if __name__ == "__main__":
    main()
