'use strict';
/* ================= game: state, player, combat, dinosaurs, humans ================= */
const SAVE_KEY = 'amberfall-save-v1';
const DEF_LOOK = { build: 'a', body: 'athletic', skin: 1, face: 0, hair: 'crop', hairCol: 1, beard: 0, outfit: 'hide' };
const ITEMS = { wood: 'Wood', stone: 'Stone', flint: 'Flint', fiber: 'Fiber', berries: 'Berries', meat: 'Raw Meat', cooked: 'Cooked Meat', hide: 'Hide', arrows: 'Arrows', bandage: 'Bandage' };
const SLOTS = ['bow', 'axe', 'spear', 'torch', 'sling', 'hammer'];
const WNAME = { hand: 'Bare Hands', bow: 'Hunting Bow', axe: 'Stone Axe', spear: 'Flint Spear', torch: 'Torch', sling: 'Sling', hammer: 'Build Hammer' };
const MELEE = { hand: { d: 5, reach: 2.2, tree: 1, rock: 0, gate: .3 }, axe: { d: 18, reach: 2.6, tree: 3, rock: 2, gate: 1 }, spear: { d: 27, reach: 3.7, tree: 0, rock: 0, gate: .5 }, torch: { d: 9, reach: 2.4, tree: 0, rock: 0, gate: .6 }, hammer: { d: 14, reach: 2.6, tree: 1, rock: 3, gate: 2 }, bow: { d: 4, reach: 2, tree: 0, rock: 0, gate: .2 }, sling: { d: 4, reach: 2, tree: 0, rock: 0, gate: .2 } };
const RECIPES = [
  { id: 'axe', name: 'Stone Axe', tool: 1, cost: { wood: 3, stone: 2, fiber: 2 }, desc: 'Chops trees, mines rock, holds its own in a fight.' },
  { id: 'bow', name: 'Hunting Bow', tool: 1, cost: { wood: 5, fiber: 6 }, desc: 'Hold LMB to draw. Release at 72–88% for a PERFECT shot.' },
  { id: 'arrows', name: 'Arrows ×6', give: ['arrows', 6], cost: { wood: 2, flint: 1 }, desc: 'Flint drops from rocks.' },
  { id: 'spear', name: 'Flint Spear', tool: 1, cost: { wood: 4, flint: 2, fiber: 2 }, desc: 'Longest reach, hardest melee hit.' },
  { id: 'sling', name: 'Sling', tool: 1, cost: { fiber: 5, hide: 1 }, desc: 'Throws stones. Never kills — ideal for dazing a dino you want to tame.' },
  { id: 'torch', name: 'Torch', tool: 1, cost: { wood: 2, fiber: 2 }, desc: 'Lights the night.' },
  { id: 'hammer', name: 'Build Hammer', tool: 1, cost: { wood: 4, stone: 4 }, desc: 'Equip it and press B to build your base.' },
  { id: 'saddle', name: 'Saddle', tool: 1, cost: { hide: 4, fiber: 6 }, desc: 'Ride tamed raptors, triceratops and pteranodons (F).' },
  { id: 'cooked', name: 'Cooked Meat', give: ['cooked', 1], cost: { meat: 1 }, fire: 1, desc: 'Needs a campfire nearby.' },
  { id: 'bandage', name: 'Bandage', give: ['bandage', 1], cost: { fiber: 4 }, desc: 'Restores 35 health.' }
];
const TAME_NAMES = ['Ember', 'Fern', 'Talon', 'Moss', 'Blaze', 'Pebble', 'Echo', 'Saffron', 'Thorn', 'Juno', 'Rook', 'Sable'];
let S = null;
function newState() {
  return { look: { ...DEF_LOOK }, inv: { wood: 0, stone: 0, flint: 0, fiber: 0, berries: 0, meat: 0, cooked: 0, hide: 0, arrows: 0, bandage: 0 }, tools: { hand: 1 }, weapon: 'hand', amber: 1500, owned: {}, equip: { bow: null, mount: null }, quest: 0, pieces: [], gate: 500, won: false, tamed: [], xp: 0, tier: 0, crates: 1, codex: {}, hp: 100, water: 80, food: 75, dayT: .3, bed: null, created: false, pos: null, stat: { kills: 0, tames: 0, rides: 0 }, fossilT: 0 };
}
function save() { if (!S || !S.created) return; try { S.pos = [P.pos.x, P.pos.z]; S.tamed = dinos.filter(d => d.tamed && d.alive).map(d => ({ type: d.type, name: d.name })); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.inv && s.created) { const n = newState(); return Object.assign(n, s, { inv: Object.assign(n.inv, s.inv), stat: Object.assign(n.stat, s.stat), equip: Object.assign(n.equip, s.equip) }); } } catch (e) { } return null; }

const K = {};
let mode = 'title', locked = false;
const P = { kind: 'player', pos: new T.Vector3(SPAWN.x, 0, SPAWN.z), vy: 0, yaw: 0, camYaw: 2.4, camPitch: -.12, ground: true, alive: true, r: .5, h: null, walkT: 0, moving: false, charge: -1, swing: 0, emote: null, emoteT: 0, mount: null, iframes: 0, atkCool: 0 };
const dinos = [], humans = [], projs = [], nodes = [], respawns = [];
let fires = [], beds = [], segs = [], baseSegs = [], outSegs = [];
let lastHit = null, lastHitT = 0, prompt = null, buildMode = false;
const creator = { zoom: false, spin: 0 };

