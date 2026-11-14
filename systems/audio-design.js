/* Sound direction: distinct materials, quieter anticipation, contact-led accents. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10SoundDesign=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const sample=(ids,gain=.4,rate=1,delay=0)=>({type:'sample',ids:Array.isArray(ids)?ids:[ids],gain,rate,delay});
 const noise=(duration,gain=.15,frequency=1000,band='lowpass',delay=0)=>({type:'noise',duration,gain,frequency,band,delay});
 const tone=(f0,f1,duration,gain=.12,wave='sine',delay=0)=>({type:'tone',f0,f1,duration,gain,wave,delay});
 const punch=['punch0','punch1','punch2'],metal=['metal0','metal1','metal2'],glass=['glass0','glass1','glass2'],cloth=['cloth0','cloth1'];
 const cues={};
 const cue=(name,category,layers,options={})=>cues[name]={category,layers,interval:.065,priority:3,...options};
 cue('ui.test','ui',[sample('punch0',.5),tone(660,800,.16,.045,'sine',.2)]);
 cue('ui.focus','ui',[tone(580,680,.045,.045,'triangle')],{interval:.09,priority:2});
 cue('ui.accept','ui',[tone(460,650,.08,.08,'triangle'),tone(900,1020,.1,.05,'sine',.055)]);
 cue('ui.back','ui',[tone(620,370,.095,.065,'triangle')]);
 cue('ui.denied','ui',[tone(180,120,.09,.07,'triangle'),tone(140,95,.08,.04,'triangle',.1)],{interval:.35});
 cue('ui.buy','ui',[tone(520,640,.12,.08),tone(780,850,.18,.065,'sine',.07),tone(1040,1250,.25,.04,'sine',.14)]);
 cue('ui.heal','ui',[tone(590,770,.14,.065),tone(890,1070,.23,.055,'sine',.08),noise(.22,.015,2000)]);
 cue('ui.level','ui',[tone(440,480,.17,.08),tone(660,700,.21,.075,'sine',.12),tone(880,920,.32,.065,'sine',.24)],{interval:.6,priority:7});
 cue('ui.clear','ui',[tone(392,440,.18,.065,'triangle'),tone(587,660,.22,.06,'sine',.12),tone(784,880,.35,.06,'sine',.25)],{interval:1,priority:6});
 cue('ui.combat','ui',[tone(135,115,.18,.07,'triangle'),sample('armor0',.1,.85,.025),tone(330,290,.12,.035,'sine',.13)],{interval:1,priority:6});
 cue('ui.unlock','ui',[tone(523,600,.3,.08),tone(784,900,.35,.07,'sine',.18),tone(1046,1200,.7,.055,'sine',.36),sample('shield',.08,1.4)],{interval:2,priority:8});
 cue('ui.defeat','ui',[tone(250,160,.4,.09,'triangle'),tone(160,85,.65,.075,'sine',.28)],{interval:2,priority:8});
 cue('watch.select','ui',[sample('draw',.12,1.35),tone(850,1200,.07,.055,'triangle')],{interval:.15});
 cue('watch.charge','action',[sample('shield',.2,1.1),tone(190,900,.85,.07,'triangle'),tone(750,1300,.55,.025,'sine',.3)],{priority:6});
 cue('watch.transform','action',[sample('shield',.3,1.3),noise(.35,.19,2400),tone(145,55,.38,.16),tone(1100,580,.19,.035)],{priority:8});
 cue('watch.revert','action',[sample('shield',.17,.8),noise(.26,.13,1200),tone(700,170,.35,.07,'triangle')],{priority:7});
 cue('watch.empty','ui',[tone(360,180,.18,.075,'triangle'),tone(280,140,.16,.06,'triangle',.2)],{interval:1});
 cue('watch.ready','ui',[tone(700,780,.09,.06),tone(1050,1170,.17,.045,'sine',.12)],{interval:1});
 cue('body.swing','action',[sample(cloth,.18,1.2),noise(.1,.12,2200,'bandpass')]);
 cue('body.hit','impact',[sample(punch,.56),tone(120,55,.1,.13)],{interval:.055,priority:6});
 cue('body.heavy','impact',[sample(['heavy0','heavy1'],.6,.85),tone(95,36,.22,.19)],{priority:7});
 cue('body.slam','action',[sample(['stone0','stone1'],.38,.75),sample('heavy0',.32,.73),tone(85,30,.4,.23),noise(.28,.14,750)],{priority:7,interval:.12});
 cue('body.clap','action',[sample('heavy0',.42,1.15),sample('heavy1',.25,.95,.024),noise(.33,.23,1700),tone(105,34,.36,.2)],{priority:7});
 cue('body.lift','action',[sample('stone0',.2,.72),sample('creak',.16,.65),noise(.5,.09,400)],{interval:.3});
 cue('body.throw','action',[sample(cloth,.23,.8),noise(.2,.21,1200,'bandpass')]);
 cue('metal.hit','impact',[sample(metal,.42),sample(punch,.23,.9)],{interval:.07,priority:5});
 cue('metal.heavy','impact',[sample('armor0',.36,.82),sample('heavy0',.32,.8),tone(100,38,.22,.12)],{priority:7});
 cue('metal.block','impact',[sample('armor0',.37,1.18),tone(710,420,.11,.025)],{priority:6});
 cue('metal.break','action',[sample('armor1',.45,.8),sample('shatter',.22,.85,.035)],{priority:7});
 cue('enemy.swing','action',[sample('slice',.23,.88),noise(.16,.12,1700,'bandpass')]);
 cue('enemy.shot','action',[tone(380,120,.13,.08,'triangle'),sample('draw',.2,1.5),noise(.08,.1,3600)]);
 cue('enemy.support','action',[tone(360,480,.5,.05),sample('shield',.09,1.3)],{interval:.6});
 cue('enemy.fall','action',[sample('armor1',.23,.8),sample('heavy1',.23,.75,.055)],{interval:.12,priority:4});
 cue('fire.charge','action',[noise(.65,.1,600),tone(70,130,.55,.045)],{interval:.4});
 cue('fire.launch','action',[{...sample(['fire0','fire1'],.37,1.25),duration:.4},noise(.24,.22,1900),tone(130,48,.17,.1)],{priority:5});
 cue('fire.hit','impact',[sample('blast',.24,1.5),noise(.22,.19,2600),tone(110,42,.2,.12)],{interval:.075,priority:6});
 cue('fire.burst','action',[sample('blast',.42,.95),sample('fire0',.2,1.1),tone(90,28,.5,.22)],{priority:7,interval:.18});
 cue('fire.jet','loop',[noise(2,.095,950)],{priority:2});
 cue('fire.crackle','loop',[noise(2,.014,1400,'bandpass')],{priority:1});
 cue('crystal.slash','action',[sample('slice',.24,1.3),sample(glass,.15,1.4)]);
 cue('crystal.grow','action',[sample(glass,.28,.85),tone(510,980,.19,.045),sample('stone1',.13,.9)],{interval:.07});
 cue('crystal.hit','impact',[sample(glass,.39,1.15),sample(metal,.17,1.3)],{priority:6});
 cue('crystal.break','action',[sample('shatter',.46),sample('stone0',.18,.8)],{priority:7,interval:.18});
 cue('speed.charge','action',[noise(.25,.09,1700,'bandpass'),tone(150,420,.25,.03)],{interval:.25});
 cue('speed.rush','action',[noise(.22,.23,2200,'bandpass'),sample('cloth0',.13,1.5)],{interval:.08});
 cue('speed.wind','loop',[noise(2,.075,1900,'bandpass')],{priority:2});
 cue('speed.skid','action',[sample('grass0',.23,.65),noise(.3,.12,1900,'highpass')],{interval:.2});
 cue('ball.fold','action',[sample(cloth,.2,.65),sample('metal0',.12,.7)],{interval:.2});
 cue('ball.charge','loop',[noise(2,.085,240),tone(48,55,2,.03)],{priority:2});
 cue('ball.roll','loop',[noise(2,.065,300)],{priority:1});
 cue('ball.impact','impact',[sample('heavy1',.45,.72),sample('stone1',.28,.8),tone(90,30,.33,.19)],{interval:.075,priority:7});
 cue('ghost.phase','action',[sample('shield',.12,.57),noise(.5,.055,550,'bandpass'),tone(440,160,.5,.045)]);
 cue('ghost.reveal','action',[noise(.42,.15,900,'bandpass'),sample('slime0',.12,.7),tone(170,95,.45,.065)],{interval:.15});
 cue('ghost.whip','action',[sample(cloth,.19,.8),noise(.23,.12,1100,'bandpass')]);
 cue('ghost.hit','impact',[sample('punch0',.32,.7),noise(.22,.08,650,'bandpass')],{priority:5});
 cue('slime.spit','action',[sample(['slime0','slime1'],.28,1.65),noise(.05,.055,2300)],{interval:.04});
 cue('slime.splat','impact',[sample(['slime0','slime1'],.27,1.2),sample('punch1',.14,1.4)],{interval:.07,priority:4});
 cue('insect.wings','loop',[noise(2,.065,1150,'bandpass'),tone(92,96,2,.022,'sawtooth')],{priority:2});
 cue('insect.sting','action',[sample('slice',.22,1.15),sample('metal0',.09,1.5)]);
 cue('vine.whip','action',[sample('slice',.2,1.15),sample(cloth,.18,.95),sample('wood',.12,1.2)]);
 cue('vine.roots','action',[sample('creak',.25,.82),sample(['stone0','stone1'],.22,.8),noise(.25,.085,450)]);
 cue('vine.seed','action',[sample('wood',.13,1.5),noise(.12,.075,1900)]);
 cue('vine.bloom','action',[sample('creak',.18,.8),sample('slime0',.19,.8),noise(.3,.1,500)],{interval:.2});
 cue('wolf.claw','action',[sample('slice',.29,1.2),noise(.12,.1,2100,'bandpass')]);
 cue('wolf.bite','impact',[sample('heavy0',.3,1.25),sample('wood',.27,1.1),noise(.1,.07,550)],{priority:6});
 cue('wolf.howl','action',[{type:'howl',duration:.85,gain:.16},noise(.6,.06,950,'bandpass')],{priority:7,interval:.7});
 cue('tech.morph','action',[sample('slime1',.22,.9),sample('engine',.12,1.1),tone(240,410,.27,.045)]);
 cue('tech.laser','action',[sample('laserSmall',.31,1.1),tone(330,140,.16,.055,'sawtooth')],{interval:.08});
 cue('tech.cannon','action',[sample('laserLarge',.38,.8),tone(80,45,.45,.12)],{priority:7,interval:.13});
 cue('tech.pulse','action',[sample('shield',.27,.8),tone(180,50,.5,.13),noise(.22,.09,550)],{priority:6});
 cue('tech.whip','action',[sample('slime0',.15,1.5),sample('slice',.22,.9)]);
 cue('ground.step','ground',[sample(['step0','step1','step2','step3'],.22)],{interval:.13,priority:1});
 cue('ground.grass','ground',[sample(['grass0','grass1','grass2'],.23)],{interval:.13,priority:1});
 cue('ground.heavy','ground',[sample(['step0','step2'],.27,.68),sample('metal0',.055,.8)],{interval:.22,priority:1});
 cue('ground.metal','ground',[sample(['step1','step3'],.19),sample(metal,.07,1.25)],{interval:.15,priority:1});
 cue('ground.root','ground',[sample(['grass0','grass2'],.19,.88),sample('creak',.035,1.4)],{interval:.2,priority:1});
 cue('ground.gel','ground',[sample('slime1',.1,1.4),sample('step0',.065)],{interval:.19,priority:1});
 cue('ground.land','action',[sample(['step0','step2'],.3,.85),sample('heavy0',.17,.8)],{interval:.2});
 cue('boss.draw','action',[sample('draw',.3,.75),sample('armor0',.16,.75)],{priority:5});
 cue('boss.slash','action',[sample('slice',.36,.7),sample('armor1',.15,1.2),noise(.2,.17,1800)],{priority:6});
 cue('boss.command','action',[tone(140,180,.55,.085,'triangle'),sample('shield',.12,.55)],{priority:7,interval:1});
 cue('boss.fall','action',[sample('armor1',.4,.65),sample('heavy0',.35,.65),sample('metal1',.16,.7,.2)],{priority:8,interval:1});
 // Explicitly authored for the seven drawn techniques of each alien.
 // Each row is [preparation, contact/release, optional sustain]. Repeated contacts use the clip's own times.
 const skills={
  'four-arms':[['body.lift','body.clap'],['body.swing','body.slam'],['body.swing','body.swing'],['body.lift','body.clap'],['body.lift','body.throw'],['body.swing','body.slam'],['body.swing','body.swing']],
  heatblast:[['fire.charge','fire.burst'],['fire.charge','fire.launch'],['fire.charge','fire.launch','fire.jet'],['fire.charge','fire.launch'],['fire.charge','fire.launch'],['fire.charge','fire.launch','fire.jet'],['fire.charge','fire.burst']],
  xlr8:[['speed.charge','speed.rush'],['speed.charge','speed.rush'],['speed.charge','body.swing'],['speed.charge','speed.skid'],['speed.charge','speed.rush'],['body.swing','speed.rush'],['speed.charge','speed.rush']],
  diamondhead:[['crystal.grow','crystal.grow'],['crystal.slash','crystal.grow'],['crystal.slash','crystal.slash'],['body.lift','crystal.grow'],['crystal.grow','crystal.grow'],['crystal.slash','crystal.grow'],['crystal.grow','crystal.grow']],
  cannonbolt:[['ball.fold','ball.impact'],['ball.fold','ball.impact'],['ball.fold','wolf.claw'],['ball.fold','speed.rush','ball.charge'],['ball.fold','speed.skid','ball.roll'],['ball.fold','speed.rush','ball.roll'],['ball.fold','ball.impact']],
  ghostfreak:[['ghost.phase','ghost.reveal'],['ghost.phase','ghost.whip'],['ghost.reveal','ghost.whip'],['ghost.reveal','body.slam'],['ghost.phase','ghost.whip'],['ghost.phase','ghost.whip'],['ghost.phase','ghost.reveal']],
  stinkfly:[['slime.spit','slime.spit'],['insect.sting','insect.sting','insect.wings'],['slime.spit','slime.spit'],['insect.sting','slime.splat','insect.wings'],['slime.spit','slime.spit'],['insect.sting','insect.sting'],['insect.sting','slime.spit','insect.wings']],
  wildvine:[['vine.roots','vine.roots'],['vine.whip','vine.whip'],['vine.whip','body.swing'],['vine.whip','vine.whip'],['vine.seed','vine.seed'],['vine.roots','vine.roots'],['vine.roots','vine.bloom']],
  blitzwolfer:[['wolf.claw','wolf.howl'],['wolf.claw','wolf.claw'],['wolf.claw','wolf.bite'],['wolf.claw','wolf.claw'],['wolf.claw','wolf.claw'],['wolf.claw','wolf.claw'],['wolf.claw','wolf.howl']],
  upgrade:[['tech.morph','tech.pulse'],['tech.morph','body.swing'],['tech.morph','crystal.slash'],['tech.morph','tech.cannon'],['tech.morph','tech.whip'],['tech.morph','tech.laser'],['tech.morph','tech.morph']]
 };
 function skill(form,id){const index=id==='f'?0:Number(id.slice(1))+1,row=skills[form]?.[index];return row?{prepare:row[0],contact:row[1],sustain:row[2]||null}:null}
 function basic(form,heavy,combo=1,special=false){
  if(form==='heatblast')return heavy?'fire.launch':'body.swing';if(form==='diamondhead')return heavy?'crystal.grow':'crystal.slash';
  if(form==='stinkfly')return heavy?special?'slime.spit':'insect.sting':null;
  if(form==='wildvine')return heavy&&special?'vine.roots':'vine.whip';
  if(form==='blitzwolfer')return heavy&&special?'wolf.howl':!heavy&&combo===3?'wolf.bite':'wolf.claw';
  if(form==='upgrade')return heavy?special?'tech.morph':'tech.laser':'tech.morph';
  if(form==='ghostfreak')return heavy?'ghost.reveal':'ghost.whip';
  if(form==='xlr8')return heavy?'speed.rush':'body.swing';if(form==='cannonbolt')return heavy?'speed.rush':'wolf.claw';
  return form==='four-arms'&&heavy&&special?'body.clap':'body.swing';
 }
 function hit(form,heavy=false,{slime=false,combo=1}={}){if(slime||form==='stinkfly')return 'slime.splat';return ({heatblast:'fire.hit',diamondhead:'crystal.hit',cannonbolt:'ball.impact',ghostfreak:'ghost.hit',upgrade:'metal.hit'})[form]||(form==='blitzwolfer'&&combo===3?'wolf.bite':heavy||form==='four-arms'?'body.heavy':'body.hit')}
 return {cues,skills,skill,basic,hit};
});
