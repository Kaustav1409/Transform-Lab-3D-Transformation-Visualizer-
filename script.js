'use strict';
/* inject bg orbs */
[1,2,3].forEach(i=>{const d=document.createElement('div');d.className=`bg-orb bg-orb-${i}`;document.body.prepend(d);});
const DEG=Math.PI/180;
function eid(id){return document.getElementById(id);}
function setFill(el){el.style.setProperty('--f',((+el.value-+el.min)/(+el.max-+el.min)*100)+'%');}
function buildMat(id,cols,vals){
  const g=eid(id);g.className='mat mat-'+cols;
  if(g.children.length!==vals.length){g.innerHTML='';vals.forEach(()=>{const d=document.createElement('div');d.className='mc';g.appendChild(d);});}
  [...g.children].forEach((d,i)=>{const v=vals[i];d.textContent=v.toFixed(2);d.classList.toggle('hi',Math.abs(v)>.001&&Math.abs(v-1)>.001);});
}

/* ═══ STARS ═══ */
(function(){
  const c=eid('stars-bg'),ctx=c.getContext('2d');
  const COLORS=['rgba(180,210,255,','rgba(120,200,255,','rgba(200,220,255,','rgba(100,180,255,'];
  let W,H,stars=[];
  function init(){W=c.width=innerWidth;H=c.height=document.body.scrollHeight||innerHeight;stars=Array.from({length:320},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.15,a:Math.random(),da:(Math.random()-.5)*.008,col:COLORS[Math.floor(Math.random()*COLORS.length)]}));}
  function draw(){ctx.clearRect(0,0,W,H);stars.forEach(s=>{s.a=Math.max(.04,Math.min(1,s.a+s.da));if(s.a<=.04||s.a>=1)s.da*=-1;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fillStyle=s.col+s.a+')';ctx.fill();});requestAnimationFrame(draw);}
  window.addEventListener('resize',init);init();draw();
})();

/* ═══ SCROLL REVEAL ═══ */
const io=new IntersectionObserver(e=>{e.forEach(el=>{if(el.isIntersecting){el.target.classList.add('visible');io.unobserve(el.target);}});},{threshold:.12});
document.querySelectorAll('.reveal,.reveal-right').forEach(el=>io.observe(el));

/* ═══ NAVBAR ACTIVE ═══ */
const sio=new IntersectionObserver(e=>{e.forEach(el=>{if(el.isIntersecting)document.querySelectorAll('.nav-link').forEach(l=>l.classList.toggle('active',l.dataset.section===el.target.id));});},{threshold:.4});
['hero','translation','rotation','scaling','reflection','projection'].forEach(id=>{const el=eid(id);if(el)sio.observe(el);});

/* ═══ AXIS GIZMO ═══ */
function drawGizmo(canvasId,rx,ry){
  const c=eid(canvasId);if(!c)return;
  const ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,L=25;
  ctx.clearRect(0,0,W,H);
  const cosRx=Math.cos(rx*DEG),sinRx=Math.sin(rx*DEG),cosRy=Math.cos(ry*DEG),sinRy=Math.sin(ry*DEG);
  function proj(x3,y3,z3){
    const x1=x3*cosRy+z3*sinRy,y1=y3,z1=-x3*sinRy+z3*cosRy;
    return{x:cx+x1,y:cy-(y1*cosRx-z1*sinRx)};
  }
  function arrow(x3,y3,z3,col,lbl){
    const p=proj(x3,y3,z3);
    ctx.save();ctx.shadowColor=col;ctx.shadowBlur=6;
    ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.stroke();
    ctx.restore();
    ctx.fillStyle=col;ctx.font='bold 9px monospace';ctx.fillText(lbl,p.x+2,p.y+3);
  }
  arrow(L,0,0,'#f97316','X');arrow(0,L,0,'#22c55e','Y');arrow(0,0,-L,'#3b82f6','Z');
  ctx.save();ctx.shadowColor='rgba(255,255,255,.6)';ctx.shadowBlur=4;
  ctx.beginPath();ctx.arc(cx,cy,3,0,6.28);ctx.fillStyle='rgba(255,255,255,.6)';ctx.fill();
  ctx.restore();
}

/* ═══ SCENE DRAG (orbit) ═══ */
function makeDraggable(wrapId,onDrag){
  const el=eid(wrapId);if(!el)return;
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
  return ()=>({rx:baseRx,ry:baseRy});
}
/* Scroll-to-zoom for a cube-scene element */
function addZoom(sceneId){
  const sc=eid(sceneId);if(!sc)return;
  let persp=600;
  sc.addEventListener('wheel',e=>{
    e.preventDefault();
    persp=Math.max(200,Math.min(1400,persp+e.deltaY*1.2));
    sc.style.perspective=persp+'px';
  },{passive:false});
}

