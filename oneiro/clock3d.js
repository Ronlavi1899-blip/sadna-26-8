// ONEIRO 3D product model (three.js). Shared by the site and the still-render page.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function dialTexture(maxAniso, dark, cream) {
  const INK = dark ? '#e8e6e1' : '#1e1e1c', INK2 = dark ? 'rgba(232,230,225,' : 'rgba(30,30,28,';
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), R = S / 2;
  g.translate(R, R);
  const grd = g.createRadialGradient(0, -R * .2, R * .1, 0, 0, R);
  if (dark) { grd.addColorStop(0, '#2a2b2e'); grd.addColorStop(.85, '#222326'); grd.addColorStop(1, '#1a1b1d'); } else if (cream) { grd.addColorStop(0, '#f3ece0'); grd.addColorStop(.85, '#ebe1d1'); grd.addColorStop(1, '#ddd0bc'); } else { grd.addColorStop(0, '#f7f6f2'); grd.addColorStop(.85, '#efede8'); grd.addColorStop(1, '#e4e1db'); }
  g.fillStyle = grd; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
  // fine outer track
  g.strokeStyle = INK2 + '.55)'; g.lineWidth = 2.5;
  g.beginPath(); g.arc(0, 0, R * .955, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, hour = i % 5 === 0;
    const r1 = R * .945, r2 = hour ? R * .80 : R * .905;
    g.strokeStyle = hour ? INK : INK2 + '.7)';
    g.lineWidth = hour ? (i === 0 ? 0 : 16) : 4; g.lineCap = 'butt';
    if (g.lineWidth) { g.beginPath(); g.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1); g.lineTo(Math.sin(a) * r2, -Math.cos(a) * r2); g.stroke(); }
  }
  // twin bars at 12
  g.fillStyle = INK;
  g.fillRect(-26, -R * .945, 14, R * .145); g.fillRect(12, -R * .945, 14, R * .145);
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '300 66px "Helvetica Neue", Helvetica, Arial, sans-serif';
  try { g.letterSpacing = '26px'; } catch (e) {}
  g.fillText('EASY DREAMS', 13, -R * .36);
  g.font = '400 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
  try { g.letterSpacing = '12px'; } catch (e) {}
  g.fillStyle = INK2 + '.55)';
  g.fillText('DREAM RECORDER', 6, R * .40);
  g.fillStyle = '#d9572b'; g.beginPath(); g.arc(0, R * .50, 9, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
}

