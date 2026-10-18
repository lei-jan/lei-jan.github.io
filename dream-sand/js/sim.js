// Falling-sand cellular automaton. Everything physical reads from sim.cfg (the world's rules).
class Sim{
 constructor(w,h,cfg,mats){
  this.w=w;this.h=h;this.cfg=cfg;this.mats=mats;this.tick=1;
  const n=w*h;
  this.m=new Uint8Array(n);  // material id
  this.l=new Uint8Array(n);  // lifetime (fire, smoke, steam)
  this.v=new Uint8Array(n);  // low 5 bits: color variation, bit 7: stationary fire
  this.s=new Uint8Array(n);  // tick stamp: already moved this tick
 }
 set(i,t,life,stat){
  this.m[i]=t;
  this.l[i]=life!==undefined?life:t==M.FIRE?20+Math.random()*30:t==M.SMOKE?60+Math.random()*80:t==M.STEAM?80+Math.random()*100:0;
  this.v[i]=(Math.random()*32|0)|(stat?128:0);
 }
 mv(i,j){const {m,l,v,s}=this;let a=m[i];m[i]=m[j];m[j]=a;a=l[i];l[i]=l[j];l[j]=a;a=v[i];v[i]=v[j];v[j]=a;s[i]=s[j]=this.tick}
 can(a,b){if(!b)return true;const B=this.mats[b],A=this.mats[a];return B.s==4||(B.s==3&&A.s>=2&&B.d<A.d)}
 tm(i,nx,ny){ // try move cell i to (nx,ny)
  if(nx<0||nx>=this.w||ny<0||ny>=this.h)return false;
  const j=ny*this.w+nx;if(!this.can(this.m[i],this.m[j]))return false;
  this.mv(i,j);return true;
 }
 em(x,y){if(x<0||x>=this.w||y<0||y>=this.h)return -1;const j=y*this.w+x;return this.m[j]?-1:j}
 react(i,x,y,t){ // fire / lava touching a random neighbor
  const R=Math.random,k=R()*4|0,nx=x+(k==0?1:k==1?-1:0),ny=y+(k==2?1:k==3?-1:0);
  if(nx<0||nx>=this.w||ny<0||ny>=this.h)return;
  const j=ny*this.w+nx,n=this.m[j];if(!n)return;
  if(n==M.WATER){if(t==M.FIRE)this.set(i,M.STEAM);else{this.set(j,M.STEAM);this.set(i,M.STONE)}return}
  const f=this.mats[n].f;
  if(f&&R()<f*this.cfg.flam){const solid=this.mats[n].s==1;this.set(j,M.FIRE,solid?60+R()*80|0:20+R()*30|0,solid)}
 }
 step(){
  const {w,h,m,l,v,s,cfg,mats}=this,R=Math.random,g=cfg.g;
  this.tick=this.tick%255+1;const T=this.tick,flip=T&1;
  for(let yy=0;yy<h;yy++){const y=g>0?h-1-yy:yy;
   for(let xx=0;xx<w;xx++){const x=flip?w-1-xx:xx,i=y*w+x,t=m[i];
    if(!t||s[i]==T)continue;
    const A=mats[t],st=A.s,d=R()<.5?-1:1;
    if(st==1)continue;
    if(st==2){ // powder
     if(R()<cfg.gs){const ny=y+g;if(this.tm(i,x,ny)||this.tm(i,x+d,ny)||this.tm(i,x-d,ny));}
     continue;
    }
    if(st==3){ // liquid
     if(t==M.LAVA)this.react(i,x,y,t);
     if(R()<A.mv){
      const ny=y+g;
      if(R()<cfg.gs&&(this.tm(i,x,ny)||this.tm(i,x+d,ny)||this.tm(i,x-d,ny)))continue;
      let ci=i,cx=x;const f=t==M.LAVA?1:cfg.flow;
      for(let k=0;k<f;k++){const nx=cx+d;if(nx<0||nx>=w)break;const j=y*w+nx;if(!this.can(t,m[j]))break;this.mv(ci,j);ci=j;cx=nx}
     }
     continue;
    }
    if(t==M.FIRE){
     if(l[i]>0)l[i]--;
     if(l[i]==0){R()<.35?this.set(i,M.ASH,0):R()<.5?this.set(i,M.SMOKE):this.set(i,0);continue}
     this.react(i,x,y,t);if(R()<.3)this.react(i,x,y,t);
     if(m[i]!=M.FIRE)continue;
     if(!(v[i]&128)&&R()<.6){const j=this.em(x+(R()*3|0)-1,y-g);if(j>=0)this.mv(i,j)}
     if(R()<.04){const j=this.em(x,y-g);if(j>=0)this.set(j,M.SMOKE)}
     continue;
    }
    // gases: smoke, steam, fog
    if(t==M.SMOKE||t==M.STEAM){
     if(l[i]>0)l[i]--;
     if(l[i]==0){t==M.STEAM&&R()<.5?this.set(i,M.WATER,0):this.set(i,0);continue}
    }
    const dx=R()<Math.abs(cfg.wind)?Math.sign(cfg.wind):(R()*3|0)-1;
    let dy;
    if(t==M.FOG){if(R()>.4)continue;dy=(R()*3|0)-1}else dy=R()<cfg.buoy?-g:0;
    let j=this.em(x+dx,y+dy);if(j<0&&dy)j=this.em(x+dx,y);
    if(j>=0)this.mv(i,j);
   }
  }
 }
}