function addAmber(n) { S.amber += n; S.xp += n; const t = Math.floor(S.xp / 1500); if (t > S.tier) { S.tier = t; S.crates++; toast('Season tier ' + t + ' reached — free Relic Crate!', 'gold'); } sfx('coin'); }
function give(item, n) { S.inv[item] = (S.inv[item] || 0) + n; toast('+' + n + ' ' + ITEMS[item]); }
const canAfford = c => Object.keys(c).every(k => (S.inv[k] || 0) >= c[k]);
const pay = c => Object.keys(c).forEach(k => S.inv[k] -= c[k]);
const nearFire = () => fires.some(f => dist2(P.pos.x, P.pos.z, f.x, f.z) < 5.5);
function craft(r) {
  if (r.tool && S.tools[r.id]) return; if (!canAfford(r.cost)) { toast('Missing materials'); return; }
  if (r.fire && !nearFire()) { toast('Stand near a campfire to cook'); return; }
  pay(r.cost); sfx('craft');
  if (r.tool) { S.tools[r.id] = 1; toast('Crafted ' + r.name, 'lime'); if (SLOTS.includes(r.id)) equipWeapon(r.id); } else give(r.give[0], r.give[1]);
}
function useItem(id) {
  if (!S.inv[id]) return;
  if (id === 'berries') { S.inv.berries--; S.food = Math.min(100, S.food + 6); S.water = Math.min(100, S.water + 2); }
  else if (id === 'cooked') { S.inv.cooked--; S.food = Math.min(100, S.food + 32); S.hp = Math.min(100, S.hp + 6); }
  else if (id === 'meat') { S.inv.meat--; S.food = Math.min(100, S.food + 10); S.hp -= 4; toast('Raw meat… cook it next time'); }
  else if (id === 'bandage') { S.inv.bandage--; S.hp = Math.min(100, S.hp + 35); }
  else return; sfx('pick');
}
function eatBest() { for (const id of ['cooked', 'berries', 'meat']) if (S.inv[id] > 0) { useItem(id); return; } toast('Nothing to eat'); }

function rebuildPlayer() { if (P.h) scene.remove(P.h.g); P.h = makeHuman(S.look); scene.add(P.h.g); equipWeapon(S.weapon, true); }
function equipWeapon(w, quiet) { if (!S.tools[w]) w = 'hand'; S.weapon = w; P.h.hand.clear(); P.h.hand.add(makeWeapon(w, S.equip.bow)); if (buildMode && w !== 'hammer') setBuild(false); if (!quiet) sfx('ui'); }
function camF3() { const cp = Math.cos(P.camPitch); return new T.Vector3(-Math.sin(P.camYaw) * cp, Math.sin(P.camPitch), -Math.cos(P.camYaw) * cp); }
const seatH = d => GLB[d.type] ? (d.def.fly ? .22 : d.def.biped ? 1.5 : 1.72) * d.def.s : d.def.fly ? .25 * d.def.s : d.def.biped ? 1.72 * d.def.s : 2.0 * d.def.s;

/* ---------- collisions ---------- */
function collideSegs(pos, r) {
  for (const s of segs) {
    if (pos.y > s.y + s.h || pos.y < s.y - 2.5) continue;
    const vx = s.x2 - s.x1, vz = s.z2 - s.z1, t = clamp(((pos.x - s.x1) * vx + (pos.z - s.z1) * vz) / (vx * vx + vz * vz), 0, 1), cx = s.x1 + vx * t, cz = s.z1 + vz * t;
    let dx = pos.x - cx, dz = pos.z - cz; const d = Math.hypot(dx, dz), R = r + .3;
    if (d < R) { if (d < 1e-4) { dx = 1; dz = 0; } else { dx /= d; dz /= d; } pos.x = cx + dx * R; pos.z = cz + dz * R; }
  }
}
function collideWorld(pos, r) {
  for (const o of trees) { if (!o.alive) continue; const dx = pos.x - o.x, dz = pos.z - o.z; if (Math.abs(dx) > 2 || Math.abs(dz) > 2) continue; const d = Math.hypot(dx, dz), R = r + .32 * o.s; if (d < R && d > 1e-4) { pos.x = o.x + dx / d * R; pos.z = o.z + dz / d * R; } }
  for (const o of rocks) { if (!o.alive) continue; const dx = pos.x - o.x, dz = pos.z - o.z; if (Math.abs(dx) > 3 || Math.abs(dz) > 3) continue; const d = Math.hypot(dx, dz), R = r + .8 * o.s; if (d < R && d > 1e-4) { pos.x = o.x + dx / d * R; pos.z = o.z + dz / d * R; } }
  collideSegs(pos, r); pos.x = clamp(pos.x, -HALF + 6, HALF - 6); pos.z = clamp(pos.z, -HALF + 6, HALF - 6);
}

