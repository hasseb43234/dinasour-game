'use strict';
/* ================= models: humans, weapons, dinosaurs ================= */
const BODIES = { slim: { w: .85, d: .85, h: 1, a: .8 }, lean: { w: .93, d: .9, h: 1.03, a: .9 }, athletic: { w: 1.06, d: 1, h: 1.02, a: 1.05 }, strong: { w: 1.22, d: 1.1, h: 1.03, a: 1.3 }, broad: { w: 1.32, d: 1.15, h: 1, a: 1.2 }, heavy: { w: 1.36, d: 1.5, h: .97, a: 1.25 }, compact: { w: 1.1, d: 1.1, h: .88, a: 1.1 }, tall: { w: .98, d: .95, h: 1.13, a: .95 } };
const SKINS = [0xf1c9a5, 0xe0ac7e, 0xc68642, 0x9c6a3c, 0x6f4526, 0x4a2c17];
const HAIRCOL = [0x1b1410, 0x4a2f1b, 0x8a5a2b, 0xd9b56a, 0xb23b1e, 0xcfcfcf];
const FACES = [[1, 1, 1], [.92, 1.1, .98], [1.08, .98, 1.02], [1, 1.04, .92]];
const HAIRS = ['bald', 'crop', 'afro', 'long', 'topknot', 'braids'];
const OUTFITS = {
  hide: { c: 0x8a7a4d, t: 0x6b5a36 }, ash: { c: 0x1d1f24, t: 0x3a3d45, coat: 1 }, honey: { c: 0xd9a520, t: 0x8a5a12 },
  frost: { c: 0xe8eef2, t: 0x9fb6c4, coat: 1 }, riot: { c: 0xd61f7a, t: 0x16161a }, ashfang: { c: 0x6b1f1a, t: 0x2a1a16 }, chief: { c: 0x2a1a16, t: 0xc23b1e, coat: 1 }
};
function makeHuman(look) {
  if (RIGS.human) return makeRigHuman(look);
  const b = BODIES[look.body] || BODIES.athletic, skin = SKINS[look.skin] || SKINS[1], o = OUTFITS[look.outfit] || OUTFITS.hide, hc = HAIRCOL[look.hairCol] || HAIRCOL[0];
  const sw = b.w * (look.build === 'b' ? .88 : 1), f = FACES[look.face] || FACES[0], g = new T.Group(), root = new T.Group(); g.add(root); root.scale.y = b.h;
  const p = [[G.box(.5 * sw, .62, .27 * b.d), o.c, M(0, 1.17, 0)], [G.cyl(.07, .08, .12), skin, M(0, 1.52, 0)],
  [G.sph(.17, 9, 7), skin, M(0, 1.69, 0, f[0], f[1], f[2])], [G.box(.04, .05, .05), skin, M(0, 1.67, .17 * f[2])],
  [G.sph(.022, 5, 4), 0x1a1a1a, M(.06, 1.72, .152 * f[2])], [G.sph(.022, 5, 4), 0x1a1a1a, M(-.06, 1.72, .152 * f[2])]];
  if (o.coat) p.push([G.box(.56 * sw, .62, .33 * b.d), o.c, M(0, .7, 0)], [G.box(.58 * sw, .08, .34 * b.d), o.t, M(0, .98, 0)]);
  else p.push([G.box(.53 * sw, .3, .3 * b.d), o.t, M(0, .8, 0)], [G.box(.3 * sw, .28, .31 * b.d), o.c, M(0, .62, 0)]);
  if (look.build === 'b' && !o.coat) p.push([G.box(.52 * sw, .16, .29 * b.d), o.t, M(0, 1.36, 0)]);
  if (b.d > 1.3) p.push([G.sph(.24, 7, 5), o.c, M(0, 1.02, .1, 1.15, 1, 1)]);
  if (look.beard) p.push([G.box(.2, .1, .1), hc, M(0, 1.585, .1)], [G.box(.24, .08, .14), hc, M(0, 1.63, .04)]);
  const cap = () => [new T.SphereGeometry(.186, 9, 5, 0, Math.PI * 2, 0, Math.PI * .52), hc, M(0, 1.7, -.01, f[0], f[1], f[2])];
  switch (look.hair) {
    case 'crop': p.push(cap()); break;
    case 'afro': p.push([G.sph(.27, 8, 6), hc, M(0, 1.78, -.03)]); break;
    case 'long': p.push(cap(), [G.box(.34, .42, .12), hc, M(0, 1.52, -.13)], [G.box(.08, .3, .2), hc, M(.17, 1.6, -.02)], [G.box(.08, .3, .2), hc, M(-.17, 1.6, -.02)]); break;
    case 'topknot': p.push(cap(), [G.sph(.08, 6, 5), hc, M(0, 1.92, -.05)]); break;
    case 'braids': p.push(cap(), [G.cyl(.04, .03, .4, 5), hc, M(.15, 1.5, .02)], [G.cyl(.04, .03, .4, 5), hc, M(-.15, 1.5, .02)]); break;
    case 'sunflare': for (let i = 0; i < 6; i++)p.push([G.cone(.06, .34, 4), i % 2 ? 0xffd23a : 0xe2341d, M(0, 1.9 - Math.abs(i - 2) * .03, .13 - i * .06, 1, 1, 1, -.25 - i * .12, 0, 0)]); break;
    case 'jay': p.push(cap()); for (let i = 0; i < 7; i++)p.push([G.cone(.05, .5, 4), i % 2 ? 0x2f7de0 : 0x9ad1ff, M((i - 3) * .06, 1.92, -.12, 1, 1, .4, -.5, 0, -(i - 3) * .22)]); break;
  }
  root.add(mesh(p));
  const limb = (x, y, parts) => { const l = new T.Group(); l.position.set(x, y, 0); l.add(mesh(parts)); root.add(l); return l; };
  const aw = .11 * b.a, sleeve = o.coat ? o.c : skin;
  const arm = sx => limb(sx * (.25 * sw + .075), 1.43, [[G.box(aw, .32, aw), sleeve, M(0, -.14, 0)], [G.box(aw * .92, .3, aw * .92), skin, M(0, -.43, 0)], [G.box(aw * 1.1, .07, aw * 1.1), o.t, M(0, -.5, 0)], [G.box(aw, .1, aw), skin, M(0, -.6, 0)]]);
  const leg = sx => limb(sx * .13 * sw, .84, [[G.box(.15, .8, .16), skin, M(0, -.4, 0)], [G.box(.15, .06, .25), 0x3a2c1e, M(0, -.81, .04)]]);
  const armL = arm(1), armR = arm(-1), legL = leg(1), legR = leg(-1), hand = new T.Group(); hand.position.set(0, -.62, 0); armR.add(hand);
  return { g, root, armL, armR, legL, legR, hand };
}
function animHuman(h, t, moving, o = {}) {
  const a = moving ? Math.sin(t) * .75 : 0;
  h.legL.rotation.set(a, 0, 0); h.legR.rotation.set(-a, 0, 0); h.armL.rotation.set(-a * .8, 0, 0); h.armR.rotation.set(a * .8, 0, 0); h.root.position.y = moving ? Math.abs(Math.sin(t)) * .05 : 0; h.root.rotation.set(0, 0, 0);
  if (o.sit) { h.legL.rotation.set(-1.25, 0, .55); h.legR.rotation.set(-1.25, 0, -.55); h.armL.rotation.set(-.6, 0, .1); h.armR.rotation.set(-.6, 0, -.1); }
  if (o.aim) { h.armR.rotation.set(-1.55, 0, 0); h.armL.rotation.set(-1.35, 0, -.55); }
  if (o.raise) h.armR.rotation.set(-1.2 - o.raise * 1.6, 0, 0);
  if (o.swing > 0) h.armR.rotation.set(-2.7 + (1 - o.swing / .3) * 2.5, 0, 0);
  const e = o.emote, et = o.et || 0;
  if (e === 'wave') h.armR.rotation.set(0, 0, -2.6 + Math.sin(et * 10) * .35);
  else if (e === 'cheer') { h.armR.rotation.set(0, 0, -2.8); h.armL.rotation.set(0, 0, 2.8); h.root.position.y = Math.abs(Math.sin(et * 7)) * .3; }
  else if (e === 'dance') { const s = Math.sin(et * 8); h.armR.rotation.set(-1.2 + s, 0, -.6); h.armL.rotation.set(-1.2 - s, 0, .6); h.legL.rotation.x = s * .5; h.legR.rotation.x = -s * .5; h.root.rotation.y = Math.sin(et * 4) * .5; h.root.position.y = Math.abs(s) * .12; }
  else if (e === 'point') h.armR.rotation.set(-1.5, 0, 0);
  else if (e === 'sit') { h.legL.rotation.set(-1.5, 0, .2); h.legR.rotation.set(-1.5, 0, -.2); h.root.position.y = -.72; }
  else if (e === 'flex') { h.armR.rotation.set(0, 0, -1.6); h.armL.rotation.set(0, 0, 1.6); h.root.rotation.y = Math.sin(et * 3) * .3; }
  else if (e === 'stomp') { const s = Math.sin(et * 9); h.legL.rotation.x = s > 0 ? -s * 1.2 : 0; h.legR.rotation.x = s < 0 ? s * 1.2 : 0; h.armR.rotation.set(0, 0, -2.4 - s * .4); h.armL.rotation.set(0, 0, 2.4 - s * .4); h.root.position.y = Math.abs(s) * .1; }
  if (h.rig) applyRig(h, o);
}

