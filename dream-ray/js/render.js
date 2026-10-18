// Grid raycaster with per-cell floor and ceiling heights (Doom-like sectors on a grid).
// Sprite shapes: f(u,v) returns 0xRRGGBB, or -1 for transparent. Bit 24 marks light-emitting pixels.
const ST=[
 {w:.7,h:1.9,z:0,f:(u,v)=>{const x=(u-.5)*.7,y=(v-.09)*1.9;
  if(v<.16){if(x*x+y*y>.012)return -1;return Math.abs(y)<.025&&Math.abs(Math.abs(x)-.045)<.015?0x1a1a22:0xd8d4e0}
  if(v>.95||Math.abs(x)>.14-.05*(v-.15))return -1;const k=1-v*.35;return(0xd8*k<<16)|(0xd4*k<<8)|0xe0*k}},
 {w:.5,h:1.7,z:0,f:(u,v)=>{const x=(u-.5)*.5,y=(v-.1)*1.7;
  if(x*x+y*y<.022)return 0xffd890|0x1000000;return Math.abs(u-.5)<.04&&v>.18?0x3c3a48:-1}},
 {w:1,h:2.1,z:.35,f:(u,v)=>u<.1||u>.9||v<.06?0x2a2430:0xe8f0ff|0x1000000}
];

function render(L,P,buf,W,H,zb){
 const N=L.N,F=L.F,C=L.C,fc=L.fc,cc=L.cc,wc=L.wc,open=L.open,fogD=L.fogD,fr=L.fog[0],fg=L.fog[1],fb=L.fog[2];
 const dx=Math.cos(P.a),dy=Math.sin(P.a),PL=.7,plx=-dy*PL,ply=dx*PL,FOC=W/2/PL,ez=P.z+.75,hz=H/2+P.pitch;
 const fogpix=0xff000000|fb<<16|fg<<8|fr;
 // distance-banded fog, like a Doom colormap but fading to a tint instead of black
 const lit=(a,i,d,m)=>{let s=1-d/fogD;s=s<0?0:Math.floor(s*10)/10;return 0xff000000|(fb+(a[i+2]*m-fb)*s)<<16|(fg+(a[i+1]*m-fg)*s)<<8|(fr+(a[i]*m-fr)*s)};
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
   // floor of the current cell, from the previous boundary out to this one
   let yF=Math.ceil(hz+(ez-f0)*FOC/d-.5);if(yF<yt)yF=yt;
   for(let y=yF;y<yb;y++){const dd=y+.5-hz;if(dd<.25)continue;const rd=(ez-f0)*FOC/dd,wx=P.x+rx*rd,wy=P.y+ry*rd;
    buf[y*W+x]=lit(fc,ci*3,rd,((wx*3|0)+(wy*3|0))&1?.9:1)}
   if(yF<yb)yb=yF;
   // ceiling (or sky)
   let yC=Math.ceil(hz-(c0-ez)*FOC/d-.5);if(yC>yb)yC=yb;
   for(let y=yt;y<yC;y++){const dd=hz-(y+.5);if(dd<.25)continue;const rd=(c0-ez)*FOC/dd,wx=P.x+rx*rd,wy=P.y+ry*rd;
    buf[y*W+x]=lit(cc,ci*3,rd,L.sky?1:((wx*2|0)+(wy*2|0))&1?.9:1)}
   if(yC>yt)yt=yC;
   if(yt>=yb){zb[x]=d;break}
   const ni=my*N+mx;
   if(mx<0||my<0||mx>=N||my>=N||!open[ni]){ // wall: fills whatever is left of the column
    const wi=(mx<0||my<0||mx>=N||my>=N?ci:ni)*3,wxh=side?P.x+d*rx:P.y+d*ry,u=wxh-Math.floor(wxh);
    for(let y=yt;y<yb;y++){const z=ez-(y+.5-hz)*d/FOC;buf[y*W+x]=lit(wc,wi,d,((u*4|0)+Math.floor(z*4)&1?.86:1)*(side?.78:1))}
    zb[x]=d;yt=yb;break}
   const f1=F[ni],c1=C[ni];
   if(f1>f0){let ys=Math.ceil(hz+(ez-f1)*FOC/d-.5);if(ys<yt)ys=yt;
    for(let y=ys;y<yb;y++)buf[y*W+x]=lit(fc,ni*3,d,side?.62:.78);
    if(ys<yb)yb=ys}
   if(c1<c0){let ye=Math.ceil(hz-(c1-ez)*FOC/d-.5);if(ye>yb)ye=yb;
    for(let y=yt;y<ye;y++)buf[y*W+x]=lit(cc,ni*3,d,side?.6:.75);
    if(ye>yt)yt=ye}
   ci=ni;if(yt>=yb)zb[x]=d;
  }
  for(let y=yt;y<yb;y++)buf[y*W+x]=fogpix; // open distance
 }
 // billboards, far to near, hidden behind walls by the per-column depth
 const inv=1/(plx*dy-dx*ply),list=[];
 for(const s of L.sp){const ax=s.x-P.x,ay=s.y-P.y,tx=inv*(dy*ax-dx*ay),ty=inv*(-ply*ax+plx*ay);if(ty>.15)list.push({s,tx,ty})}
 list.sort((a,b)=>b.ty-a.ty);
 for(const{s,tx,ty}of list){
  const T=ST[s.t],sh=T.h*FOC/ty,sw=T.w*FOC/ty,sxp=W/2*(1+tx/ty),yBot=hz-(s.f+T.z-ez)*FOC/ty,yTop=yBot-sh,x0=Math.floor(sxp-sw/2),x1=Math.floor(sxp+sw/2);
  let k=1-ty/fogD;k=k<0?0:Math.floor(k*10)/10;
  for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){if(ty>=zb[x])continue;const u=(x-x0)/(x1-x0);
   for(let y=Math.max(0,Math.floor(yTop));y<Math.min(H,Math.ceil(yBot));y++){
    const c=T.f(u,(y-yTop)/sh);if(c<0)continue;const e=c&0x1000000?Math.max(k,.9):k;
    buf[y*W+x]=0xff000000|(fb+((c&255)-fb)*e)<<16|(fg+((c>>8&255)-fg)*e)<<8|(fr+((c>>16&255)-fr)*e)}}
 }
}
