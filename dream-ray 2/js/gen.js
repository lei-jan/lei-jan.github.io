// ---- seeded randomness ----
function hash(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0}
function rng(a){return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function h2(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+s|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function vn(x,y,s){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx*=fx*(3-2*fx);fy*=fy*(3-2*fy);const a=h2(ix,iy,s),b=h2(ix+1,iy,s),c=h2(ix,iy+1,s),d=h2(ix+1,iy+1,s),t=a+(b-a)*fx,u=c+(d-c)*fx;return t+(u-t)*fy}
function fbm(x,y,s){return vn(x,y,s)*.6+vn(x*2,y*2,s+1)*.3+vn(x*4,y*4,s+2)*.1}
function hsl(h,s,l){h=(h%360+360)%360;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return(l-a*Math.max(-1,Math.min(k-3,9-k,1)))*255};return[f(0),f(8),f(4)]}

// A seed picks a mood; the mood biases fog, palette, height variation, ceilings and what lives in the level.
const MOODS=[
 {n:'hollow',fog:9,hue:[200,260],sat:.12,lit:.5,hv:.8,cv:1.2,sky:0,lamp:3,fig:6,door:1},
 {n:'drowned',fog:6,hue:[150,200],sat:.4,lit:.42,hv:.6,cv:.6,sky:0,lamp:9,fig:3,door:2},
 {n:'fever',fog:13,hue:[0,35],sat:.55,lit:.5,hv:1.6,cv:2,sky:1,lamp:4,fig:5,door:1},
 {n:'still',fog:17,hue:[30,60],sat:.08,lit:.6,hv:.4,cv:2.5,sky:0,lamp:2,fig:2,door:3}
];

function gen(seed){
 const s=hash(seed),r=rng(s),rg=(a,b)=>a+r()*(b-a),N=64,n2=N*N,mo=MOODS[r()*MOODS.length|0],hue=rg(mo.hue[0],mo.hue[1]);
 const open=new Uint8Array(n2),F=new Float32Array(n2),C=new Float32Array(n2),rid=new Int16Array(n2).fill(-1),q=v=>Math.round(v*4)/4;
 // caves from noise, then rooms, then corridors joining the rooms in order
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++)open[y*N+x]=fbm(x*.09,y*.09,s)>.56?1:0;
 const rooms=[],K=11+(r()*5|0);
 for(let k=0;k<K;k++){const w=5+(r()*7|0),h=5+(r()*7|0),x0=2+(r()*(N-w-4)|0),y0=2+(r()*(N-h-4)|0);
  for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){open[y*N+x]=1;rid[y*N+x]=k}
  rooms.push({x:x0+(w>>1),y:y0+(h>>1)})}
 const cut=(x,y)=>{for(const[a,b]of[[0,0],[1,0],[0,1],[1,1]]){const xx=x+a,yy=y+b;if(xx>0&&yy>0&&xx<N-1&&yy<N-1)open[yy*N+xx]=1}};
 for(let k=1;k<K;k++){let{x,y}=rooms[k-1];const t=rooms[k];while(x!=t.x){cut(x,y);x+=Math.sign(t.x-x)}while(y!=t.y){cut(x,y);y+=Math.sign(t.y-y)}}
 // heights: smooth noise, flat rooms, quarter-unit steps
 const base=(x,y)=>q((fbm(x*.05,y*.05,s+11)-.5)*mo.hv*4),rf=rooms.map(p=>base(p.x,p.y)),rc=rooms.map(()=>rg(2,3.5)+mo.cv*.3);
 for(let i=0;i<n2;i++){const x=i%N,y=i/N|0,k=rid[i];
  F[i]=k>=0?rf[k]:base(x,y);
  C[i]=mo.sky?F[i]+9:k>=0?F[i]+rc[k]:F[i]+1.8+q(fbm(x*.1,y*.1,s+5)*mo.cv)}
 // keep every step walkable (max 0.5), which turns sharp edges into stairs
 for(let it=0,ch=1;ch&&it<40;it++){ch=0;for(let i=0;i<n2;i++)if(open[i])for(const d of[1,-1,N,-N]){const j=i+d;if(open[j]&&F[i]>F[j]+.5){F[i]=F[j]+.5;ch=1}}}
 for(let i=0;i<n2;i++)C[i]=Math.max(C[i],F[i]+1.5);
 // colors
 const fc=new Uint8Array(n2*3),cc=new Uint8Array(n2*3),wc=new Uint8Array(n2*3),put=(a,i,c)=>{a[i*3]=c[0];a[i*3+1]=c[1];a[i*3+2]=c[2]},skyc=hsl(hue+20,.3,.3);
 for(let i=0;i<n2;i++){const x=i%N,y=i/N|0,n=fbm(x*.07,y*.07,s+21);
  put(fc,i,hsl(hue+n*40,mo.sat,mo.lit*(.5+.5*n)*.8));
  put(cc,i,mo.sky?skyc:hsl(hue+30,mo.sat*.8,mo.lit*.45));
  put(wc,i,hsl(hue-20+n*60,mo.sat*1.2,mo.lit*(.7+.4*n)))}
 // things that live here
 const st=rooms[0],seen=new Uint8Array(n2),qu=[st.y*N+st.x],cells=[];seen[qu[0]]=1;
 for(let h=0;h<qu.length;h++){const i=qu[h];cells.push(i);for(const d of[1,-1,N,-N]){const j=i+d;if(open[j]&&!seen[j]){seen[j]=1;qu.push(j)}}}
 const sp=[],add=(t,n)=>{for(let k=0;k<n;k++){const i=cells[r()*cells.length|0],x=i%N,y=i/N|0;if(Math.abs(x-st.x)+Math.abs(y-st.y)<5)continue;sp.push({t,x:x+.2+r()*.6,y:y+.2+r()*.6,f:F[i]})}};
 add(0,mo.fig);add(1,mo.lamp);add(2,mo.door);
 return{N,open,F,C,fc,cc,wc,sp,start:{x:st.x+.5,y:st.y+.5},mood:mo,fogD:mo.fog,fog:hsl(hue,.2,.06),sky:mo.sky};
}
