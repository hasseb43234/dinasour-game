'use strict';
/* ================= AMBERFALL — core: utils, terrain, scene, vegetation ================= */
const T = THREE;
const $ = s => document.querySelector(s);
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const lerpAngle = (a, b, t) => { let d = (b - a + Math.PI) % (Math.PI * 2); if (d < 0) d += Math.PI * 2; return a + (d - Math.PI) * Math.min(1, t); };
function mulberry(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(x, z) { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v) * 2 - 1;
}
const fbm = (x, z) => vnoise(x, z) * .55 + vnoise(x * 2.1, z * 2.1) * .28 + vnoise(x * 4.3, z * 4.3) * .17;

/* ---------- audio (tiny synth) ---------- */
let AC = null;
function initAudio() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
const SFX = { hit: [170, 60, .12, 'square', .14], shoot: [520, 170, .16, 'triangle', .12], pick: [640, 980, .1, 'sine', .1], craft: [420, 860, .22, 'triangle', .12], roar: [150, 42, .9, 'sawtooth', .2], hurt: [230, 90, .22, 'sawtooth', .14], coin: [900, 1500, .18, 'sine', .1], chop: [120, 70, .08, 'square', .16], ui: [700, 720, .05, 'sine', .05], win: [520, 1040, .55, 'triangle', .14], boom: [90, 30, .5, 'sawtooth', .22], kick: [130, 42, .2, 'sine', .3], hat: [1800, 1400, .04, 'square', .03] };
function sfx(kind) {
  if (!AC) return; const p = SFX[kind]; if (!p) return;
  try {
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.connect(g); g.connect(AC.destination);
    o.type = p[3]; o.frequency.setValueAtTime(p[0], t); o.frequency.exponentialRampToValueAtTime(p[1], t + p[2]);
    g.gain.setValueAtTime(p[4], t); g.gain.exponentialRampToValueAtTime(.001, t + p[2]); o.start(t); o.stop(t + p[2] + .03);
  } catch (e) { }
}

/* ---------- world layout ---------- */
const WORLD = 660, HALF = 330;
const VOLC = { x: -170, z: -190 }, LAKE = { x: 70, z: 60, r: 62 }, OUTPOST = { x: 160, z: -100, h: 9, r: 18 }, SPAWN = { x: 6, z: 26 }, FOSSIL = { x: -62, z: 74 };
function terrainH(x, z) {
  let h = 7 + fbm(x * .006 + 10, z * .006 + 10) * 13 + fbm(x * .03, z * .03) * 2.2;
  h -= 17 * smooth(1 - dist2(x, z, LAKE.x, LAKE.z) / LAKE.r);
  const dv = dist2(x, z, VOLC.x, VOLC.z);
  if (dv < 110) { h += 85 * Math.pow(1 - dv / 110, 1.6); if (dv < 18) h -= (18 - dv) * 2.2; }
  const dc = Math.hypot(x, z); if (dc > 255) h -= (dc - 255) * .35;
  const dO = dist2(x, z, OUTPOST.x, OUTPOST.z); if (dO < 42) h = lerp(h, OUTPOST.h, smooth(1 - (dO - 24) / 18));
  const dS = dist2(x, z, SPAWN.x, SPAWN.z); if (dS < 16) h = lerp(h, Math.max(h, 2.2), smooth(1 - dS / 16));
  return h;
}
const floors = new Map();
const cellKey = (cx, cz) => cx + ',' + cz;
function groundH(x, z) {
  const t = terrainH(x, z), f = floors.get(cellKey(Math.round(x / 4), Math.round(z / 4)));
  return f !== undefined ? Math.max(t, f) : t;
}

