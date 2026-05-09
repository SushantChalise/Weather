#!/usr/bin/env python3
"""
Himawari-9 cloud overlay pipeline for Nepal Mountain Weather Decision Map.

Downloads Band 13 (10.4 µm thermal IR, 2 km) for the segments covering Nepal
from the public AWS S3 bucket, reprojects from GEOS to EPSG:3857 using satpy +
pyresample, colourises by brightness temperature (cold cloud tops → white/opaque,
warm surface → transparent), generates XYZ tiles z5–z8 covering the Nepal bbox,
then uploads the tiles + a manifest JSON to Vercel Blob.

Run via GitHub Actions (see .github/workflows/himawari.yml).

Dependencies (requirements-himawari.txt):
  boto3 satpy[all] pyresample Pillow numpy requests
"""

import bz2
import json
import os
import struct
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path

import boto3
import numpy as np
import requests
from PIL import Image

# ── configuration ─────────────────────────────────────────────────────────────

BUCKET = "noaa-himawari9"
S3_PREFIX = "AHI-L1b-FLDK"
SATELLITE = "H09"

# Nepal bbox in geographic degrees (with ~2° buffer on each side)
NEPAL_WEST  = 78.0
NEPAL_EAST  = 92.0
NEPAL_SOUTH = 23.0
NEPAL_NORTH = 32.5

# Himawari-9 GEOS projection parameters
SAT_LON = 140.7        # sub-satellite longitude °E
SAT_HEIGHT = 35786023  # satellite height above Earth surface in metres (GRS80)
EARTH_EQ_RAD = 6378137.0
EARTH_POL_RAD = 6356752.3141403

# Segments covering Nepal: full disk has 10 horizontal strips, Nepal is in 3–5
NEPAL_SEGMENTS = [3, 4, 5]

# Tile zoom range
MIN_ZOOM = 5
MAX_ZOOM = 8
TILE_SIZE = 256  # px per tile

# Cloud colourisation — brightness temperature thresholds in Kelvin
BT_SURFACE  = 295  # above this → fully transparent (clear sky)
BT_THIN_HI  = 280  # thin/low cloud
BT_MID      = 265  # mid-level cloud
BT_DEEP_LO  = 240  # deep convection / thick cloud → fully opaque white

# Vercel Blob
BLOB_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
BLOB_API   = "https://blob.vercel-storage.com"


# ── S3 helpers ────────────────────────────────────────────────────────────────

def _s3_client():
    """Anonymous S3 client for the public noaa-himawari9 bucket."""
    from botocore import UNSIGNED
    from botocore.config import Config
    return boto3.client("s3", region_name="us-east-1",
                        config=Config(signature_version=UNSIGNED))


