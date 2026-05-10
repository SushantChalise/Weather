"""Load a GeoTIFF DEM and create a displaced mesh in the active scene.

If the GeoTIFF file is not available (e.g. download not yet complete) this
module falls back to a procedurally-generated low-poly HKH terrain so that
the pipeline can still produce a render.  The fallback is logged clearly and
recorded in provenance.
"""
from __future__ import annotations

import math
import struct
from pathlib import Path

import bpy
import bmesh
import numpy as np  # Blender ships numpy

# Coordinate scaling helpers (same as cameras.py)
_KM_PER_DEG_LAT = 111.0
_REF_LAT = 30.0
_KM_PER_DEG_LON = 111.0 * math.cos(math.radians(_REF_LAT))
_M_TO_BU = 1.0 / 1_000.0


def _read_geotiff_simple(path: Path) -> tuple[np.ndarray, tuple[float, float, float, float], tuple[int, int]]:
    """Read a GeoTIFF using the struct module (no rasterio).

    Returns (elevation_array, (west, south, east, north), (cols, rows)).
    Only handles single-band, 16-bit integer GeoTIFFs (SRTM standard).
    Falls back gracefully if the file format is unexpected.
    """
    data = path.read_bytes()

    # Minimal TIFF parsing — enough to extract the DEM raster
    # TIFF header: bytes 0-3 = byte order, 4-7 = offset to first IFD
    byte_order = data[:2]
    endian = "<" if byte_order == b"II" else ">"
    ifd_offset = struct.unpack_from(f"{endian}I", data, 4)[0]

    # Parse IFD entries to find image width, height, and tile/strip offsets
    entry_count = struct.unpack_from(f"{endian}H", data, ifd_offset)[0]
    tags: dict[int, object] = {}

    for i in range(entry_count):
        off = ifd_offset + 2 + i * 12
        tag = struct.unpack_from(f"{endian}H", data, off)[0]
        dtype = struct.unpack_from(f"{endian}H", data, off + 2)[0]
        count = struct.unpack_from(f"{endian}I", data, off + 4)[0]
        value_off = struct.unpack_from(f"{endian}I", data, off + 8)[0]
        if count == 1 and dtype in (3, 4):  # SHORT or LONG
            fmt = f"{endian}H" if dtype == 3 else f"{endian}I"
            value = struct.unpack_from(fmt, data, off + 8)[0]
        else:
            value = value_off
        tags[tag] = (dtype, count, value)

    # TIFF tag IDs
    _WIDTH = 256
    _HEIGHT = 257
    _STRIP_OFFSETS = 273
    _STRIP_BYTE_COUNTS = 279

    width = tags.get(_WIDTH, (None, None, 1024))[2]
    height = tags.get(_HEIGHT, (None, None, 1024))[2]

    # Simple strip read — works for SRTM GeoTIFFs
    strip_offs = tags.get(_STRIP_OFFSETS, (None, None, 0))[2]
    strip_bytes = tags.get(_STRIP_BYTE_COUNTS, (None, None, width * height * 2))[2]

    raw = data[strip_offs : strip_offs + int(strip_bytes)]
    elev = np.frombuffer(raw, dtype=f"{endian}i2").reshape(int(height), int(width)).astype(np.float32)

    # NODATA = -32768 in SRTM — replace with 0
    elev[elev < -1000] = 0.0

    # Approximate bbox (HKH defaults if GeoTIFF geo-metadata not parsed)
    bbox = (70.0, 26.0, 95.0, 36.0)  # (west, south, east, north)
    return elev, bbox, (int(width), int(height))


