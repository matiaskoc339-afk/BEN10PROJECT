"""Bake a zero-face clip from the untouched logo, so local HTML never reads image pixels."""
from pathlib import Path
import hashlib,json
from PIL import Image

root=Path(__file__).resolve().parents[1]
source=root/'assets/ui/ben10-title.png'
image=Image.open(source).convert('RGBA')
w,h=image.size
pixels=image.load()
seen=set()
largest=[]
def white(x,y):
    r,g,b,a=pixels[x,y]
    return min(r,g,b)>225 and a>128
for y in range(int(h*.4),h):
    for x in range(int(w*.43),w):
        if (x,y) in seen or not white(x,y):continue
        group=[(x,y)]
        seen.add((x,y))
        for u,v in group:
            for c,d in ((u-1,v),(u+1,v),(u,v-1),(u,v+1)):
                if 0<=c<w and 0<=d<h and (c,d) not in seen and white(c,d):
                    seen.add((c,d))
                    group.append((c,d))
        if len(group)>len(largest):largest=group
assert len(largest)>w*h*.05,'No continuous white zero face found'
rows={}
for x,y in largest:rows.setdefault(y,[]).append(x)
runs=[]
for y,values in sorted(rows.items()):
    values.sort()
    start=prev=values[0]
    for x in values[1:]:
        if x!=prev+1:
            runs.append([start,y,prev-start+1])
            start=x
        prev=x
    runs.append([start,y,prev-start+1])
data={'width':w,'height':h,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'bounds':{'left':min(x for x,y in largest)*720/w,'right':max(x for x,y in largest)*720/w,'top':min(y for x,y in largest)*720/h,'bottom':max(y for x,y in largest)*720/h,'pixels':int(len(largest)*720*720/w/h)},'runs':runs}
(root/'systems/title-logo-mask.js').write_text('/* Exact white zero-face mask, baked from the untouched title art. No pixel reads at runtime: file:// works offline. */\nwindow.Ben10TitleMask='+json.dumps(data,separators=(',',':'))+';\n')
print(f'Baked zero-face clip: {len(runs)} runs, source {w}x{h}.')
