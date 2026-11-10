'use strict';
/* ================= outpost, base building, events, quests, interaction, input, loop ================= */
const gate = { alive: true, x: 0, z: 0, mesh: null, shake: 0, max: 500 };
let bannerMat = null;
function refreshSegs() { segs = [...outSegs, ...baseSegs]; }
function buildOutpost() {
  const { x: ox, z: oz, h, r } = OUTPOST, ga = Math.atan2(SPAWN.z - oz, SPAWN.x - ox), gw = .17, a0 = ga + gw, span = Math.PI * 2 - gw * 2;
  const n = Math.floor(span * r / 1.0), im = new T.InstancedMesh(merged([[G.cyl(.42, .54, 5.6, 8), HAS('bark') ? 0xd8cfc4 : 0x6b4a2f, M(0, 2.8, 0)], [G.cone(.42, .9, 8), HAS('bark') ? 0xe6dccf : 0x7d5939, M(0, 6.05, 0)]]), triMat('bark', .55, 2.6), n + 1);
  for (let i = 0; i <= n; i++) { const a = a0 + span * i / n; setInst(im, i, ox + Math.cos(a) * r, h - .3, oz + Math.sin(a) * r, 1 + hash(i, 3) * .22, a); }
  im.castShadow = true; scene.add(im);
  for (let k = 0; k < 28; k++) { const b0 = a0 + span * k / 28, b1 = a0 + span * (k + 1) / 28; outSegs.push({ x1: ox + Math.cos(b0) * r, z1: oz + Math.sin(b0) * r, x2: ox + Math.cos(b1) * r, z2: oz + Math.sin(b1) * r, y: h, h: 5.6 }); }
  gate.x = ox + Math.cos(ga) * r; gate.z = oz + Math.sin(ga) * r; gate.alive = S.gate > 0 && !S.won;
  if (gate.alive) {
    const gwid = 2 * r * Math.sin(gw) + .6, parts = [[G.box(gwid, 4.8, .45), 0x5a3f27, M(0, 2.4, 0)], [G.box(gwid + .2, .35, .6), 0x2f2a26, M(0, 1.2, 0)], [G.box(gwid + .2, .35, .6), 0x2f2a26, M(0, 3.6, 0)]];
    for (let i = 0; i < 6; i++) parts.push([G.cone(.22, .8, 4), 0xe6dcc0, M(-gwid / 2 + .5 + i * (gwid - 1) / 5, 5.1, 0)]);
    gate.mesh = mesh(parts, triMat('planks', .45, 1.5)); gate.mesh.position.set(gate.x, h, gate.z); gate.mesh.rotation.y = Math.atan2(-Math.cos(ga), -Math.sin(ga)); scene.add(gate.mesh);
    outSegs.push({ gate: 1, x1: ox + Math.cos(ga - gw) * r, z1: oz + Math.sin(ga - gw) * r, x2: ox + Math.cos(ga + gw) * r, z2: oz + Math.sin(ga + gw) * r, y: h, h: 5 });
  }
  const st = [];
  for (const [dx, dz] of [[-8, -7], [8, -5], [1, 10]]) if (GLB.hut) { const hm = glbMesh('hut', 1.05); hm.position.set(ox + dx, h - .1, oz + dz); hm.rotation.y = Math.atan2(-dx, -dz); scene.add(hm); } else st.push([G.cyl(2.6, 2.8, 2.3, 8), 0x9a8257, M(dx, 1.15, dz)], [G.cone(3.5, 2.6, 8), 0x6f5a35, M(dx, 3.6, dz)]);
  st.push([G.cyl(.4, .5, 7, 6), 0x4a321d, M(0, 3.5, 0)], [G.box(1.3, 1.1, 1.1), 0x2f2a26, M(0, 5.2, 0)], [G.cone(.5, 1.1, 5), 0xe6dcc0, M(0, 7.4, 0)], [G.cyl(1.1, 1.2, .25, 8), 0x55514b, M(4, .12, 2)]);
  const sm = mesh(st); sm.position.set(ox, h, oz); scene.add(sm);
  bannerMat = new T.MeshBasicMaterial({ color: S.won ? 0xc8ff2e : 0xc2321e });
  const bn = new T.Mesh(new T.BoxGeometry(.08, 2.2, 1.5), bannerMat); bn.position.set(ox + .55, h + 3.6, oz); scene.add(bn);
  const fl = new T.PointLight(0xff8a3a, 14, 30, 1.6); fl.position.set(ox + 4, h + 1.6, oz + 2); scene.add(fl);
  const fm = new T.Mesh(G.cone(.6, 1.6, 6), new T.MeshBasicMaterial({ color: 0xff8a2a })); fm.position.set(ox + 4, h + .9, oz + 2); scene.add(fm);
  if (!S.won) {
    for (let i = 0; i < 2; i++) spawnDino('ptero', ox, oz, { rider: true, rad: 24 + i * 6, alt: 15 + i * 3, ang: i * 3.1 });
    [[-4, -3], [5, -6], [-7, 4], [6, 6], [-1, 8]].forEach(([dx, dz], i) => spawnHuman({ team: 'ash', out: 1, x: ox + dx, z: oz + dz, name: 'Ashfang ' + ['Hunter', 'Spearman', 'Scout', 'Brute', 'Stalker'][i] }));
    spawnHuman({ team: 'ash', out: 1, chief: 1, x: ox - 1, z: oz - 2, name: 'Chief Varrok' });
  }
  refreshSegs();
}
function damageGate(d) {
  if (!gate.alive) return; S.gate -= d; gate.shake = .25; sfx('chop'); burst(gate.x, OUTPOST.h + 2.4, gate.z, 0x8a6a45, 7, 4);
  for (const e of humans) if (e.out) e.alert = 40;
  if (S.gate <= 0) openGate(true);
}
function openGate(smashed) {
  if (!gate.alive) return; gate.alive = false; S.gate = 0; scene.remove(gate.mesh); outSegs = outSegs.filter(s => !s.gate); refreshSegs();
  if (smashed) { sfx('boom'); burst(gate.x, OUTPOST.h + 2.5, gate.z, 0x6b4a2f, 40, 8, 2.4); toast('The gate is breached — finish the Ashfang!', 'lime'); for (const e of humans) if (e.out) e.alert = 999; }
}
function checkOutpost() {
  if (S.won || humans.some(e => e.out && e.alive)) return;
  S.won = true; openGate(false); bannerMat.color.setHex(0xc8ff2e); addAmber(2000); S.crates += 2; sfx('win'); bigBanner('OUTPOST CAPTURED', 'The Ashfang are broken · +2000 amber · 2 Relic Crates');
}