/* ---------- player ---------- */
function playerUpdate(dt) {
  if (!P.alive) return;
  P.iframes -= dt; P.atkCool -= dt; if (P.swing > 0) P.swing -= dt;
  if (K.ArrowLeft) P.camYaw += 1.9 * dt; if (K.ArrowRight) P.camYaw -= 1.9 * dt;
  if (K.ArrowUp) P.camPitch = Math.min(.9, P.camPitch + 1.2 * dt); if (K.ArrowDown) P.camPitch = Math.max(-1.2, P.camPitch - 1.2 * dt);
  const ix = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0), iz = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0);
  const fx = -Math.sin(P.camYaw), fz = -Math.cos(P.camYaw), rx = Math.cos(P.camYaw), rz = -Math.sin(P.camYaw);
  let dx = fx * iz + rx * ix, dz = fz * iz + rz * ix; const len = Math.hypot(dx, dz), moving = len > 0; if (moving) { dx /= len; dz /= len; }
  if (P.charge >= 0) P.charge += dt;
  if (P.emote) { P.emoteT += dt; if (moving || P.emoteT > 3.2) P.emote = null; }
  if (P.mount) { mountUpdate(dt, dx, dz, moving, iz); }
  else {
    const swim = terrainH(P.pos.x, P.pos.z) < -1.15;
    const sprint = (K.ShiftLeft || K.ShiftRight) && S.food > 3 && P.charge < 0;
    const spd = (sprint ? 9.6 : 5.6) * (swim ? .5 : 1) * (P.charge >= 0 ? .55 : 1);
    if (moving) { P.pos.x += dx * spd * dt; P.pos.z += dz * spd * dt; P.walkT += dt * spd * 1.55; collideWorld(P.pos, .45); if (sprint) S.food -= dt * .12; }
    let ty = moving ? Math.atan2(dx, dz) : P.yaw; if (P.charge >= 0 || P.swing > 0) ty = Math.atan2(fx, fz);
    P.yaw = lerpAngle(P.yaw, ty, 13 * dt);
    const fl = swim ? -1.3 : groundH(P.pos.x, P.pos.z);
    if (K.Space && P.ground && !swim) { P.vy = 8.2; P.ground = false; }
    P.vy -= 24 * dt; P.pos.y += P.vy * dt;
    if (P.pos.y <= fl || (P.ground && P.vy <= 0 && P.pos.y - fl < .6)) { P.pos.y = fl; P.vy = 0; P.ground = true; } else P.ground = false;
    P.moving = moving; P.swim = swim;
  }
  // survival
  S.food = Math.max(0, S.food - dt * .14); S.water = Math.max(0, S.water - dt * .19);
  if (S.food <= 0 || S.water <= 0) { S.hp -= dt * 1.6; if (S.hp <= 0) die('You succumbed to the wild'); }
  else if (S.food > 35 && S.water > 35 && S.hp < 100) S.hp = Math.min(100, S.hp + dt * 1.1);
  // model
  const g = P.h.g; g.position.copy(P.pos); g.rotation.y = P.yaw; if (P.mount) g.position.y -= .78; else if (P.swim) g.position.y -= .25;
  const ranged = S.weapon === 'bow' || S.weapon === 'sling', ch = P.charge >= 0 ? Math.min(1, P.charge / 1.1) : 0;
  animHuman(P.h, P.walkT, P.moving && !P.mount, { sit: !!P.mount, aim: ranged && P.charge >= 0, raise: !ranged && P.charge >= .1 ? ch : 0, swing: P.swing, emote: P.emote, et: P.emoteT });
}
function mountUpdate(dt, dx, dz, moving, iz) {
  const d = P.mount, def = d.def; let spd = def.spd * ((K.ShiftLeft || K.ShiftRight) ? 1.4 : 1);
  if (def.fly) {
    spd *= 1.25; const gh = Math.max(groundH(d.pos.x, d.pos.z), 0) + .5 * def.s; let vy = 0;
    if (K.Space) vy += 9; if (K.KeyC || K.ControlLeft) vy -= 9; if (moving && iz > 0) vy += Math.sin(P.camPitch) * spd;
    const air = d.pos.y > gh + .25; if (!air) spd *= .3;
    if (moving) { d.pos.x += dx * spd * dt; d.pos.z += dz * spd * dt; d.yaw = lerpAngle(d.yaw, Math.atan2(dx, dz), 5 * dt); }
    else if (air) { d.pos.x += Math.sin(d.yaw) * 3 * dt; d.pos.z += Math.cos(d.yaw) * 3 * dt; }
    d.pos.y = clamp(d.pos.y + vy * dt, gh, 150); d.air = air; d.phase += dt * (air ? 7 : 3); d.moving = moving;
    d.pos.x = clamp(d.pos.x, -HALF, HALF); d.pos.z = clamp(d.pos.z, -HALF, HALF); if (!air) collideSegs(d.pos, 1);
  } else {
    if (moving) { const nx = d.pos.x + dx * spd * dt, nz = d.pos.z + dz * spd * dt; if (terrainH(nx, nz) > -def.s * .9) { d.pos.x = nx; d.pos.z = nz; } d.yaw = lerpAngle(d.yaw, Math.atan2(dx, dz), 6 * dt); d.phase += dt * spd * 1.1; collideWorld(d.pos, def.r * .6); }
    d.pos.y = Math.max(groundH(d.pos.x, d.pos.z), -def.s * .9); d.moving = moving;
  }
  P.pos.set(d.pos.x, d.pos.y + seatH(d), d.pos.z); P.yaw = d.yaw; P.moving = false; P.swim = false;
}
function mountDino(d) {
  if (!S.tools.saddle) { toast('Craft a Saddle first (Tab)'); return; }
  P.mount = d; d.state = 'mounted'; d.target = null; P.charge = -1; setBuild(false); S.stat.rides++; sfx('pick'); toast('Riding ' + d.name + ' — F to dismount' + (d.def.fly ? ' · Space up / C down' : ''), 'lime');
}
function dismount() { const d = P.mount; if (!d) return; P.mount = null; d.state = 'follow'; d.air = d.def.fly && d.pos.y > groundH(d.pos.x, d.pos.z) + 2; P.pos.set(d.pos.x + Math.cos(d.yaw) * (d.r + 1), d.pos.y, d.pos.z - Math.sin(d.yaw) * (d.r + 1)); P.vy = 0; P.ground = false; }
function die(why) {
  if (!P.alive) return; P.alive = false; if (P.mount) dismount(); P.charge = -1; mode = 'dead'; sfx('roar');
  const lost = Math.floor(S.amber * .1); S.amber -= lost; showDead(why, lost);
}
function respawn() {
  const b = S.bed || SPAWN; P.pos.set(b.x, groundH(b.x, b.z) + .2, b.z); P.vy = 0; S.hp = 100; S.water = Math.max(S.water, 60); S.food = Math.max(S.food, 55); P.alive = true; P.iframes = 3; mode = 'play';
  for (const d of dinos) if (d.target === P) { d.state = d.tamed ? 'follow' : 'wander'; d.target = null; }
}

