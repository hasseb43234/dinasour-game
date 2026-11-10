'use strict';
/* ================= Higgsfield-generated GLB assets (embedded at build time) ================= */
const GLB = {}, RIGS = {};
const ASSET_CFG = {
  human: { rig: 1 }, human_f: { rig: 1 },
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
  const L = new T.GLTFLoader(), inline = typeof ASSET_DATA !== 'undefined', names = inline ? Object.keys(ASSET_DATA) : (typeof ASSET_LIST !== 'undefined' ? ASSET_LIST : []);
  const bufs = await Promise.all(names.map(async name => { try { if (inline) { const bin = atob(ASSET_DATA[name]), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); return buf.buffer; } const r = await fetch('assets/' + name + '.glb'); return r.ok ? await r.arrayBuffer() : null; } catch (e) { return null; } }));
  for (let ni = 0; ni < names.length; ni++) {
    const name = names[ni], ab = bufs[ni]; if (!ab) { console.warn('asset missing', name); continue; }
    try {
      const g = await new Promise((ok, no) => L.parse(ab, '', ok, no)); let m = null;
      if (name.startsWith('human')) { g.scene.traverse(o => { if (o.isSkinnedMesh) { const mt = new T.MeshStandardMaterial({ map: o.material.map, roughness: .85, metalness: 0 }); mt.color.setScalar(1.75); o.material = mt; } }); RIGS[name] = { scene: g.scene }; continue; } g.scene.updateMatrixWorld(true); g.scene.traverse(o => { if (o.isMesh && !m) m = o; });
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

/* ---------- rigged realistic humans ---------- */
const OUTFIT_TINT = { ash: 0x5c5c68, honey: 0xffcf66, frost: 0xd6e6f2, riot: 0xff7ab8, ashfang: 0xc9675a, chief: 0x8f5a55 };
const RIG_BONES = ['LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'Spine', 'Head', 'RightHand'];
function makeRigHuman(look) {
  const tpl = RIGS[look.build === 'b' && RIGS.human_f ? 'human_f' : 'human'], inst = T.SkeletonUtils.clone(tpl.scene), b = BODIES[look.body] || BODIES.athletic, tint = OUTFIT_TINT[look.outfit];
  inst.updateMatrixWorld(true); const rig = { DL: new T.Quaternion().setFromEuler(new T.Euler(0, 0, -1.36)), DR: new T.Quaternion().setFromEuler(new T.Euler(0, 0, 1.36)) }, ws = new T.Vector3();
  inst.traverse(o => {
    if (o.isSkinnedMesh) { o.material = o.material.clone(); if (tint) o.material.color.set(tint).multiplyScalar(1.75); o.frustumCulled = false; o.castShadow = true; }
    if (o.isBone && RIG_BONES.includes(o.name)) { const w = o.getWorldQuaternion(new T.Quaternion()); rig[o.name] = { bone: o, pre: o.quaternion.clone().multiply(w.clone().invert()), post: w, w }; }
  });
  const holder = (bone, worldQ, worldPos) => { const h = new T.Group(), bw = rig[bone]; bw.bone.getWorldScale(ws); h.quaternion.copy(bw.w).invert().multiply(worldQ); h.scale.setScalar(1 / ws.x); h.position.copy(bw.bone.worldToLocal(worldPos)); bw.bone.add(h); return h; };
  const hp = rig.RightHand.bone.getWorldPosition(new T.Vector3()); hp.x -= .09;
  const hand = holder('RightHand', new T.Quaternion().setFromEuler(new T.Euler(0, 0, -1.36)), hp);
  const hat = (look.hair === 'sunflare' || look.hair === 'jay') ? holder('Head', new T.Quaternion(), new T.Vector3(0, look.build === 'b' && RIGS.human_f ? -.2 : -.1, -.02)) : null;
  if (hat) { const p = []; if (look.hair === 'sunflare') for (let i = 0; i < 6; i++) p.push([G.cone(.06, .34, 4), i % 2 ? 0xffd23a : 0xe2341d, M(0, 1.9 - Math.abs(i - 2) * .03, .13 - i * .06, 1, 1, 1, -.25 - i * .12, 0, 0)]); else for (let i = 0; i < 7; i++) p.push([G.cone(.05, .5, 4), i % 2 ? 0x2f7de0 : 0x9ad1ff, M((i - 3) * .06, 1.92, -.12, 1, 1, .4, -.5, 0, -(i - 3) * .22)]); hat.add(mesh(p)); }
  const g = new T.Group(), root = new T.Group(); g.add(root); root.add(inst); root.scale.set(.5 + .5 * b.w, b.h, .5 + .5 * b.d);
  const D = () => new T.Object3D();
  return { g, root, armL: D(), armR: D(), legL: D(), legR: D(), hand, rig };
}
const _rq = new T.Quaternion(), _re = new T.Euler();
function setBone(r, k, q) { const b = r[k]; if (b) b.bone.quaternion.copy(b.pre).multiply(q).multiply(b.post); }
function applyRig(h, o) {
  const r = h.rig;
  setBone(r, 'LeftArm', _rq.setFromEuler(h.armL.rotation).multiply(r.DL)); setBone(r, 'RightArm', _rq.setFromEuler(h.armR.rotation).multiply(r.DR));
  setBone(r, 'LeftUpLeg', _rq.setFromEuler(h.legL.rotation)); setBone(r, 'RightUpLeg', _rq.setFromEuler(h.legR.rotation));
  const sit = o.sit || o.emote === 'sit', kl = sit ? 1.3 : Math.max(0, -h.legL.rotation.x) * .9 + .05, kr = sit ? 1.3 : Math.max(0, -h.legR.rotation.x) * .9 + .05;
  setBone(r, 'LeftLeg', _rq.setFromEuler(_re.set(kl, 0, 0))); setBone(r, 'RightLeg', _rq.setFromEuler(_re.set(kr, 0, 0)));
  setBone(r, 'LeftForeArm', _rq.setFromEuler(_re.set(0, o.aim ? -.9 : -.3, 0))); setBone(r, 'RightForeArm', _rq.setFromEuler(_re.set(0, o.aim || o.raise || o.swing > 0 ? .1 : .3, 0)));
}