/* ═══ 1. TRANSLATION ═══ */
let tBaseRx=-18,tBaseRy=30;
function updateT(rx,ry){
  if(rx!==undefined){tBaseRx=rx;tBaseRy=ry;}
  const tx=+eid('tx').value,ty=+eid('ty').value,tz=+eid('tz').value;
  eid('tx-v').textContent=tx;eid('ty-v').textContent=ty;eid('tz-v').textContent=tz;
  eid('tc-x').textContent=tx;eid('tc-y').textContent=ty;eid('tc-z').textContent=tz;
  eid('t-track').style.transform=`translate3d(${tx}px,${-ty}px,${tz*.4}px)`;
  eid('t-cube').style.transform=`rotateX(${tBaseRx}deg) rotateY(${tBaseRy}deg)`;
  const d=`translate(${(tx/10).toFixed(1)},${(ty/10).toFixed(1)},${(tz/10).toFixed(1)})`;
  eid('t-status').textContent=tx===0&&ty===0&&tz===0?'Cube is at origin (0, 0, 0)':`Moving by (${tx}, ${ty}, ${tz}) units`;
  buildMat('t-mat',4,[1,0,0,tx/10,0,1,0,ty/10,0,0,1,tz/10,0,0,0,1]);
  drawGizmo('ag-t',tBaseRx,tBaseRy);
}
makeDraggable('t-scene-wrap',(rx,ry)=>updateT(rx,ry));
['tx','ty','tz'].forEach(id=>{const el=eid(id);setFill(el);el.addEventListener('input',()=>{setFill(el);updateT();});});
function resetT(){['tx','ty','tz'].forEach(id=>{const el=eid(id);el.value=0;setFill(el);});updateT();}
updateT();

/* ═══ 2. ROTATION ═══ */
let rBaseRx=-18,rBaseRy=30,autoSpin=false,autoRAF,autoAngle=0;
function updateR(rx,ry){
  if(rx!==undefined){rBaseRx=rx;rBaseRy=ry;}
  const rx2=+eid('rx').value,ry2=+eid('ry').value,rz2=+eid('rz').value;
  eid('rx-v').textContent=rx2+'°';eid('ry-v').textContent=ry2+'°';eid('rz-v').textContent=rz2+'°';
  eid('rc-x').textContent=rx2+'°';eid('rc-y').textContent=ry2+'°';eid('rc-z').textContent=rz2+'°';
  eid('r-cube').style.transform=`rotateX(${rx2+rBaseRx}deg) rotateY(${ry2+rBaseRy}deg) rotateZ(${rz2}deg)`;
  const t=ry2*DEG,c=Math.cos(t),s=Math.sin(t);
  buildMat('r-mat',3,[c,0,s,0,1,0,-s,0,c]);
  eid('r-status').textContent=rx2===0&&ry2===0&&rz2===0?'No rotation applied':`Rx:${rx2}° Ry:${ry2}° Rz:${rz2}°`;
  drawGizmo('ag-r',rBaseRx,rBaseRy);
}
makeDraggable('r-scene-wrap',(rx,ry)=>updateR(rx,ry));
['rx','ry','rz'].forEach(id=>{const el=eid(id);setFill(el);el.addEventListener('input',()=>{setFill(el);updateR();});});
eid('auto-spin-btn').addEventListener('click',function(){
  autoSpin=!autoSpin;this.textContent=autoSpin?'⏸ Stop':'⏵ Auto Spin';this.classList.toggle('active',autoSpin);
  if(autoSpin)(function spin(){if(!autoSpin)return;autoAngle=(autoAngle+0.5)%360;const el=eid('ry');el.value=autoAngle;setFill(el);updateR();autoRAF=requestAnimationFrame(spin);})();
});
function resetR(){autoSpin=false;eid('auto-spin-btn').textContent='⏵ Auto Spin';eid('auto-spin-btn').classList.remove('active');['rx','ry','rz'].forEach(id=>{const el=eid(id);el.value=0;setFill(el);});updateR();}
updateR();

