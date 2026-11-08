"""Read PNG silhouettes and write atlas rectangles; never modifies image pixels.
Requires Pillow only when replacing the generated art, not when running the game.
"""
from pathlib import Path
from collections import deque
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
frames = {}
for name in ('ben', 'four', 'heat', 'diamond'):
    im = Image.open(root / 'assets/characters' / (name + '-combat.png')).convert('RGBA')
    width, height = im.size
    alpha = im.getchannel('A').tobytes()
    seen = bytearray(width * height)
    components = []
    for start, a in enumerate(alpha):
        if a <= 160 or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        left = right = start % width
        top = bottom = start // width
        count = sx = sy = 0
        while queue:
            p = queue.popleft()
            x, y = p % width, p // width
            count += 1
            sx += x
            sy += y
            left, right = min(left, x), max(right, x)
            top, bottom = min(top, y), max(bottom, y)
            for n in (p - width, p + width, p - 1 if x else -1, p + 1 if x + 1 < width else -1):
                if 0 <= n < len(alpha) and not seen[n] and alpha[n] > 160:
                    seen[n] = 1
                    queue.append(n)
        if count > 1200:
            components.append((count, sx / count, sy / count, left, top, right, bottom))
    boxes = []
    for row in range(4):
        for col in range(8):
            candidates = [v for v in components if int(v[1] * 8 / width) == col and int(v[2] * 4 / height) == row]
            if not candidates:
                raise ValueError(f'{name}: no full silhouette at row {row} col {col}')
            comp = max(candidates)
            _, _, _, left, top, right, bottom = comp
            left, top = max(0, left - 4), max(0, top - 4)
            right, bottom = min(width - 1, right + 4), min(height - 1, bottom + 4)
            boxes.append([left, top, right - left + 1, bottom - top + 1])
    if len(components) != 32:
        raise ValueError(f'{name}: expected 32 complete bodies, found {len(components)}')
    frames[name + 'Combat'] = boxes
    print(name, '32 complete silhouettes registered')
(root / 'js/atlas-frames.js').write_text(
    '/* Explicit complete combat silhouettes, including poses that cross nominal grid lines.\n'
    '   Regenerate with scripts/register-combat-atlas.py when replacing combat art. */\n'
    'window.B10.atlasFrames = ' + json.dumps(frames, separators=(',', ':')) + ';\n'
)