/* ---------- camp + tribemates ---------- */
function fireMesh(x, y, z) {
  const g = new T.Group(); g.add(mesh(pieceParts('fire', 0))); const fl = new T.Mesh(G.cone(.38, 1.0, 6), new T.MeshBasicMaterial({ color: 0xffa23a })); fl.position.y = .75; g.add(fl);
  const l = new T.PointLight(0xff8a3a, 12, 22, 1.6); l.position.y = 1.4; g.add(l); g.position.set(x, y, z); return { g, fl, l };
}
function buildCamp() {
  const x = SPAWN.x + 4, z = SPAWN.z - 3, f = fireMesh(x, terrainH(x, z), z); scene.add(f.g); fires.push({ x, z, fixed: true, fl: f.fl, l: f.l });
  const logs = mesh([[G.cyl(.25, .25, 2.2, 6), 0x5e4630, M(-2.2, .25, 0, 1, 1, 1, Math.PI / 2, 0, 0)], [G.cyl(.25, .25, 2.2, 6), 0x5e4630, M(.6, .25, 2.2, 1, 1, 1, 0, 0, Math.PI / 2)], ...(GLB.hut ? [] : [[G.cone(2.2, 2.6, 5), 0xa58f62, M(3.4, 1.3, -2.6)], [G.cyl(.05, .05, 3.2, 4), 0x4a321d, M(3.4, 1.6, -2.6)]])]);
  if (GLB.hut) { const hm = glbMesh('hut', .8); hm.position.set(x + 4.2, terrainH(x + 4.2, z - 3.4) - .1, z - 3.4); hm.rotation.y = -2.2; scene.add(hm); }
  logs.position.set(x, terrainH(x, z), z); scene.add(logs);
  ['Kaya', 'Oru', 'Tamsin'].forEach((n, i) => spawnHuman({ team: 'ally', name: n, x: x + Math.cos(i * 2.1) * 5, z: z + Math.sin(i * 2.1) * 5 }));
}