const BOWSKIN = { glacier: [0x9ad1ff, 0x2f7de0], toxin: [0x54e36a, 0x12602a] };
function makeWeapon(id, bowSkin) {
  const wood = 0x7a5a36, stone = 0x8d8a83; let m = null, g = new T.Group();
  if (id === 'axe') m = mesh([[G.cyl(.03, .035, .8, 5), wood, M(0, 0, .3, 1, 1, 1, Math.PI / 2, 0, 0)], [G.box(.07, .22, .26), stone, M(0, -.06, .62)]]);
  else if (id === 'hammer') m = mesh([[G.cyl(.035, .04, .85, 5), wood, M(0, 0, .32, 1, 1, 1, Math.PI / 2, 0, 0)], [G.box(.2, .34, .22), 0x9a7a4e, M(0, 0, .72)]]);
  else if (id === 'spear') m = mesh([[G.cyl(.025, .03, 2.1, 5), wood, M(0, 0, .5, 1, 1, 1, Math.PI / 2, 0, 0)], [G.cone(.06, .3, 4), stone, M(0, 0, 1.68, 1, 1, 1, Math.PI / 2, 0, 0)]]);
  else if (id === 'torch') { m = mesh([[G.cyl(.03, .035, .7, 5), wood, M(0, 0, .25, 1, 1, 1, Math.PI / 2, 0, 0)]]); const f = new T.Mesh(G.cone(.09, .3, 5), new T.MeshBasicMaterial({ color: 0xffa23a })); f.position.set(0, 0, .72); f.rotation.x = Math.PI / 2; g.add(f); const l = new T.PointLight(0xff9a4a, 16, 24, 1.5); l.position.set(0, -.9, 1.3); g.add(l); }
  else if (id === 'sling') m = mesh([[G.cyl(.025, .03, .35, 5), wood, M(0, 0, .12, 1, 1, 1, Math.PI / 2, 0, 0)], [G.cyl(.02, .02, .25, 4), wood, M(.07, 0, .38, 1, 1, 1, Math.PI / 2, 0, -.5)], [G.cyl(.02, .02, .25, 4), wood, M(-.07, 0, .38, 1, 1, 1, Math.PI / 2, 0, .5)]]);
  else if (id === 'bow') { const c = BOWSKIN[bowSkin] || [wood, 0x5a3f22]; const bp = [[G.box(.04, .05, .42), c[1], M(0, -.1, 0)], [G.box(.035, .04, .42), c[0], M(0, -.05, .38, 1, 1, 1, .3, 0, 0)], [G.box(.035, .04, .42), c[0], M(0, -.05, -.38, 1, 1, 1, -.3, 0, 0)], [G.box(.008, .008, 1.12), 0xe8e0c8, M(0, .02, 0)]]; if (BOWSKIN[bowSkin]) for (const z of [.6, -.6]) for (const k of [0, 1, 2]) bp.push([G.cone(.04, .3, 4), k % 2 ? c[1] : c[0], M(0, -.08 - k * .07, z * (1 - k * .14), 1, 1, .4, z > 0 ? -2.2 : -.9, 0, 0)]); m = mesh(bp); }
  if (m) g.add(m); return g;
}

