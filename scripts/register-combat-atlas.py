"""Read PNG silhouettes and write atlas rectangles; never modifies image pixels.
Requires Pillow only when replacing the generated art, not when running the game.
"""
from pathlib import Path
from collections import deque
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
frames = {}
for name, kind, rows, cols in [(n, 'combat', 4, 8) for n in ('ben','four','heat','diamond')] + [(n, 'side', 2, 8) for n in ('ben','four','heat','diamond','knight')] + [('props', 'stage', 2, 4)]:
    im = Image.open(root / ('assets/stages/props.png' if kind == 'stage' else 'assets/characters/' + name + '-' + kind + '.png')).convert('RGBA')
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
    for row in range(rows):
        for col in range(cols):
            candidates = [v for v in components if int(v[1] * cols / width) == col and int(v[2] * rows / height) == row]
            if not candidates:
                raise ValueError(f'{name}: no full silhouette at row {row} col {col}')
            comp = max(candidates)
            _, _, _, left, top, right, bottom = comp
            left, top = max(0, left - 4), max(0, top - 4)
            right, bottom = min(width - 1, right + 4), min(height - 1, bottom + 4)
            boxes.append([left, top, right - left + 1, bottom - top + 1])
    if len(components) != rows * cols:
        raise ValueError(f'{name}: expected {rows * cols} complete bodies, found {len(components)}')
    frames['sideProps' if kind == 'stage' else name + ('Combat' if kind == 'combat' else 'Side')] = boxes
    print(name, kind, rows * cols, 'complete silhouettes registered')
(root / 'js/atlas-frames.js').write_text(
    '/* Explicit complete combat silhouettes, including poses that cross nominal grid lines.\n'
    '   Regenerate with scripts/register-combat-atlas.py when replacing combat art. */\n'
    'window.B10.atlasFrames = ' + json.dumps(frames, separators=(',', ':')) + ';\n'
)