/* ---------- base building ---------- */
const PIECES = [{ id: 'floor', name: 'Floor', cost: { wood: 4 } }, { id: 'wall', name: 'Wall', cost: { wood: 3 } }, { id: 'door', name: 'Doorway', cost: { wood: 3 } }, { id: 'roof', name: 'Roof', cost: { wood: 4, fiber: 2 } }, { id: 'fire', name: 'Campfire', cost: { wood: 3, stone: 3 } }, { id: 'bed', name: 'Bed', cost: { wood: 4, fiber: 6, hide: 2 } }];
const pieceGroup = new T.Group(); scene.add(pieceGroup);
let buildSel = 0, buildRot = 0, ghost = null, ghostSig = '';
const ghostMat = new T.MeshBasicMaterial({ color: 0xc8ff2e, transparent: true, opacity: .42, depthWrite: false });
function pieceParts(id, tier) {
  const tex = HAS('planks'), c = tier ? (tex ? 0xd4d2cc : 0x97968f) : (tex ? 0xd9c7ad : 0x8a6a45), c2 = tier ? (tex ? 0xa9a7a1 : 0x6f6e69) : (tex ? 0xa8937a : 0x6b5034);
  switch (id) {
    case 'floor': return [[G.box(4, .3, 4), c, M(0, -.15, 0)], [G.box(4.02, .31, .07), c2, M(0, -.15, -1)], [G.box(4.02, .31, .07), c2, M(0, -.15, 1)], [G.box(4.02, .31, .07), c2, M(0, -.15, 0)], ...[[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].map(([x, z]) => [G.box(.3, 3, .3), c2, M(x, -1.7, z)])];
    case 'wall': return [[G.box(4, 3, .25), c, M(0, 1.5, -2)], [G.box(.3, 3.1, .34), c2, M(-1.9, 1.55, -2)], [G.box(.3, 3.1, .34), c2, M(1.9, 1.55, -2)], [G.box(4, .2, .32), c2, M(0, 1.5, -2)]];
    case 'door': return [[G.box(1.1, 3, .25), c, M(-1.45, 1.5, -2)], [G.box(1.1, 3, .25), c, M(1.45, 1.5, -2)], [G.box(4, .5, .3), c2, M(0, 2.75, -2)]];
    case 'roof': return [[G.cone(2.95, 1.5, 4), tier ? 0x8f8e88 : 0x9c8452, M(0, 3.85, 0, 1, 1, 1, 0, Math.PI / 4, 0)], [G.box(4.1, .15, 4.1), c2, M(0, 3.08, 0)]];
    case 'fire': return [[G.cyl(.7, .8, .2, 8), 0x77746c, M(0, .1, 0)], [G.cyl(.08, .08, 1.1, 5), 0x4a321d, M(0, .3, 0, 1, 1, 1, 0, 0, 1.25)], [G.cyl(.08, .08, 1.1, 5), 0x4a321d, M(0, .3, 0, 1, 1, 1, 1.25, 0, 0)]];
    case 'bed': return [[G.box(1.3, .35, 2.3), 0x6b5034, M(0, .18, 0)], [G.box(1.2, .12, 2.1), 0xb59b6a, M(0, .4, 0)], [G.box(.9, .14, .45), 0xe4dcc6, M(0, .5, -.75)]];
  }
}
function cellY(cx, cz) {
  const f = floors.get(cellKey(cx, cz)); if (f !== undefined) return f;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = floors.get(cellKey(cx + dx, cz + dz)); if (n !== undefined) return n; }
  const x = cx * 4, z = cz * 4; return Math.max(terrainH(x - 2, z - 2), terrainH(x + 2, z - 2), terrainH(x - 2, z + 2), terrainH(x + 2, z + 2), terrainH(x, z)) + .2;
}
function addPiece(p) {
  const x = p.cx * 4, z = p.cz * 4, th = -p.rot * Math.PI / 2, g = new T.Group(), m = mesh(pieceParts(p.id, p.tier), p.id === 'bed' || p.id === 'fire' ? MAT : p.tier ? triMat('rockg', .5, 1.7) : triMat('planks', .45, 1.7)); m.receiveShadow = true; g.add(m); g.position.set(x, p.y, z); g.rotation.y = th; pieceGroup.add(g);
  const rp = (lx, lz) => [x + lx * Math.cos(th) + lz * Math.sin(th), z - lx * Math.sin(th) + lz * Math.cos(th)];
  const seg = (a, b) => { const A = rp(a, -2), B = rp(b, -2); baseSegs.push({ x1: A[0], z1: A[1], x2: B[0], z2: B[1], y: p.y, h: 3 }); };
  if (p.id === 'floor') floors.set(cellKey(p.cx, p.cz), p.y);
  else if (p.id === 'wall') seg(-2, 2);
  else if (p.id === 'door') { seg(-2, -.9); seg(.9, 2); }
  else if (p.id === 'fire') { const f = fireMesh(0, 0, 0); f.g.remove(f.g.children[0]); g.add(f.g); fires.push({ x, z, fl: f.fl, l: f.l }); }
  else if (p.id === 'bed') beds.push({ x, z });
}
function rebuildBase() { pieceGroup.clear(); floors.clear(); baseSegs = []; fires = fires.filter(f => f.fixed); beds = []; S.pieces.filter(p => p.id === 'floor').forEach(addPiece); S.pieces.filter(p => p.id !== 'floor').forEach(addPiece); refreshSegs(); }
function buildCell() { const fx = -Math.sin(P.camYaw), fz = -Math.cos(P.camYaw); return { cx: Math.round((P.pos.x + fx * 4.6) / 4), cz: Math.round((P.pos.z + fz * 4.6) / 4) }; }
function setBuild(on) {
  if (on && !S.tools.hammer) { toast('Craft a Build Hammer first (Tab)'); return; }
  if (on && P.mount) { toast('Dismount to build'); return; }
  buildMode = !!on; if (on && S.weapon !== 'hammer') equipWeapon('hammer', true); if (ghost) ghost.visible = buildMode; uiBuildBar();
}
function updateGhost() {
  const sig = buildSel + ''; if (sig !== ghostSig) { if (ghost) scene.remove(ghost); ghost = new T.Mesh(merged(pieceParts(PIECES[buildSel].id, 0)), ghostMat); scene.add(ghost); ghostSig = sig; }
  const { cx, cz } = buildCell(); ghost.visible = true; ghost.position.set(cx * 4, cellY(cx, cz), cz * 4); ghost.rotation.y = -buildRot * Math.PI / 2;
  ghostMat.color.setHex(canAfford(PIECES[buildSel].cost) ? 0xc8ff2e : 0xff4a3a);
}
function placePiece() {
  const pc = PIECES[buildSel], { cx, cz } = buildCell(), rot = buildRot;
  if (S.pieces.some(p => p.id === pc.id && p.cx === cx && p.cz === cz && (pc.id === 'floor' || pc.id === 'roof' || pc.id === 'fire' || pc.id === 'bed' || p.rot === rot))) { toast('Already built here'); return; }
  if (dist2(cx * 4, cz * 4, OUTPOST.x, OUTPOST.z) < 30) { toast('Too close to the Ashfang outpost'); return; }
  if (!canAfford(pc.cost)) { toast('Not enough materials for ' + pc.name); return; }
  pay(pc.cost); S.pieces.push({ id: pc.id, cx, cz, rot, y: cellY(cx, cz), tier: 0 }); rebuildBase(); sfx('craft'); burst(cx * 4, cellY(cx, cz) + 1, cz * 4, 0xc9a26b, 10, 3);
}
function upgradePiece() {
  const { cx, cz } = buildCell(), p = S.pieces.find(p => p.cx === cx && p.cz === cz && !p.tier && p.id !== 'fire' && p.id !== 'bed');
  if (!p) { toast('Nothing to upgrade in this tile'); return; } if (S.inv.stone < 4) { toast('Upgrade to stone costs 4 Stone'); return; }
  S.inv.stone -= 4; p.tier = 1; rebuildBase(); sfx('craft'); toast('Upgraded ' + p.id + ' to stone', 'lime');
}
function removePiece() {
  const { cx, cz } = buildCell(); let i = -1; S.pieces.forEach((p, k) => { if (p.cx === cx && p.cz === cz) i = k; });
  if (i < 0) return; S.pieces.splice(i, 1); S.inv.wood += 2; rebuildBase(); sfx('chop');
}