def _make_procedural_dem(
    bounds_lonlat: tuple[float, float, float, float],
    resolution: int = 64,
) -> np.ndarray:
    """Generate a stylised HKH terrain using procedural noise.

    Returns elevation array (resolution × resolution) in metres.
    The procedural terrain looks plausible from orbital altitude.
    """
    west, south, east, north = bounds_lonlat
    rows, cols = resolution, resolution

    # Create coordinate grids
    lons = np.linspace(west, east, cols)
    lats = np.linspace(north, south, rows)
    LON, LAT = np.meshgrid(lons, lats)

    # Simplified ridge model for HKH
    # Main Himalayan ridge: lat ~28–30N, running east-west
    ridge_dist = np.abs(LAT - 28.5) / 3.0
    ridge_height = 6000.0 * np.exp(-ridge_dist ** 2 * 4)

    # Karakoram ridge: lat ~36N, lon ~75E
    kk_dist = np.sqrt(((LON - 75.0) / 4.0) ** 2 + ((LAT - 36.0) / 2.0) ** 2)
    kk_height = 5500.0 * np.exp(-kk_dist ** 2 * 0.8)

    # Hindu Kush: lat ~34-36N, lon ~70-73E
    hk_dist = np.sqrt(((LON - 71.5) / 2.0) ** 2 + ((LAT - 35.0) / 1.5) ** 2)
    hk_height = 4800.0 * np.exp(-hk_dist ** 2 * 0.8)

    # Tibetan Plateau: north of Himalayas
    plateau_mask = LAT > 31.0
    plateau = np.where(plateau_mask, 4500.0 * (1 - (LAT - 31.0) / 8.0).clip(0, 1), 0.0)

    # Indo-Gangetic plain: south of Himalayas
    plain_mask = LAT < 27.0
    plain = np.where(plain_mask, 200.0, 0.0)

    # Random noise for texture (deterministic)
    rng = np.random.default_rng(42)
    noise = rng.normal(0, 80, (rows, cols)).astype(np.float32)

    elev = ridge_height + kk_height + hk_height + plateau + plain + noise
    elev = elev.clip(0, 8849)  # clip to Earth range
    return elev.astype(np.float32)


def load_dem_as_mesh(
    geotiff_path: Path,
    name: str,
    bounds_lonlat: tuple[float, float, float, float],
    resolution: int = 512,
    z_scale_m: float = 1.0,
) -> tuple[bpy.types.Object, bool]:
    """Load a GeoTIFF DEM and create a displaced mesh in the active scene.

    Returns (mesh_object, used_real_dem).
    used_real_dem=False means the procedural fallback was used.

    The mesh is positioned in Blender km-space:
      lon=X, lat=Y, alt=Z (1 BU = 1 km).

    Parameters
    ----------
    geotiff_path : path to the SRTM GeoTIFF
    name         : name for the created bpy Object
    bounds_lonlat: (west, south, east, north) in degrees
    resolution   : mesh resolution (default 512 × 512 quads)
    z_scale_m    : multiply elevation by this factor (use 1.0 for true scale)
    """
    west, south, east, north = bounds_lonlat
    used_real_dem = False

    # ── Load elevation data ────────────────────────────────────────────────
    if geotiff_path.exists() and geotiff_path.stat().st_size > 1_000_000:
        try:
            raw_elev, _, (raw_cols, raw_rows) = _read_geotiff_simple(geotiff_path)
            used_real_dem = True
            print(f"[dem] Loaded real DEM: {geotiff_path} ({raw_cols}×{raw_rows})")
        except Exception as exc:
            print(f"[dem] WARNING: failed to parse GeoTIFF ({exc}), using procedural fallback")
            raw_elev = _make_procedural_dem(bounds_lonlat, resolution)
    else:
        print(f"[dem] WARNING: {geotiff_path} not found or too small — using procedural terrain")
        raw_elev = _make_procedural_dem(bounds_lonlat, resolution)

    # ── Down-sample to render resolution ──────────────────────────────────
    if raw_elev.shape[0] != resolution or raw_elev.shape[1] != resolution:
        # Simple nearest-neighbour resampling via numpy index math
        row_idx = np.linspace(0, raw_elev.shape[0] - 1, resolution).astype(int)
        col_idx = np.linspace(0, raw_elev.shape[1] - 1, resolution).astype(int)
        elev = raw_elev[np.ix_(row_idx, col_idx)]
    else:
        elev = raw_elev

    # ── Build mesh ─────────────────────────────────────────────────────────
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    rows, cols = elev.shape
    verts: list[bmesh.types.BMVert] = []

    lon_step = (east - west) / (cols - 1)
    lat_step = (north - south) / (rows - 1)

    for r in range(rows):
        for c in range(cols):
            lon = west + c * lon_step
            lat = north - r * lat_step
            alt_m = float(elev[r, c]) * z_scale_m

            x = (lon - 83.0) * _KM_PER_DEG_LON
            y = (lat - 30.0) * _KM_PER_DEG_LAT
            z = alt_m * _M_TO_BU

            verts.append(bm.verts.new((x, y, z)))

    bm.verts.ensure_lookup_table()

    # Create quads
    for r in range(rows - 1):
        for c in range(cols - 1):
            v0 = verts[r * cols + c]
            v1 = verts[r * cols + c + 1]
            v2 = verts[(r + 1) * cols + c + 1]
            v3 = verts[(r + 1) * cols + c]
            try:
                bm.faces.new([v0, v1, v2, v3])
            except Exception:
                pass

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    return obj, used_real_dem