/* ---------- dinosaurs ---------- */
const DINOS = {
  dryo: { name: 'Dryosaurus', biped: 1, s: .55, hp: 28, spd: 8.4, walk: 2.2, temper: 'flee', pal: [0x9aa55b, 0xd9c98a, 0x5d6b2f], meat: 2, hide: 1, amber: 15, r: .7, info: 'Small, skittish plant-eater. Your first source of meat and hide.' },
  raptor: { name: 'Raptor', biped: 1, s: 1.25, hp: 80, spd: 9.3, walk: 2.6, temper: 'hostile', dmg: 9, pal: [0x5a6788, 0xc2c8d8, 0xe0452e], meat: 3, hide: 2, amber: 40, r: 1.1, tame: 'meat', mount: 1, crest: 1, bite: 22, info: 'Pack hunter. Daze it below 30% health, feed 2 raw meat to tame. Fast land mount.' },
  rex: { name: 'Tyrannosaurus', biped: 1, s: 2.7, hp: 900, spd: 8.6, walk: 2.4, temper: 'hostile', dmg: 34, pal: [0x7a6a55, 0xb5a88e, 0x9a3a28], meat: 12, hide: 8, amber: 400, r: 2.6, big: 1, info: 'Apex predator that stalks the volcano slopes. Bring a pack, or run.' },
  trike: { name: 'Triceratops', quad: 'trike', s: 1.5, hp: 260, spd: 7, walk: 1.6, temper: 'neutral', dmg: 20, pal: [0x7c6a4a, 0xc9b58c, 0xa8532e], meat: 6, hide: 5, amber: 70, r: 1.9, tame: 'berries', mount: 1, bite: 45, info: 'Calm until provoked. Tame with 6 berries when dazed. Its charge smashes gates.' },
  stego: { name: 'Stegosaurus', quad: 'stego', s: 1.5, hp: 240, spd: 5.5, walk: 1.4, temper: 'neutral', dmg: 18, pal: [0x5d7350, 0xb5c08a, 0xb8442e], meat: 6, hide: 6, amber: 70, r: 1.9, info: 'Armoured grazer with a spiked tail. Rich in hide.' },
  bronto: { name: 'Brachiosaurus', quad: 'bronto', s: 3.2, hp: 700, spd: 4, walk: 1.5, temper: 'passive', pal: [0xa3a89c, 0xd6d7cb, 0x7d8178], meat: 14, hide: 8, amber: 120, r: 3.4, big: 1, info: 'Gentle giant of the lakeshore.' },
  ptero: { name: 'Pteranodon', fly: 1, s: 1.9, hp: 60, spd: 13, walk: 3, temper: 'passive', pal: [0x7186ad, 0xe6d9b4, 0xe0552e], meat: 2, hide: 2, amber: 60, r: 1.5, tame: 'meat', mount: 1, bite: 12, info: 'Shoot it down, feed 2 raw meat while it is grounded, then saddle up and fly.' }
};
const MOUNTSKIN = { midnight: Object.assign([0x15151c, 0x2a2a36, 0xff3fa4], { tint: 0x56506e }), gilded: Object.assign([0xd9a520, 0xf3dc8a, 0x8a5a12], { tint: 0xffd257 }), candy: Object.assign([0xff5fa8, 0xffc1dd, 0xc8ff2e], { hat: 1, tint: 0xff7ac0 }) };
function makeDino(type, pal) {
  if (GLB[type]) { const a = GLB[type], g = new T.Group(), mat = wobbleMat(a, pal ? (pal.tint || 0xff8f70) : null), m = new T.Mesh(a.geo, mat); m.castShadow = true; m.frustumCulled = false; g.add(m); return { g, legs: [], wings: null, u: mat.userData.u, amp: a.cfg.amp }; }
  const d = DINOS[type]; pal = pal || d.pal; const [c1, c2, c3] = pal, g = new T.Group(), legs = [], wings = [], R = Math.PI / 2, bone = 0xe9e1c9, eye = 0xffd23a;
  const leg = (x, y, z, parts) => { const l = new T.Group(); l.position.set(x, y, z); l.add(mesh(parts)); g.add(l); legs.push(l); };
  if (d.biped) {
    const hs = d.big ? 1.5 : 1, hz = d.big ? .18 : 0;
    const b = [[G.sph(1), c1, M(0, 1.25, 0, .42, .48, .95)], [G.sph(1), c2, M(0, 1.1, .05, .36, .36, .8)], [G.cone(.32, 2.2), c1, M(0, 1.3, -1.85, 1, 1, 1, -R, 0, 0)],
    [G.cyl(.2, .3, .95), c1, M(0, 1.72, .85, 1, 1, 1, .7, 0, 0)], [G.sph(1), c1, M(0, 2.1, 1.25 + hz, .25 * hs, .26 * hs, .42 * hs)],
    [G.box(.3, .2, .5), c1, M(0, 2.06, 1.6 + hz * 2, hs, hs, hs)], [G.box(.26, .08, .45), c2, M(0, 1.9 - hz * .5, 1.55 + hz * 2, hs, hs, hs)],
    [G.sph(.05, 5, 4), eye, M(.2 * hs, 2.2, 1.35 + hz)], [G.sph(.05, 5, 4), eye, M(-.2 * hs, 2.2, 1.35 + hz)],
    [G.box(.08, .35, .08), c1, M(.3, 1.05, .65, 1, 1, 1, .6, 0, 0)], [G.box(.08, .35, .08), c1, M(-.3, 1.05, .65, 1, 1, 1, .6, 0, 0)]];
    if (d.big) for (let i = 0; i < 5; i++) b.push([G.cone(.03, .1, 4), bone, M((i - 2) * .09, 1.93, 2.2, 1, 1, 1, Math.PI, 0, 0)]);
    if (d.crest) for (let i = 0; i < 6; i++) b.push([G.cone(.07, .42, 4), c3, M(0, 2.44 - i * .13, 1.12 - i * .2, 1, 1, 1, -.7, 0, 0)]);
    else for (let i = 0; i < 7; i++) b.push([G.box(.5, .02, .12), c3, M(0, 1.72 - Math.abs(i - 2) * .02, .5 - i * .35)]);
    if (pal.hat) b.push([G.sph(.3, 7, 5), c3, M(0, 2.42, 1.2, 1, .8, 1)], [G.box(.14, .3, .3), c3, M(.3, 2.25, 1.2)], [G.box(.14, .3, .3), c3, M(-.3, 2.25, 1.2)], ...[0, 1, 2, 3, 4, 5].map(i => [G.sph(.09, 5, 4), 0x7a2fd0, M(Math.sin(i * 2.4) * .38, 1.3 + Math.cos(i * 1.9) * .3, i * .35 - 1)]));
    g.add(mesh(b));
    for (const sx of [1, -1]) leg(.3 * sx, 1.15, -.05, [[G.box(.22, .6, .3), c1, M(0, -.25, .05)], [G.box(.13, .6, .14), c1, M(0, -.75, -.05)], [G.box(.2, .1, .4), 0x2a2622, M(0, -1.1, .1)]]);
  } else if (d.quad) {
    const b = [[G.sph(1), c1, M(0, 1.3, 0, .75, .7, 1.35)], [G.sph(1), c2, M(0, 1.1, 0, .68, .55, 1.2)], [G.cone(.4, d.quad === 'bronto' ? 3.4 : 2.0), c1, M(0, 1.22, d.quad === 'bronto' ? -2.9 : -2.2, 1, 1, 1, -R + .12, 0, 0)]];
    if (d.quad === 'trike') b.push([G.sph(1), c1, M(0, 1.35, 1.7, .45, .45, .62)], [G.cone(.22, .55), c2, M(0, 1.2, 2.35, 1, 1, 1, R, 0, 0)], [G.cyl(.9, .9, .12, 9), c3, M(0, 1.78, 1.22, 1, 1, 1, R - .4, 0, 0)], [G.cyl(.62, .62, .14, 9), c2, M(0, 1.76, 1.26, 1, 1, 1, R - .4, 0, 0)],
      [G.cone(.08, .85), bone, M(.25, 1.9, 2.0, 1, 1, 1, 1.0, 0, 0)], [G.cone(.08, .85), bone, M(-.25, 1.9, 2.0, 1, 1, 1, 1.0, 0, 0)], [G.cone(.07, .35), bone, M(0, 1.55, 2.25, 1, 1, 1, .6, 0, 0)], [G.sph(.05, 5, 4), eye, M(.4, 1.5, 1.95)], [G.sph(.05, 5, 4), eye, M(-.4, 1.5, 1.95)]);
    else if (d.quad === 'stego') { b.push([G.cyl(.18, .28, .8), c1, M(0, 1.05, 1.5, 1, 1, 1, 1.35, 0, 0)], [G.sph(1), c1, M(0, .98, 1.95, .2, .19, .36)], [G.sph(.04, 5, 4), eye, M(.17, 1.05, 2.0)], [G.sph(.04, 5, 4), eye, M(-.17, 1.05, 2.0)]); for (let i = 0; i < 8; i++) { const z = 1.1 - i * .42, k = 1 - Math.abs(i - 3.2) / 5; b.push([G.cone(.34 * k + .1, .75 * k + .15, 4), c3, M(i % 2 ? .1 : -.1, 1.95 + k * .28 - (i > 5 ? (i - 5) * .22 : 0), z, .3, 1, 1)]); } for (const sx of [1, -1]) b.push([G.cone(.05, .5, 4), bone, M(sx * .3, 1.25, -2.9, 1, 1, 1, 0, 0, -sx * 1.2)], [G.cone(.05, .5, 4), bone, M(sx * .3, 1.25, -2.6, 1, 1, 1, 0, 0, -sx * 1.2)]); }
    else b.push([G.cyl(.2, .4, 3.2), c1, M(0, 2.9, 1.95, 1, 1, 1, .65, 0, 0)], [G.sph(1), c1, M(0, 4.15, 2.95, .25, .22, .42)], [G.sph(.04, 5, 4), eye, M(.2, 4.22, 3.05)], [G.sph(.04, 5, 4), eye, M(-.2, 4.22, 3.05)]);
    g.add(mesh(b));
    for (const sx of [1, -1]) for (const sz of [1, -1]) leg(.5 * sx, 1.0, .8 * sz, [[G.cyl(.21, .18, 1.0), c1, M(0, -.5, 0)], [G.cyl(.2, .22, .12), 0x2a2622, M(0, -.94, 0)]]);
  } else {
    g.add(mesh([[G.sph(1), c1, M(0, 0, 0, .22, .22, .6)], [G.sph(1), c2, M(0, -.06, 0, .18, .16, .5)], [G.sph(1), c1, M(0, .15, .7, .14, .14, .25)], [G.cone(.07, .8, 5), c2, M(0, .12, 1.2, 1, 1, 1, R, 0, 0)], [G.cone(.06, .55, 4), c3, M(0, .32, .42, 1, 1, 1, -R + .5, 0, 0)],
    [G.sph(.03, 5, 4), eye, M(.11, .2, .78)], [G.sph(.03, 5, 4), eye, M(-.11, .2, .78)], [G.cyl(.03, .02, .4, 4), c1, M(.1, -.3, -.3)], [G.cyl(.03, .02, .4, 4), c1, M(-.1, -.3, -.3)]]));
    for (const sx of [1, -1]) {
      const w = new T.Group(); w.position.set(.18 * sx, .05, .1); const wg = new T.BufferGeometry();
      wg.setAttribute('position', new T.Float32BufferAttribute([0, 0, .38, 1.3 * sx, 0, .3, 0, 0, -.38, 1.3 * sx, 0, .3, 2.5 * sx, 0, -.15, 0, 0, -.38, 1.3 * sx, 0, .3, 2.3 * sx, 0, .12, 2.5 * sx, 0, -.15], 3));
      w.add(mesh([[wg, c1], [G.cyl(.035, .02, 2.3, 4), c3, M(1.15 * sx, .01, .3, 1, 1, 1, 0, 0, R)]], MAT_DS)); g.add(w); wings.push(w);
    }
  }
  return { g, legs, wings };
}