/* ---------- live events ---------- */
const EV = { next: 95, active: null, t: 0, dur: 0, title: '', spawned: 0, alpha: null, first: true };
const meteors = [];
function startEvent(kind) {
  EV.active = kind; EV.t = 0; EV.spawned = 0;
  if (kind === 'storm') { EV.dur = 42; EV.title = 'AMBER STORM'; EV.sub = 'Meteors are falling — grab the amber shards'; }
  else if (kind === 'alpha') { const p = landPoint(P.pos.x, P.pos.z, 60, 85); EV.alpha = spawnDino('rex', p.x, p.z, { alpha: true, scale: 1.18, pal: [0x3a1512, 0x8a2f22, 0xff7a1a], hp: 1300, maxHp: 1300, state: 'chase', target: P, t: 90 }); EV.dur = 260; EV.title = 'ALPHA HUNT'; EV.sub = 'An Alpha Tyrannosaurus is on the prowl'; }
  else if (kind === 'gather') {
    const x = SPAWN.x - 9, z = SPAWN.z - 11, y = terrainH(x, z), g = new T.Group(); EV.mark = { x, z }; EV.dur = 75; EV.title = 'TRIBE GATHERING'; EV.sub = 'A show at your camp — get there and dance (hold G) for amber'; EV.day0 = S.dayT; EV.beat = 0; EV.pay = 0;
    const star = makeDino('rex', MOUNTSKIN.candy); star.g.scale.setScalar(2.2); star.g.position.set(x, y, z); star.g.rotation.order = 'YXZ'; g.add(star.g); const beams = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, bm = new T.Mesh(new T.ConeGeometry(3, 46, 10, 1, true), new T.MeshBasicMaterial({ color: [0xc8ff2e, 0xff5fa8, 0x8a5bff, 0x4ad8ff][i % 4], transparent: true, opacity: .17, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); bm.geometry.translate(0, -23, 0); bm.rotation.x = Math.PI; bm.position.set(x + Math.cos(a) * 9, y, z + Math.sin(a) * 9); g.add(bm); beams.push(bm); const fl = new T.Mesh(G.cone(.5, 1.6, 6), new T.MeshBasicMaterial({ color: 0xffa23a })); fl.position.set(x + Math.cos(a) * 9, y + .8, z + Math.sin(a) * 9); g.add(fl); }
    const lt = new T.PointLight(0xff7ad0, 220, 60, 1.4); lt.position.set(x, y + 9, z + 4); g.add(lt); scene.add(g); EV.fest = { g, star, beams, lt, x, y, z };
  }
  else { for (let i = 0; i < 3; i++) { const p = landPoint(P.pos.x, P.pos.z, 38, 52, .5); spawnHuman({ team: 'ash', raider: 1, x: p.x, z: p.z, name: 'Ashfang Raider' }); } EV.dur = 200; EV.title = 'TRIBE RAID'; EV.sub = 'Ashfang raiders are hunting you'; }
  sfx('roar'); bigBanner('LIVE EVENT · ' + EV.title, EV.sub);
}
function eventsUpdate(dt) {
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]; m.t += dt / 2.2; m.m.position.lerpVectors(m.from, m.to, Math.min(1, m.t)); if (Math.random() < .6) burst(m.m.position.x, m.m.position.y, m.m.position.z, 0xff8a2a, 1, 1.5, 1.6);
    if (m.t >= 1) { scene.remove(m.m); meteors.splice(i, 1); sfx('boom'); burst(m.to.x, m.to.y + .5, m.to.z, 0xffa23a, 26, 7, 1.8); if (dist2(P.pos.x, P.pos.z, m.to.x, m.to.z) < 3.5) damage(P, 15, null); const n = new T.Mesh(new T.OctahedronGeometry(.6), new T.MeshBasicMaterial({ color: 0xffa51f })); n.position.set(m.to.x, m.to.y + .8, m.to.z); scene.add(n); nodes.push({ x: m.to.x, z: m.to.z, m: n, amber: 120, life: 240 }); }
  }
  for (let i = nodes.length - 1; i >= 0; i--) { const n = nodes[i]; n.m.rotation.y += dt * 2; n.life -= dt; if (n.life <= 0) { scene.remove(n.m); nodes.splice(i, 1); } }
  if (!EV.active) { EV.next -= dt; if (EV.next <= 0) { const o = ['storm', 'alpha', 'gather', 'gather']; if (!S.won) o.push('raid'); startEvent(EV.first ? 'storm' : EV.n === 1 ? 'gather' : pick(o)); EV.first = false; EV.n = (EV.n || 0) + 1; } return; }
  EV.t += dt;
  if (EV.active === 'gather' && EV.fest) {
    const f = EV.fest, t = EV.t; S.dayT = .8; f.star.g.position.y = f.y + Math.abs(Math.sin(t * 4.2)) * 1.1; f.star.g.rotation.y = Math.sin(t * 1.4) * 1.2; f.star.g.rotation.z = Math.sin(t * 4.2) * .12; if (f.star.u) { f.star.u.uPh.value = t * 8.4; f.star.u.uAmp.value = .35; }
    f.beams.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.3 + i) * .45; b.rotation.x = Math.PI + Math.cos(t * 1.1 + i * 2) * .4; }); f.lt.color.setHSL((t * .25) % 1, 1, .6);
    if ((EV.beat -= dt) <= 0) { EV.beat = .48; sfx('kick'); setTimeout(() => sfx('hat'), 240); burst(f.x + rand(-22, 22), f.y + rand(18, 34), f.z + rand(-22, 22), pick([0xc8ff2e, 0xff5fa8, 0x8a5bff, 0x4ad8ff, 0xffc04a]), 22, 9, 2.4); }
    if ((EV.pay -= dt) <= 0) { EV.pay = 4; if (dist2(P.pos.x, P.pos.z, f.x, f.z) < 34) { const n = P.emote ? 60 : 25; addAmber(n); toast('+' + n + ' amber · ' + (P.emote ? 'the crowd loves it!' : 'enjoying the show — dance for more'), 'gold'); } }
  }
  if (EV.active === 'storm' && EV.spawned < 8 && EV.t > EV.spawned * 4 + 2) {
    EV.spawned++; const p = landPoint(P.pos.x, P.pos.z, 12, 42, .8), to = new T.Vector3(p.x, terrainH(p.x, p.z), p.z);
    const m = new T.Mesh(new T.SphereGeometry(.9, 7, 6), new T.MeshBasicMaterial({ color: 0xffc04a })); scene.add(m); meteors.push({ m, to, from: new T.Vector3(p.x + rand(-50, 50), to.y + 140, p.z + rand(-50, 50)), t: 0 });
  }
  let done = EV.t > EV.dur; if (EV.active === 'alpha' && !EV.alpha.alive) done = true; if (EV.active === 'raid' && !humans.some(e => e.raider && e.alive)) { done = true; if (EV.t <= EV.dur) toast('Raid repelled!', 'lime'); }
  if (done) { if (EV.fest) { scene.remove(EV.fest.g); EV.fest = null; S.dayT = EV.day0; toast('The gathering is over — until next time', 'lime'); } EV.active = null; EV.next = rand(170, 260); }
}