/* ---------- attacks ---------- */
function startCharge() { if (!P.alive || P.atkCool > 0) return; P.charge = 0; P.emote = null; }
function releaseCharge() {
  if (P.charge < 0) return; const p = clamp(P.charge / 1.1, .08, 1), perfect = p > .72 && p < .88, mult = (.45 + .55 * p) * (perfect ? 1.5 : 1), w = S.weapon;
  P.charge = -1; P.atkCool = .32; if (perfect) { floatText('PERFECT'); sfx('coin'); }
  const fx = -Math.sin(P.camYaw), fz = -Math.cos(P.camYaw);
  if (w === 'bow' || w === 'sling') {
    const ammo = w === 'bow' ? 'arrows' : 'stone'; if (S.inv[ammo] < 1) { toast(w === 'bow' ? 'No arrows — craft some (Tab)' : 'No stones for the sling'); return; }
    S.inv[ammo]--; const start = new T.Vector3(P.pos.x + fx * .6, P.pos.y + 1.45, P.pos.z + fz * .6);
    const dir = camera.position.clone().addScaledVector(camF3(), 110).sub(start).normalize();
    shoot(P, start, dir, w === 'bow' ? 30 + 44 * p : 28 + 24 * p, w === 'bow' ? 26 * mult : 9 * mult, w === 'bow' ? 'arrow' : 'stone'); sfx('shoot'); P.swing = .12; return;
  }
  P.swing = .3; P.yaw = Math.atan2(fx, fz);
  if (P.mount) { mountAttack(); return; }
  melee(MELEE[w] || MELEE.hand, mult, w, fx, fz);
}
function inFront(px, pz, fx, fz, tx, tz, reach) { const dx = tx - px, dz = tz - pz, d = Math.hypot(dx, dz); return d < reach && (d < .8 || (dx * fx + dz * fz) / d > .45) ? d : -1; }
function melee(W, mult, w, fx, fz) {
  const px = P.pos.x, pz = P.pos.z; let best = null, bd = 1e9;
  for (const e of dinos) { if (!e.alive || e.tamed || Math.abs(e.pos.y - P.pos.y) > 4 + e.r) continue; const d = inFront(px, pz, fx, fz, e.pos.x, e.pos.z, W.reach + e.r); if (d >= 0 && d < bd) { bd = d; best = e; } }
  for (const e of humans) { if (!e.alive || e.team !== 'ash') continue; const d = inFront(px, pz, fx, fz, e.pos.x, e.pos.z, W.reach + .5); if (d >= 0 && d < bd) { bd = d; best = e; } }
  if (best) { damage(best, W.d * mult, P); burst(best.pos.x, best.pos.y + (best.kind === 'dino' ? best.def.s : 1.2), best.pos.z, 0xb8232a, 6, 3); sfx('hit'); return; }
  if (gate.alive && inFront(px, pz, fx, fz, gate.x, gate.z, W.reach + 2.6) >= 0) { damageGate(W.d * mult * W.gate); return; }
  if (W.tree) for (const o of trees) {
    if (!o.alive || inFront(px, pz, fx, fz, o.x, o.z, 2.5) < 0) continue;
    o.hp -= W.tree * (.6 + mult * .5); S.inv.wood += w === 'axe' ? 2 : 1; sfx('chop'); burst(o.x, o.y + 1.3, o.z, 0xc9a26b, 6, 3);
    if (o.hp <= 0) { o.alive = false; o.t = 200; hideInst(IM['tree' + o.type], o.i); give('wood', 3); burst(o.x, o.y + 3, o.z, 0x3f7a44, 16, 5, 1.6); } else toast('+' + (w === 'axe' ? 2 : 1) + ' Wood'); return;
  }
  if (W.rock) for (const o of rocks) {
    if (!o.alive || inFront(px, pz, fx, fz, o.x, o.z, 2.2 + o.s) < 0) continue;
    o.hp -= W.rock; S.inv.stone += 2; const fl = Math.random() < .4; if (fl) S.inv.flint++; toast('+2 Stone' + (fl ? ' · +1 Flint' : '')); sfx('chop'); burst(o.x, o.y + .6, o.z, 0x9a968c, 7, 3);
    if (o.hp <= 0) { o.alive = false; o.t = 150; hideInst(IM.rock, o.i); } return;
  }
}
function mountAttack() {
  const d = P.mount, def = d.def; d.lunge = .3; const fx = Math.sin(d.yaw), fz = Math.cos(d.yaw); let hit = false; P.atkCool = .75;
  for (const e of [...dinos, ...humans]) { if (!e.alive || e === d || e.tamed || e.team === 'ally') continue; if (inFront(d.pos.x, d.pos.z, fx, fz, e.pos.x, e.pos.z, def.r + 2.6 + (e.r || .5)) >= 0 && Math.abs(e.pos.y - d.pos.y) < 5) { damage(e, def.bite, P); hit = true; } }
  if (gate.alive && inFront(d.pos.x, d.pos.z, fx, fz, gate.x, gate.z, def.r + 4) >= 0) { damageGate(def.bite * (d.type === 'trike' ? 3 : 1)); hit = true; }
  sfx(hit ? 'hit' : 'chop');
}
const projGeo = { arrow: new T.BoxGeometry(.05, .05, .95), stone: new T.SphereGeometry(.12, 6, 5), spear: new T.BoxGeometry(.06, .06, 1.9) };
const projMat = { arrow: new T.MeshBasicMaterial({ color: 0xe8dcc0 }), stone: new T.MeshBasicMaterial({ color: 0x8d8a83 }), spear: new T.MeshBasicMaterial({ color: 0x7a5a36 }) };
function shoot(owner, start, dir, speed, dmg, type) {
  const m = new T.Mesh(projGeo[type], projMat[type]); m.position.copy(start); scene.add(m);
  projs.push({ m, v: dir.clone().multiplyScalar(speed), dmg, owner, type, life: 5, friendly: owner === P });
}
function projUpdate(dt) {
  for (let i = projs.length - 1; i >= 0; i--) {
    const p = projs[i], m = p.m; p.life -= dt; p.v.y -= 11 * dt; m.position.addScaledVector(p.v, dt); m.lookAt(m.position.x + p.v.x, m.position.y + p.v.y, m.position.z + p.v.z);
    let dead = p.life <= 0 || m.position.y < terrainH(m.position.x, m.position.z) || m.position.y < 0;
    if (!dead && p.friendly) {
      for (const e of dinos) { if (!e.alive || e.tamed) continue; const cy = e.def.fly ? 0 : e.def.s * 1.25; if (Math.hypot(m.position.x - e.pos.x, m.position.y - e.pos.y - cy, m.position.z - e.pos.z) < e.r + .45) { damage(e, p.dmg, P, p.type === 'stone'); dead = true; break; } }
      if (!dead) for (const e of humans) { if (!e.alive || e.team !== 'ash') continue; if (Math.hypot(m.position.x - e.pos.x, m.position.y - e.pos.y - 1, m.position.z - e.pos.z) < .85) { damage(e, p.dmg, P); dead = true; break; } }
      if (!dead && gate.alive && dist2(m.position.x, m.position.z, gate.x, gate.z) < 3 && m.position.y < OUTPOST.h + 5) { damageGate(p.dmg * .25); dead = true; }
      if (dead && p.life > 0) { sfx('hit'); burst(m.position.x, m.position.y, m.position.z, 0xb8232a, 5, 3); }
    } else if (!dead && P.alive && Math.hypot(m.position.x - P.pos.x, m.position.y - P.pos.y - 1, m.position.z - P.pos.z) < .8) { damage(P, p.dmg, p.owner); dead = true; }
    if (dead) { scene.remove(m); projs.splice(i, 1); }
  }
}
function damage(e, dmg, from, nonlethal) {
  if (!e.alive) return;
  if (e === P) { if (P.iframes > 0 || mode !== 'play') return; S.hp -= dmg; P.iframes = .45; sfx('hurt'); hurtFlash(); if (S.hp <= 0) die(from && from.kind === 'dino' ? 'Killed by a ' + from.def.name : 'Killed by the Ashfang'); return; }
  e.hp -= dmg; if (nonlethal && e.hp < 1) e.hp = 1; e.flash = .16; if (from === P) { lastHit = e; lastHitT = 5; for (const t of dinos) if (t.tamed && t.alive && t.state === 'follow' && !t.def.fly && t !== e) { t.state = 'chase'; t.target = e; t.t = 20; } }
  if (e.kind === 'human') { if (e.hp <= 0) killHuman(e); else { e.alert = 30; } return; }
  const def = e.def;
  if (e.hp <= 0) { killDino(e, from === P || (from && from.tamed)); return; }
  if (e.tamed || e.state === 'mounted') return;
  if (def.tame && e.hp < e.maxHp * (def.fly ? .55 : .3) && e.state !== 'stunned') { e.state = 'stunned'; e.t = 16; e.air = false; if (from === P) toast(def.name + ' is dazed — get close and feed it to tame!', 'lime'); return; }
  if (e.state === 'stunned') return;
  const attacker = from && from.alive ? from : P;
  if (def.temper === 'flee' || def.temper === 'passive') { e.state = 'flee'; e.t = 7; e.threat = attacker; }
  else { e.state = 'chase'; e.target = attacker; e.t = 22; if (e.type === 'raptor') for (const o of dinos) if (o !== e && o.alive && o.type === 'raptor' && !o.tamed && o.state === 'wander' && dist2(o.pos.x, o.pos.z, e.pos.x, e.pos.z) < 28) { o.state = 'chase'; o.target = attacker; o.t = 20; } }
}
function killDino(d, byPlayer) {
  d.alive = false; d.deadT = 6; d.state = 'dead'; if (d.tag) { d.m.g.remove(d.tag); d.tag = null; }
  if (d === P.mount) dismount();
  if (d.tamed) { toast(d.name + ' has fallen', 'red'); return; }
  if (byPlayer) { const f = d.def; S.inv.meat += f.meat; S.inv.hide += f.hide; toast('+' + f.meat + ' Raw Meat · +' + f.hide + ' Hide'); addAmber(f.amber * (d.alpha ? 3 : 1)); S.stat.kills++; if (d.alpha) { S.crates++; toast('Alpha slain — Relic Crate earned!', 'gold'); sfx('win'); } }
  if (d.def.big) sfx('roar');
}
function tame(d) {
  const need = d.def.tame === 'meat' ? ['meat', 2] : ['berries', 6];
  if (S.inv[need[0]] < need[1]) { toast('Needs ' + need[1] + ' ' + ITEMS[need[0]] + ' to tame'); return; }
  S.inv[need[0]] -= need[1]; d.tamed = true; d.state = 'follow'; d.hp = Math.max(d.hp, d.maxHp * .65); d.name = pick(TAME_NAMES); d.target = null; d.air = !!d.def.fly;
  buildDinoModel(d); S.stat.tames++; addAmber(100); sfx('win'); toast(d.name + ' the ' + d.def.name + ' joined your tribe!', 'lime'); burst(d.pos.x, d.pos.y + d.def.s * 1.5, d.pos.z, 0xc8ff2e, 18, 4);
}

