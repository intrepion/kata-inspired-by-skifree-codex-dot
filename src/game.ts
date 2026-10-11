export type Mode='slalom'|'freestyle'|'free';
export type Input={steer:number;brake?:boolean;tuck?:boolean;jump?:boolean};
export type Terrain={id:number;kind:'tree'|'rock'|'ramp'|'gate';x:number;y:number;width:number};
export const finishDistance=(mode:Mode)=>mode==='free'?3200:2400;
export function terrain(mode:Mode,seed:number):Terrain[]{
 let n=seed>>>0; const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 const items:Terrain[]=[]; const add=(kind:Terrain['kind'],x:number,y:number,width:number)=>items.push({id:items.length,kind,x,y,width});
 for(let y=260;y<finishDistance(mode)-260;y+=mode==='free'?110:75){
  const line=mode==='slalom'?Math.sin((y-300)/170*Math.PI)*145:mode==='freestyle'?Math.sin(y/360)*130:0;
  for(let j=0;j<(mode==='free'?2:3);j++){const x=rand()*660-330;if(Math.abs(x-line)>85)add(rand()>.32?'tree':'rock',x,y+rand()*25,18);}
 }
 if(mode==='slalom')for(let i=0;i<12;i++)add('gate',i%2?145:-145,300+i*150,150);
 if(mode==='freestyle')for(let y=300;y<2050;y+=180)add('ramp',Math.sin(y/360)*130,y,110);
 // Gates and ramps have clear approach and landing zones.
 return items.filter(o=>o.kind==='gate'||o.kind==='ramp'||!items.some(t=>(t.kind==='gate'||t.kind==='ramp')&&Math.abs(t.y-o.y)<85&&Math.abs(t.x-o.x)<110));
}
export type State={mode:Mode;x:number;distance:number;speed:number;angle:number;time:number;score:number;combo:number;gates:number;misses:number;tricks:number;crashes:number;air:number;airDuration:number;spins:number;immunity:number;chase:'sleeping'|'warning'|'active'|'escaped'|'caught';gap:number;status:'running'|'paused'|'result';message:string;messageTime:number};
export class Run{
 readonly objects:Terrain[];readonly state:State;private accumulator=0;private jumpHeld=false;private consumed=new Set<number>();
 constructor(mode:Mode,readonly seed:number){this.objects=terrain(mode,seed);this.state={mode,x:0,distance:0,speed:55,angle:0,time:0,score:0,combo:0,gates:0,misses:0,tricks:0,crashes:0,air:0,airDuration:0,spins:0,immunity:0,chase:'sleeping',gap:220,status:'running',message:'Find your line',messageTime:2};}
 pause(){if(this.state.status==='running'){this.state.status='paused';this.accumulator=0;this.jumpHeld=false;}else if(this.state.status==='paused')this.state.status='running';}
 advance(input:Input,elapsed:number){if(this.state.status!=='running')return;this.accumulator+=Math.min(Math.max(elapsed,0),1);while(this.accumulator>=1/60&&this.state.status==='running'){this.step(input);this.accumulator-=1/60;}}
 private announce(text:string){this.state.message=text;this.state.messageTime=2;}
 private launch(duration:number){this.state.air=duration;this.state.airDuration=duration;this.state.spins=0;this.announce('AIR • tap hop to spin');}
 private crash(){const s=this.state;if(s.immunity>0)return;s.crashes++;s.score=Math.max(0,s.score-100);s.combo=0;s.speed=25;s.air=0;s.spins=0;s.immunity=2.5;this.announce('Snow tumble • recovery shield');}
 private step(input:Input){const s=this.state,dt=1/60,oldY=s.distance,oldX=s.x;
  s.time+=dt;s.immunity=Math.max(0,s.immunity-dt);s.messageTime=Math.max(0,s.messageTime-dt);
  const steer=Number.isFinite(input.steer)?Math.max(-1,Math.min(1,input.steer)):0;
  s.angle+=(steer*.95-s.angle)*Math.min(1,dt*8);
  const target=input.brake?25:input.tuck?145:90; s.speed+=(target-s.speed)*dt*1.6;
  s.x=Math.max(-340,Math.min(340,s.x+Math.sin(s.angle)*s.speed*dt*2.4));
  s.distance+=s.speed*Math.max(.65,Math.cos(s.angle))*dt;
  if(input.jump&&!this.jumpHeld){if(s.air>0){s.spins=Math.min(2,s.spins+1);this.announce(s.spins===1?'180 • align your skis':'360 • align your skis');}else if(s.immunity===0)this.launch(.65);}
  this.jumpHeld=!!input.jump;
  if(s.air>0){s.air-=dt;if(s.air<=0){s.air=0;if(Math.abs(s.angle)>.65)this.crash();else{if(s.spins>0){s.combo=Math.min(4,s.combo+1);const pts=(100+s.spins*150)*s.combo;s.score+=pts;s.tricks++;this.announce(`Clean landing +${pts} • ×${s.combo}`);}else this.announce('Soft landing');}}}
  for(const o of this.objects){if(this.consumed.has(o.id)||o.y<oldY||o.y>s.distance)continue;this.consumed.add(o.id);const x=oldX+(s.x-oldX)*(o.y-oldY)/(s.distance-oldY);const close=Math.abs(x-o.x);
   if(o.kind==='gate'){if(close<=o.width/2){s.gates++;s.combo=Math.min(4,s.combo+1);s.score+=150*s.combo;this.announce(`Gate ${s.gates}/12 • ×${s.combo}`);}else{s.misses++;s.combo=0;this.announce('Missed gate • +5 seconds');}}
   else if(o.kind==='ramp'){if(close<o.width/2&&s.air===0&&s.immunity===0)this.launch(1.35);}
   else if(close<o.width+10&&(o.kind==='tree'||this.altitude<10))this.crash();
  }
  const warning=finishDistance(s.mode)-650,active=warning+150;
  if(s.chase==='sleeping'&&s.distance>=warning){s.chase='warning';this.announce('RIMEHORN WAKES • tuck to escape!');}
  if(s.chase==='warning'&&s.distance>=active){s.chase='active';this.announce('CHASE • keep speed above 105');}
  if(s.chase==='active'){if(s.immunity===0)s.gap+=(s.speed*Math.max(.65,Math.cos(s.angle))-105)*dt;s.gap=Math.min(300,s.gap);if(s.gap<=0){s.chase='caught';s.status='result';this.announce('Rimehorn caught you • try again');}}
  if(s.distance>=finishDistance(s.mode)&&s.status==='running'){s.distance=finishDistance(s.mode);s.chase='escaped';s.status='result';s.score+=s.mode==='slalom'?Math.max(0,Math.round(2500-(s.time+s.misses*5)*30)):s.mode==='free'?Math.round(s.distance/4):500;this.announce('Refuge reached!');}
 }
 get altitude(){const s=this.state;return s.air>0?Math.sin(Math.PI*s.air/s.airDuration)*45:0;}
}
export type Save={best:Record<Mode,number>;mute:boolean;reduced:boolean};
export function readSave(raw:string|null):Save{const clean:Save={best:{slalom:0,freestyle:0,free:0},mute:true,reduced:false};try{const v=JSON.parse(raw??'null');if(!v||typeof v!=='object')return clean;for(const mode of ['slalom','freestyle','free'] as Mode[])if(Number.isFinite(v.best?.[mode])&&v.best[mode]>=0)clean.best[mode]=Math.min(1e8,Math.floor(v.best[mode]));clean.mute=typeof v.mute==='boolean'?v.mute:true;clean.reduced=v.reduced===true;}catch{}return clean;}
export function record(save:Save,mode:Mode,score:number):Save{return {...save,best:{...save.best,[mode]:Math.max(save.best[mode],Number.isFinite(score)?Math.max(0,Math.floor(score)):0)}};}