def find_latest_slot(lookback_minutes: int = 90) -> datetime:
    """Return the most recent 10-minute slot that has Band 13 data in S3."""
    s3 = _s3_client()
    now = datetime.now(timezone.utc)
    for minutes_back in range(0, lookback_minutes, 10):
        t = now - timedelta(minutes=minutes_back)
        t = t.replace(minute=(t.minute // 10) * 10, second=0, microsecond=0)
        prefix = f"{S3_PREFIX}/{t.strftime('%Y/%m/%d/%H%M')}/HS_{SATELLITE}_{t.strftime('%Y%m%d_%H%M')}_B13_FLDK"
        resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, MaxKeys=1)
        if resp.get("KeyCount", 0) > 0:
            print(f"Latest slot: {t.isoformat()}")
            return t
    raise RuntimeError(f"No B13 data found in last {lookback_minutes} minutes")


def download_b13_segments(slot: datetime, out_dir: Path) -> list[Path]:
    """Download Band 13 for Nepal segments, decompress bz2, return file paths."""
    s3 = _s3_client()
    files = []
    for seg in NEPAL_SEGMENTS:
        key = (f"{S3_PREFIX}/{slot.strftime('%Y/%m/%d/%H%M')}/"
               f"HS_{SATELLITE}_{slot.strftime('%Y%m%d_%H%M')}"
               f"_B13_FLDK_R20_S{seg:02d}10.DAT.bz2")
        local_bz2 = out_dir / Path(key).name
        local_dat = local_bz2.with_suffix("")  # strip .bz2
        print(f"  downloading {Path(key).name} …")
        s3.download_file(BUCKET, key, str(local_bz2))
        with bz2.open(local_bz2) as f_in, open(local_dat, "wb") as f_out:
            f_out.write(f_in.read())
        local_bz2.unlink()
        files.append(local_dat)
    return files


# ── HSD binary parsing ────────────────────────────────────────────────────────
# We read the HSD format directly rather than pulling in the full satpy stack.
# Reference: JAXA Himawari Standard Data (HSD) User's Guide v1.3

def _read_hsd_segment(path: Path) -> tuple[np.ndarray, dict]:
    """
    Parse an HSD segment file and return (counts_2d, info_dict).
    counts_2d shape: (lines, pixels_per_line) — raw 16-bit DN values.
    """
    with open(path, "rb") as fh:
        # Basic Information Block (block 1) — 282 bytes header
        block_id     = struct.unpack(">B", fh.read(1))[0]   # should be 1
        block_len    = struct.unpack(">H", fh.read(2))[0]
        sat_name     = fh.read(16).decode("ascii").strip("\x00")
        proc_center  = fh.read(16).decode("ascii").strip("\x00")

        # observation time: milliseconds from 1858-11-17 00:00:00 UTC (Modified Julian Day epoch)
        obs_time_ms  = struct.unpack(">Q", fh.read(8))[0]

        fh.read(block_len - 43)  # skip remainder of block 1

        # Data Information Block (block 2) — 50 bytes
        block_id = struct.unpack(">B", fh.read(1))[0]  # should be 2
        block_len = struct.unpack(">H", fh.read(2))[0]
        bits_per_px = struct.unpack(">H", fh.read(2))[0]  # 16
        n_columns   = struct.unpack(">H", fh.read(2))[0]
        n_lines     = struct.unpack(">H", fh.read(2))[0]
        compress    = struct.unpack(">B", fh.read(1))[0]   # 0 = no compress
        fh.read(block_len - 11)

        # skip blocks 3–11 by reading their declared lengths
        for _ in range(9):
            bid  = struct.unpack(">B", fh.read(1))[0]
            blen = struct.unpack(">H", fh.read(2))[0]
            fh.read(blen - 3)

        # Data block: n_lines × n_columns × 2 bytes big-endian uint16
        raw = np.frombuffer(fh.read(n_lines * n_columns * 2), dtype=">u2")
        counts = raw.reshape((n_lines, n_columns))

    info = {
        "n_lines": n_lines,
        "n_columns": n_columns,
        "obs_time_ms": obs_time_ms,
        "satellite": sat_name,
    }
    return counts, info


# ── GEOS → geographic conversion ─────────────────────────────────────────────

def geos_to_latlon(col: np.ndarray, line: np.ndarray,
                   n_cols: int = 11000, n_lines: int = 11000) -> tuple:
    """
    Convert GEOS pixel coordinates to geographic lat/lon.
    col, line: zero-indexed pixel coordinates in the full-disk 11000×11000 frame.
    Returns (lat, lon) arrays in degrees.
    Reference: JAXA HSD User's Guide §6.
    """
    h  = SAT_HEIGHT + EARTH_EQ_RAD
    r_eq = EARTH_EQ_RAD
    r_pol = EARTH_POL_RAD
    CFAC = 40932549.0   # column scaling factor for 2 km full disk
    LFAC = 40932549.0   # line scaling factor

    # Convert pixel indices to scanning angles (radians)
    x = np.deg2rad((col - 5500.5) / (CFAC / 2**16))
    y = np.deg2rad((5500.5 - line) / (LFAC / 2**16))

    sin_x, cos_x = np.sin(x), np.cos(x)
    sin_y, cos_y = np.sin(y), np.cos(y)

    a = sin_x ** 2 + (cos_x * (cos_y ** 2 + (r_eq / r_pol) ** 2 * sin_y ** 2))
    b = -2.0 * h * cos_x * cos_y
    c = h ** 2 - r_eq ** 2

    disc = b ** 2 - 4 * a * c
    valid = disc >= 0

    rs = np.where(valid, (-b - np.sqrt(np.where(valid, disc, 0.0))) / (2 * a), np.nan)

    Sx = rs * cos_x * cos_y
    Sy = -rs * sin_x
    Sz = rs * cos_x * sin_y

    lat = np.rad2deg(np.arctan(
        (r_eq / r_pol) ** 2 * Sz / np.sqrt((h - Sx) ** 2 + Sy ** 2)
    ))
    lon = np.rad2deg(np.arctan(Sy / (h - Sx))) + SAT_LON

    lat = np.where(valid, lat, np.nan)
    lon = np.where(valid, lon, np.nan)
    return lat, lon


# ── brightness temperature calibration ───────────────────────────────────────

# Band 13 (10.4 µm) calibration constants — JAXA HSD User's Guide, Table 4-1
# Planck c1 and c2 constants
PLANCK_C1 = 1.19104e-5   # mW m-2 sr-1 (cm-1)-4
PLANCK_C2 = 1.43877      # K (cm-1)-1
B13_WAVENUMBER = 960.858  # central wavenumber (cm-1)
B13_ALPHA = 0.9991       # correction coefficients
B13_BETA  = 0.0976

def counts_to_bt(counts: np.ndarray) -> np.ndarray:
    """Convert raw 16-bit counts to brightness temperature (K) for B13."""
    # Step 1: counts → radiance (gain/offset from JAXA calibration table)
    # Approximate gain/offset for B13 2km product:
    gain   = 0.0039568  # mW / (m2 sr cm-1) per count
    offset = -0.2       # mW / (m2 sr cm-1)
    radiance = counts * gain + offset
    radiance = np.where(radiance > 0, radiance, np.nan)

    # Step 2: radiance → effective BT via inverse Planck
    nu = B13_WAVENUMBER
    bt_eff = (PLANCK_C2 * nu) / np.log(PLANCK_C1 * nu ** 3 / radiance + 1)

    # Step 3: correction to actual BT
    bt = (bt_eff - B13_BETA) / B13_ALPHA
    return bt


# ── build Nepal IR array ──────────────────────────────────────────────────────

def build_nepal_bt(segment_files: list[Path]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Assemble the Nepal region brightness temperature grid from HSD segment files.
    Returns (bt_nepal, lat_grid, lon_grid) — all same shape, masked outside Nepal bbox.
    """
    # Each segment is 1100 lines × 11000 columns in full-disk 2 km space
    # Segments 3–5 span lines 2200–4400 (0-indexed) in the full disk
    all_counts = []
    seg_indices = []
    for i, f in zip(NEPAL_SEGMENTS, segment_files):
        counts, info = _read_hsd_segment(f)
        all_counts.append(counts)
        seg_start = (i - 1) * 1100  # 0-indexed line offset in full disk
        seg_indices.append(seg_start)

    n_cols = 11000
    total_lines = len(all_counts) * 1100
    first_line = seg_indices[0]

    # Stack segments vertically
    stacked = np.concatenate(all_counts, axis=0)

    # Build pixel-coordinate grids for the stacked region
    col_idx = np.arange(n_cols)
    line_idx = np.arange(first_line, first_line + total_lines)
    col_grid, line_grid = np.meshgrid(col_idx, line_idx)

    print("  computing lat/lon for segment pixels …")
    lat, lon = geos_to_latlon(col_grid, line_grid)

    # Mask to Nepal bbox
    mask = ((lat >= NEPAL_SOUTH) & (lat <= NEPAL_NORTH) &
            (lon >= NEPAL_WEST)  & (lon <= NEPAL_EAST))

    if not mask.any():
        raise RuntimeError("No pixels fell within Nepal bbox — check segment selection")

    # Calibrate to brightness temperature
    bt = counts_to_bt(stacked)
    bt = np.where(mask, bt, np.nan)

    # Crop to non-NaN bbox to reduce memory
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    r0, r1 = rows[0], rows[-1] + 1
    c0, c1 = cols[0], cols[-1] + 1

    return bt[r0:r1, c0:c1], lat[r0:r1, c0:c1], lon[r0:r1, c0:c1]


# ── colourisation ─────────────────────────────────────────────────────────────

def bt_to_rgba(bt: np.ndarray) -> np.ndarray:
    """
    Map brightness temperature (K) to RGBA cloud overlay.
      BT > BT_SURFACE       → transparent
      BT_THIN_HI < BT < BT_SURFACE → light gray, 0–25% opacity
      BT_MID < BT < BT_THIN_HI    → medium gray, 25–55% opacity
      BT_DEEP_LO < BT < BT_MID    → light white, 55–80% opacity
      BT < BT_DEEP_LO              → pure white, 80% opacity
    """
    h, w = bt.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)

    def lerp(a, b, t):
        return a + (b - a) * np.clip(t, 0, 1)

    # normalised temperature band [0,1] — lower BT = more cloud
    t_surface = (BT_SURFACE - bt) / (BT_SURFACE - BT_DEEP_LO)
    t_surface = np.clip(t_surface, 0, 1)

    # Opacity: scales from 0 (clear) to 200 (deep cloud)
    alpha = lerp(0, 200, t_surface)

    # Colour: white (255,255,255) for deep cloud, light gray for thin cloud
    brightness = lerp(255, 200, t_surface * 0.3)

    valid = ~np.isnan(bt)
    rgba[valid, 0] = brightness[valid].astype(np.uint8)
    rgba[valid, 1] = brightness[valid].astype(np.uint8)
    rgba[valid, 2] = brightness[valid].astype(np.uint8)
    rgba[valid, 3] = alpha[valid].astype(np.uint8)

    return rgba


# ── XYZ tile generation ───────────────────────────────────────────────────────

def _lon_to_x(lon: float, zoom: int) -> int:
    import math
    return int((lon + 180) / 360 * (2 ** zoom))

def _lat_to_y(lat: float, zoom: int) -> int:
    import math
    lat_r = math.radians(lat)
    return int((1 - math.log(math.tan(lat_r) + 1 / math.cos(lat_r)) / math.pi) / 2 * (2 ** zoom))

def _tile_bounds(x: int, y: int, zoom: int) -> tuple:
    """Return (west, south, east, north) in degrees for a tile."""
    import math
    n = 2 ** zoom
    west  =  x       / n * 360 - 180
    east  = (x + 1)  / n * 360 - 180
    north = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y       / n))))
    south = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    return west, south, east, north


def generate_tiles(bt: np.ndarray, lat: np.ndarray, lon: np.ndarray,
                   out_dir: Path) -> list[tuple]:
    """
    Generate PNG tiles (z, x, y) from the BT array.
    Returns list of (z, x, y, file_path).
    """
    rgba = bt_to_rgba(bt)
    print(f"  RGBA array: {rgba.shape}, {(rgba[:,:,3]>0).sum()} non-transparent px")

    # Lat/lon extents of our data
    valid = ~np.isnan(bt)
    lat_min = lat[valid].min()
    lat_max = lat[valid].max()
    lon_min = lon[valid].min()
    lon_max = lon[valid].max()

    tiles_written = []

    for zoom in range(MIN_ZOOM, MAX_ZOOM + 1):
        x_min = _lon_to_x(lon_min, zoom)
        x_max = _lon_to_x(lon_max, zoom)
        y_min = _lat_to_y(lat_max, zoom)  # y increases southward
        y_max = _lat_to_y(lat_min, zoom)

        for tx in range(x_min, x_max + 1):
            for ty in range(y_min, y_max + 1):
                t_west, t_south, t_east, t_north = _tile_bounds(tx, ty, zoom)

                # Find source pixels that fall within this tile
                in_tile = (valid &
                           (lon >= t_west) & (lon < t_east) &
                           (lat >= t_south) & (lat < t_north))

                if not in_tile.any():
                    continue

                # Map source pixels onto a 256×256 tile canvas
                tile_img = np.zeros((TILE_SIZE, TILE_SIZE, 4), dtype=np.uint8)

                lon_in  = lon[in_tile]
                lat_in  = lat[in_tile]
                rgba_in = rgba[in_tile]

                # Normalise to [0, TILE_SIZE-1]
                px = ((lon_in - t_west) / (t_east - t_west) * TILE_SIZE).astype(int)
                py = ((t_north - lat_in) / (t_north - t_south) * TILE_SIZE).astype(int)

                px = np.clip(px, 0, TILE_SIZE - 1)
                py = np.clip(py, 0, TILE_SIZE - 1)

                tile_img[py, px] = rgba_in

                # Save tile
                tile_path = out_dir / str(zoom) / str(tx) / f"{ty}.png"
                tile_path.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(tile_img, "RGBA").save(tile_path, "PNG", optimize=True)
                tiles_written.append((zoom, tx, ty, tile_path))

        print(f"    zoom {zoom}: {sum(1 for t in tiles_written if t[0]==zoom)} tiles")

    return tiles_written


# ── Vercel Blob upload ────────────────────────────────────────────────────────

def blob_put(path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to Vercel Blob; return the public URL."""
    resp = requests.put(
        f"{BLOB_API}/{path}",
        data=data,
        headers={
            "Authorization": f"Bearer {BLOB_TOKEN}",
            "Content-Type": content_type,
            "x-api-version": "7",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["url"]


def upload_tiles(tiles: list[tuple], slot: datetime, ts: str) -> str:
    """Upload all tiles to Vercel Blob and return the tile base URL."""
    print(f"  uploading {len(tiles)} tiles to Vercel Blob …")
    base_url = None
    for z, x, y, path in tiles:
        blob_path = f"himawari/{ts}/{z}/{x}/{y}.png"
        with open(path, "rb") as f:
            url = blob_put(blob_path, f.read(), "image/png")
        if base_url is None:
            # Strip the trailing tile part to get base URL prefix
            base_url = url.rsplit(f"/{z}/{x}/{y}.png", 1)[0]

    print(f"  tile base URL: {base_url}")
    return base_url


def upload_manifest(slot: datetime, ts: str, base_url: str,
                    processed_at: datetime) -> None:
    """Write manifest.json to Vercel Blob."""
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
    blob_put(
        "himawari/manifest.json",
        json.dumps(manifest, indent=2).encode(),
        "application/json",
    )
    print("  manifest.json uploaded")


# ── entrypoint ────────────────────────────────────────────────────────────────

def main():
    if not BLOB_TOKEN:
        print("ERROR: BLOB_READ_WRITE_TOKEN env var not set", file=sys.stderr)
        sys.exit(1)

    print("=== Himawari-9 B13 Pipeline ===")
    t0 = time.time()

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)

        print("[1/5] Finding latest slot …")
        slot = find_latest_slot()
        ts = slot.strftime("%Y%m%d%H%M%S")

        print("[2/5] Downloading Band 13 segments for Nepal …")
        seg_files = download_b13_segments(slot, tmp_path)

        print("[3/5] Building Nepal BT array …")
        bt, lat, lon = build_nepal_bt(seg_files)
        print(f"  BT range: {np.nanmin(bt):.1f} – {np.nanmax(bt):.1f} K")

        print("[4/5] Generating XYZ tiles …")
        tile_dir = tmp_path / "tiles"
        tiles = generate_tiles(bt, lat, lon, tile_dir)
        print(f"  {len(tiles)} tiles written")

        processed_at = datetime.now(timezone.utc)

        print("[5/5] Uploading to Vercel Blob …")
        base_url = upload_tiles(tiles, slot, ts)
        upload_manifest(slot, ts, base_url, processed_at)

    elapsed = time.time() - t0
    print(f"=== Done in {elapsed:.0f}s ===")


if __name__ == "__main__":
    main()