/* ═══ 3. SCALING ═══ */
let sBaseRx=-18,sBaseRy=30;
function updateS(rx,ry){
  if(rx!==undefined){sBaseRx=rx;sBaseRy=ry;}
  const sx=+eid('sx').value,sy=+eid('sy').value,sz=+eid('sz').value;
  eid('su-v').textContent=+eid('su').value+'×';
  eid('sx-v').textContent=sx.toFixed(2)+'×';eid('sy-v').textContent=sy.toFixed(2)+'×';eid('sz-v').textContent=sz.toFixed(2)+'×';
  eid('sc-x').textContent=sx.toFixed(2)+'×';eid('sc-y').textContent=sy.toFixed(2)+'×';eid('sc-z').textContent=sz.toFixed(2)+'×';
  eid('s-cube').style.transform=`rotateX(${sBaseRx}deg) rotateY(${sBaseRy}deg) scale3d(${sx},${sy},${sz})`;
  buildMat('s-mat',4,[sx,0,0,0,0,sy,0,0,0,0,sz,0,0,0,0,1]);
  const u=sx===sy&&sy===sz;
  eid('s-status').textContent=u?`Uniform scale: ${sx.toFixed(2)}×`:`Non-uniform: X${sx.toFixed(2)} Y${sy.toFixed(2)} Z${sz.toFixed(2)}`;
  drawGizmo('ag-s',sBaseRx,sBaseRy);
}
makeDraggable('s-scene-wrap',(rx,ry)=>updateS(rx,ry));
eid('su').addEventListener('input',function(){setFill(this);const v=+this.value;['sx','sy','sz'].forEach(id=>{const el=eid(id);el.value=v;setFill(el);});updateS();});
['sx','sy','sz'].forEach(id=>{const el=eid(id);setFill(el);el.addEventListener('input',()=>{setFill(el);updateS();});});
function setUniform(){const v=+eid('su').value;['sx','sy','sz'].forEach(id=>{const el=eid(id);el.value=v;setFill(el);});updateS();}
function resetS(){[['su',1],['sx',1],['sy',1],['sz',1]].forEach(([id,v])=>{const el=eid(id);el.value=v;setFill(el);});updateS();}
updateS();

/* ═══ 4. REFLECTION ═══ */
const REFL={
  YZ:{vals:[-1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],f:"P' = Myz · P",orig:'rotateX(-18deg) rotateY(30deg)',copy:'rotateX(-18deg) rotateY(150deg)',label:'Reflected across the YZ plane (x → −x)'},
  XZ:{vals:[1,0,0,0,0,-1,0,0,0,0,1,0,0,0,0,1],f:"P' = Mxz · P",orig:'rotateX(-18deg) rotateY(30deg)',copy:'rotateX(18deg) rotateY(30deg)',label:'Reflected across the XZ plane (y → −y)'},
  XY:{vals:[1,0,0,0,0,1,0,0,0,0,-1,0,0,0,0,1],f:"P' = Mxy · P",orig:'rotateX(-18deg) rotateY(30deg)',copy:'rotateX(-18deg) rotateY(210deg)',label:'Reflected across the XY plane (z → −z)'},
};
function applyRefl(axis){
  const d=REFL[axis];
  eid('refl-orig').style.transform=d.orig;
  eid('refl-copy').style.transform=d.copy;
  eid('refl-formula').textContent=d.f;
  eid('m-status').textContent=d.label;
  buildMat('m-mat',4,d.vals);
}
document.querySelectorAll('.btn-plane').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.btn-plane').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');applyRefl(btn.dataset.plane);
  });
});
applyRefl('YZ');

/* ═══ 5. PROJECTION ═══ */
function updateProj(){
  const d=+eid('persp-d').value,ry=+eid('proj-ry').value;
  eid('persp-d-v').textContent=d+'px';eid('proj-ry-v').textContent=ry+'°';
  eid('pi-d').textContent=d+'px';
  eid('p-persp-scene').style.perspective=d+'px';
  eid('p-persp').style.transform=`rotateX(-18deg) rotateY(${ry}deg)`;
  eid('p-ortho').style.transform=`rotateX(-18deg) rotateY(${ry}deg)`;
  eid('p-status').textContent=d<400?`Strong perspective (d=${d}px) — depth exaggerated`:`Mild perspective (d=${d}px) — near orthographic`;
}
['persp-d','proj-ry'].forEach(id=>{const el=eid(id);setFill(el);el.addEventListener('input',()=>{setFill(el);updateProj();});});
updateProj();

/* ═══ PARALLAX HERO ═══ */
document.addEventListener('mousemove',e=>{
  const hv=document.querySelector('.hero-visual');
  if(hv){const nx=(e.clientX/innerWidth-.5)*2,ny=(e.clientY/innerHeight-.5)*2;hv.style.transform=`translateY(${ny*8}px) translateX(${nx*4}px)`;}
});

/* ═══ SCROLL-TO-ZOOM: wire all scenes ═══ */
['t-scene','r-scene','s-scene'].forEach(id=>addZoom(id));

/* ═══ KEYBOARD SHORTCUTS ═══ */
const SECTION_MAP={'1':'translation','2':'rotation','3':'scaling','4':'reflection','5':'projection'};
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  const sec=SECTION_MAP[e.key];
  if(sec){document.getElementById(sec).scrollIntoView({behavior:'smooth'});return;}
  if(e.key==='r'||e.key==='R'){
    // reset whichever section is most visible
    const visible=Object.entries(SECTION_MAP).find(([,id])=>{const el=document.getElementById(id);if(!el)return false;const r=el.getBoundingClientRect();return r.top<innerHeight/2&&r.bottom>0;});
    if(visible){
      const s=visible[1];
      if(s==='translation')resetT();
      else if(s==='rotation')resetR();
      else if(s==='scaling')resetS();
    }
  }
});