/* ---------- quests ---------- */
const QUESTS = [
  ['Pick up 3 stones — walk to a rock and press E', () => S.inv.stone >= 3 || S.tools.axe],
  ['Gather 4 fiber from berry bushes (E)', () => S.inv.fiber >= 4 || S.tools.axe],
  ['Punch a tree for 3 wood (LMB)', () => S.inv.wood >= 3 || S.tools.axe],
  ['Open crafting (Tab) and make a Stone Axe', () => S.tools.axe],
  ['Craft a Hunting Bow and Arrows', () => S.tools.bow && (S.inv.arrows > 0 || S.stat.kills > 0)],
  ['Hunt a Dryosaurus for raw meat', () => S.stat.kills > 0],
  ['Daze a Raptor (under 30% health), then feed it 2 raw meat', () => S.stat.tames > 0],
  ['Craft a Build Hammer, press B and place a Floor', () => S.pieces.length > 0],
  ['Craft a Saddle and ride your dino (F)', () => S.stat.rides > 0],
  ['Breach the Ashfang outpost (red marker on compass)', () => S.won]
];
function questUpdate() { while (S.quest < QUESTS.length && QUESTS[S.quest][1]()) { S.quest++; addAmber(150); toast('Objective complete · +150 amber', 'lime'); } }

