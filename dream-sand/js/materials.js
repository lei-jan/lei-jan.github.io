// Material ids
const M={E:0,STONE:1,SAND:2,WATER:3,OIL:4,WOOD:5,FIRE:6,SMOKE:7,STEAM:8,ASH:9,LAVA:10,FOG:11,PLANT:12};
// s: 1 solid, 2 powder, 3 liquid, 4 gas | d: density | c: rgb | a: opacity
// f: chance to ignite per tick when touching fire | mv: chance to move per tick
// To add a material: add one entry here (and a rule in sim.js if it needs special behavior).
const BASE=[
 {n:'empty',s:0,d:0,c:[0,0,0],a:0},
 {n:'stone',s:1,d:9,c:[96,96,112],a:1},
 {n:'sand',s:2,d:5,c:[214,190,120],a:1},
 {n:'water',s:3,d:3,c:[60,110,210],a:.85,mv:1},
 {n:'oil',s:3,d:2,c:[74,52,44],a:.92,mv:.8,f:.6},
 {n:'wood',s:1,d:8,c:[112,76,46],a:1,f:.08},
 {n:'fire',s:4,d:0,c:[255,150,40],a:1},
 {n:'smoke',s:4,d:0,c:[90,90,100],a:.45},
 {n:'steam',s:4,d:0,c:[205,218,232],a:.4},
 {n:'ash',s:2,d:4,c:[140,140,148],a:1},
 {n:'lava',s:3,d:7,c:[255,90,20],a:1,mv:.2},
 {n:'fog',s:4,d:0,c:[226,231,242],a:.35},
 {n:'plant',s:1,d:8,c:[70,160,84],a:1,f:.15}
];