/* ---------- dinosaurs ---------- */
function landPoint(cx, cz, rmin, rmax, minH = 1.6, maxH = 30) {
  for (let i = 0; i < 60; i++) { const a = rand(6.28), r = rand(rmin, rmax), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, h = terrainH(x, z); if (h > minH && h < maxH && Math.abs(x) < 290 && Math.abs(z) < 290 && dist2(x, z, OUTPOST.x, OUTPOST.z) > 36) return { x, z }; }
  return { x: SPAWN.x + rand(-20, 20), z: SPAWN.z + rand(-20, -5) };
}
function buildDinoModel(d) {
  if (d.m) scene.remove(d.m.g);
  d.m = makeDino(d.type, d.pal || (d.tamed && S.equip.mount ? MOUNTSKIN[S.equip.mount] : null)); d.m.g.rotation.order = 'YXZ'; d.m.g.scale.setScalar(d.def.s * (d.scale || 1)); scene.add(d.m.g);
  if (d.tamed) { d.tag = makeTag(d.name); d.tag.position.y = (d.def.fly ? 1.2 : d.def.biped ? 2.9 : 2.9) + .3; d.tag.scale.multiplyScalar(1 / d.def.s); d.m.g.add(d.tag); }
}
function spawnDino(type, x, z, o = {}) {
  const def = DINOS[type];
  const d = Object.assign({ kind: 'dino', type, def, hp: def.hp, maxHp: def.hp, pos: new T.Vector3(x, terrainH(x, z), z), home: { x, z }, yaw: rand(6.28), state: 'wander', t: 0, cool: 0, phase: rand(6), alive: true, r: def.r, tamed: false, flash: 0, lunge: 0, ang: rand(6.28), alt: rand(11, 17), rad: rand(18, 30), air: !!def.fly, moving: false }, o);
  if (def.fly && d.air) d.pos.y += d.alt; buildDinoModel(d); dinos.push(d); return d;
}
function populate() {
  const sp = (t, n, cx, cz, a, b, mh) => { for (let i = 0; i < n; i++) { const p = landPoint(cx, cz, a, b, 1.6, mh); spawnDino(t, p.x, p.z); } };
  sp('dryo', 13, SPAWN.x, SPAWN.z, 28, 150); sp('raptor', 9, SPAWN.x, SPAWN.z, 105, 270); sp('trike', 5, 0, 0, 60, 250); sp('stego', 4, 0, 0, 70, 250);
  sp('bronto', 3, LAKE.x, LAKE.z, 66, 105); sp('ptero', 6, 0, 0, 30, 220); sp('rex', 1, VOLC.x, VOLC.z, 105, 150, 34);
  for (const t of S.tamed) { const p = landPoint(P.pos.x, P.pos.z, 4, 9, .5); spawnDino(t.type, p.x, p.z, { tamed: true, name: t.name, state: 'follow', hp: DINOS[t.type].hp * .9 }); }
}
function dinoUpdate(d, dt) {
  const def = d.def, g = d.m.g;
  if (!d.alive) { d.deadT -= dt; g.rotation.z = Math.min(1.45, g.rotation.z + dt * 3.5); if (def.fly) g.position.y = Math.max(groundH(d.pos.x, d.pos.z) + .3, g.position.y - dt * 14); if (d.deadT < 1.2) g.position.y -= dt * def.s * 1.2; if (d.deadT <= 0) { scene.remove(g); d.gone = true; if (!d.tamed && !d.alpha) respawns.push({ type: d.type, t: 55 }); } return; }
  d.cool -= dt; d.t -= dt; if (d.flash > 0) d.flash -= dt; if (d.lunge > 0) d.lunge -= dt;
  const dp = dist2(d.pos.x, d.pos.z, P.pos.x, P.pos.z);
  if (dp < 34 && !S.codex[d.type]) { S.codex[d.type] = 1; toast('Codex updated: ' + def.name); }
  let speed = 0, tx = 0, tz = 0, away = false; if (d.tag) d.tag.visible = dp < 60 && d !== P.mount;
  if (d.state === 'mounted') { /* driven by player */ }
  else if (def.fly) flyUpdate(d, dt, dp);
  else {
    switch (d.state) {
      case 'stunned': if (d.t <= 0) { d.hp = Math.max(d.hp, d.maxHp * .5); if (def.temper === 'hostile') { d.state = 'chase'; d.target = P; d.t = 15; } else { d.state = 'flee'; d.threat = P; d.t = 8; } } break;
      case 'wander':
        if (d.t <= 0 || !d.wp) { d.wp = { x: d.home.x + rand(-28, 28), z: d.home.z + rand(-28, 28) }; d.t = rand(4, 10); d.idle = Math.random() < .35; }
        if (!d.idle) { tx = d.wp.x; tz = d.wp.z; speed = def.walk; if (dist2(d.pos.x, d.pos.z, tx, tz) < 2) d.idle = true; }
        if (P.alive && mode === 'play' && !d.tamed) {
          if (def.temper === 'hostile' && dp < (nightF > .5 ? 36 : 25) + (def.big ? 16 : 0)) { d.state = 'chase'; d.target = P; d.t = 18; if (def.big) sfx('roar'); }
          else if (def.temper === 'flee' && dp < 11) { d.state = 'flee'; d.threat = P; d.t = 5; }
        } break;
      case 'flee': { const th = d.threat || P; tx = th.pos.x; tz = th.pos.z; away = true; speed = def.spd * (def.temper === 'passive' ? 1.5 : 1); if (d.t <= 0) d.state = 'wander'; break; }
      case 'chase': {
        const tg = d.target, dd = tg ? dist2(d.pos.x, d.pos.z, tg.pos.x, tg.pos.z) : 0;
        if (!tg || !tg.alive || dd > 70 || d.t <= 0 || (tg === P && mode !== 'play')) { d.state = d.tamed ? 'follow' : 'wander'; d.target = null; d.home = { x: d.pos.x, z: d.pos.z }; break; }
        if (dd < 30) d.t = Math.max(d.t, 8);
        tx = tg.pos.x; tz = tg.pos.z; const reach = def.r + (tg.r || .5) + .7;
        if (dd < reach && Math.abs(tg.pos.y - d.pos.y) < def.s * 2.4 + 1) { d.yaw = lerpAngle(d.yaw, Math.atan2(tx - d.pos.x, tz - d.pos.z), 8 * dt); if (d.cool <= 0) { d.cool = 1.35; d.lunge = .3; damage(tg, def.dmg || def.bite || 8, d); } } else speed = def.spd; break;
      }
      case 'follow': if (dp > 5 + def.r) { tx = P.pos.x; tz = P.pos.z; speed = dp > 13 ? def.spd * 1.15 : def.walk * 1.7; } if (dp > 95 && !P.mount) { const p = landPoint(P.pos.x, P.pos.z, 6, 12, .3); d.pos.x = p.x; d.pos.z = p.z; } break;
    }
    if (speed > 0) {
      let a = Math.atan2(tx - d.pos.x, tz - d.pos.z); if (away) a += Math.PI; d.yaw = lerpAngle(d.yaw, a, 5 * dt);
      const nx = d.pos.x + Math.sin(d.yaw) * speed * dt, nz = d.pos.z + Math.cos(d.yaw) * speed * dt;
      if (terrainH(nx, nz) > -def.s * .55 && Math.abs(nx) < HALF - 20 && Math.abs(nz) < HALF - 20) { d.pos.x = nx; d.pos.z = nz; d.phase += dt * speed * (1.4 / Math.sqrt(def.s)); } else { d.wp = null; d.t = Math.min(d.t, .5); if (d.state === 'flee') d.yaw += 1.5; }
      collideSegs(d.pos, def.r * .5);
    }
    d.moving = speed > 0; d.pos.y = Math.max(groundH(d.pos.x, d.pos.z), -def.s * .6);
  }
  // pose
  g.position.copy(d.pos); g.rotation.y = d.yaw; g.rotation.x = d.lunge > 0 ? Math.sin(d.lunge / .3 * Math.PI) * .28 : 0;
  g.rotation.z = d.state === 'stunned' ? Math.sin(performance.now() / 70) * .07 : 0;
  g.scale.setScalar(def.s * (d.scale || 1) * (d.flash > 0 ? 1.06 : 1));
  if (d.m.u) { d.m.u.uPh.value = d.phase; const tg = def.fly ? (d.air ? 1 : 0) : (d.moving ? d.m.amp : 0); d.m.u.uAmp.value += (tg - d.m.u.uAmp.value) * Math.min(1, dt * 8); }
  else if (def.fly) { const a = d.air ? Math.sin(d.phase) * .6 : -.45; d.m.wings[0].rotation.z = a; d.m.wings[1].rotation.z = -a; }
  else { const a = d.moving ? Math.sin(d.phase) * .62 : 0; d.m.legs.forEach((l, i) => l.rotation.x = (i === 0 || i === 3) ? a : -a); if (d.moving) g.position.y += Math.abs(Math.sin(d.phase)) * .06 * def.s; }
}
function flyUpdate(d, dt, dp) {
  const def = d.def, gh = Math.max(groundH(d.pos.x, d.pos.z), 0) + .5 * def.s;
  if (d.state === 'stunned') { d.air = false; d.pos.y = Math.max(gh, d.pos.y - 16 * dt); if (d.t <= 0) { d.state = 'wander'; d.hp = Math.max(d.hp, d.maxHp * .7); } return; }
  if (d.state === 'follow') {
    const tx = P.pos.x + Math.cos(d.ang) * 4, tz = P.pos.z + Math.sin(d.ang) * 4, ty = P.pos.y + 4.5; d.ang += dt * .5;
    const dx = tx - d.pos.x, dy = ty - d.pos.y, dz = tz - d.pos.z, dd = Math.hypot(dx, dy, dz), sp = Math.min(dd * 1.6, 17);
    if (dd > .4) { d.pos.x += dx / dd * sp * dt; d.pos.y += dy / dd * sp * dt; d.pos.z += dz / dd * sp * dt; d.yaw = lerpAngle(d.yaw, Math.atan2(dx, dz), 3 * dt); }
    d.pos.y = Math.max(d.pos.y, gh); d.air = true; d.phase += dt * 7; return;
  }
  if (d.state !== 'wander') d.state = 'wander';
  d.air = true; d.ang += dt * def.spd * .55 / d.rad; d.phase += dt * 6;
  const tx = d.home.x + Math.cos(d.ang) * d.rad, tz = d.home.z + Math.sin(d.ang) * d.rad;
  d.yaw = Math.atan2(tx - d.pos.x, tz - d.pos.z); d.pos.x = lerp(d.pos.x, tx, Math.min(1, dt * 2)); d.pos.z = lerp(d.pos.z, tz, Math.min(1, dt * 2));
  d.pos.y = lerp(d.pos.y, Math.max(terrainH(tx, tz), 0) + d.alt, Math.min(1, dt * .8));
}
function respawnUpdate(dt) {
  for (let i = dinos.length - 1; i >= 0; i--) if (dinos[i].gone) dinos.splice(i, 1);
  for (let i = humans.length - 1; i >= 0; i--) if (humans[i].gone) humans.splice(i, 1);
  for (let i = respawns.length - 1; i >= 0; i--) { const r = respawns[i]; if ((r.t -= dt) <= 0) { const c = r.type === 'rex' ? landPoint(VOLC.x, VOLC.z, 105, 150, 1.6, 34) : landPoint(P.pos.x, P.pos.z, 95, 210); spawnDino(r.type, c.x, c.z); respawns.splice(i, 1); } }
}