/* ---------- interaction ---------- */
function findPrompt() {
  if (P.mount) return { key: 'F', text: 'DISMOUNT', fn: dismount, quiet: true };
  const px = P.pos.x, pz = P.pos.z;
  for (const d of dinos) {
    if (!d.alive) continue; const dd = dist2(px, pz, d.pos.x, d.pos.z);
    if (d.state === 'stunned' && d.def.tame && !d.tamed && dd < d.r + 3.2) return { key: 'E', text: 'TAME', fn: () => tame(d) };
    if (d.tamed && d.def.mount && dd < d.r + 2.6 && Math.abs(d.pos.y - P.pos.y) < 6) return { key: 'F', text: S.tools.saddle ? 'RIDE ' + d.name.toUpperCase() : 'RIDE — NEEDS SADDLE', fn: () => mountDino(d) };
  }
  for (const n of nodes) if (dist2(px, pz, n.x, n.z) < 3) return { key: 'E', text: 'COLLECT AMBER', fn: () => { addAmber(n.amber); toast('+' + n.amber + ' amber', 'gold'); n.life = 0; } };
  if (S.fossilT <= 0 && dist2(px, pz, FOSSIL.x, FOSSIL.z) < 10) return { key: 'E', text: 'DIG FOR FOSSIL AMBER', fn: () => { S.fossilT = 300; addAmber(250); toast('+250 amber from the fossil bed', 'gold'); burst(px, P.pos.y + .3, pz, 0xd9c594, 14, 3); } };
  for (const b of beds) if (dist2(px, pz, b.x, b.z) < 2.6) return { key: 'E', text: 'SLEEP', fn: () => { S.bed = { x: b.x, z: b.z }; S.hp = Math.min(100, S.hp + 30); if (nightF > .5) { S.dayT = .27; toast('You slept until morning', 'lime'); } else toast('Respawn point set', 'lime'); } };
  if (S.inv.meat > 0) for (const f of fires) if (dist2(px, pz, f.x, f.z) < 3.4) return { key: 'E', text: 'COOK MEAT', fn: () => { S.inv.meat--; give('cooked', 1); sfx('craft'); } };
  let best = null, bd = 2.6; for (const o of bushes) { if (!o.berries) continue; const d = dist2(px, pz, o.x, o.z); if (d < bd) { bd = d; best = o; } }
  if (best) return { key: 'E', text: 'GATHER BERRIES & FIBER', fn: () => { best.berries = false; best.t = 100; hideInst(IM.berry, best.i); S.inv.berries += 3; S.inv.fiber += 2; toast('+3 Berries · +2 Fiber'); sfx('pick'); } };
  for (const o of rocks) { if (!o.alive) continue; if (dist2(px, pz, o.x, o.z) < 1.5 + o.s) return { key: 'E', text: 'PICK UP STONE', fn: () => { S.inv.stone++; const fl = Math.random() < .25; if (fl) S.inv.flint++; toast('+1 Stone' + (fl ? ' · +1 Flint' : '')); sfx('pick'); if (--o.hp <= 0) { o.alive = false; o.t = 150; hideInst(IM.rock, o.i); } } }; }
  if (S.water < 96 && (terrainH(px, pz) < .25 || terrainH(px - Math.sin(P.camYaw) * 1.6, pz - Math.cos(P.camYaw) * 1.6) < -.05)) return { key: 'E', text: 'DRINK', fn: () => { S.water = Math.min(100, S.water + 40); sfx('pick'); } };
  return null;
}

