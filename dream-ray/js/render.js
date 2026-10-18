// Grid raycaster with per-cell floor and ceiling heights (Doom-like sectors on a grid), lamp light, and billboards.
// Sprite shapes: f(u,v,e) returns 0xRRGGBB, or -1 for transparent. Bit 24 marks light-emitting pixels.
// e carries per-entity state: view (0 front, 1 side, 2 back), flip, walk phase, moving, carrying, lit.
const ST=[
 {w:.7,h:1.9,z:0,dir:1,f:(u,v,e)=>{ // pale figure
  if(e.fl)u=1-u;const x=(u-.5)*.7,y=(v-.09)*1.9,sd=e.v==1,bk=e.v==2;
  if(v<.16){if(x*x+y*y>.012)return -1;
   if(!bk&&Math.abs(y)<.025&&(sd?Math.abs(x-.06)<.015:Math.abs(Math.abs(x)-.045)<.015))return 0x1a1a22;return bk?0xb8b4c4:0xd8d4e0}
  if(v>.98)return -1;
  const sw=e.mv?Math.sin(e.ph):0;
  if(e.carry&&(x-(sd?.1:.17))**2+(y-.78)**2<.003)return 0xffd890|0x1000000;
  if(v>.78){const lg=sd?[.05*sw,-.05*sw]:[-.06,.06];
   for(let k=0;k<2;k++){const lift=sd||!e.mv?0:Math.max(0,k?-sw:sw);if(Math.abs(x-lg[k])<.03&&v<.98-.04*lift)return 0x9c98ac}
   return -1}
  if(Math.abs(x)>(sd?.085:.14-.05*(v-.15)))return -1;const k=1-v*.3;return(0xd8*k<<16)|(0xd4*k<<8)|0xe0*k}},
 {w:.5,h:1.7,z:0,f:(u,v,e)=>{const x=(u-.5)*.5,y=(v-.1)*1.7;
  if(x*x+y*y<.022)return e.lit?0xffd890|0x1000000:0x7a6a50;return Math.abs(u-.5)<.04&&v>.18?0x3c3a48:-1}},
 {w:1,h:2.1,z:.35,f:(u,v)=>u<.1||u>.9||v<.06?0x2a2430:0xe8f0ff|0x1000000}
];

