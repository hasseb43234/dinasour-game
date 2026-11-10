'use strict';
/* ================= Higgsfield-generated GLB assets (embedded at build time) ================= */
const GLB = {};
const ASSET_CFG = {
  raptor: { dim: 'y', size: 2.4, mode: 0, hip: .42, amp: .34 }, dryo: { dim: 'y', size: 2.3, mode: 0, hip: .42, amp: .34 }, rex: { dim: 'y', size: 2.5, mode: 0, hip: .42, amp: .3 },
  trike: { yaw: -Math.PI / 2, dim: 'y', size: 2.3, mode: 1, hip: .46, amp: .22 }, stego: { yaw: -Math.PI / 2, dim: 'y', size: 2.6, mode: 1, hip: .4, amp: .2 }, bronto: { yaw: -Math.PI / 2, dim: 'y', size: 4.6, mode: 1, hip: .36, amp: .3 },
  ptero: { yaw: -Math.PI / 2, dim: 'x', size: 5.2, mode: 2, mid: 1, hip: 1, amp: 1 },
  tree0: { dim: 'y', size: 6.4, ds: 1 }, tree1: { dim: 'y', size: 6.8, ds: 1 }, tree2: { dim: 'y', size: 5.2, ds: 1 }, rock: { dim: 'x', size: 2.3 }, bush: { dim: 'x', size: 1.9, ds: 1 }, hut: { dim: 'y', size: 4.6 }
};
const WOBBLE = [
  'if(position.y<uHip){float k=(uHip-position.y)/uHip;float ph=uPh+(position.x>0.?0.:3.14159);transformed.z+=sin(ph)*k*uAmp;transformed.y+=max(0.,cos(ph))*k*uAmp*.3;}else{transformed.x+=sin(uPh*.5+position.z)*uAmp*.12*max(0.,-position.z);}',
  'if(position.y<uHip){float k=(uHip-position.y)/uHip;float ph=uPh+(position.x>0.?0.:3.14159)+(position.z>0.?3.14159:0.);transformed.z+=sin(ph)*k*uAmp;transformed.y+=max(0.,cos(ph))*k*uAmp*.3;}else{transformed.x+=sin(uPh*.5+position.z)*uAmp*.1*max(0.,-position.z-.6);}',
  'float w=abs(position.x);transformed.y+=sin(uPh)*uAmp*w*w*.16;'
];
async function loadAssets() {
  if (typeof ASSET_DATA === 'undefined') return; const L = new T.GLTFLoader();
  for (const name in ASSET_DATA) {
    try {
      const bin = atob(ASSET_DATA[name]), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const g = await new Promise((ok, no) => L.parse(buf.buffer, '', ok, no)); let m = null; g.scene.updateMatrixWorld(true); g.scene.traverse(o => { if (o.isMesh && !m) m = o; });
      const cfg = ASSET_CFG[name] || { dim: 'y', size: 1 }, geo = m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); if (cfg.yaw) geo.rotateY(cfg.yaw);
      geo.computeBoundingBox(); const b = geo.boundingBox, sz = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3()), k = cfg.size / sz[cfg.dim];
      geo.translate(-c.x, cfg.mid ? -c.y : -b.min.y, -c.z); geo.scale(k, k, k); geo.computeBoundingBox(); geo.computeBoundingSphere();
      const mat = new T.MeshStandardMaterial({ map: m.material.map, roughness: .9, metalness: 0, side: cfg.ds ? T.DoubleSide : T.FrontSide }); mat.color.setScalar(cfg.mode !== undefined ? 1.9 : 1.5);
      GLB[name] = { geo, mat, h: sz.y * k, cfg };
    } catch (e) { console.warn('asset failed', name, e); }
  }
}
function wobbleMat(a, tint) {
  const m = a.mat.clone(), u = { uPh: { value: 0 }, uAmp: { value: 0 }, uHip: { value: a.cfg.hip * a.h } }; if (tint) m.color.set(tint).multiplyScalar(1.9);
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, u); sh.vertexShader = 'uniform float uPh;uniform float uAmp;uniform float uHip;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + WOBBLE[a.cfg.mode]); };
  m.customProgramCacheKey = () => 'wob' + a.cfg.mode; m.userData.u = u; return m;
}
function glbMesh(name, s = 1) { const a = GLB[name]; if (!a) return null; const m = new T.Mesh(a.geo, a.mat); m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; return m; }
