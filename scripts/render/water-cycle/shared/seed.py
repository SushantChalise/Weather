"""Fix all random seeds for reproducibility.

Usage:
    import seed
    script_hash = seed.lock_seeds(Path(__file__))
"""
from __future__ import annotations

import bpy
import random
import hashlib
from pathlib import Path


def lock_seeds(script_path: Path) -> str:
    """Compute sha256 of the calling script and use as seed.

    Seeds:
    - bpy.context.scene.cycles.seed
    - Python random module

    Returns the full hex digest (64 chars) for inclusion in provenance.json.
    """
    h = hashlib.sha256(script_path.read_bytes()).hexdigest()
    seed_int = int(h[:8], 16)
    random.seed(seed_int)
    # Blender Cycles seed must be an int ≤ 2^31-1
    bpy.context.scene.cycles.seed = seed_int & 0x7FFF_FFFF
    return h
