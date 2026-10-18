// ---- seeded randomness ----
function hash(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0}
function rng(a){return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function h2(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+s|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function vn(x,y,s){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx*=fx*(3-2*fx);fy*=fy*(3-2*fy);const a=h2(ix,iy,s),b=h2(ix+1,iy,s),c=h2(ix,iy+1,s),d=h2(ix+1,iy+1,s),t=a+(b-a)*fx,u=c+(d-c)*fx;return t+(u-t)*fy}
function fbm(x,y,s){return vn(x,y,s)*.6+vn(x*2,y*2,s+1)*.3+vn(x*4,y*4,s+2)*.1}

// ---- seed -> everything that can vary between worlds ----
function makeConfig(seed){
 const s=hash(seed),r=rng(s),rg=(a,b)=>a+r()*(b-a),pick=a=>a[r()*a.length|0];
 const c={seed,s};
 c.g=r()<.78?1:-1;            // gravity direction (-1 = up)
 c.gs=rg(.35,1);              // gravity strength
 c.flow=1+(r()*5|0);          // how far liquids spread sideways
 c.buoy=rg(.15,.9);           // how eagerly gases rise
 c.flam=rg(.3,2.2);           // flammability multiplier
 c.wind=r()<.4?rg(-.5,.5):0;  // horizontal drift for gases
 c.fog=r()<.65?rg(.03,.5):0;  // ambient fog density
 c.perm=pick([[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]); // palette shift
 c.br=rg(.75,1.15);
 c.cave=rg(.025,.07);c.cavity=rg(0,.12);c.rough=rg(10,60);c.base=rg(.45,.7);c.lake=rg(.6,.8);
 c.lakeMat=r()<.3?M.OIL:M.WATER; // some worlds have flammable oil lakes
 c.lava=r()<.5;c.isl=r()<.35;c.plant=rg(0,.35);
 const sk=()=>[rg(5,70),rg(5,70),rg(10,90)];
 c.sky0=sk();c.sky1=sk().map(v=>v*1.8+20);
 return c;
}
function makeMats(c){
 const p=c.perm;
 return BASE.map((b,i)=>{const o={...b};
  o.c=(i&&i!=M.FIRE&&i!=M.LAVA&&i!=M.SMOKE)?[b.c[p[0]],b.c[p[1]],b.c[p[2]]].map(v=>v*c.br):b.c.slice();
  return o});
}

// ---- terrain ----
// y below is measured from the "sky"; in upside-down worlds the whole map is flipped.
function generate(sim){
 const W=sim.w,H=sim.h,m=sim.m,c=sim.cfg,r=rng(c.s^0x9e3779b9),g=c.g,s=c.s&0xffff;
 const surf=[];for(let x=0;x<W;x++)surf[x]=H*c.base+(fbm(x/90,3.3,s)-.5)*c.rough*2;
 const at=(x,y)=>(g>0?y:H-1-y)*W+x,put=(x,y,t)=>sim.set(at(x,y),t);
 for(let x=0;x<W;x++)for(let y=0;y<H;y++){
  let t=0;
  if(y>surf[x]){
   t=y<surf[x]+4+r()*3?M.SAND:M.STONE;
   if(y>surf[x]+8&&fbm(x*c.cave,y*c.cave*1.5,s+7)>.6-c.cavity)t=0;
  }else if(c.isl&&y<surf[x]-25&&y>15&&fbm(x*.02,y*.035,s+3)>.68)t=M.STONE;
  if(!t&&c.lava&&y>H*.92)t=M.LAVA;
  else if(!t&&y>=H*c.lake)t=c.lakeMat;
  if(!t&&c.fog&&r()<c.fog*.15)t=M.FOG;
  if(t)put(x,y,t);
 }
 for(let x=0;x<W;x++)if(r()<c.plant*.3){
  let y=0;while(y<H&&(!m[at(x,y)]||m[at(x,y)]==M.FOG))y++;
  if(y<H&&y>0&&m[at(x,y)]<3){const hh=2+(r()*5|0);for(let k=1;k<=hh;k++)if(!m[at(x,y-k)])put(x,y-k,M.PLANT)}
 }
}