/* ---------- renderer / scene ---------- */
const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.domElement.id = 'gl';
document.body.prepend(renderer.domElement);
const scene = new T.Scene();
scene.fog = new T.Fog(0xbfd9ea, 90, 560);
const camera = new T.PerspectiveCamera(62, 1, .1, 1400);
scene.add(camera);
const hemi = new T.HemisphereLight(0xcfe6ff, 0x7a7258, 1.0); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff1d6, 2.4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006; sun.shadow.normalBias = .06;
Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 320 });
scene.add(sun); scene.add(sun.target);
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* sky dome */
const skyU = { top: { value: new T.Color(0x3f86d6) }, bot: { value: new T.Color(0xbfd9ea) } };
const sky = new T.Mesh(new T.SphereGeometry(1100, 20, 12), new T.ShaderMaterial({
  uniforms: skyU, side: T.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: 'uniform vec3 top;uniform vec3 bot;varying float h;void main(){gl_FragColor=vec4(mix(bot,top,pow(clamp(h*1.25,0.,1.),.6)),1.);}'
}));
scene.add(sky);
const sunDisc = new T.Mesh(new T.SphereGeometry(26, 12, 8), new T.MeshBasicMaterial({ color: 0xfff3c4, fog: false })); scene.add(sunDisc);
const clouds = new T.Group(); scene.add(clouds);
{
  const cm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .82, fog: false }), cg = new T.SphereGeometry(1, 7, 5);
  for (let i = 0; i < 26; i++) { const c = new T.Group(); for (let j = 0; j < 4; j++) { const m = new T.Mesh(cg, cm); m.position.set(rand(-22, 22), rand(-3, 3), rand(-10, 10)); m.scale.set(rand(14, 26), rand(5, 9), rand(10, 18)); c.add(m); } c.position.set(rand(-700, 700), rand(150, 230), rand(-700, 700)); clouds.add(c); }
}
const SKYC = { dTop: new T.Color(0x3f86d6), dBot: new T.Color(0xc3dcec), sBot: new T.Color(0xf5a25d), sTop: new T.Color(0x5a5f9e), nTop: new T.Color(0x0a1228), nBot: new T.Color(0x24324e) };
let nightF = 0;
function updateSky(dayT, focus) {
  const a = dayT * Math.PI * 2, sh = Math.sin(a);
  const day = smooth((sh + .12) / .3), dusk = 1 - smooth(Math.abs(sh) / .38);
  nightF = 1 - day;
  skyU.top.value.copy(SKYC.nTop).lerp(SKYC.dTop, day).lerp(SKYC.sTop, dusk * .55);
  skyU.bot.value.copy(SKYC.nBot).lerp(SKYC.dBot, day).lerp(SKYC.sBot, dusk * .8);
  scene.fog.color.copy(skyU.bot.value);
  const dir = new T.Vector3(Math.cos(a) * .75, sh, .45).normalize();
  sunDisc.position.copy(focus).addScaledVector(dir, 950); sunDisc.material.color.setHex(sh > 0 ? 0xfff3c4 : 0xdfe8ff); sunDisc.scale.setScalar(sh > 0 ? 1 : .0001);
  const ld = sh > 0 ? dir : dir.clone().multiplyScalar(-1); if (ld.y < .18) { ld.y = .18; ld.normalize(); }
  sun.position.copy(focus).addScaledVector(ld, 140); sun.target.position.copy(focus);
  sun.intensity = lerp(.7, 2.1, day) * (1 - dusk * .35); sun.color.setHex(sh > 0 ? 0xfff1d6 : 0x8fa8ff).lerp(SKYC.sBot, sh > 0 ? dusk * .6 : 0);
  hemi.intensity = lerp(.62, 1.45, day); sky.position.copy(focus);
  clouds.children.forEach(c => { c.position.x += .012; if (c.position.x > 720) c.position.x = -720; c.children[0].material.opacity = lerp(.18, .82, day); });
}

/* ---------- geometry helpers ---------- */
const MAT = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .86, metalness: 0 });
const MAT_DS = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .86, side: T.DoubleSide });
const G = {
  sph: (r = 1, w = 8, h = 6) => new T.SphereGeometry(r, w, h), box: (x, y, z) => new T.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 7) => new T.CylinderGeometry(a, b, h, s), cone: (r, h, s = 6) => new T.ConeGeometry(r, h, s),
  ico: (r = 1, d = 0) => new T.IcosahedronGeometry(r, d)
};
const M = (x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) =>
  new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(sx, sy, sz));
function merged(parts) {
  const pos = [], col = [], c = new T.Color();
  for (const [g0, color, m] of parts) {
    const g = g0.index ? g0.toNonIndexed() : g0; if (m) g.applyMatrix4(m);
    const p = g.attributes.position.array; c.set(color);
    for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); col.push(c.r, c.g, c.b); }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); return g;
}
function mesh(parts, mat) { const m = new T.Mesh(merged(parts), mat || MAT); m.castShadow = true; return m; }
function makeTag(text, color = '#c8ff2e') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.font = '700 30px "Bahnschrift","Arial Narrow",Arial,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(8,12,10,.55)'; const w = x.measureText(text).width + 28; x.fillRect(128 - w / 2, 12, w, 40);
  x.fillStyle = color; x.fillText(text, 128, 33);
  const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false, transparent: true })); s.scale.set(1.7, .425, 1); s.renderOrder = 5; return s;
}