/* ---------- humans (rival tribe, raiders, tribemates) ---------- */
function spawnHuman(o) {
  const look = { build: pick(['a', 'b']), body: o.chief ? 'strong' : pick(['lean', 'athletic', 'broad', 'compact']), skin: Math.floor(rand(6)), face: Math.floor(rand(4)), hair: pick(HAIRS), hairCol: Math.floor(rand(5)), beard: Math.random() < .4 ? 1 : 0, outfit: o.team === 'ash' ? (o.chief ? 'chief' : 'ashfang') : pick(['hide', 'honey', 'frost']) };
  const e = Object.assign({ kind: 'human', pos: new T.Vector3(o.x, groundH(o.x, o.z), o.z), hp: o.chief ? 240 : 70, alive: true, r: .5, yaw: rand(6.28), walkT: 0, cool: rand(1, 3), t: 0, home: { x: o.x, z: o.z }, alert: 0, emote: null, et: 0, swing: 0 }, o);
  e.maxHp = e.hp; e.h = makeHuman(look); if (o.chief) e.h.g.scale.setScalar(1.25); e.h.hand.add(makeWeapon(o.team === 'ash' ? 'spear' : 'axe')); scene.add(e.h.g);
  if (o.name) { e.tag = makeTag(o.name, o.team === 'ash' ? '#ff5a4a' : '#ffffff'); e.tag.position.y = 2.2; e.h.g.add(e.tag); }
  humans.push(e); return e;
}
function killHuman(e) {
  e.alive = false; e.deadT = 5; sfx('hit'); addAmber(e.chief ? 300 : 60); S.stat.kills++;
  if (e.out) checkOutpost();
}
function humanUpdate(e, dt) {
  const g = e.h.g;
  if (!e.alive) { e.deadT -= dt; g.rotation.x = Math.max(-1.5, g.rotation.x - dt * 4); if (e.deadT < 1) g.position.y -= dt; if (e.deadT <= 0) { scene.remove(g); e.gone = true; } return; }
  e.cool -= dt; e.t -= dt; if (e.swing > 0) e.swing -= dt; if (e.alert > 0) e.alert -= dt;
  const dp = dist2(e.pos.x, e.pos.z, P.pos.x, P.pos.z); let speed = 0, tx = 0, tz = 0; if (e.tag) e.tag.visible = dp < 32;
  if (e.team === 'ally') {
    if (e.emote) { e.et += dt; if (e.et > 2.6) e.emote = null; }
    else if (P.emote && dp < 14) { e.emote = P.emote === 'sit' ? 'wave' : P.emote; e.et = 0; e.yaw = Math.atan2(P.pos.x - e.pos.x, P.pos.z - e.pos.z); }
    else { if (e.t <= 0) { e.wp = { x: e.home.x + rand(-7, 7), z: e.home.z + rand(-7, 7) }; e.t = rand(4, 9); e.idle = Math.random() < .5; } if (!e.idle && e.wp && dist2(e.pos.x, e.pos.z, e.wp.x, e.wp.z) > 1) { tx = e.wp.x; tz = e.wp.z; speed = 1.8; } }
  } else {
    const active = P.alive && mode === 'play' && (e.raider ? dp < 120 : (dp < 36 || e.alert > 0) && dp < 80);
    if (active) {
      e.yaw = lerpAngle(e.yaw, Math.atan2(P.pos.x - e.pos.x, P.pos.z - e.pos.z), 8 * dt);
      const free = e.raider || !gate.alive || dist2(P.pos.x, P.pos.z, OUTPOST.x, OUTPOST.z) < OUTPOST.r - 1;
      if (free && dp > 1.9) { tx = P.pos.x; tz = P.pos.z; speed = e.chief ? 4.6 : 5.3; }
      if (dp < 2.2 && Math.abs(P.pos.y - e.pos.y) < 2.5) { if (e.cool <= 0) { e.cool = 1.25; e.swing = .3; damage(P, e.chief ? 16 : 9, e); } }
      else if (dp > 7 && dp < 40 && e.cool <= 0) {
        e.cool = rand(2.6, 4.2); e.swing = .3; const st = new T.Vector3(e.pos.x, e.pos.y + 1.7, e.pos.z), v = 26, tt = dp / v;
        const aim = new T.Vector3(P.pos.x, P.pos.y + 1 + .5 * 11 * tt * tt, P.pos.z).sub(st).normalize(); shoot(e, st, aim, v, e.chief ? 12 : 7, 'spear');
      }
    } else if (!e.raider) { if (e.t <= 0) { e.wp = { x: e.home.x + rand(-5, 5), z: e.home.z + rand(-5, 5) }; e.t = rand(3, 8); } if (e.wp && dist2(e.pos.x, e.pos.z, e.wp.x, e.wp.z) > 1) { tx = e.wp.x; tz = e.wp.z; speed = 1.6; } }
  }
  if (speed > 0) {
    if (e.team === 'ally' || !(P.alive && dp < 40)) e.yaw = lerpAngle(e.yaw, Math.atan2(tx - e.pos.x, tz - e.pos.z), 6 * dt);
    const a = Math.atan2(tx - e.pos.x, tz - e.pos.z); e.pos.x += Math.sin(a) * speed * dt; e.pos.z += Math.cos(a) * speed * dt; e.walkT += dt * speed * 1.6; collideSegs(e.pos, .45);
  }
  e.pos.y = groundH(e.pos.x, e.pos.z); g.position.copy(e.pos); g.rotation.y = e.yaw;
  animHuman(e.h, e.walkT, speed > 0, { swing: e.swing, emote: e.emote, et: e.et });
}
