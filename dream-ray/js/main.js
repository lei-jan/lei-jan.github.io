(()=>{
const W=256,H=144,cv=document.getElementById('c'),ctx=cv.getContext('2d'),$=id=>document.getElementById(id);
cv.width=W;cv.height=H;
const img=ctx.createImageData(W,H),buf=new Uint32Array(img.data.buffer),zb=new Float32Array(W);
const keys={};let L,P,wd,tk=0;

function build(seed){
 seed=seed||'dream';$('seed').value=seed;history.replaceState(null,'','#'+encodeURIComponent(seed));
 L=gen(seed);P={x:L.start.x,y:L.start.y,a:0,z:L.F[(L.start.y|0)*L.N+(L.start.x|0)],pitch:0,carry:0};
 wd=makeWorld(L,seed);think(wd,L,P);$('mood').textContent=L.mood.n;
}
function update(dt){
 const fz=L.F[(P.y|0)*L.N+(P.x|0)];
 P.a+=((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*2*dt;
 P.pitch+=((keys.ArrowUp?1:0)-(keys.ArrowDown?1:0))*60*dt;P.pitch=Math.max(-50,Math.min(50,P.pitch));
 const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),sd=(keys.KeyD?1:0)-(keys.KeyA?1:0),sp=2.6*dt;
 const vx=(Math.cos(P.a)*f-Math.sin(P.a)*sd)*sp,vy=(Math.sin(P.a)*f+Math.cos(P.a)*sd)*sp;
 if(free(L,P.x+vx,P.y,fz))P.x+=vx;
 if(free(L,P.x,P.y+vy,fz))P.y+=vy;
 P.z+=(L.F[(P.y|0)*L.N+(P.x|0)]-P.z)*Math.min(1,dt*10);
 tk+=dt;while(tk>=.1){tk-=.1;think(wd,L,P)}
 move(wd,L,dt);
}
function lights(){const a=[];for(const l of wd.lamps)if(l.lit)a.push({x:l.x,y:l.y,r2:25});if(P.carry)a.push({x:P.x,y:P.y,r2:49});return a}
let last=0;
function frame(t){
 const dt=Math.min(.05,(t-last)/1000||0);last=t;
 update(dt);render(L,P,buf,W,H,zb,wd.npcs.concat(wd.lamps,wd.doors),lights());ctx.putImageData(img,0,0);requestAnimationFrame(frame);
}
function fit(){const s=Math.max(1,Math.floor(Math.min(innerWidth/W,innerHeight/H)));cv.style.width=W*s+'px';cv.style.height=H*s+'px'}
function go(){build($('seed').value.trim());$('seed').blur()}

addEventListener('keydown',e=>{if(e.target.tagName=='INPUT'){if(e.key=='Enter')go();return}
 if(e.code.startsWith('Arrow')||e.code=='Space')e.preventDefault();keys[e.code]=1;
 if(e.code=='KeyE'&&!e.repeat)interact(wd,L,P)});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('resize',fit);
cv.addEventListener('click',()=>cv.requestPointerLock&&cv.requestPointerLock());
addEventListener('mousemove',e=>{if(document.pointerLockElement==cv){P.a+=e.movementX*.0025;P.pitch=Math.max(-50,Math.min(50,P.pitch-e.movementY*.5))}});
$('go').onclick=go;
$('rnd').onclick=()=>build(Math.random().toString(36).slice(2,8));
fit();build(decodeURIComponent(location.hash.slice(1))||'dream');requestAnimationFrame(frame);
})();
