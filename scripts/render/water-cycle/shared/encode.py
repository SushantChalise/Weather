"""Encode a frame sequence to AV1, H.264, and low-bitrate scrub master.

All output files must be < 24 MiB (Cloudflare Workers asset cap).

Usage:
    import encode
    encode.encode_chapter(
        frames_dir=Path("tmp/render/ch0"),
        output_dir=Path("public/water-cycle/ch0"),
        fps=30,
    )
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

# File size cap from WATER_CYCLE_SPEC.md §7
_MAX_MIB = 24.0


def _mib(path: Path) -> float:
    return path.stat().st_size / (1024 * 1024)


def _run(cmd: list[str], label: str) -> None:
    """Run an ffmpeg command, streaming stdout/stderr."""
    print(f"[encode] {label}")
    print(f"[encode] cmd: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[encode] STDERR:\n{result.stderr[-3000:]}", file=sys.stderr)
        raise RuntimeError(f"ffmpeg failed for {label}: exit {result.returncode}")


def _find_ffmpeg() -> str:
    """Return the ffmpeg executable path. Searches PATH and common Windows paths."""
    import shutil
    import glob as _glob
    # Try PATH first
    found = shutil.which("ffmpeg")
    if found:
        return found
    # Common Windows install locations (including WinGet)
    candidates = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\Users\ACER\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe",
        r"C:\Users\ACER\AppData\Roaming\Any Video Converter\com.anvsoft.avc\native\ffmpeg.exe",
    ]
    # Also search WinGet package directories
    winget_base = r"C:\Users\ACER\AppData\Local\Microsoft\WinGet\Packages"
    for pattern in [
        f"{winget_base}\\Gyan.FFmpeg*\\ffmpeg-*\\bin\\ffmpeg.exe",
        f"{winget_base}\\*ffmpeg*\\*\\bin\\ffmpeg.exe",
    ]:
        matches = _glob.glob(pattern)
        candidates.extend(matches)

    for c in candidates:
        if Path(c).exists():
            return c
    raise FileNotFoundError(
        "ffmpeg not found. Install via: winget install --id Gyan.FFmpeg\n"
        f"Searched: {candidates[:5]}"
    )


def encode_chapter(
    frames_dir: Path,
    output_dir: Path,
    fps: int = 30,
) -> dict[str, float]:
    """Encode all PNG frames in frames_dir to the four output formats.

    Output files (all written to output_dir):
    - cinematic.webm   AV1, ~1.5 Mbps, production resolution
    - cinematic.mp4    H.264, ~2 Mbps, Safari fallback
    - cinematic-scrub.webm  VP9, ~600 Kbps, 854x480, dense keyframes
    - poster.jpg       Last frame, JPEG quality 95, upscaled to 1920x1080

    Validates each output is < 24 MiB.

    Returns dict of {filename: size_mib}.
    """
    frames_dir = Path(frames_dir)
    output_dir = Path(output_dir)

    # Find frames
    frame_files = sorted(frames_dir.glob("*.png"))
    if not frame_files:
        raise FileNotFoundError(f"No PNG frames in {frames_dir}")

    print(f"[encode] Encoding {len(frame_files)} frames at {fps} fps")
    output_dir.mkdir(parents=True, exist_ok=True)

    ffmpeg = _find_ffmpeg()

    # Detect resolution from first frame
    # (we just pass the frame glob to ffmpeg; it handles the rest)
    input_pattern = str(frames_dir / "%04d.png")

    # ── AV1 (primary) ─────────────────────────────────────────────────────
    av1_out = output_dir / "cinematic.webm"
    _run([
        ffmpeg, "-y",
        "-framerate", str(fps),
        "-i", input_pattern,
        "-c:v", "libsvtav1",
        "-crf", "35",
        "-preset", "8",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(av1_out),
    ], "AV1 encode (cinematic.webm)")

    # ── H.264 (Safari fallback) ────────────────────────────────────────────
    mp4_out = output_dir / "cinematic.mp4"
    _run([
        ffmpeg, "-y",
        "-framerate", str(fps),
        "-i", input_pattern,
        "-c:v", "libx264",
        "-crf", "23",
        "-preset", "slow",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(mp4_out),
    ], "H.264 encode (cinematic.mp4)")

    # ── VP9 scrub master (dense keyframes, 480p) ───────────────────────────
    scrub_out = output_dir / "cinematic-scrub.webm"
    _run([
        ffmpeg, "-y",
        "-framerate", str(fps),
        "-i", input_pattern,
        "-vf", "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2",
        "-c:v", "libvpx-vp9",
        "-b:v", "600k",
        "-g", str(fps // 2),  # keyframe every 0.5s for smooth scrub
        "-quality", "good",
        "-speed", "4",
        "-pix_fmt", "yuv420p",
        str(scrub_out),
    ], "VP9 scrub master (cinematic-scrub.webm)")

    # ── Poster JPG (last frame) ────────────────────────────────────────────
    last_frame = str(frames_dir / f"{len(frame_files) - 1:04d}.png")
    poster_out = output_dir / "poster.jpg"
    _run([
        ffmpeg, "-y",
        "-i", last_frame,
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease",
        "-q:v", "2",
        str(poster_out),
    ], "Poster JPEG (poster.jpg)")

    # ── File size validation ───────────────────────────────────────────────
    sizes: dict[str, float] = {}
    violations: list[str] = []
    for path in [av1_out, mp4_out, scrub_out, poster_out]:
        mib = _mib(path)
        sizes[path.name] = mib
        print(f"[encode] {path.name}: {mib:.1f} MiB")
        if path.suffix != ".jpg" and mib > _MAX_MIB:
            violations.append(f"{path.name} is {mib:.1f} MiB (cap: {_MAX_MIB} MiB)")

    if violations:
        raise RuntimeError(
            f"File size cap exceeded (Cloudflare Workers {_MAX_MIB} MiB limit):\n"
            + "\n".join(violations)
        )

    print(f"[encode] All files within {_MAX_MIB} MiB cap. Done.")
    return sizes