function grilleTexture(dark) {
  const W = 1024, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = dark ? '#151517' : '#3a3936';
  for (let y = 0; y < 5; y++) for (let x = 0; x < 22; x++) {
    g.beginPath(); g.arc(46 + x * 44 + (y % 2) * 22, 40 + y * 44, 12, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const FINISHES = {
  stone:    { body: 0xd9d8d4, rough: .78, hand: 0x1b1b1a, diff: 0xcfccc6, led: 0xc4c1bb, metal: 0xd4d3cf, dial: 'light' },
  graphite: { body: 0x36373a, rough: .7,  hand: 0xeeede9, diff: 0x2c2d30, led: 0x2c2d30, metal: 0xd4d3cf, dial: 'dark' },
  mocha:    { body: 0x5a4436, rough: .72, hand: 0x231b16, diff: 0x46352a, led: 0x46352a, metal: 0xd9c7a8, dial: 'cream' },
};
const VIOLET = new THREE.Color(0x8a6cf0), AMBER = new THREE.Color(0xffa25e);
export function createClock(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve });
  renderer.setPixelRatio(opts.pixelRatio || Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, .1, 300);
  camera.position.set(opts.camX ?? 16, 10.5, 47);
  const target = new THREE.Vector3(0, -.3, 0);
  camera.lookAt(target);

  const aniso = renderer.capabilities.getMaxAnisotropy();
  const F = FINISHES[opts.finish] || FINISHES.stone, G = F.dial === 'dark';
  const M = {
    body: new THREE.MeshPhysicalMaterial({ color: F.body, roughness: F.rough, metalness: 0, clearcoat: .1, clearcoatRoughness: .6 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x2a2a2b, roughness: .8 }),
    champagne: new THREE.MeshStandardMaterial({ color: F.metal, metalness: 1, roughness: .32, envMapIntensity: 1.4 }),
    hand: new THREE.MeshStandardMaterial({ color: F.hand, metalness: .1, roughness: .5 }),
    second: new THREE.MeshStandardMaterial({ color: 0xd9572b, metalness: .2, roughness: .45 }),
    diffuser: new THREE.MeshStandardMaterial({ color: F.diff, roughness: .9, emissive: 0xffa25e, emissiveIntensity: 0 }),
    led: new THREE.MeshStandardMaterial({ color: F.led, roughness: .6, emissive: 0xff3b2f, emissiveIntensity: 0 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .03, metalness: 0, transparent: true, opacity: .16, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false }),
  };

  const clock = new THREE.Group(); scene.add(clock);
  const add = (geo, mat, cast = true, recv = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; clock.add(m); return m; };

  add(new RoundedBoxGeometry(16, 16, 5.2, 10, 2.6), M.body);
  const pl = add(new RoundedBoxGeometry(9, .4, 3, 4, .15), M.plinth); pl.position.y = -8.1;

  const FZ = 2.6; // front face
  const diff = add(new THREE.RingGeometry(5.2, 5.38, 160), M.diffuser, false); diff.position.z = FZ + .006;
  const bez = add(new THREE.TorusGeometry(5.0, .07, 24, 180), M.champagne); bez.position.z = FZ + .03;
  const dial = add(new THREE.CircleGeometry(4.98, 160), new THREE.MeshStandardMaterial({ map: dialTexture(aniso, G, F.dial === 'cream'), roughness: .85 }), false); dial.position.z = FZ + .012;

  function hand(w, len, back, depth, mat, z) {
    const geo = new THREE.BoxGeometry(w, len + back, depth); geo.translate(0, (len - back) / 2, 0);
    const m = add(geo, mat, true, false); m.position.z = z; return m;
  }
  const hHour = hand(.28, 2.6, .4, .05, M.hand, FZ + .16);
  const hMin = hand(.2, 3.95, .5, .05, M.hand, FZ + .24);
  const hSec = hand(.055, 4.3, 1.1, .03, M.second, FZ + .31);
  const cap = add(new THREE.CylinderGeometry(.3, .3, .14, 48), M.champagne); cap.rotation.x = Math.PI / 2; cap.position.z = FZ + .36;

  const R = 40, th = Math.asin(5.02 / R);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 160, 24, 0, Math.PI * 2, 0, th), M.glass);
  dome.rotation.x = Math.PI / 2; dome.position.z = FZ + .05 - R * Math.cos(th); dome.renderOrder = 5; clock.add(dome);

  // top: crown record button + speaker grille
  const TOP = 8.0;
  const crown = add(new THREE.CylinderGeometry(.85, .85, .16, 96), M.champagne); crown.position.set(4.0, TOP + .07, 0);
  const led = add(new THREE.TorusGeometry(1.02, .05, 16, 96), M.led, false); led.rotation.x = Math.PI / 2; led.position.set(4.0, TOP + .005, 0);
  const gr = add(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshStandardMaterial({ map: grilleTexture(G), transparent: true, roughness: .9 }), false);
  gr.rotation.x = -Math.PI / 2; gr.position.set(-2.0, TOP + .004, 0);

  // floor + lights
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -8.3; floor.receiveShadow = true; scene.add(floor);
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-14, 24, 20); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
  key.shadow.bias = -.0004; key.shadow.normalBias = .03; scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, .35));
  const warm = new THREE.PointLight(0xff9d5c, 0, 40, 2); warm.position.set(0, 0, 9); scene.add(warm);

  let controls = null;
  if (opts.controls) {
    controls = new OrbitControls(camera, canvas); controls.target.copy(target);
    controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true;
    controls.minAzimuthAngle = -.9; controls.maxAzimuthAngle = .9; controls.minPolarAngle = 1.0; controls.maxPolarAngle = 1.75;
  }

  function resize() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < .9 ? 34 : 26; camera.updateProjectionMatrix();
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  const api = {
    setTime(h, m, s = 0) {
      const sec = s, min = m + sec / 60, hr = (h % 12) + min / 60;
      hSec.rotation.z = -sec / 60 * Math.PI * 2;
      hMin.rotation.z = -min / 60 * Math.PI * 2;
      hHour.rotation.z = -hr / 12 * Math.PI * 2;
    },
    setGlow(v) {
      M.diffuser.emissiveIntensity = v * 2.2;
      M.diffuser.emissive.lerpColors(VIOLET, AMBER, Math.min(1, v * 1.4));
      warm.intensity = v * 70;
    },
    setRecording(on) { M.led.emissiveIntensity = on ? 3 : 0; },
    setFinish(name) {
      const f = FINISHES[name]; if (!f) return;
      M.body.color.setHex(f.body); M.body.roughness = f.rough; M.hand.color.setHex(f.hand);
      M.diffuser.color.setHex(f.diff); M.led.color.setHex(f.led); M.champagne.color.setHex(f.metal);
      const old = dial.material.map; dial.material.map = dialTexture(aniso, f.dial === 'dark', f.dial === 'cream'); dial.material.needsUpdate = true; old && old.dispose();
    },
    setExposure(v) { renderer.toneMappingExposure = v; },
    render() { controls && controls.update(); renderer.render(scene, camera); },
    renderer, scene, camera,
  };
  api.setTime(10, 8, 36); api.setGlow(0);
  if (opts.animate) { const loop = () => { api.render(); requestAnimationFrame(loop); }; loop(); }
  return api;
}
