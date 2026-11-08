"""Read PNG silhouettes and write atlas rectangles; never modifies image pixels.
Requires Pillow only when replacing the generated art, not when running the game.
"""
from pathlib import Path
from collections import deque
import json
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
frames = {}
clips = {}
base_sheets = [(n, 'combat', 4, 8) for n in ('ben','four','heat','diamond')] + [(n, 'side', 2, 8) for n in ('ben','four','heat','diamond','knight')] + [('props', 'stage', 2, 4)]
extra_sheets = [(n, k, r, c) for n in ('ben','four','heat','diamond') for k,r,c in [('idle',2,4),('fight',4,6)]] + [('cast-act-a','acting',4,6),('cast-act-b','acting',6,6),('boss-act','acting',3,6)]
for name, kind, rows, cols in base_sheets + extra_sheets:
    file = root / ('assets/stages/props.png' if kind == 'stage' else 'assets/characters/' + (name if kind == 'acting' else name + '-' + kind) + '.png')
    if not file.exists():
        if "--available" in sys.argv: continue
        raise FileNotFoundError(file)
    im = Image.open(file).convert('RGBA')
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
        outline_rows = {}
        while queue:
            p = queue.popleft()
            x, y = p % width, p // width
            if kind == "acting":
                lo, hi = outline_rows.get(y, (x, x))
                outline_rows[y] = (min(lo, x), max(hi, x))
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
            components.append((count, sx / count, sy / count, left, top, right, bottom, outline_rows))
    boxes = []
    outlines = []
    for row in range(rows):
        for col in range(cols):
            candidates = [v for v in components if int(v[1] * cols / width) == col and int(v[2] * rows / height) == row]
            if not candidates:
                raise ValueError(f'{name}: no full silhouette at row {row} col {col}')
            comp = max(candidates, key=lambda v: v[0])
            _, _, _, left, top, right, bottom, silhouette_rows = comp
            padding = 6 if kind == "acting" else 4
            left, top = max(0, left - padding), max(0, top - padding)
            right, bottom = min(width - 1, right + padding), min(height - 1, bottom + padding)
            boxes.append([left, top, right - left + 1, bottom - top + 1])
            if kind == "acting":
                ys = sorted(silhouette_rows)
                points = [[silhouette_rows[y][0] - left - 3, y - top] for y in ys]
                points += [[silhouette_rows[y][1] - left + 3, y - top] for y in reversed(ys)]
                points[0][1] -= 3
                points[len(ys) - 1][1] += 3
                points[len(ys)][1] += 3
                points[-1][1] -= 3
                # Compress collinear outline vertices. This is metadata for a Canvas clip,
                # not a rewritten or resampled image. It excludes adjacent poses only.
                simple = []
                for point in points:
                    while len(simple) > 1:
                        a, b = simple[-2:]
                        if (b[0]-a[0])*(point[1]-b[1]) != (b[1]-a[1])*(point[0]-b[0]): break
                        simple.pop()
                    simple.append(point)
                outlines.append(simple)
    if kind in ('combat','side','stage') and len(components) != rows * cols:
        raise ValueError(f'{name}: expected {rows * cols} complete bodies, found {len(components)}')
    key = {'cast-act-a':'castActA','cast-act-b':'castActB','boss-act':'bossAct'}.get(name) or ('sideProps' if kind == 'stage' else name + kind.capitalize())
    frames[key] = boxes
    if outlines: clips[key] = outlines
    print(name, kind, rows * cols, 'complete silhouettes registered')
(root / 'js/atlas-frames.js').write_text(
    '/* Explicit complete combat silhouettes, including poses that cross nominal grid lines.\n'
    '   Regenerate with scripts/register-combat-atlas.py when replacing combat art. */\n'
    'window.B10.atlasFrames = ' + json.dumps(frames, separators=(',', ':')) + ';\n'
    + '// prettier-ignore\nwindow.B10.atlasClips = ' + json.dumps(clips, separators=(',', ':')) + ';\n'
)
