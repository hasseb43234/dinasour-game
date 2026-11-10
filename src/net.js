'use strict';
/* ================= online multiplayer (Higgsfield realtime rooms over WebSocket) ================= */
const NET = { ws: null, id: null, on: false, tries: 0, players: new Map(), room: 'main', acc: 0, baseSig: '', started: false };
function netId() { let id = null; try { id = sessionStorage.getItem('af-pid'); if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('af-pid', id); } } catch (e) { } return id || Math.random().toString(36).slice(2, 10); }
function netSend(m) { if (NET.ws && NET.ws.readyState === 1) try { NET.ws.send(JSON.stringify(m)); } catch (e) { } }
function netStart() {
  if (NET.started || !/^https?:$/.test(location.protocol)) return; NET.started = true;
  NET.room = (new URLSearchParams(location.search).get('room') || 'main').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'main'; NET.id = netId(); netConnect();
  setInterval(() => { if (NET.ws && NET.ws.readyState === 1) NET.ws.send('__ping'); }, 30000);
}
function netJoin() { netSend({ type: 'join', playerId: NET.id, name: S.name || 'Survivor', look: S.look }); NET.baseSig = ''; }
function netConnect() {
  let ws; try { ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws/' + NET.room); } catch (e) { return; }
  NET.ws = ws;
  ws.onopen = () => { NET.on = true; NET.tries = 0; netJoin(); toast('Online — room "' + NET.room + '"', 'lime'); };
  ws.onmessage = ev => { if (typeof ev.data !== 'string' || ev.data === '__pong') return; let m; try { m = JSON.parse(ev.data); } catch (e) { return; } netMsg(m); };
  ws.onclose = ev => { const was = NET.on; NET.on = false; NET.ws = null; for (const id of [...NET.players.keys()]) netRemove(id); if (ev.code === 4000 || (!was && ++NET.tries > 3)) return; setTimeout(netConnect, 1500 * Math.min(NET.tries + 1, 5)); };
  ws.onerror = () => { };
}
function netLook(l) {
  const o = { ...DEF_LOOK }; if (!l || typeof l !== 'object') return o;
  if (l.build === 'a' || l.build === 'b') o.build = l.build; if (BODIES[l.body]) o.body = l.body; if (OUTFITS[l.outfit]) o.outfit = l.outfit;
  if ([...HAIRS, 'sunflare', 'jay'].includes(l.hair)) o.hair = l.hair; for (const k of ['skin', 'face', 'hairCol', 'beard']) if (Number.isInteger(l[k]) && l[k] >= 0 && l[k] < 6) o[k] = l[k]; return o;
}
function netAdd(p) {
  if (!p || p.id === NET.id) return; if (NET.players.has(p.id)) netRemove(p.id);
  const h = makeHuman(netLook(p.look)), name = String(p.name || 'Survivor').slice(0, 16), tag = makeTag(name, '#8fd0ff'); tag.position.y = 2.25; h.g.add(tag); scene.add(h.g);
  const r = { id: p.id, name, h, tag, pos: new T.Vector3(SPAWN.x, terrainH(SPAWN.x, SPAWN.z), SPAWN.z), tgt: new T.Vector3(SPAWN.x, terrainH(SPAWN.x, SPAWN.z), SPAWN.z), yaw: 0, tyaw: 0, s: {}, walkT: 0, et: 0, mt: '', mount: null, w: '', seen: false, base: new T.Group() };
  scene.add(r.base); NET.players.set(p.id, r); if (p.s) netState(r, p.s);
}
function netRemove(id) { const r = NET.players.get(id); if (!r) return; scene.remove(r.h.g); scene.remove(r.base); if (r.mount) scene.remove(r.mount.g); NET.players.delete(id); }
function netState(r, s) {
  if (!s || !Array.isArray(s.p)) return; r.tgt.set(+s.p[0] || 0, +s.p[1] || 0, +s.p[2] || 0); r.tyaw = +s.p[3] || 0; if (!r.seen) { r.pos.copy(r.tgt); r.yaw = r.tyaw; r.seen = true; }
  if (s.e !== r.s.e) r.et = 0; r.s = s;
  const w = WNAME[s.w] ? s.w : 'hand'; if (w !== r.w) { r.w = w; r.h.hand.clear(); r.h.hand.add(makeWeapon(w)); }
  const mt = DINOS[s.mt] && DINOS[s.mt].mount ? s.mt : ''; if (mt !== r.mt) { if (r.mount) scene.remove(r.mount.g); r.mount = null; r.mt = mt; if (mt) { r.mount = makeDino(mt); r.mount.g.scale.setScalar(DINOS[mt].s); r.mount.g.rotation.order = 'YXZ'; r.mount.ph = 0; scene.add(r.mount.g); } }
}
function netBase(r, pieces) {
  r.base.clear(); if (!Array.isArray(pieces)) return;
  for (const p of pieces.slice(0, 80)) { if (!p || !PIECES.some(q => q.id === p.id)) continue; const parts = pieceParts(p.id, p.tier ? 1 : 0), g = mesh(parts); g.position.set(p.cx * 4, +p.y || 0, p.cz * 4); g.rotation.y = -(p.rot | 0) * Math.PI / 2; g.receiveShadow = true; r.base.add(g); }
}
function netMsg(m) {
  if (m.type === 'welcome') { for (const p of m.players || []) netAdd(p); if ((m.players || []).length) toast((m.players.length) + ' other survivor' + (m.players.length > 1 ? 's' : '') + ' in this room', 'lime'); }
  else if (m.type === 'joined') { const known = NET.players.has(m.id); netAdd(m); if (!known) toast((m.name || 'Survivor') + ' joined the island', 'lime'); NET.baseSig = ''; }
  else if (m.type === 'left') { const r = NET.players.get(m.id); if (r) toast(r.name + ' left'); netRemove(m.id); }
  else if (m.type === 's') { const r = NET.players.get(m.id); if (r) netState(r, m.s); }
  else if (m.type === 'b') { const r = NET.players.get(m.id); if (r) netBase(r, m.pieces); }
  else if (m.type === 'full') toast('This room is full — add ?room=yourname to the address for a private room', 'red');
}
function netUpdate(dt) {
  for (const r of NET.players.values()) {
    r.pos.lerp(r.tgt, Math.min(1, dt * 10)); r.yaw = lerpAngle(r.yaw, r.tyaw, 10 * dt); const s = r.s, mv = !!s.m, g = r.h.g; g.position.copy(r.pos); g.rotation.y = r.yaw; r.et += dt;
    r.tag.visible = dist2(r.pos.x, r.pos.z, P.pos.x, P.pos.z) < 80;
    if (r.mount) {
      const def = DINOS[r.mt], sh = seatH({ type: r.mt, def }), mg = r.mount.g; mg.position.set(r.pos.x, r.pos.y - sh, r.pos.z); mg.rotation.y = r.yaw; if (mv || def.fly) r.mount.ph += dt * (def.fly ? 7 : 10);
      if (r.mount.u) { r.mount.u.uPh.value = r.mount.ph; r.mount.u.uAmp.value = def.fly ? 1 : mv ? r.mount.amp : 0; } else if (!def.fly) { const a = mv ? Math.sin(r.mount.ph) * .6 : 0; r.mount.legs.forEach((l, i) => l.rotation.x = (i === 0 || i === 3) ? a : -a); }
      g.position.y -= .78; animHuman(r.h, 0, false, { sit: true, aim: !!s.c });
    } else { if (mv) r.walkT += dt * 8.6; const ranged = r.w === 'bow' || r.w === 'sling'; animHuman(r.h, r.walkT, mv, { aim: ranged && !!s.c, raise: !ranged && s.c ? .8 : 0, emote: s.e || null, et: r.et }); }
  }
  if (!NET.on || mode !== 'play') return;
  if ((NET.acc += dt) > .1) {
    NET.acc = 0; const r2 = v => Math.round(v * 100) / 100;
    netSend({ type: 's', s: { p: [r2(P.pos.x), r2(P.pos.y), r2(P.pos.z), r2(P.yaw)], m: (P.moving || (P.mount && P.mount.moving)) ? 1 : 0, e: P.emote || '', w: S.weapon, mt: P.mount ? P.mount.type : '', c: P.charge >= 0 ? 1 : 0 } });
    const sig = JSON.stringify(S.pieces); if (sig !== NET.baseSig) { NET.baseSig = sig; netSend({ type: 'b', pieces: S.pieces.slice(0, 80) }); }
  }
}
