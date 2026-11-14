/* Offline-safe Web Audio mixer. Recorded materials + shaped synthesis, with bounded voices. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./audio-design.js'):root.Ben10SoundDesign);if(typeof module==='object'&&module.exports)module.exports=api;else{root.Ben10AudioEngine=api;let storage;try{storage=root.localStorage}catch{}root.Ben10Audio=new api.Engine({samples:root.BEN10_AUDIO_SAMPLES,storage})}})(typeof globalThis==='undefined'?this:globalThis,function(Design){
 'use strict';
 const SETTINGS_KEY='ben10.audio.settings.v1',MAX_VOICES=14,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function settings(raw){try{const v=JSON.parse(raw||'null');return {volume:Number.isFinite(v?.volume)?clamp(v.volume,0,1):.7,muted:v?.muted===true}}catch{return {volume:.7,muted:false}}}
 class Engine{
  constructor({samples={},storage,random=Math.random}={}){this.samples=samples||{};this.storage=storage;this.random=random;let raw;try{raw=storage?.getItem(SETTINGS_KEY)}catch{}this.settings=settings(raw);this.context=null;this.buffers=new Map();this.groups=new Set();this.loops=new Map();this.last=new Map();this.events=[];this.gameActive=false;this.visible=true;this.phase=-1;this.serial=0;this.decodeErrors=[];this.supported=true;this.ready=Promise.resolve();this.onSettings=()=>{}}
  async unlock(){if(!this.supported)return false;try{if(!this.context){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C){this.supported=false;return false}this.attach(new C({latencyHint:'interactive'}))}if(this.context.state==='suspended')await this.context.resume();return this.context.state==='running'}catch{this.supported=false;return false}}
  attach(context){if(this.context)return this.ready;this.context=context;const c=context;this.buses={};this.compressor=c.createDynamicsCompressor();Object.assign(this.compressor.threshold,{value:-12});this.compressor.knee.value=12;this.compressor.ratio.value=5;this.compressor.attack.value=.003;this.compressor.release.value=.15;
   const shaper=c.createWaveShaper(),curve=new Float32Array(2048);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=Math.tanh(x*1.4)/1.4}shaper.curve=curve;shaper.oversample='2x';this.output=c.createGain();this.output.gain.value=this.settings.muted||!this.visible?0:this.settings.volume;this.compressor.connect(shaper);shaper.connect(this.output);this.output.connect(c.destination);
   for(const category of ['ui','action','impact','ground','loop']){const gain=c.createGain();gain.gain.value=category==='ui'||this.gameActive?1:0;gain.connect(this.compressor);this.buses[category]=gain}
   this.reverb=c.createConvolver();const impulse=c.createBuffer(2,Math.ceil(c.sampleRate*.19),c.sampleRate);for(let ch=0;ch<2;ch++){const a=impulse.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]=(this.random()*2-1)*Math.pow(1-i/a.length,3.5)*.17}this.reverb.buffer=impulse;this.room=c.createGain();this.room.gain.value=[.035,.095,.065][this.phase]||.035;this.reverb.connect(this.room);this.room.connect(this.buses.action);
   this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const noise=this.noise.getChannelData(0);let pink=0;for(let i=0;i<noise.length;i++){pink=.89*pink+.11*(this.random()*2-1);noise[i]=pink*2.8}for(let i=0;i<300;i++){const fade=i/300;noise[i]*=fade;noise[noise.length-1-i]*=fade}
   this.ready=Promise.all(Object.entries(this.samples).map(async([id,base64])=>{try{const binary=typeof atob==='function'?atob(base64):Buffer.from(base64,'base64').toString('binary'),bytes=Uint8Array.from(binary,v=>v.charCodeAt(0));const buffer=await c.decodeAudioData(bytes.buffer);this.buffers.set(id,buffer)}catch(e){this.decodeErrors.push(id)}}));return this.ready;
  }
  _record(value){this.events.push(value);if(this.events.length>240)this.events.shift()}
  setSettings(patch){if(Number.isFinite(patch.volume))this.settings.volume=clamp(patch.volume,0,1);if(typeof patch.muted==='boolean')this.settings.muted=patch.muted;try{this.storage?.setItem(SETTINGS_KEY,JSON.stringify(this.settings))}catch{}this._volume();if(this.settings.muted)this.stopAll();this.onSettings({...this.settings});}
  _volume(){if(this.output){const a=this.output.gain,t=this.context.currentTime;a.cancelScheduledValues(t);a.setTargetAtTime(this.settings.muted||!this.visible?0:this.settings.volume,t,.015)}}
  setVisible(visible){this.visible=!!visible;this._volume();if(!visible)this.stopAll()}
  setGameActive(active){active=!!active;if(active===this.gameActive)return;this.gameActive=active;const t=this.context?.currentTime||0;if(this.buses)for(const [name,bus]of Object.entries(this.buses))if(name!=='ui')bus.gain.setTargetAtTime(active?1:0,t,.025);if(!active)this.stopGame()}
  setRoom(phase){if(this.phase===phase)return;this.phase=phase;if(this.room)this.room.gain.setTargetAtTime([.035,.095,.065][phase]||.035,this.context.currentTime,.2)}
  prune(now=this.context?.currentTime||0){for(const g of this.groups)if(g.endsAt<=now)this.groups.delete(g)}
  _stop(g,fade=.025){if(!g||g.stopped)return;g.stopped=true;const t=this.context.currentTime;g.gain.gain.cancelScheduledValues(t);g.gain.gain.setTargetAtTime(0,t,Math.max(.003,fade/3));for(const source of g.sources)try{source.stop(t+fade)}catch{}g.endsAt=t+fade;this.groups.delete(g);for(const [key,value]of this.loops)if(value===g)this.loops.delete(key)}
  stopAll(){for(const g of [...this.groups])this._stop(g);this.loops.clear();this.last.clear()}
  stopGame(){for(const g of [...this.groups])if(g.category!=='ui')this._stop(g);this.loops.clear()}
  stopLoop(key){const group=this.loops.get(key);if(group){this._stop(group,.09);this._record({type:'loop-stop',key,time:this.context.currentTime})}}
  keepLoop(key,cue,options={}){if(this.loops.has(key))return this.loops.get(key);const group=this.play(cue,{...options,loop:true,key:'loop:'+key});if(group)this.loops.set(key,group);return group}
  play(name,options={}){
   const recipe=Design.cues[name],c=this.context;if(!recipe||!c||this.settings.muted||!this.visible||(!this.gameActive&&recipe.category!=='ui')||(c.state==='suspended'&&typeof c.startRendering!=='function')||c.state==='closed')return false;
   const now=Number.isFinite(options.when)?Math.max(c.currentTime,options.when):c.currentTime,key=options.key||name;this.prune(now);const last=this.last.get(key)??-Infinity;if(now-last<(options.interval??recipe.interval))return false;
   if(this.groups.size>=MAX_VOICES){const weakest=[...this.groups].sort((a,b)=>a.priority-b.priority||a.start-b.start)[0];if(weakest.priority>=(options.priority??recipe.priority))return false;this._stop(weakest)}
   this.last.set(key,now);if(this.last.size>300)this.last.delete(this.last.keys().next().value);
   const gain=c.createGain(),pan=c.createStereoPanner();gain.gain.value=clamp(options.gain??1,0,1.2);pan.pan.value=clamp(options.pan||0,-.8,.8);gain.connect(pan);pan.connect(this.buses[recipe.category]);if(['action','impact'].includes(recipe.category))pan.connect(this.reverb);
   const g={id:++this.serial,name,category:recipe.category,priority:options.priority??recipe.priority,start:now,endsAt:now,loop:!!options.loop,gain,pan,sources:[],stopped:false};this.groups.add(g);
   for(const layer of recipe.layers)this._layer(g,layer,now,options);
   if(!g.sources.length){this.groups.delete(g);gain.disconnect();pan.disconnect();return false}
   if(g.loop)g.endsAt=Infinity;
   const cleanup=()=>{if(g.sources.every(s=>s._finished)){this.groups.delete(g);try{gain.disconnect();pan.disconnect()}catch{}}};for(const source of g.sources)source.onended=()=>{source._finished=true;cleanup()};
   this._record({type:'play',cue:name,category:recipe.category,time:now,gameTime:options.gameTime,source:options.source,skill:options.skill,contact:options.contact,loop:g.loop,voices:this.groups.size});return g;
  }
  _layer(g,layer,now,options){const c=this.context,t=now+(layer.delay||0),rate=(layer.rate||1)*(options.pitch||1)*(1+(this.random()-.5)*.035),sources=[];let source,duration=layer.duration||.25;
   if(layer.type==='sample'){const ids=layer.ids,id=ids[Math.floor(this.random()*ids.length)],buffer=this.buffers.get(id);if(!buffer)return;source=c.createBufferSource();source.buffer=buffer;source.playbackRate.value=rate;source.loop=g.loop;duration=Math.min(buffer.duration/rate,layer.duration||Infinity);
   }else if(layer.type==='noise'){source=c.createBufferSource();source.buffer=this.noise;source.loop=true;source.playbackRate.value=1;
   }else{source=c.createOscillator();source.type=layer.type==='howl'?'sawtooth':layer.wave||'sine';const f0=layer.type==='howl'?140:layer.f0,f1=layer.type==='howl'?330:layer.f1;source.frequency.setValueAtTime(Math.max(20,f0*(options.pitch||1)),t);if(!g.loop){if(layer.type==='howl'){source.frequency.exponentialRampToValueAtTime(420,t+duration*.34);source.frequency.exponentialRampToValueAtTime(255,t+duration)}else source.frequency.exponentialRampToValueAtTime(Math.max(20,f1*(options.pitch||1)),t+duration)}
   }
   sources.push(source);let output=source;
   if(layer.type==='noise'||layer.type==='howl'||layer.filter){const filter=c.createBiquadFilter();filter.type=layer.type==='howl'?'bandpass':layer.band||'lowpass';filter.frequency.value=layer.type==='howl'?850:layer.frequency||1800;filter.Q.value=layer.type==='howl'?2.7:layer.band==='bandpass'?.7:.6;output.connect(filter);output=filter;}
   const level=c.createGain(),amplitude=layer.gain||.1,attack=layer.type==='sample'?.002:layer.type==='howl'?.08:.008,end=t+duration;level.gain.setValueAtTime(.0001,t);level.gain.exponentialRampToValueAtTime(amplitude,t+Math.min(attack,duration*.15));if(!g.loop){level.gain.setValueAtTime(amplitude,t+duration*.36);level.gain.exponentialRampToValueAtTime(.0001,end)}output.connect(level);level.connect(g.gain);source.start(t);if(!g.loop)source.stop(end+.01);g.sources.push(...sources);g.endsAt=Math.max(g.endsAt,end+.02);
  }
  snapshot(){this.prune();return {supported:this.supported,state:this.context?.state||'locked',settings:{...this.settings},decoded:this.buffers.size,decodeErrors:[...this.decodeErrors],voices:this.groups.size,loops:this.loops.size,maxVoices:MAX_VOICES,gameActive:this.gameActive,visible:this.visible}}
 }
 return {Engine,SETTINGS_KEY,MAX_VOICES,settings};
});