/* ---------- input ---------- */
const canvas = renderer.domElement;
function requestLock() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
addEventListener('blur', () => { for (const k in K) K[k] = false; P.charge = -1; });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (e.code === 'Tab' || (e.code === 'Space' && mode === 'play')) e.preventDefault(); if (e.repeat) return; K[e.code] = true; initAudio();
  if (mode === 'craft') { if (e.code === 'Tab' || e.code === 'Escape') closeOverlay(); return; }
  if (mode === 'menu') { if (e.code === 'KeyP' || e.code === 'Escape') closeOverlay(); return; }
  if (mode !== 'play') return;
  const dg = e.code.startsWith('Digit') ? +e.code[5] : 0;
  if (dg >= 1 && dg <= 6) { if (buildMode) { buildSel = dg - 1; uiBuildBar(); } else { const w = SLOTS[dg - 1]; if (!S.tools[w]) toast(WNAME[w] + ' not crafted yet'); else equipWeapon(S.weapon === w ? 'hand' : w); } return; }
  switch (e.code) {
    case 'Tab': openCraft(); break; case 'KeyP': openMenu('shop'); break;
    case 'KeyE': case 'KeyF': if (prompt && prompt.key === e.code[3]) prompt.fn(); break;
    case 'KeyB': setBuild(!buildMode); break; case 'KeyH': eatBest(); break;
    case 'KeyR': if (buildMode) buildRot = (buildRot + 1) % 4; break; case 'KeyU': if (buildMode) upgradePiece(); break; case 'KeyX': if (buildMode) removePiece(); break;
    case 'KeyV': P.fp = !P.fp; toast(P.fp ? 'First-person view' : 'Third-person view'); break;
    case 'KeyT': P.rally = !P.rally; toast(P.rally ? 'Tribe rallied — they follow and fight with you' : 'Tribe returns to camp', 'lime'); sfx('roar'); break;
    case 'KeyQ': wheelOpen('weapon'); break; case 'KeyG': wheelOpen('emote'); break;
  }
});
addEventListener('keyup', e => { K[e.code] = false; if ((e.code === 'KeyQ' || e.code === 'KeyG') && wheel.open) wheelClose(); });
canvas.addEventListener('mousedown', e => {
  initAudio(); if (mode !== 'play') return; if (!locked) requestLock();
  if (e.button === 0 && !wheel.open) { if (buildMode) placePiece(); else startCharge(); }
});
addEventListener('mouseup', e => { if (e.button === 0 && mode === 'play') releaseCharge(); });
addEventListener('mousemove', e => {
  if (mode === 'creator') { if ((e.buttons & 1) && e.target === canvas) creator.spin += e.movementX * .01; return; }
  if (mode !== 'play') return;
  if (wheel.open) { if (locked) wheelMove(e.movementX, e.movementY, false); else wheelMove(e.clientX - innerWidth / 2, e.clientY - innerHeight / 2, true); return; }
  if (locked || (e.buttons & 2)) { P.camYaw -= clamp(e.movementX, -220, 220) * .0023; P.camPitch = clamp(P.camPitch - clamp(e.movementY, -220, 220) * .0023, -1.2, .9); }
});

