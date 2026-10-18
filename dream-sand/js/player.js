// Side-view walker that obeys the world's gravity. Solids and powders block; liquids slow and float.
class Player{
 constructor(sim){
  this.sim=sim;this.w=3;this.h=7;this.vx=this.vy=this.ax=this.ay=0;
  const W=sim.w,H=sim.h,m=sim.m,mats=sim.mats,g=sim.cfg.g;
  let x=W>>1,y=g>0?0:H-1;
  while(y>=0&&y<H&&(!m[y*W+x]||mats[m[y*W+x]].s==4))y+=g;
  y=Math.max(0,Math.min(H-1,y));
  this.x=x-1;this.y=g>0?y-this.h:y+1;
  for(let j=0;j<this.h;j++)for(let i=0;i<this.w;i++){const px=this.x+i,py=this.y+j;if(px>=0&&px<W&&py>=0&&py<H)m[py*W+px]=0}
 }
 blocked(px,py){
  const S=this.sim,W=S.w,H=S.h;
  for(let j=0;j<this.h;j++){const yy=py+j;if(yy<0||yy>=H)return true;
   for(let i=0;i<this.w;i++){const xx=px+i;if(xx<0||xx>=W)return true;const s=S.mats[S.m[yy*W+xx]].s;if(s==1||s==2)return true}}
  return false;
 }
 update(k){
  const S=this.sim,c=S.cfg,g=c.g;
  let liq=0;
  for(let j=0;j<this.h;j++)for(let i=0;i<this.w;i++){const px=this.x+i,py=this.y+j;if(px>=0&&px<S.w&&py>=0&&py<S.h&&S.mats[S.m[py*S.w+px]].s==3)liq++}
  const sw=liq>4,onGround=this.blocked(this.x,this.y+g);
  if(this.blocked(this.x,this.y)){for(let u=1;u<=8;u++)if(!this.blocked(this.x,this.y-g*u)){this.y-=g*u;break}}
  this.vy+=g*.15*(.4+.6*c.gs)*(sw?.3:1);
  if(sw)this.vy*=.9;
  if(k.up){if(onGround)this.vy=-g*2.4*(.7+.3*c.gs);else if(sw)this.vy-=g*.2}
  this.vy=Math.max(-3,Math.min(3,this.vy));
  const tx=((k.r?1:0)-(k.l?1:0))*(sw?.6:1.1);
  this.vx+=(tx-this.vx)*(onGround?.35:.15);
  this.ax+=this.vx;
  while(Math.abs(this.ax)>=1){const sg=Math.sign(this.ax);this.ax-=sg;
   if(!this.blocked(this.x+sg,this.y))this.x+=sg;
   else{let ok=false;for(let u=1;u<=2&&!ok;u++)if(!this.blocked(this.x+sg,this.y-g*u)){this.x+=sg;this.y-=g*u;ok=true}
    if(!ok){this.vx=0;this.ax=0}}}
  this.ay+=this.vy;
  while(Math.abs(this.ay)>=1){const sg=Math.sign(this.ay);this.ay-=sg;
   if(!this.blocked(this.x,this.y+sg))this.y+=sg;else{this.vy=0;this.ay=0}}
 }
}