/* ---------- terrain + water ---------- */
function buildTerrain() {
  const N = 180, g = new T.PlaneGeometry(WORLD, WORLD, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new T.Color(), c2 = new T.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = terrainH(x, z); p.setY(i, h);
    const sl = Math.hypot(terrainH(x + 2, z) - h, terrainH(x, z + 2) - h) / 2, n = vnoise(x * .05, z * .05);
    if (h < .7) c.set(0xd9c594); else if (h < 1.7) c.set(0xb7b274); else c.set(0x55863a).lerp(c2.set(0x8aa64e), n * .5 + .5);
    if (sl > .55) c.lerp(c2.set(0x7d766b), clamp((sl - .55) * 3, 0, 1));
    const dv = dist2(x, z, VOLC.x, VOLC.z); if (dv < 95) c.lerp(c2.set(0x3b3532), smooth((95 - dv) / 50)); if (dv < 14) c.set(0xa3300f);
    const dO = dist2(x, z, OUTPOST.x, OUTPOST.z); if (dO < 30) c.lerp(c2.set(0x9b7c55), smooth((30 - dO) / 8));
    const dS = dist2(x, z, SPAWN.x, SPAWN.z); if (dS < 9 && h > .7) c.lerp(c2.set(0xa58a60), smooth((9 - dS) / 5) * .8);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
  const tm = new T.MeshStandardMaterial({ vertexColors: true, roughness: .96 });
  if (typeof ASSET_IMG !== 'undefined' && ASSET_IMG.ground) { const tx = new T.TextureLoader().load('data:image/jpeg;base64,' + ASSET_IMG.ground); tx.wrapS = tx.wrapT = T.MirroredRepeatWrapping; tx.repeat.set(70, 70); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 8; tm.map = tx; tm.color.setScalar(2.0); }
  const m = new T.Mesh(g, tm); m.receiveShadow = true; scene.add(m);
  const w = new T.Mesh(new T.PlaneGeometry(2600, 2600), new T.MeshStandardMaterial({ color: 0x2c8b9e, transparent: true, opacity: .8, roughness: .1, metalness: .4 }));
  w.rotation.x = -Math.PI / 2; w.position.y = 0; scene.add(w);
  const lava = new T.Mesh(new T.CircleGeometry(13, 14), new T.MeshBasicMaterial({ color: 0xff6a1a })); lava.rotation.x = -Math.PI / 2;
  lava.position.set(VOLC.x, terrainH(VOLC.x, VOLC.z) + 3, VOLC.z); scene.add(lava);
}

/* ---------- vegetation (instanced) ---------- */
const trees = [], rocks = [], bushes = [];
const IM = {};
const _m4 = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3();
function setInst(im, i, x, y, z, s, yaw = 0) { _q.setFromEuler(_e.set(0, yaw, 0)); _m4.compose(_v.set(x, y, z), _q, _s.set(s, s, s)); im.setMatrixAt(i, _m4); im.instanceMatrix.needsUpdate = true; }
function scatter() {
  const R = mulberry(77);
  const ok = (x, z, h) => h > 1.6 && h < 34 && dist2(x, z, SPAWN.x, SPAWN.z) > 11 && dist2(x, z, OUTPOST.x, OUTPOST.z) > 33 && dist2(x, z, FOSSIL.x, FOSSIL.z) > 10;
  for (let i = 0; i < 9000 && trees.length < (GLB.tree0 ? 470 : 640); i++) {
    const x = (R() - .5) * 600, z = (R() - .5) * 600, h = terrainH(x, z); if (!ok(x, z, h)) continue;
    const dens = vnoise(x * .012 + 5, z * .012 + 5); if (dens < -.1 && R() < .82) continue;
    trees.push({ x, z, y: h, s: .8 + R() * .7, type: h < 4.2 ? 2 : (R() < .45 ? 1 : 0), hp: 6, alive: true, yaw: R() * 6.28, t: 0 });
  }
  for (let i = 0; i < 4000 && rocks.length < 190; i++) {
    const x = (R() - .5) * 600, z = (R() - .5) * 600, h = terrainH(x, z); if (h < .6 || h > 60 || dist2(x, z, SPAWN.x, SPAWN.z) < 6 || dist2(x, z, OUTPOST.x, OUTPOST.z) < 33) continue;
    rocks.push({ x, z, y: h, s: .55 + R() * 1.0, hp: 6, alive: true, yaw: R() * 6.28, t: 0 });
  }
  for (let i = 0; i < 4000 && bushes.length < 230; i++) {
    const x = (R() - .5) * 600, z = (R() - .5) * 600, h = terrainH(x, z); if (!ok(x, z, h) && dist2(x, z, SPAWN.x, SPAWN.z) > 11) continue; if (h < 1.6 || h > 30) continue;
    bushes.push({ x, z, y: h, s: .7 + R() * .5, berries: true, yaw: R() * 6.28, t: 0 });
  }
  // guaranteed starter resources near spawn
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + .4, x = SPAWN.x + Math.cos(a) * (9 + i % 3 * 3), z = SPAWN.z + Math.sin(a) * (9 + i % 3 * 3); if (terrainH(x, z) > .8) rocks.push({ x, z, y: terrainH(x, z), s: .7, hp: 6, alive: true, yaw: a, t: 0 }); }
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + 1, x = SPAWN.x + Math.cos(a) * 13, z = SPAWN.z + Math.sin(a) * 13; if (terrainH(x, z) > 1.2) bushes.push({ x, z, y: terrainH(x, z), s: .9, berries: true, yaw: a, t: 0 }); }

  const R2 = Math.PI / 2, tk = 0x6b4a2f;
  const tg = [
    merged([[G.cyl(.22, .32, 2.6), tk, M(0, 1.3, 0)], [G.cone(1.6, 2.4, 7), 0x2c5a33, M(0, 3.1, 0)], [G.cone(1.2, 2.0, 7), 0x35693b, M(0, 4.3, 0)], [G.cone(.78, 1.7, 7), 0x3f7a44, M(0, 5.4, 0)]]),
    merged([[G.cyl(.17, .3, 5.4), 0x5e4630, M(0, 2.7, 0)], [G.sph(1, 8, 5), 0x3a6a37, M(0, 5.5, 0, 2.3, .7, 2.3)], [G.sph(1, 7, 4), 0x4a7f41, M(0, 6.2, 0, 1.4, .55, 1.4)], [G.sph(1, 6, 4), 0x33602f, M(.9, 4.6, .4, 1.0, .4, 1.0)]]),
    merged([[G.cyl(.14, .22, 3.8), 0x8a6f4a, M(0, 1.9, 0, 1, 1, 1, 0, 0, .08)], ...[0, 1, 2, 3, 4, 5, 6].map(i => [G.cone(.34, 2.5, 4), i % 2 ? 0x4f9a3f : 0x3f8436, M(Math.sin(i * .9) * 1.0 + .15, 3.55, Math.cos(i * .9) * 1.0, .9, 1, .28, 1.95, i * .9, 0)])])
  ];
  tg.forEach((g, t) => { const a = GLB['tree' + t], list = trees.filter(o => o.type === t), im = new T.InstancedMesh(a ? a.geo : g, a ? a.mat : MAT_DS, list.length); im.castShadow = true; im.receiveShadow = true; list.forEach((o, i) => { o.i = i; setInst(im, i, o.x, o.y - .1, o.z, o.s, o.yaw); }); scene.add(im); IM['tree' + t] = im; });
  IM.rock = GLB.rock ? new T.InstancedMesh(GLB.rock.geo, GLB.rock.mat, rocks.length) : new T.InstancedMesh(merged([[G.ico(1, 0), 0x8b8880, M(0, .35, 0, 1, .72, 1)], [G.ico(.5, 0), 0x77746c, M(.7, .15, .3, 1, .7, 1)]]), MAT, rocks.length); IM.rock.castShadow = IM.rock.receiveShadow = true;
  rocks.forEach((o, i) => { o.i = i; setInst(IM.rock, i, o.x, o.y, o.z, o.s, o.yaw); }); scene.add(IM.rock);
  IM.bush = GLB.bush ? new T.InstancedMesh(GLB.bush.geo, GLB.bush.mat, bushes.length) : new T.InstancedMesh(merged([[G.ico(.8, 0), 0x3f7a35, M(0, .5, 0, 1, .8, 1)], [G.ico(.55, 0), 0x4c8c3d, M(.45, .45, .2)]]), MAT, bushes.length); IM.bush.castShadow = !GLB.bush;
  IM.berry = new T.InstancedMesh(merged([0, 1, 2, 3, 4, 5, 6].map(i => [G.sph(.09, 5, 4), 0xd0304a, M(Math.sin(i * 2.1) * .6, .55 + Math.cos(i * 1.7) * .3, Math.cos(i * 2.1) * .6)])), MAT, bushes.length);
  bushes.forEach((o, i) => { o.i = i; setInst(IM.bush, i, o.x, o.y, o.z, o.s, o.yaw); setInst(IM.berry, i, o.x, o.y, o.z, o.s, o.yaw); }); scene.add(IM.bush, IM.berry);
  // grass tufts
  const tufts = []; for (let i = 0; i < 12000 && tufts.length < 3200; i++) { const x = (R() - .5) * 560, z = (R() - .5) * 560, h = terrainH(x, z); if (h > 1.8 && h < 26 && dist2(x, z, OUTPOST.x, OUTPOST.z) > 28) tufts.push([x, h, z, .6 + R() * .9, R() * 6]); }
  const gi = new T.InstancedMesh(merged([[G.cone(.1, .6, 3), 0x6fa044, M(0, .3, 0)], [G.cone(.09, .5, 3), 0x5b8f3a, M(.14, .25, .05, 1, 1, 1, 0, 0, -.3)], [G.cone(.09, .45, 3), 0x7fae4e, M(-.12, .22, -.06, 1, 1, 1, 0, 0, .35)]]), MAT, tufts.length);
  tufts.forEach((t, i) => setInst(gi, i, t[0], t[1], t[2], t[3], t[4])); scene.add(gi);
  // fossil site: giant ribcage + skull
  const bone = 0xe6dcc0, fy = terrainH(FOSSIL.x, FOSSIL.z), fp = [];
  for (let i = 0; i < 7; i++) fp.push([new T.TorusGeometry(3.2 - Math.abs(i - 3) * .28, .22, 5, 9, Math.PI), bone, M(0, -.2, -6 + i * 2, 1, 1.25, 1)]);
  fp.push([G.cyl(.3, .3, 15, 6), bone, M(0, 3.7, 0, 1, 1, 1, R2, 0, 0)], [G.sph(1, 7, 5), bone, M(0, 1.6, 9.6, 1.5, 1.4, 2.3)], [G.box(1.8, .5, 2.6), bone, M(0, .5, 11, 1, 1, 1, .15, 0, 0)]);
  const fm = mesh(fp); fm.position.set(FOSSIL.x, fy, FOSSIL.z); fm.rotation.y = .7; scene.add(fm);
}
function hideInst(im, i) { _m4.makeScale(0, 0, 0); im.setMatrixAt(i, _m4); im.instanceMatrix.needsUpdate = true; }
function vegRespawn(dt) {
  for (const o of trees) if (!o.alive && (o.t -= dt) <= 0) { o.alive = true; o.hp = 6; setInst(IM['tree' + o.type], o.i, o.x, o.y - .1, o.z, o.s, o.yaw); }
  for (const o of rocks) if (!o.alive && (o.t -= dt) <= 0) { o.alive = true; o.hp = 6; setInst(IM.rock, o.i, o.x, o.y, o.z, o.s, o.yaw); }
  for (const o of bushes) if (!o.berries && (o.t -= dt) <= 0) { o.berries = true; setInst(IM.berry, o.i, o.x, o.y, o.z, o.s, o.yaw); }
}

/* ---------- particles ---------- */
const parts = [], partGeo = new T.BoxGeometry(.13, .13, .13), partMats = {};
function burst(x, y, z, color, n = 8, sp = 4, size = 1) {
  const mat = partMats[color] || (partMats[color] = new T.MeshBasicMaterial({ color }));
  for (let i = 0; i < n; i++) { const m = new T.Mesh(partGeo, mat); m.position.set(x, y, z); m.scale.setScalar(size * rand(.6, 1.5)); scene.add(m); parts.push({ m, v: new T.Vector3(rand(-sp, sp), rand(1, sp * 1.3), rand(-sp, sp)), life: rand(.4, .9) }); }
}
function partsUpdate(dt) {
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.v.y -= 14 * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += dt * 6; if (p.life <= 0) { scene.remove(p.m); parts.splice(i, 1); } }
}
