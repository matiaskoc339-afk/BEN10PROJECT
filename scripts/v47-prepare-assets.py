#!/usr/bin/env python3
"""Prepare V47 images from the user's original Blitzwolfer Mundo ZIP.

The output consists only of local PNG assets: no network fetch is performed by
the game at runtime. The ZIP is fetched during the repository build.
"""
import io
import os
import sys
import zipfile
from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "desierto-blitz" / "assets"
STAMP_TO_OUTPUT = {
    # Village / wastes / cave panoramas, in walking order.
    "17_40_21": ("village-a.png", False),
    "17_40_26": ("village-b.png", False),
    "17_41_33": ("village-c.png", False),
    "17_41_42": ("wastes-a.png", False),
    "17_40_40": ("wastes-b.png", False),
    "17_40_30": ("wastes-c.png", False),
    "17_38_16": ("cavern-a.png", False),
    "17_37_10": ("cavern-b.png", False),
    "17_37_45": ("cavern-c.png", False),
    # Alfa portrait and six 6x6 frame atlases.
    "17_31_20": ("alpha-portrait.png", False),
    "17_32_18": ("alpha-walk.png", True),
    "17_32_51": ("alpha-claw.png", True),
    "17_33_05": ("alpha-charge.png", True),
    "17_33_18": ("alpha-dodge.png", True),
    "17_33_21": ("alpha-howl.png", True),
    "17_33_35": ("alpha-rage.png", True),
    # Physical, ranged, mixed robots, three strength tiers each.
    "17_39_48": ("robot-physical-weak.png", True),
    "17_40_07": ("robot-physical-mid.png", True),
    "17_40_11": ("robot-physical-strong.png", True),
    "17_40_47": ("robot-ranged-weak.png", True),
    "17_40_51": ("robot-ranged-mid.png", True),
    "17_40_54": ("robot-ranged-strong.png", True),
    "17_42_04": ("robot-mixed-weak.png", True),
    "17_42_08": ("robot-mixed-mid.png", True),
    "17_42_19": ("robot-mixed-strong.png", True),
    "17_34_44": ("worm.png", True),
}
EXTRAS = {
    "17_31_32": "alpha-portrait-alt.png",
    "17_32_03": "alpha-reference.png",
    "17_39_44": "robot-effects.png",
    "17_42_42": "robot-reference.png",
    "17_38_03": "desert-props.png",
}

def remove_matte(img: Image.Image) -> Image.Image:
    """Discard the near-uniform slate background, preserving opaque sprites."""
    rgba = np.array(img.convert("RGBA"))
    h, w = rgba.shape[:2]
    sample = np.array([rgba[0, 0, :3], rgba[0, w-1, :3], rgba[h-1, 0, :3], rgba[h-1, w-1, :3]], dtype=np.int16)
    bg = np.median(sample, axis=0)
    rgb = rgba[:, :, :3].astype(np.int16)
    distance = np.max(np.abs(rgb-bg),axis=2)
    # Sprite source has a uniform dark gray base. A conservative threshold
    # prevents clipping the wolf's dark hair and the robots' outlines.
    rgba[distance < 23, 3] = 0
    return Image.fromarray(rgba, "RGBA")

def main(archive: Path):
    if not archive.is_file():
        raise SystemExit(f"Missing source ZIP: {archive}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        pngs=[name for name in z.namelist() if name.lower().endswith(".png")]
        if len(pngs)<26:
            raise ValueError(f"Expected at least 26 source images; found {len(pngs)}")
        mapping={**STAMP_TO_OUTPUT,**{k:(v,False) for k,v in EXTRAS.items()}}
        for stamp,(filename,transparent) in mapping.items():
            matches=[name for name in pngs if stamp in name]
            if len(matches)!=1:
                raise ValueError(f"Image {stamp}: expected 1 match, found {len(matches)}: {matches}")
            with z.open(matches[0]) as stream:
                img=Image.open(io.BytesIO(stream.read()))
                img.load()
            if transparent:
                img=remove_matte(img)
            else:
                img=img.convert("RGB")
            img.save(OUTPUT/filename,format="PNG",optimize=True)
            print(f"V47 {filename}: {img.width}x{img.height}",flush=True)
    print("V47 sprites and landscapes ready. Gameplay will use only local URLs.")

if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("Usage: python scripts/v47-prepare-assets.py /tmp/blitwolfermundo.zip")
    main(Path(sys.argv[1]))
