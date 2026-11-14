"""Prepare CC0 recordings at consistent levels; embed their Ogg bytes for offline playback."""
from pathlib import Path
import json,subprocess,hashlib,base64
import numpy as np
root=Path(__file__).resolve().parents[1]
folder=root/'assets/audio'
sources=json.loads((folder/'sources.json').read_text())
manifest={}
bank={}
for key,spec in sources.items():
    source=folder/spec['source']
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-f','f32le','-ar','32000','-ac','1','-af','highpass=f=45,lowpass=f=14000','pipe:1'])
    data=np.frombuffer(raw,dtype='<f4').copy()
    active=np.flatnonzero(np.abs(data)>.002)
    if len(active):data=data[max(0,int(active[0])-160):min(len(data),int(active[-1])+800)]
    data=data[:int(spec['maxSeconds']*32000)]
    if not len(data):raise ValueError(key+' is empty')
    rms=float(np.sqrt(np.mean(data*data)))
    data*=min(.14/max(rms,1e-6),.78/max(float(np.max(np.abs(data))),1e-6))
    fade=min(640,len(data)//5)
    data[:80]*=np.linspace(0,1,min(80,len(data)))
    data[-fade:]*=np.linspace(1,0,fade)
    target=folder/'samples'/f'{key}.ogg'
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','32000','-ac','1','-i','pipe:0','-c:a','libvorbis','-q:a','5',str(target)],input=data.astype('<f4').tobytes(),check=True)
    value=target.read_bytes()
    bank[key]=base64.b64encode(value).decode('ascii')
    manifest[key]={'file':str(target.relative_to(folder)),'source':spec['source'],'license':'CC0-1.0','duration':len(data)/32000,'rms':float(np.sqrt(np.mean(data*data))),'peak':float(np.max(np.abs(data))),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sha256':hashlib.sha256(value).hexdigest()}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'systems/audio-samples.js').write_text('/* Kenney CC0 recordings; embedded Ogg permits local/offline HTML playback. */\nwindow.BEN10_AUDIO_SAMPLES='+json.dumps(bank,separators=(',',':'))+';\n')
print(f'Prepared {len(bank)} recordings, {sum((folder/m["file"]).stat().st_size for m in manifest.values())} compressed bytes.')
