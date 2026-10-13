#!/usr/bin/env python3
from PIL import Image, ImageFilter
import os

BLACK_SRC = '/Users/macbookpro/.cursor/projects/Users-macbookpro-Desktop-site-new/assets/2353-52e37194-4272-49e4-97cf-285ac2bc5eb1.png'
TARGET_W, TARGET_H = 300, 100

OUTPUTS = [
    ('/Users/macbookpro/Desktop/site_new/lumera-black.png', False),
    ('/Users/macbookpro/Desktop/site_new/lumera-white.png', True),
    ('/Users/macbookpro/Desktop/site_new/theme_export_lumera/assets/lumera-logo.png', False),
    ('/Users/macbookpro/Desktop/site_new/theme_export_lumera/assets/lumera-logo-white.png', True),
]


def build_alpha(img):
    gray = img.convert('L')
    # Invert: dark ink -> bright mask
    inv = ImageOps.invert(gray)
    inv = inv.point(lambda p: 0 if p < 18 else min(255, int((p - 18) * 1.6)))
    inv = inv.filter(ImageFilter.GaussianBlur(radius=0.4))
    inv = inv.point(lambda p: 0 if p < 12 else min(255, p))
    return inv


def render(alpha, white=False):
    bbox = alpha.getbbox()
    if not bbox:
        raise RuntimeError('empty alpha')
    alpha = alpha.crop(bbox)
    iw, ih = alpha.size
    scale = min(TARGET_W / iw, TARGET_H / ih)
    nw, nh = max(1, round(iw * scale)), max(1, round(ih * scale))
    alpha = alpha.resize((nw, nh), Image.LANCZOS)
    rgb = (255, 255, 255) if white else (0, 0, 0)
    layer = Image.new('RGBA', (nw, nh), rgb + (0,))
    layer.putalpha(alpha)
    canvas = Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))
    canvas.paste(layer, ((TARGET_W - nw) // 2, (TARGET_H - nh) // 2), layer)
    return canvas


if __name__ == '__main__':
    from PIL import ImageOps
    src = Image.open(BLACK_SRC)
    alpha = build_alpha(src)
    log = []
    for path, white in OUTPUTS:
        img = render(alpha, white=white)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img.save(path, 'PNG', optimize=True)
        # count opaque pixels in bottom half (tagline area)
        px = img.load()
        bottom = sum(1 for y in range(55, 100) for x in range(300) if px[x, y][3] > 30)
        log.append(f'{path} bottom_opaque={bottom} size={os.path.getsize(path)}')
    open('/Users/macbookpro/Desktop/site_new/logo_process.log', 'w').write('\n'.join(log))