/* ---------- camera ---------- */
const camGoal = new T.Vector3(), camLook = new T.Vector3();
function updateCamera(dt) {
  if (mode === 'title') { const t = performance.now() / 9000, y = terrainH(SPAWN.x, SPAWN.z); camera.position.set(SPAWN.x + Math.cos(t) * 17, y + 6.5, SPAWN.z + Math.sin(t) * 17); camera.lookAt(SPAWN.x, y + 2, SPAWN.z); return; }
  if (mode === 'creator') {
    const dv = new T.Vector3(VOLC.x - P.pos.x, 0, VOLC.z - P.pos.z).normalize(), bh = (BODIES[S.look.body] || BODIES.athletic).h, d = creator.zoom ? 1.3 : 4.3, h = creator.zoom ? 1.66 * bh : 1.05;
    camGoal.set(P.pos.x - dv.x * d, P.pos.y + h + (creator.zoom ? 0 : .3), P.pos.z - dv.z * d); camera.position.lerp(camGoal, Math.min(1, 6 * dt));
    camLook.lerp(_v.set(P.pos.x, P.pos.y + h, P.pos.z), Math.min(1, 6 * dt)); camera.lookAt(camLook); P.yaw = Math.atan2(-dv.x, -dv.z) + creator.spin; return;
  }
  if (P.fp && !P.mount) { const f = camF3(); camera.position.set(P.pos.x + f.x * .12, P.pos.y + 1.64, P.pos.z + f.z * .12); camera.lookAt(camera.position.x + f.x, camera.position.y + f.y, camera.position.z + f.z); return; }
  const m = P.mount, dist = m ? 5.5 + m.def.s * 2.6 : 5.2, f3 = camF3(), rx = Math.cos(P.camYaw), rz = -Math.sin(P.camYaw);
  const tx = P.pos.x + rx * .7, ty = P.pos.y + 1.65, tz = P.pos.z + rz * .7;
  camera.position.set(tx - f3.x * dist, ty - f3.y * dist, tz - f3.z * dist);
  const gy = Math.max(terrainH(camera.position.x, camera.position.z), 0) + .45; if (camera.position.y < gy) camera.position.y = gy;
  camera.lookAt(tx + f3.x * 20, ty + f3.y * 20, tz + f3.z * 20);
}

/* ---------- main loop ---------- */
let lastT = performance.now(), uiAcc = 0, saveAcc = 0, qAcc = 0, perfN = 0, perfT = 0, perfDone = false, perfRaw = 0;
function frame(now) {
  requestAnimationFrame(frame); const raw = (now - lastT) / 1000, dt = Math.min(.05, raw); lastT = now; if (mode === 'play' && !perfDone) perfRaw += raw;
  if (mode === 'play' && !perfDone) { perfN++; perfT += (now - lastT + dt * 1000) * 0 + dt; if (perfN >= 150) { perfDone = true; if (perfN / perfRaw < 26) { renderer.shadowMap.enabled = false; sun.castShadow = false; renderer.setPixelRatio(1); scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); toast('Low frame rate — shadows turned off'); } } }
  if (mode === 'play') {
    S.dayT = (S.dayT + dt / 600) % 1; if (S.fossilT > 0) S.fossilT -= dt; if (lastHitT > 0) lastHitT -= dt;
    playerUpdate(dt); for (const d of dinos) dinoUpdate(d, dt); for (const e of humans) humanUpdate(e, dt);
    projUpdate(dt); eventsUpdate(dt); vegRespawn(dt); respawnUpdate(dt);
    prompt = P.alive ? findPrompt() : null; if (buildMode) updateGhost();
    if (gate.alive && gate.shake > 0) { gate.shake -= dt; gate.mesh.rotation.z = Math.sin(now / 20) * gate.shake * .12; }
    for (const f of fires) { const k = 1 + Math.sin(now / 90 + f.x) * .12; f.fl.scale.set(k, 1 + Math.sin(now / 60 + f.z) * .18, k); f.l.intensity = (4 + nightF * 30) * k; }
    if ((qAcc += dt) > .5) { qAcc = 0; questUpdate(); } if ((saveAcc += dt) > 15) { saveAcc = 0; save(); }
  } else if (P.h) {
    P.h.g.position.copy(P.pos); P.h.g.rotation.y = P.yaw; animHuman(P.h, 0, false, mode === 'creator' ? {} : { sit: !!P.mount }); if (P.mount) P.h.g.position.y -= .78;
    if (mode === 'dead') { for (const d of dinos) dinoUpdate(d, dt); }
  }
  netUpdate(dt); waterUpdate(now); fpUpdate(); partsUpdate(dt); updateCamera(dt); updateSky(S.dayT, P.pos); renderer.render(scene, camera);
  if (mode === 'play') { uiFrame(); if ((uiAcc += dt) > .1) { uiAcc = 0; uiTick(); } }
}
function startPlay() { S.created = true; mode = 'play'; if (NET.started) { if (NET.on) netJoin(); } else netStart(); creator.zoom = false; creator.spin = 0; showHud(true); requestLock(); save(); }
async function boot() {
  await loadAssets(); show('#loading', false);
  let fresh = false; try { fresh = sessionStorage.getItem('af-new') === '1'; sessionStorage.removeItem('af-new'); } catch (e) { }
  S = (!fresh && loadSave()) || newState();
  buildTerrain(); scatter(); buildCamp(); buildOutpost(); rebuildBase();
  const sp = S.pos ? { x: S.pos[0], z: S.pos[1] } : SPAWN; P.pos.set(sp.x, Math.max(groundH(sp.x, sp.z), -1.2), sp.z);
  rebuildPlayer(); populate(); uiInit(); camLook.set(P.pos.x, P.pos.y + 1, P.pos.z);
  if (fresh) enterCreator(); else showTitle();
  requestAnimationFrame(frame);
}
addEventListener('beforeunload', save);
