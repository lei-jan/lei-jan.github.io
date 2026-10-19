(()=>{
const W=256,H=144,FOC=W/2/.7,cv=document.getElementById('c'),ctx=cv.getContext('2d'),$=id=>document.getElementById(id);
cv.width=W;cv.height=H;
const img=ctx.createImageData(W,H),buf=new Uint32Array(img.data.buffer),zb=new Float32Array(W);
const seed=decodeURIComponent(location.hash.slice(1))||'hut',sd=hash(seed)&0xffff,{L,E}=buildWorld(seed);
const P={x:L.start.x,y:L.start.y,a:Math.PI/2,z:L.F[(L.start.y|0)*L.N+(L.start.x|0)],pitch:0},keys={};
const FL=[];for(let k=0;k<400;k++)FL.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()});
let wood=6,warm=.8,fuel=100,msg='',msgT=0,now=0,last=0,wI=.2,wind=0,ambK=1,lastA=P.a,dropT=0,tod='',wl='';
const cl=(v,a=0,b=1)=>v<a?a:v>b?b:v,say=s=>{msg=s;msgT=2.5};

function interact(){
 if(Math.hypot(P.x-E.stove.x,P.y-E.stove.y)<2.2){if(wood<1)return say('no wood');wood--;fuel=Math.min(360,fuel+75);return say('fed the stove')}
 let b=-1,bd=1.8;E.piles.forEach((p,i)=>{const d=Math.hypot(p.x-P.x,p.y-P.y);if(d<bd){bd=d;b=i}});
 if(b>=0){E.piles.splice(b,1);wood=Math.min(20,wood+3);return say('gathered wood')}
 say('nothing here');
}
function frame(t){
 const dt=Math.min(.05,(t-last)/1000||0);last=t;now=t/1000;
 // time of day and weather: slow, and they never repeat exactly
 const tt=(now/240+.76)%1,sn=Math.sin(6.2832*(tt-.25)),d=cl(sn*1.5+.2),u=cl(1-Math.abs(sn)*4),nt=1-d,t2=now+40;
 wI=cl((fbm(t2*.012,4.1,sd)-.3)*2.2,.05,1);wind=(fbm(t2*.01,9.7,sd)-.5)*2*(.3+wI);
 tod=d>.8?'day':nt>.8?'night':tt<.5?'dawn':'dusk';wl=wI<.2?'clear':wI<.5?'light snow':wI<.8?'snow':'blizzard';
 const ci=(P.y|0)*L.N+(P.x|0),inHut=!L.skyc[ci];
 ambK+=((inHut?.55:1)-ambK)*Math.min(1,dt*3);
 L.amb=[(.22+.78*d)*ambK,(.26+.74*d)*ambK,(.4+.6*d)*ambK];
 L.fog=[14+196*d+u*70,18+204*d+u*30,38+200*d-u*15];L.fogD=22-15*wI;
 L.star=nt>.3?(nt-.3)/.7*(1-wI):0;L.aur=L.star*cl(1-wI*2);
 const zr=8+112*d+u*50,zg=10+150*d+u*10,zB=26+184*d;
 for(let i=0;i<L.skyc.length;i++)if(L.skyc[i]){L.cc[i*3]=zr;L.cc[i*3+1]=zg;L.cc[i*3+2]=zB}
 // movement
 const fz=L.F[ci],cold=warm<.3?.7:1;
 P.a+=((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*2*dt;
 P.pitch=cl(P.pitch+((keys.ArrowUp?1:0)-(keys.ArrowDown?1:0))*60*dt,-50,50);
 const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),sdv=(keys.KeyD?1:0)-(keys.KeyA?1:0),sp=2.4*dt*cold;
 const vx=(Math.cos(P.a)*f-Math.sin(P.a)*sdv)*sp,vy=(Math.sin(P.a)*f+Math.cos(P.a)*sdv)*sp;
 if(free(L,P.x+vx,P.y,fz))P.x+=vx;
 if(free(L,P.x,P.y+vy,fz))P.y+=vy;
 P.z+=(L.F[(P.y|0)*L.N+(P.x|0)]-P.z)*Math.min(1,dt*10);
 // the stove burns down, the hut warms you, the mountain takes it back
 fuel=Math.max(0,fuel-dt);E.stove.lit=fuel>0?1:0;
 const sdx=Math.hypot(P.x-E.stove.x,P.y-E.stove.y);
 warm=cl(warm+((inHut&&fuel>0?.07+(sdx<3?.06:0):0)-(inHut?.003:.006+.012*wI+(nt>.5?.006:0)))*dt);
 dropT+=dt;if(dropT>40){dropT=0;if(E.piles.length<6)addPile(L,E,Math.random)} // someone leaves more wood
 if(msgT>0)msgT-=dt;
 const fk=Math.min(1,fuel/15),lights=[{x:E.lamp.x,y:E.lamp.y,r2:20}];
 if(fuel>0)lights.push({x:E.stove.x,y:E.stove.y,r2:(16+3*Math.sin(now*9))*fk+4});
 render(L,P,buf,W,H,zb,E.pines.concat(E.piles,[E.stove,E.bed,E.lamp]),lights,[],now);
 // falling snow, drawn in screen space and held back indoors
 const dA=P.a-lastA;lastA=P.a;
 if(!inHut){const n=60+(wI*340|0),fl=250*(.3+.7*d)|0,fv=0xff000000|Math.min(255,fl+6)<<16|Math.min(255,fl+3)<<8|fl;
  for(let k=0;k<n;k++){const s=FL[k];s.y+=(18+s.z*34)*dt;s.x+=(wind*28*(.5+s.z)+Math.sin(s.y*.06+k)*6)*dt-dA*FOC;s.x=(s.x%W+W)%W;
   if(s.y>=H){s.y-=H;s.x=Math.random()*W}
   const px=s.x|0,py=s.y|0;buf[py*W+px]=fv;if(s.z>.7)buf[py*W+(px+1)%W]=fv}}
 ctx.putImageData(img,0,0);
 if(warm<.4){const a=(.4-warm)/.4*.5,gr=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.8); // frost at the edges when cold
  gr.addColorStop(0,'rgba(200,225,255,0)');gr.addColorStop(1,'rgba(200,225,255,'+a+')');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H)}
 $('stat').textContent='wood '+wood+'\nwarmth '+'#'.repeat(Math.round(warm*10)).padEnd(10,'.')+'\nstove '+(fuel>60?'burning':fuel>0?'low':'cold')+'\n'+tod+', '+wl+(msgT>0?'\n'+msg:'');
 requestAnimationFrame(frame);
}
function fit(){const s=Math.max(1,Math.floor(Math.min(innerWidth/W,innerHeight/H)));cv.style.width=W*s+'px';cv.style.height=H*s+'px'}
addEventListener('keydown',e=>{if(e.code.startsWith('Arrow')||e.code=='Space')e.preventDefault();keys[e.code]=1;if(e.code=='KeyE'&&!e.repeat)interact()});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('resize',fit);
cv.addEventListener('click',()=>cv.requestPointerLock&&cv.requestPointerLock());
addEventListener('mousemove',e=>{if(document.pointerLockElement==cv){P.a+=e.movementX*.0025;P.pitch=cl(P.pitch-e.movementY*.5,-50,50)}});
fit();requestAnimationFrame(frame);
})();