function render(L,P,buf,W,H,zb,ents,lights){
 const N=L.N,F=L.F,C=L.C,fc=L.fc,cc=L.cc,wc=L.wc,open=L.open,fogD=L.fogD,fr=L.fog[0],fg=L.fog[1],fb=L.fog[2];
 const dx=Math.cos(P.a),dy=Math.sin(P.a),PL=.7,plx=-dy*PL,ply=dx*PL,FOC=W/2/PL,ez=P.z+.75,hz=H/2+P.pitch;
 const fogpix=0xff000000|fb<<16|fg<<8|fr,cl=v=>v>255?255:v;
 // lamp light: a soft chunky glow that pushes the fog back and warms the colors
 const act=[];for(const l of lights)if(Math.hypot(l.x-P.x,l.y-P.y)<Math.sqrt(l.r2)+fogD*3.5)act.push(l);
 const lg=(x,y)=>{let s=0;for(let k=0;k<act.length;k++){const l=act[k],a=x-l.x,b=y-l.y,d2=a*a+b*b;if(d2<l.r2){const t=1-d2/l.r2;s+=t*t}}return s>1?1:Math.floor(s*8)/8};
 const lit=(a,i,d,m,g)=>{let s=1-d/(fogD*(1+2.5*g));s=s<0?0:Math.floor(s*10)/10;
  return 0xff000000|cl(fb+(a[i+2]*m*(1+.2*g)-fb)*s)<<16|cl(fg+(a[i+1]*m*(1+.55*g)-fg)*s)<<8|cl(fr+(a[i]*m*(1+.9*g)-fr)*s)};
 for(let x=0;x<W;x++){
  const cx=2*x/W-1,rx=dx+plx*cx,ry=dy+ply*cx;
  let mx=Math.floor(P.x),my=Math.floor(P.y),sx,sy,sdx,sdy,side=0;
  const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);
  if(rx<0){sx=-1;sdx=(P.x-mx)*ddx}else{sx=1;sdx=(mx+1-P.x)*ddx}
  if(ry<0){sy=-1;sdy=(P.y-my)*ddy}else{sy=1;sdy=(my+1-P.y)*ddy}
  let yt=0,yb=H,ci=my*N+mx;zb[x]=1e9;
  for(let it=0;it<48&&yt<yb;it++){
   if(sdx<sdy){mx+=sx;sdx+=ddx;side=0}else{my+=sy;sdy+=ddy;side=1}
   let d=side?sdy-ddy:sdx-ddx;if(d<.01)d=.01;
   const f0=F[ci],c0=C[ci];
   let yF=Math.ceil(hz+(ez-f0)*FOC/d-.5);if(yF<yt)yF=yt;
   for(let y=yF;y<yb;y++){const dd=y+.5-hz;if(dd<.25)continue;const rd=(ez-f0)*FOC/dd,wx=P.x+rx*rd,wy=P.y+ry*rd;
    buf[y*W+x]=lit(fc,ci*3,rd,((wx*3|0)+(wy*3|0))&1?.9:1,lg(wx,wy))}
   if(yF<yb)yb=yF;
   let yC=Math.ceil(hz-(c0-ez)*FOC/d-.5);if(yC>yb)yC=yb;
   for(let y=yt;y<yC;y++){const dd=hz-(y+.5);if(dd<.25)continue;const rd=(c0-ez)*FOC/dd,wx=P.x+rx*rd,wy=P.y+ry*rd;
    buf[y*W+x]=lit(cc,ci*3,rd,L.sky?1:((wx*2|0)+(wy*2|0))&1?.9:1,lg(wx,wy))}
   if(yC>yt)yt=yC;
   if(yt>=yb){zb[x]=d;break}
   const ni=my*N+mx,hx=P.x+rx*d,hy=P.y+ry*d;
   if(mx<0||my<0||mx>=N||my>=N||!open[ni]){
    const wi=(mx<0||my<0||mx>=N||my>=N?ci:ni)*3,wxh=side?hx:hy,u=wxh-Math.floor(wxh),g=lg(hx,hy);
    for(let y=yt;y<yb;y++){const z=ez-(y+.5-hz)*d/FOC;buf[y*W+x]=lit(wc,wi,d,((u*4|0)+Math.floor(z*4)&1?.86:1)*(side?.78:1),g)}
    zb[x]=d;yt=yb;break}
   const f1=F[ni],c1=C[ni];
   if(f1>f0){let ys=Math.ceil(hz+(ez-f1)*FOC/d-.5);if(ys<yt)ys=yt;const g=lg(hx,hy);
    for(let y=ys;y<yb;y++)buf[y*W+x]=lit(fc,ni*3,d,side?.62:.78,g);
    if(ys<yb)yb=ys}
   if(c1<c0){let ye=Math.ceil(hz-(c1-ez)*FOC/d-.5);if(ye>yb)ye=yb;const g=lg(hx,hy);
    for(let y=yt;y<ye;y++)buf[y*W+x]=lit(cc,ni*3,d,side?.6:.75,g);
    if(ye>yt)yt=ye}
   ci=ni;if(yt>=yb)zb[x]=d;
  }
  for(let y=yt;y<yb;y++)buf[y*W+x]=fogpix;
 }
 // billboards, far to near, hidden behind walls by the per-column depth
 const inv=1/(plx*dy-dx*ply),list=[];
 for(const e of ents){const ax=e.x-P.x,ay=e.y-P.y,tx=inv*(dy*ax-dx*ay),ty=inv*(-ply*ax+plx*ay);if(ty>.15)list.push({e,tx,ty})}
 list.sort((a,b)=>b.ty-a.ty);
 for(const{e,tx,ty}of list){
  const T=ST[e.t];
  if(T.dir){let rel=e.fa-Math.atan2(P.y-e.y,P.x-e.x);rel=Math.atan2(Math.sin(rel),Math.cos(rel));const a=Math.abs(rel);e.v=a<.785?0:a>2.356?2:1;e.fl=rel>0}
  const sc=(e.sc||1)*(e.sit?.7:1),sh=T.h*sc*FOC/ty,sw=T.w*sc*FOC/ty,sxp=W/2*(1+tx/ty),yBot=hz-(e.f+T.z+(e.bob||0)-ez)*FOC/ty,yTop=yBot-sh,x0=Math.floor(sxp-sw/2),x1=Math.floor(sxp+sw/2);
  const g=lg(e.x,e.y);let k=1-ty/(fogD*(1+2.5*g));k=k<0?0:Math.floor(k*10)/10;const wm=1+.6*g;
  for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){if(ty>=zb[x])continue;const u=(x-x0)/(x1-x0);
   for(let y=Math.max(0,Math.floor(yTop));y<Math.min(H,Math.ceil(yBot));y++){
    const c=T.f(u,(y-yTop)/sh,e);if(c<0)continue;const m=c&0x1000000?Math.max(k,.9):k;
    buf[y*W+x]=0xff000000|cl(fb+((c&255)*wm-fb)*m)<<16|cl(fg+((c>>8&255)*wm-fg)*m)<<8|cl(fr+((c>>16&255)*wm-fr)*m)}}
 }
}
