// ---- seeded randomness ----
function hash(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0}
function rng(a){return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function h2(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+s|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function vn(x,y,s){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx*=fx*(3-2*fx);fy*=fy*(3-2*fy);const a=h2(ix,iy,s),b=h2(ix+1,iy,s),c=h2(ix,iy+1,s),d=h2(ix+1,iy+1,s),t=a+(b-a)*fx,u=c+(d-c)*fx;return t+(u-t)*fy}
function fbm(x,y,s){return vn(x,y,s)*.6+vn(x*2,y*2,s+1)*.3+vn(x*4,y*4,s+2)*.1}
function hsl(h,s,l){h=(h%360+360)%360;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return(l-a*Math.max(-1,Math.min(k-3,9-k,1)))*255};return[f(0),f(8),f(4)]}

function free(L,x,y,fz){
 for(const[ox,oy]of[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]]){
  const cx=Math.floor(x+ox),cy=Math.floor(y+oy);if(cx<0||cy<0||cx>=L.N||cy>=L.N)return false;
  const i=cy*L.N+cx;if(!L.open[i]||Math.abs(L.F[i]-fz)>.5)return false}
 return true;
}
// a stack of cut logs somewhere on the slope below the hut
function addPile(L,E,rnd){
 for(let k=0;k<30;k++){const a=rnd()*6.28,d=4+rnd()*10,x=31.5+Math.cos(a)*d,y=9.5+Math.abs(Math.sin(a))*d,i=(y|0)*L.N+(x|0);
  if(x>2&&x<L.N-2&&y<L.N-2&&L.open[i]&&L.skyc[i]){E.piles.push({t:5,x,y,f:L.F[i]});return}}
}
// A snowy valley under a cliff. The hut is a pocket in the cliff face: planks low, snow cap, rock above.
function buildWorld(seed){
 const s=hash(seed),r=rng(s),N=64,n2=N*N,q=v=>Math.round(v*4)/4,FLOOR=[96,66,42],CEIL=[84,58,38],PLANK=[120,84,52];
 const open=new Uint8Array(n2),F=new Float32Array(n2),C=new Float32Array(n2),sk=new Uint8Array(n2),hut=new Uint8Array(n2);
 const fc=new Uint8Array(n2*3),cc=new Uint8Array(n2*3),wc=new Uint8Array(n2*3),put=(a,i,c)=>{a[i*3]=c[0];a[i*3+1]=c[1];a[i*3+2]=c[2]};
 const cx=31,cy=11;
 for(let i=0;i<n2;i++){const x=i%N,y=i/N|0,n=fbm(x*.09,y*.09,s+21);
  F[i]=q((1-y/N)*3.5+(fbm(x*.05,y*.05,s)-.5)*3);
  open[i]=x<2||x>N-3||y<8||y>N-3||(fbm(x*.13,y*.13,s+9)>.72&&Math.hypot(x-cx,y-cy)>9)?0:1;
  sk[i]=open[i];put(fc,i,hsl(215,.2,.86-.1*n));put(wc,i,hsl(222,.1,.42+.25*n))}
 const Fg0=F[cy*N+cx]; // flatten the clearing in front of the hut, then keep every slope walkable
 for(let i=0;i<n2;i++){const dd=Math.hypot(i%N-cx,(i/N|0)-cy),k=Math.min(1,Math.max(0,(dd-6)/5));F[i]=q(Fg0+(F[i]-Fg0)*k)}
 for(let it=0,ch=1;ch&&it<40;it++){ch=0;for(let i=0;i<n2;i++)if(open[i])for(const d of[1,-1,N,-N]){const j=i+d;if(open[j]&&F[i]>F[j]+.5){F[i]=F[j]+.5;ch=1}}}
 const Fg=F[8*N+31];
 for(let y=2;y<8;y++)for(let x=27;x<36;x++)hut[y*N+x]=1;
 for(let y=3;y<7;y++)for(let x=28;x<35;x++){const i=y*N+x;open[i]=1;sk[i]=0;F[i]=Fg;C[i]=Fg+2.2;put(fc,i,FLOOR);put(cc,i,CEIL)}
 {const i=7*N+31;open[i]=1;sk[i]=0;F[i]=Fg;C[i]=Fg+2;put(fc,i,FLOOR);put(cc,i,CEIL)} // the door
 for(let i=0;i<n2;i++)if(sk[i])C[i]=F[i]+9;
 const E={pines:[],piles:[],stove:{t:6,x:29.6,y:3.7,f:Fg,lit:1},bed:{t:7,x:33.4,y:3.7,f:Fg},lamp:{t:1,x:29.8,y:8.7,f:Fg,lit:1}};
 for(let k=0;k<120;k++){const x=2+r()*(N-4),y=9+r()*(N-11),i=(y|0)*N+(x|0);if(!open[i]||Math.hypot(x-31.5,y-9)<5)continue;E.pines.push({t:4,x,y,f:F[i],sc:.8+r()*.6})}
 const L={N,open,F,C,fc,cc,wc,skyc:sk,hut,sky:1,pat:.96,start:{x:31.5,y:4.8},fogD:20,fog:[200,210,225],amb:[1,1,1],star:0,aur:0,pl:new Uint8Array(n2*3),sn:new Uint8Array(n2*3)};
 for(let i=0;i<n2;i++){put(L.pl,i,PLANK);put(L.sn,i,[235,240,248])}
 for(let k=0;k<4;k++)addPile(L,E,r);
 return{L,E};
}
