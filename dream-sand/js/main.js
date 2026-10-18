(()=>{
const W=640,H=360,cv=document.getElementById('c'),ctx=cv.getContext('2d');
cv.width=W;cv.height=H;
const img=ctx.createImageData(W,H),buf=new Uint32Array(img.data.buffer),$=id=>document.getElementById(id);
const px=(r,g,b)=>0xff000000|(b>255?255:b)<<16|(g>255?255:g)<<8|(r>255?255:r);
const names={1:'stone',2:'sand',3:'water',4:'oil',5:'wood',6:'fire',7:'lava',8:'plant',9:'fog',0:'dig'};
const ids={1:M.STONE,2:M.SAND,3:M.WATER,4:M.OIL,5:M.WOOD,6:M.FIRE,7:M.LAVA,8:M.PLANT,9:M.FOG,0:0};
const km={KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',KeyW:'up',ArrowUp:'up',Space:'up'},keys={};
let sim,pl,mats,bgr,bgg,bgb,bgc,tool='3',size=3,mx=0,my=0,down=0;

function build(seed){
 seed=seed||'dream';$('seed').value=seed;history.replaceState(null,'','#'+encodeURIComponent(seed));
 const c=makeConfig(seed);mats=makeMats(c);sim=new Sim(W,H,c,mats);generate(sim);pl=new Player(sim);
 bgr=[];bgg=[];bgb=[];bgc=[];
 for(let y=0;y<H;y++){const t=c.g>0?y/H:1-y/H,a=c.sky0.map((v,i)=>v+(c.sky1[i]-v)*t);bgr[y]=a[0];bgg[y]=a[1];bgb[y]=a[2];bgc[y]=px(a[0],a[1],a[2])}
 $('info').textContent=[`gravity   ${c.g>0?'down':'up'} x${c.gs.toFixed(2)}`,`flow      ${c.flow}`,`buoyancy  ${c.buoy.toFixed(2)}`,`flammable x${c.flam.toFixed(2)}`,`wind      ${c.wind.toFixed(2)}`,`fog       ${c.fog.toFixed(2)}`,`lakes     ${c.lakeMat==M.OIL?'oil':'water'}`,`lava      ${c.lava?'yes':'no'}`,`islands   ${c.isl?'yes':'no'}`].join('\n');
 updTool();
}
function updTool(){$('tool').textContent=`tool: ${names[tool]}   brush: ${size}`}
function go(){build($('seed').value.trim());$('seed').blur()}

function paint(){
 if(!down)return;
 const id=down==2?0:ids[tool];
 for(let dy=-size;dy<=size;dy++)for(let dx=-size;dx<=size;dx++){
  if(dx*dx+dy*dy>size*size)continue;
  const x=mx+dx,y=my+dy;if(x<0||y<0||x>=W||y>=H)continue;
  const i=y*W+x;
  if(!id)sim.set(i,0);
  else if(!sim.m[i]||mats[sim.m[i]].s==4){if(mats[id].s==1||Math.random()<.4)sim.set(i,id)}
 }
}

function draw(){
 const m=sim.m,l=sim.l,v=sim.v;
 for(let y=0;y<H;y++){
  const R0=bgr[y],G0=bgg[y],B0=bgb[y],bp=bgc[y];
  for(let x=0,i=y*W;x<W;x++,i++){
   const t=m[i];if(!t){buf[i]=bp;continue}
   const A=mats[t];let r,g,b;
   if(t==M.FIRE){const k=l[i];r=255;g=60+(k>40?40:k)*4;b=20+(k>60?30:0)}
   else{const q=1+((v[i]&31)-16)*.012,c=A.c;r=c[0]*q;g=c[1]*q;b=c[2]*q}
   const a=A.a;if(a<1){r=R0+(r-R0)*a;g=G0+(g-G0)*a;b=B0+(b-B0)*a}
   buf[i]=px(r,g,b);
  }
 }
 const up=sim.cfg.g>0;
 for(let j=0;j<pl.h;j++)for(let i=0;i<pl.w;i++){
  const x=pl.x+i,y=pl.y+j;if(x<0||y<0||x>=W||y>=H)continue;
  const head=up?j<2:j>=pl.h-2;buf[y*W+x]=head?px(255,225,200):px(235,235,250);
 }
 ctx.putImageData(img,0,0);
}

let last=0,acc=0;
function frame(t){
 acc+=Math.min(100,t-last);last=t;
 while(acc>=16.67){acc-=16.67;paint();sim.step();pl.update(keys)}
 draw();requestAnimationFrame(frame);
}
function fit(){const s=Math.max(1,Math.floor(Math.min(innerWidth/W,innerHeight/H)));cv.style.width=W*s+'px';cv.style.height=H*s+'px'}
function mouse(e){const r=cv.getBoundingClientRect();mx=((e.clientX-r.left)/r.width*W)|0;my=((e.clientY-r.top)/r.height*H)|0}

cv.addEventListener('mousedown',e=>{mouse(e);down=e.button==2?2:1});
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mouseup',()=>down=0);
addEventListener('mousemove',mouse);
addEventListener('resize',fit);
addEventListener('keydown',e=>{
 if(e.target.tagName=='INPUT'){if(e.key=='Enter')go();return}
 if(e.code=='Space'||e.code.startsWith('Arrow'))e.preventDefault();
 if(km[e.code])keys[km[e.code]]=1;
 if(e.key in names)tool=e.key;
 if(e.key=='[')size=Math.max(1,size-1);
 if(e.key==']')size=Math.min(12,size+1);
 updTool();
});
addEventListener('keyup',e=>{if(km[e.code])keys[km[e.code]]=0});
$('go').onclick=go;
$('rnd').onclick=()=>build(Math.random().toString(36).slice(2,8));

fit();
build(decodeURIComponent(location.hash.slice(1))||'dream');
requestAnimationFrame(frame);
})();
