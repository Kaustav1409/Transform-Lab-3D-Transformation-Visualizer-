'use strict';

/* Inject bg orbs */
[1,2,3].forEach(i=>{const d=document.createElement('div');d.className=`bg-orb bg-orb-${i}`;document.body.prepend(d);});

const DEG = Math.PI/180;
function eid(id){return document.getElementById(id);}
function setFill(el){el.style.setProperty('--f',((+el.value-+el.min)/(+el.max-+el.min)*100)+'%');}

function buildMat(id,cols,vals){
  const g=eid(id); if(!g)return;
  g.className='mat mat-'+cols;
  if(g.children.length!==vals.length){g.innerHTML='';vals.forEach(()=>{const d=document.createElement('div');d.className='mc';g.appendChild(d);});}
  [...g.children].forEach((d,i)=>{const v=vals[i];d.textContent=v.toFixed(2);d.classList.toggle('hi',Math.abs(v)>.001&&Math.abs(v-1)>.001);});
}

/* Stars */
(function(){
  const c=eid('stars-bg'); if(!c)return;
  const ctx=c.getContext('2d');
  const COLORS=['rgba(180,210,255,','rgba(120,200,255,','rgba(200,220,255,','rgba(100,180,255,'];
  let W,H,stars=[];
  function init(){W=c.width=innerWidth;H=c.height=document.body.scrollHeight||innerHeight;stars=Array.from({length:300},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.15,a:Math.random(),da:(Math.random()-.5)*.008,col:COLORS[Math.floor(Math.random()*COLORS.length)]}));}
  function draw(){ctx.clearRect(0,0,W,H);stars.forEach(s=>{s.a=Math.max(.04,Math.min(1,s.a+s.da));if(s.a<=.04||s.a>=1)s.da*=-1;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fillStyle=s.col+s.a+')';ctx.fill();});requestAnimationFrame(draw);}
  window.addEventListener('resize',init);init();draw();
})();

/* Scroll reveal */
const io=new IntersectionObserver(e=>{e.forEach(el=>{if(el.isIntersecting){el.target.classList.add('visible');io.unobserve(el.target);}});},{threshold:.12});
document.querySelectorAll('.reveal,.reveal-right').forEach(el=>io.observe(el));

/* Axis gizmo */
function drawGizmo(canvasId,rx,ry){
  const c=eid(canvasId); if(!c)return;
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,L=25;
  ctx.clearRect(0,0,W,H);
  const cosRx=Math.cos(rx*DEG),sinRx=Math.sin(rx*DEG),cosRy=Math.cos(ry*DEG),sinRy=Math.sin(ry*DEG);
  function proj(x3,y3,z3){const x1=x3*cosRy+z3*sinRy;return{x:cx+x1,y:cy-(y3*cosRx-(-x3*sinRy+z3*cosRy)*sinRx)};}
  function arrow(x3,y3,z3,col,lbl){const p=proj(x3,y3,z3);ctx.save();ctx.shadowColor=col;ctx.shadowBlur=6;ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();ctx.fillStyle=col;ctx.font='bold 9px monospace';ctx.fillText(lbl,p.x+2,p.y+3);}
  arrow(L,0,0,'#f97316','X');arrow(0,L,0,'#22c55e','Y');arrow(0,0,-L,'#3b82f6','Z');
  ctx.save();ctx.shadowColor='rgba(255,255,255,.6)';ctx.shadowBlur=4;ctx.beginPath();ctx.arc(cx,cy,3,0,6.28);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fill();ctx.restore();
}

/* Drag-to-orbit */
function makeDraggable(wrapId,onDrag){
  const el=eid(wrapId); if(!el)return;
  let drag=false,lx=0,ly=0,baseRx=-18,baseRy=30;
  function start(x,y){drag=true;lx=x;ly=y;}
  function move(x,y){if(!drag)return;baseRy+=(x-lx)*.45;baseRx-=(y-ly)*.30;baseRx=Math.max(-80,Math.min(80,baseRx));lx=x;ly=y;onDrag(baseRx,baseRy);}
  function end(){drag=false;}
  el.addEventListener('mousedown',e=>{start(e.clientX,e.clientY);e.preventDefault();});
  window.addEventListener('mousemove',e=>{if(drag)move(e.clientX,e.clientY);});
  window.addEventListener('mouseup',end);
  el.addEventListener('touchstart',e=>{if(e.touches.length===1)start(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  window.addEventListener('touchmove',e=>{if(e.touches.length===1)move(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  window.addEventListener('touchend',end);
  return()=>({rx:baseRx,ry:baseRy});
}

/* Scroll-zoom */
function addZoom(sceneId){
  const sc=eid(sceneId); if(!sc)return;
  let persp=600;
  sc.addEventListener('wheel',e=>{e.preventDefault();persp=Math.max(200,Math.min(1400,persp+e.deltaY*1.2));sc.style.perspective=persp+'px';},{passive:false});
}

/* Nav highlight */
function initNav(pageKey){
  document.querySelectorAll('.nav-link').forEach(l=>{l.classList.toggle('active',l.dataset.page===pageKey);});
}
