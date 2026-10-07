"""Make the WebP versions the site's <img srcset> attributes point to.

For every images/gallery/NAME.jpg this writes, next to it:
  NAME-480.webp   (phone tiles, two-up grids)
  NAME-800.webp   (full-width on phones)
  NAME.webp       (original width, desktop)

Run after adding or replacing a photo:   python tools/make_webp.py
Needs Pillow (pip install pillow). Then give the new <img> a srcset like the
existing ones (see index.html), e.g.
  srcset="images/gallery/NAME-480.webp 480w, images/gallery/NAME-800.webp 800w,
          images/gallery/NAME.webp <original width>w"
"""
import glob
import os

from PIL import Image, ImageOps

QUALITY = 78
HERE = os.path.dirname(os.path.abspath(__file__))
GALLERY = os.path.join(HERE, "..", "images", "gallery")

for path in sorted(glob.glob(os.path.join(GALLERY, "*.jpg"))):
    base = path[:-4]
    image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    width, height = image.size
    for target, suffix in ((480, "-480"), (800, "-800"), (width, "")):
        out = image if target >= width else image.resize(
            (target, round(height * target / width)), Image.LANCZOS)
        out.save(f"{base}{suffix}.webp", "WEBP", quality=QUALITY, method=6)
    print(f"{os.path.basename(path)}: {width}px wide -> 480 / 800 / {width} WebP")
