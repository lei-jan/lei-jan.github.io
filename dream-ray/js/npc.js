// NPCs, lamps and the light they share. Each figure is driven by a few pulls (light, comfort distance,
// curiosity about the player, a wandering habit) rather than a script, so no two behave alike.
function free(L,x,y,fz){
 for(const[ox,oy]of[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]]){
  const cx=Math.floor(x+ox),cy=Math.floor(y+oy);if(cx<0||cy<0||cx>=L.N||cy>=L.N)return false;
  const i=cy*L.N+cx;if(!L.open[i]||Math.abs(L.F[i]-fz)>.5)return false}
 return true;
}
function makeWorld(L,seed){
 const rd=rng(hash(seed+'npc')),wd={lamps:[],npcs:[],doors:[],D:new Uint16Array(L.N*L.N),Q:new Int32Array(L.N*L.N)};
 for(const s of L.sp){
  if(s.t==1)wd.lamps.push({t:1,x:s.x,y:s.y,f:s.f,lit:1});
  else if(s.t==2)wd.doors.push({t:2,x:s.x,y:s.y,f:s.f});
  else{const a=rd()*6.28;wd.npcs.push({t:0,x:s.x,y:s.y,f:s.f,fa:a,ta:a,hd:a,ph:0,mv:0,sit:0,idle:0,vx:0,vy:0,sp:0,gz:1,bob:0,
   spd:.7+rd()*.4,sc:.9+rd()*.2,shy:2.5+rd()*2.5,bold:rd(),ring:2+rd()*2,seek:12+rd()*18})}
 }
 return wd;
}
// distance (in cells) from every open cell to the nearest light source
function flow(L,src,D,Q){
 const N=L.N;D.fill(65535);let h=0,t=0;
 for(const[x,y]of src){const i=(y|0)*N+(x|0);if(L.open[i]&&D[i]){D[i]=0;Q[t++]=i}}
 while(h<t){const i=Q[h++],d=D[i]+1;for(const k of[1,-1,N,-N]){const j=i+k;if(L.open[j]&&D[j]>d&&Math.abs(L.F[j]-L.F[i])<=.5){D[j]=d;Q[t++]=j}}}
}
// decisions, ten times a second
function think(wd,L,P){
 const N=L.N,src=[];for(const l of wd.lamps)if(l.lit)src.push([l.x,l.y]);if(P.carry)src.push([P.x,P.y]);
 flow(L,src,wd.D,wd.Q);
 const cd=Math.cos(P.a),sd=Math.sin(P.a);
 for(const n of wd.npcs){
  const cx=n.x|0,cy=n.y|0,di=wd.D[cy*N+cx],px=P.x-n.x,py=P.y-n.y,dp=Math.hypot(px,py)||1e-3;
  let vx=0,vy=0;
  n.gz=dp<L.fogD&&-(cd*px+sd*py)/dp>.87?.45:1; // hesitant while watched, never frozen
  if(n.idle>0){n.idle-=.1;n.sp=0;if(n.idle<=0)n.sit=0;if(dp<9&&n.bold>.3)n.ta=Math.atan2(py,px)}
  else{
   if(di<n.seek&&di>n.ring){ // walk toward the nearest light
    let b=di,bx=0,by=0;for(const[ox,oy]of[[1,0],[-1,0],[0,1],[0,-1]]){const v=wd.D[(cy+oy)*N+cx+ox];if(v<b){b=v;bx=ox;by=oy}}
    const tx=cx+bx+.5-n.x,ty=cy+by+.5-n.y,m=Math.hypot(tx,ty)||1;vx+=tx/m;vy+=ty/m;
   }else if(di<=n.ring){if(Math.random()<.04){n.idle=3+Math.random()*6;n.sit=1}} // settle near the light
   else{n.hd+=(Math.random()-.5)*.8;vx+=Math.cos(n.hd)*.6;vy+=Math.sin(n.hd)*.6;if(Math.random()<.05){n.idle=2+Math.random()*3;n.sit=0}}
   if(dp<n.shy){vx-=px/dp*1.6;vy-=py/dp*1.6} // keep a personal distance
   else if(n.bold>.55&&dp<9&&dp>n.shy+1.2){vx+=px/dp*.5;vy+=py/dp*.5} // bold ones drift closer
   for(const o of wd.npcs)if(o!==n){const ox=n.x-o.x,oy=n.y-o.y,d=Math.hypot(ox,oy);if(d<1.4&&d>.001){vx+=ox/d*(1.4-d);vy+=oy/d*(1.4-d)}}
   const m=Math.hypot(vx,vy);
   if(m>.05){n.vx=vx/Math.max(1,m);n.vy=vy/Math.max(1,m);n.sp=n.spd*Math.min(1,m)*n.gz;n.ta=Math.atan2(vy,vx)}else n.sp=0;
  }
 }
}
// movement, every frame
function move(wd,L,dt){
 const N=L.N;
 for(const n of wd.npcs){
  if(n.sp>0){const sx=n.x+n.vx*n.sp*dt,sy=n.y+n.vy*n.sp*dt,fz=L.F[(n.y|0)*N+(n.x|0)];let ok=0;
   if(free(L,sx,n.y,fz)){n.x=sx;ok=1}if(free(L,n.x,sy,fz)){n.y=sy;ok=1}if(!ok)n.hd+=2}
  n.mv=n.sp>.05?1:0;n.ph+=n.sp*dt*7;n.bob=n.mv?Math.abs(Math.sin(n.ph))*.04:0;
  const da=Math.atan2(Math.sin(n.ta-n.fa),Math.cos(n.ta-n.fa));n.fa+=Math.max(-3*dt,Math.min(3*dt,da));
  n.f+=(L.F[(n.y|0)*N+(n.x|0)]-n.f)*Math.min(1,dt*8);
 }
}
// e: pick up the nearest lamp, or set the one you carry down in front of you
function interact(wd,L,P){
 if(P.carry){let x=P.x+Math.cos(P.a)*.6,y=P.y+Math.sin(P.a)*.6;const fz=L.F[(P.y|0)*L.N+(P.x|0)];
  if(!free(L,x,y,fz)){x=P.x;y=P.y}
  wd.lamps.push({t:1,x,y,f:L.F[(y|0)*L.N+(x|0)],lit:1});P.carry=0;return}
 let b=null,bd=1.8;for(const l of wd.lamps){const d=Math.hypot(l.x-P.x,l.y-P.y);if(d<bd){bd=d;b=l}}
 if(b){wd.lamps.splice(wd.lamps.indexOf(b),1);P.carry=1}
}
