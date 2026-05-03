import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createScene(canvas, opts={}) {
  const A = opts.accent || 0x00e5ff;
  const Ac = new THREE.Color(A);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030610);
  scene.fog = new THREE.FogExp2(0x030610, 0.014);

  const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 18);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.shadowMap.enabled = true;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 1.4, 0.7, 0.04);
  composer.addPass(bloom);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.04;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.25;
  controls.minDistance = 3;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI * 0.82;

  // Lights
  scene.add(new THREE.AmbientLight(0x080f28, 5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);
  const lights = [
    new THREE.PointLight(A, 10, 70),
    new THREE.PointLight(0x7c3aed, 7, 60),
    new THREE.PointLight(0x0050ff, 5, 55),
    new THREE.PointLight(A, 4, 40),
  ];
  lights[0].position.set(8,10,5); lights[1].position.set(-10,8,-8);
  lights[2].position.set(0,-3,14); lights[3].position.set(-6,5,8);
  lights.forEach(l=>scene.add(l));

  // Grids
  const Gc = new THREE.Color(A).multiplyScalar(0.55);
  const g1 = new THREE.GridHelper(240, 80, A, Gc.getHex());
  g1.position.y=-5; g1.material.transparent=true; g1.material.opacity=0.55;
  scene.add(g1);
  const g2 = new THREE.GridHelper(600, 60, 0x001a2a, 0x000e18);
  g2.position.y=-5; g2.material.transparent=true; g2.material.opacity=0.30;
  scene.add(g2);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(600,600),
    new THREE.MeshStandardMaterial({color:0x010912, metalness:0.95, roughness:0.06, transparent:true, opacity:0.75})
  );
  floor.rotation.x=-Math.PI/2; floor.position.y=-5.02; scene.add(floor);

  // Particle layers
  function mkPts(n, spread, sz, col, op) {
    const pos=new Float32Array(n*3);
    for(let i=0;i<n*3;i+=3){pos[i]=(Math.random()-.5)*spread;pos[i+1]=(Math.random()-.5)*(spread*.35);pos[i+2]=(Math.random()-.5)*spread;}
    const pts=new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(pos,3)),
      new THREE.PointsMaterial({color:col,size:sz,transparent:true,opacity:op,depthWrite:false,sizeAttenuation:true})
    );
    scene.add(pts); return pts;
  }
  const p1=mkPts(2000, 280, 0.14, A, 0.50);
  const p2=mkPts(1000, 400, 0.07, 0xffffff, 0.20);
  const p3=mkPts(500,  150, 0.20, A, 0.18);

  // Environment — distant icosahedra
  const env=[];
  for(let i=0;i<16;i++){
    const sz=1.5+Math.random()*3.5;
    const geo=new THREE.IcosahedronGeometry(sz,1);
    const mat=new THREE.MeshStandardMaterial({
      color:A, emissive:Ac.clone().multiplyScalar(0.12), wireframe:true,
      transparent:true, opacity:0.08+Math.random()*0.12
    });
    const m=new THREE.Mesh(geo,mat);
    const ang=(i/16)*Math.PI*2, r=28+Math.random()*40;
    m.position.set(Math.cos(ang)*r,(Math.random()-.5)*20+3,Math.sin(ang)*r);
    m.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
    m.userData.r={x:(Math.random()-.5)*.003,y:(Math.random()-.5)*.004,z:(Math.random()-.5)*.002};
    scene.add(m); env.push(m);
  }
  // Panels
  for(let i=0;i<14;i++){
    const w=4+Math.random()*6, h=1.5+Math.random()*4;
    const geo=new THREE.PlaneGeometry(w,h);
    const mat=new THREE.MeshStandardMaterial({
      color:0x001428, emissive:Ac.clone().multiplyScalar(0.04),
      metalness:0.9, roughness:0.1, transparent:true, opacity:0.25, side:THREE.DoubleSide
    });
    const p=new THREE.Mesh(geo,mat);
    p.position.set((Math.random()-.5)*80,(Math.random()-.5)*18+2,(Math.random()-.5)*80);
    p.rotation.y=Math.random()*Math.PI; p.rotation.x=(Math.random()-.5)*.5;
    p.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({color:A, transparent:true, opacity:0.22})));
    p.userData.r={y:(Math.random()-.5)*.0015};
    scene.add(p); env.push(p);
  }
  // Tori
  for(let i=0;i<10;i++){
    const r=2.5+Math.random()*4, tube=0.04+Math.random()*.08;
    const mat=new THREE.MeshStandardMaterial({
      color:A, emissive:Ac.clone().multiplyScalar(0.5), transparent:true, opacity:0.28+Math.random()*.18
    });
    const tor=new THREE.Mesh(new THREE.TorusGeometry(r,tube,8,90),mat);
    const ang=(i/10)*Math.PI*2+.3, dist=18+Math.random()*25;
    tor.position.set(Math.cos(ang)*dist,(Math.random()-.5)*12,Math.sin(ang)*dist);
    tor.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0);
    tor.userData.r={x:(Math.random()-.5)*.006,y:(Math.random()-.5)*.004};
    scene.add(tor); env.push(tor);
  }
  // Vertical pillars
  for(let i=0;i<8;i++){
    const h=8+Math.random()*16;
    const geo=new THREE.CylinderGeometry(.06,.06,h,6);
    const mat=new THREE.MeshStandardMaterial({color:A,emissive:Ac.clone().multiplyScalar(0.8),transparent:true,opacity:0.35});
    const m=new THREE.Mesh(geo,mat);
    const ang=(i/8)*Math.PI*2, r=20+Math.random()*18;
    m.position.set(Math.cos(ang)*r,-5+h/2,Math.sin(ang)*r);
    scene.add(m);
  }

  // Background sphere
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(450,32,16),
    new THREE.MeshBasicMaterial({color:0x010508,side:THREE.BackSide})
  ));

  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight);
  });

  let t=0;
  function tick(){
    t+=.005;
    requestAnimationFrame(tick);
    env.forEach(o=>{if(o.userData.r){o.rotation.x+=o.userData.r.x||0;o.rotation.y+=o.userData.r.y||0;o.rotation.z+=o.userData.r.z||0;}});
    lights[0].position.set(Math.sin(t*.5)*18,10,Math.cos(t*.3)*16);
    lights[1].position.set(Math.cos(t*.4)*16,8,Math.sin(t*.6)*14);
    lights[2].position.set(Math.sin(t*.7)*12,-3,Math.cos(t*.5)*18);
    lights[3].position.set(Math.cos(t*.3)*10,5,Math.sin(t*.4)*12);
    p1.rotation.y+=.00018; p2.rotation.y-=.0001; p3.rotation.x+=.00008;
    if(opts.onTick) opts.onTick(t, scene, camera);
    controls.update();
    composer.render();
  }
  requestAnimationFrame(tick);  // defer so page module code runs first
  return {scene, camera, renderer, composer, controls, lights};
}

export function glowCube(size, color, emissive, opacity=0.7){
  const g=new THREE.Group();
  const geo=new THREE.BoxGeometry(size,size,size);
  g.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({
    color, emissive, emissiveIntensity:1.0, metalness:.5, roughness:.3, transparent:true, opacity
  })));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({color, transparent:true, opacity:.95})));
  return g;
}
