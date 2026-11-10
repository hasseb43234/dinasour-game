'use strict';
/* ================= UI: HUD, wheels, creator, crafting, shop, crates ================= */
const ICON = { bow: '<path d="M7 3c9 3 9 15 0 18M7 3v18M3 12h15m-4-3 4 3-4 3"/>', axe: '<path d="M5 21 16 7M12 4l7 6-4 3-5-5z"/>', spear: '<path d="M4 20 16 8M14 4h6v6z"/>', torch: '<path d="M10 21l1-9h2l1 9zM12 2c3 3 3 6 0 9-3-3-3-6 0-9z"/>', sling: '<path d="M12 21v-8M12 13 6 4M12 13l6-9M6 4c4 2 8 2 12 0"/>', hammer: '<path d="M6 21 14 10M8 4h11v6H8z"/>', hand: '<path d="M7 12V6m3 6V4m3 8V5m3 7V8M7 12c-2 5 1 9 5 9s6-3 4-9"/>' };
const svg = (k, s = 26) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k] || ''}</svg>`;
const hex = n => '#' + n.toString(16).padStart(6, '0');
const fmt = n => Math.floor(n).toLocaleString('en-US');
const show = (id, on) => $(id).classList.toggle('hide', !on);
const SHOP = [
  { id: 'ash', type: 'outfit', name: 'Ash Stalker', price: 1500, rar: 'epic', sw: ['#1d1f24', '#3a3d45'] },
  { id: 'riot', type: 'outfit', name: 'Riot Fern', price: 1500, rar: 'epic', sw: ['#d61f7a', '#16161a'] },
  { id: 'honey', type: 'outfit', name: 'Honeyhide', price: 1000, rar: 'rare', sw: ['#d9a520', '#8a5a12'] },
  { id: 'frost', type: 'outfit', name: 'Frost Runner', price: 1000, rar: 'rare', sw: ['#e8eef2', '#9fb6c4'] },
  { id: 'sunflare', type: 'hair', name: 'Sunflare Crest', price: 800, rar: 'rare', sw: ['#e2341d', '#ffd23a'] },
  { id: 'jay', type: 'hair', name: 'Jay Crown', price: 800, rar: 'rare', sw: ['#2f7de0', '#9ad1ff'] },
  { id: 'glacier', type: 'bow', name: 'Glacier Plume', price: 1200, rar: 'epic', sw: ['#9ad1ff', '#2f7de0'] },
  { id: 'toxin', type: 'bow', name: 'Toxin Thread', price: 1500, rar: 'epic', sw: ['#54e36a', '#12602a'] },
  { id: 'midnight', type: 'mount', name: 'Midnight Stripe', price: 2400, rar: 'legend', sw: ['#15151c', '#ff3fa4'] },
  { id: 'gilded', type: 'mount', name: 'Gilded Scale', price: 1200, rar: 'epic', sw: ['#d9a520', '#f3dc8a'] },
  { id: 'stomp', type: 'emote', name: 'Victory Stomp', price: 600, rar: 'rare', sw: ['#c8ff2e', '#5d7a10'] },
  { id: 'candy', type: 'mount', name: 'Candy Tyrant', price: 0, rar: 'ultra', crateOnly: true, sw: ['#ff5fa8', '#c8ff2e'] }
];
const TYPEL = { outfit: 'Outfit', hair: 'Headwear', bow: 'Bow skin', mount: 'Mount skin', emote: 'Emote' };

/* ---------- toasts / banners ---------- */
function toast(msg, cls) { const t = $('#toasts'), d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.textContent = msg; t.appendChild(d); while (t.children.length > 5) t.firstChild.remove(); setTimeout(() => d.classList.add('out'), 2800); setTimeout(() => d.remove(), 3300); }
function floatText(t) { const f = $('#float'); f.textContent = t; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
function hurtFlash() { const h = $('#hurt'); h.classList.remove('go'); void h.offsetWidth; h.classList.add('go'); }
let bannerT = 0;
function bigBanner(title, sub) { $('#banner').innerHTML = `<b>${title}</b><span>${sub || ''}</span>`; show('#banner', true); clearTimeout(bannerT); bannerT = setTimeout(() => show('#banner', false), 5200); }
function showHud(on) { show('#hud', on); }
function showDead(why, lost) { $('#dead').innerHTML = `<h2>YOU DIED</h2><p>${why}${lost ? ' · lost ' + fmt(lost) + ' amber' : ''}</p><button class="btn" id="respawnBtn">RESPAWN</button>`; show('#dead', true); show('#prompt', false); show('#power', false); if (document.exitPointerLock) document.exitPointerLock(); $('#respawnBtn').onclick = () => { show('#dead', false); respawn(); requestLock(); }; }

/* ---------- HUD ---------- */
function uiInit() {
  $('#bars').innerHTML = [['hp', '♥'], ['water', '💧'], ['food', '◆']].map(([k, i]) => `<div class="bar ${k}"><i></i><div><b id="b_${k}"></b></div><span id="n_${k}"></span></div>`).join('');
  $('#btnNew').onclick = () => { initAudio(); if (S.created) { try { localStorage.removeItem(SAVE_KEY); sessionStorage.setItem('af-new', '1'); } catch (e) { } S.created = false; location.reload(); } else { show('#title', false); enterCreator(); } };
  $('#btnCont').onclick = () => { initAudio(); show('#title', false); startPlay(); };
  $('#crDone').onclick = () => { initAudio(); S.name = ($('#crName').value || '').replace(/[^\w \-]/g, '').trim().slice(0, 16) || 'Survivor'; show('#creator', false); startPlay(); };
  $('#crName').addEventListener('keydown', e => e.stopPropagation());
  uiBuildBar();
}
function showTitle() { mode = 'title'; show('#title', true); show('#btnCont', !!S.created); $('#btnNew').textContent = S.created ? 'NEW GAME (ERASES SAVE)' : 'NEW GAME'; }
function uiTick() {
  for (const k of ['hp', 'water', 'food']) { const v = clamp(S[k], 0, 100); $('#b_' + k).style.width = v + '%'; $('#n_' + k).textContent = Math.round(v); }
  $('#amberN').textContent = fmt(S.amber); const hr = (S.dayT * 24 + 6) % 24; $('#clock').textContent = (nightF > .5 ? 'NIGHT ' : 'DAY ') + String(Math.floor(hr)).padStart(2, '0') + ':' + String(Math.floor(hr % 1 * 60)).padStart(2, '0');
  $('#questT').textContent = S.quest < QUESTS.length ? QUESTS[S.quest][0] : 'All objectives complete — the valley is yours.'; $('#questN').textContent = Math.min(S.quest + 1, QUESTS.length) + '/' + QUESTS.length;
  const w = S.weapon, ammo = w === 'bow' ? S.inv.arrows + ' arrows' : w === 'sling' ? S.inv.stone + ' stones' : '';
  $('#hotbar').innerHTML = `<span class="wic">${svg(w)}</span><div><b>${WNAME[w]}</b><small>${ammo || (P.mount ? 'LMB mount attack' : 'Hold LMB to charge')}</small></div>`;
  const p = curPromptRef(); show('#prompt', !!p); if (p) $('#prompt').innerHTML = `PRESS <kbd>${p.key}</kbd> ${p.key === 'E' ? 'TO ' : 'TO '}${p.text}`;
  const lh = lastHit && lastHit.alive && lastHitT > 0 ? lastHit : null; show('#target', !!lh);
  if (lh) { $('#targetN').textContent = (lh.kind === 'dino' ? (lh.alpha ? 'ALPHA ' : '') + lh.def.name : lh.name || 'Ashfang').toUpperCase() + (lh.state === 'stunned' ? ' · DAZED' : ''); $('#targetB').style.width = clamp(lh.hp / lh.maxHp * 100, 0, 100) + '%'; }
  const dO = dist2(P.pos.x, P.pos.z, OUTPOST.x, OUTPOST.z), so = !S.won && dO < 80; show('#outbar', so);
  if (so) { const left = humans.filter(e => e.out && e.alive).length; $('#outbar').innerHTML = gate.alive ? `<i>◆</i><div><b>RIVAL OUTPOST</b><small>BREACH THE GATE</small></div><em>${Math.round((1 - Math.max(0, S.gate) / gate.max) * 100)}%</em>` : `<i>◆</i><div><b>RIVAL OUTPOST</b><small>DEFEAT THE ASHFANG</small></div><em>${left} LEFT</em>`; }
  const m = P.mount; show('#mountp', !!m); if (m) $('#mountp').innerHTML = `<b>MOUNTED</b><small>${m.def.name.toUpperCase()} · ${m.name}</small><em>${Math.round(m.hp / m.maxHp * 100)}%</em>`;
  show('#netbar', NET.on); if (NET.on) $('#netbar').textContent = 'ONLINE · ' + (NET.players.size + 1) + ' SURVIVOR' + (NET.players.size ? 'S' : '') + ' · ROOM ' + NET.room.toUpperCase();
  show('#evbar', !!EV.active); if (EV.active) { const r = Math.max(0, EV.dur - EV.t); $('#evbar').innerHTML = `<b>LIVE EVENT</b> ${EV.title} <em>${Math.floor(r / 60)}:${String(Math.floor(r % 60)).padStart(2, '0')}</em>`; }
  show('#resume', !locked);
  if (buildMode) uiBuildBar();
}
const curPromptRef = () => prompt;
function uiFrame() {
  const c = P.charge, on = c >= .12; $('#power').classList.toggle('hide', !on);
  if (on) { const p = clamp(c / 1.1, 0, 1), perf = p > .72 && p < .88; $('#parc').setAttribute('stroke-dasharray', (p * 100).toFixed(1) + ' 100'); $('#parc').setAttribute('stroke', perf ? '#c8ff2e' : '#ffffff'); $('#ppct').textContent = Math.round(p * 100) + '%'; $('#ppct').style.color = perf ? '#c8ff2e' : '#fff'; }
  drawCompass();
}
function drawCompass() {
  const cv = $('#compass'), c = cv.getContext('2d'), yaw = P.camYaw; c.clearRect(0, 0, 140, 140); c.save(); c.translate(70, 70);
  c.fillStyle = 'rgba(10,16,12,.72)'; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.fill(); c.strokeStyle = '#c8ff2e'; c.lineWidth = 2.5; c.stroke();
  c.strokeStyle = 'rgba(200,255,46,.22)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 20, 0, 7); c.stroke();
  const plot = (x, z, lim) => { const dx = x - P.pos.x, dz = z - P.pos.z; let rt = (dx * Math.cos(yaw) - dz * Math.sin(yaw)) * .62, up = (dx * Math.sin(yaw) + dz * Math.cos(yaw)) * .62; const d = Math.hypot(rt, up); if (d > 55) { if (!lim) return null; rt = rt / d * 55; up = up / d * 55; } return [rt, up]; };
  const dot = (p, col, r) => { if (!p) return; c.fillStyle = col; c.beginPath(); c.arc(p[0], p[1], r, 0, 7); c.fill(); };
  for (const d of dinos) if (d.alive) dot(plot(d.pos.x, d.pos.z), d.tamed ? '#c8ff2e' : (d.def.temper === 'hostile' || d.rider) ? '#ff4a3a' : 'rgba(255,255,255,.75)', d.def.big ? 4 : 2.6);
  for (const e of humans) if (e.alive) dot(plot(e.pos.x, e.pos.z), e.team === 'ash' ? '#ff4a3a' : '#8fd0ff', 2.6);
  for (const n of nodes) dot(plot(n.x, n.z, true), '#ffa51f', 3.5);
  for (const r of NET.players.values()) dot(plot(r.pos.x, r.pos.z, true), '#8fd0ff', 3.4);
  for (const f of fires) dot(plot(f.x, f.z), '#ff8a3a', 2);
  if (EV.active === 'gather' && EV.mark) dot(plot(EV.mark.x, EV.mark.z, true), '#ff5fa8', 5);
  if (!S.won) { const p = plot(OUTPOST.x, OUTPOST.z, true); c.fillStyle = '#ff4a3a'; c.save(); c.translate(p[0], p[1]); c.rotate(Math.PI / 4); c.fillRect(-4, -4, 8, 8); c.restore(); }
  const n = plot(P.pos.x, P.pos.z - 4000, true); c.fillStyle = '#fff'; c.font = '700 12px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', n[0] * 1.0, n[1] * 1.0);
  c.fillStyle = '#c8ff2e'; c.beginPath(); c.moveTo(0, -8); c.lineTo(6, 7); c.lineTo(0, 3.5); c.lineTo(-6, 7); c.closePath(); c.fill(); c.restore();
}
function uiBuildBar() {
  show('#buildbar', buildMode); if (!buildMode) return;
  $('#buildbar').innerHTML = '<div class="bb-items">' + PIECES.map((p, i) => `<div class="bb ${i === buildSel ? 'on' : ''} ${canAfford(p.cost) ? '' : 'no'}"><kbd>${i + 1}</kbd><b>${p.name}</b><small>${Object.keys(p.cost).map(k => p.cost[k] + ' ' + ITEMS[k]).join(' · ')}</small></div>`).join('') + '</div><div class="bb-keys"><kbd>LMB</kbd> BUILD <kbd>R</kbd> ROTATE <kbd>U</kbd> UPGRADE TO STONE <kbd>X</kbd> REMOVE <kbd>B</kbd> BACK</div>';
}

/* ---------- radial wheels ---------- */
const wheel = { open: null, vx: 0, vy: 0, sel: -1, items: [] };
function wheelOpen(kind) {
  if (wheel.open || mode !== 'play') return; wheel.open = kind; wheel.vx = wheel.vy = 0; wheel.sel = -1; P.charge = -1;
  wheel.items = kind === 'weapon' ? SLOTS.map(w => ({ id: w, label: WNAME[w], icon: svg(w, 30), off: !S.tools[w] })) : ['wave', 'cheer', 'dance', 'point', 'sit', S.owned.stomp ? 'stomp' : 'flex'].map(e => ({ id: e, label: e.toUpperCase(), icon: `<span class="em">${e.toUpperCase()}</span>` }));
  $('#wheel').innerHTML = wheel.items.map((it, i) => { const a = i * Math.PI / 3; return `<div class="ws ${it.off ? 'off' : ''}" data-i="${i}" style="left:${150 + Math.sin(a) * 104}px;top:${150 - Math.cos(a) * 104}px"><small>${i + 1}</small>${it.icon}</div>`; }).join('') + `<div class="wc" id="wheelC">${kind === 'weapon' ? 'WEAPONS' : 'EMOTES'}</div>`;
  show('#wheel', true);
}
function wheelMove(x, y, abs) {
  if (abs) { wheel.vx = x; wheel.vy = y; } else { wheel.vx = clamp(wheel.vx + x, -110, 110); wheel.vy = clamp(wheel.vy + y, -110, 110); }
  const mag = Math.hypot(wheel.vx, wheel.vy); let sel = -1; if (mag > 24) { let a = Math.atan2(wheel.vx, -wheel.vy); if (a < 0) a += Math.PI * 2; sel = Math.round(a / (Math.PI / 3)) % 6; }
  if (sel !== wheel.sel) { wheel.sel = sel; document.querySelectorAll('#wheel .ws').forEach((n, i) => n.classList.toggle('on', i === sel)); $('#wheelC').textContent = sel >= 0 ? wheel.items[sel].label + (wheel.items[sel].off ? ' (not crafted)' : '') : (wheel.open === 'weapon' ? 'WEAPONS' : 'EMOTES'); }
}
function wheelClose() {
  const it = wheel.items[wheel.sel], kind = wheel.open; wheel.open = null; show('#wheel', false); if (!it) return;
  if (kind === 'weapon') { if (it.off) toast(it.label + ' not crafted yet'); else equipWeapon(it.id); } else if (!P.mount) { P.emote = it.id; P.emoteT = 0; sfx('ui'); }
}

/* ---------- character creator ---------- */
const CATS0 = [['body', 'BODY'], ['skin', 'SKIN'], ['face', 'FACE'], ['hair', 'HAIR'], ['hairCol', 'HAIR COLOR'], ['beard', 'BEARD'], ['outfit', 'OUTFIT']];
let crCat = 'body';
function enterCreator() { mode = 'creator'; showHud(false); show('#creator', true); if (document.exitPointerLock) document.exitPointerLock(); crCat = 'body'; creator.spin = 0; $('#crName').value = S.name || ''; $('#crDone').textContent = S.created ? 'DONE' : 'BEGIN SURVIVAL'; renderCreator(); }
function renderCreator() {
  const rig = !!RIGS.human, CATS = rig ? [['body', 'BODY'], ['outfit', 'OUTFIT'], ['hair', 'HEADWEAR']] : CATS0;
  creator.zoom = ['skin', 'face', 'hair', 'hairCol', 'beard'].includes(crCat);
  $('#crRail').innerHTML = CATS.map(([k, l], i) => `<button class="${k === crCat ? 'on' : ''}" data-k="${k}"><small>${i + 1}</small>${l}</button>`).join('');
  let opts = [];
  if (crCat === 'body') opts = Object.keys(BODIES).map(k => ({ v: k, l: k }));
  else if (crCat === 'skin') opts = SKINS.map((c, i) => ({ v: i, c }));
  else if (crCat === 'face') opts = ['Round', 'Oval', 'Square', 'Angular'].map((l, i) => ({ v: i, l }));
  else if (crCat === 'hair') opts = rig ? [{ v: 'crop', l: 'None' }, ...['sunflare', 'jay'].filter(h => S.owned[h]).map(h => ({ v: h, l: SHOP.find(s => s.id === h).name }))] : [...HAIRS, ...['sunflare', 'jay'].filter(h => S.owned[h])].map(h => ({ v: h, l: h }));
  else if (crCat === 'hairCol') opts = HAIRCOL.map((c, i) => ({ v: i, c }));
  else if (crCat === 'beard') opts = [{ v: 0, l: 'None' }, { v: 1, l: 'Full' }];
  else opts = ['hide', ...['ash', 'riot', 'honey', 'frost'].filter(o => S.owned[o])].map(o => ({ v: o, l: o === 'hide' ? 'Hide Wrap' : SHOP.find(s => s.id === o).name, c: OUTFITS[o].c }));
  $('#crTitle').textContent = CATS.find(c => c[0] === crCat)[1];
  $('#crOpts').innerHTML = opts.map((o, i) => `<button class="${S.look[crCat] === o.v ? 'on' : ''}" data-i="${i}">${o.c !== undefined ? `<i style="background:${hex(o.c)}"></i>` : ''}<span>${o.l || ''}</span></button>`).join('');
  $('#crBuild').innerHTML = (rig && !RIGS.human_f ? ['a'] : ['a', 'b']).map(b => `<button class="${S.look.build === b ? 'on' : ''}" data-b="${b}">${rig ? (b === 'a' ? '♂ MALE' : '♀ FEMALE') : 'FRAME ' + b.toUpperCase()}</button>`).join('');
  $('#crRail').querySelectorAll('button').forEach(b => b.onclick = () => { crCat = b.dataset.k; sfx('ui'); renderCreator(); });
  $('#crOpts').querySelectorAll('button').forEach(b => b.onclick = () => { S.look[crCat] = opts[+b.dataset.i].v; rebuildPlayer(); sfx('ui'); renderCreator(); });
  $('#crBuild').querySelectorAll('button').forEach(b => b.onclick = () => { S.look.build = b.dataset.b; rebuildPlayer(); sfx('ui'); renderCreator(); });
}

/* ---------- crafting ---------- */
function pauseInput() { if (document.exitPointerLock) document.exitPointerLock(); P.charge = -1; for (const k in K) K[k] = false; if (wheel.open) { wheel.sel = -1; wheelClose(); } }
function openCraft() { mode = 'craft'; pauseInput(); renderCraft(); show('#craft', true); }
function closeOverlay() { show('#craft', false); show('#menu', false); mode = 'play'; requestLock(); save(); }
function renderCraft() {
  const use = { berries: 'Eat', cooked: 'Eat', meat: 'Eat raw', bandage: 'Use' };
  $('#craft').innerHTML = `<div class="panel"><header><h2>INVENTORY & CRAFTING</h2><span><kbd>TAB</kbd> close</span></header><div class="cols"><section><h3>CARRYING</h3><div class="inv">${Object.keys(ITEMS).map(k => `<button class="it ${S.inv[k] ? '' : 'zero'}" data-u="${use[k] ? k : ''}"><b>${S.inv[k] || 0}</b><span>${ITEMS[k]}</span>${use[k] && S.inv[k] ? `<em>${use[k]}</em>` : ''}</button>`).join('')}</div><h3>TOOLS</h3><div class="tools">${['axe', 'bow', 'spear', 'sling', 'torch', 'hammer', 'saddle'].map(t => `<span class="${S.tools[t] ? 'on' : ''}">${t === 'saddle' ? 'Saddle' : WNAME[t]}</span>`).join('')}</div><p class="tip">${nearFire() ? '🔥 Campfire in range — you can cook.' : 'Stand near a campfire to cook meat.'}</p></section><section><h3>RECIPES</h3><div class="rec">${RECIPES.map((r, i) => { const own = r.tool && S.tools[r.id], ok = !own && canAfford(r.cost) && (!r.fire || nearFire()); return `<div class="r ${own ? 'own' : ok ? 'ok' : ''}"><div><b>${r.name}</b><small>${r.desc || ''}</small><p>${Object.keys(r.cost).map(k => `<span class="${(S.inv[k] || 0) >= r.cost[k] ? 'y' : 'n'}">${S.inv[k] || 0}/${r.cost[k]} ${ITEMS[k]}</span>`).join('')}</p></div><button data-r="${i}" ${ok ? '' : 'disabled'}>${own ? 'OWNED' : 'CRAFT'}</button></div>`; }).join('')}</div></section></div></div>`;
  $('#craft').querySelectorAll('[data-r]').forEach(b => b.onclick = () => { craft(RECIPES[+b.dataset.r]); questUpdate(); renderCraft(); });
  $('#craft').querySelectorAll('.it').forEach(b => b.onclick = () => { if (b.dataset.u) { useItem(b.dataset.u); renderCraft(); } });
}

/* ---------- menu: shop / character / tribe / codex ---------- */
let menuTab = 'shop';
function openMenu(tab) { mode = 'menu'; pauseInput(); renderMenu(tab || menuTab); show('#menu', true); }
function isEquipped(it) { return it.type === 'outfit' ? S.look.outfit === it.id : it.type === 'hair' ? S.look.hair === it.id : it.type === 'bow' ? S.equip.bow === it.id : it.type === 'mount' ? S.equip.mount === it.id : !!S.owned[it.id]; }
function applyCosmetic(it, force) {
  const on = force || !isEquipped(it);
  if (it.type === 'outfit') { S.look.outfit = on ? it.id : 'hide'; rebuildPlayer(); }
  else if (it.type === 'hair') { S.look.hair = on ? it.id : 'crop'; rebuildPlayer(); }
  else if (it.type === 'bow') { S.equip.bow = on ? it.id : null; equipWeapon(S.weapon, true); }
  else if (it.type === 'mount') { S.equip.mount = on ? it.id : null; dinos.filter(d => d.tamed && d.alive).forEach(buildDinoModel); }
}
function shopClick(it) {
  if (!S.owned[it.id]) {
    if (it.crateOnly) { toast('Ultra rare — only found in Relic Crates'); return; } if (S.amber < it.price) { toast('Not enough amber'); return; }
    S.amber -= it.price; S.owned[it.id] = 1; sfx('coin'); toast('Purchased ' + it.name, 'lime'); applyCosmetic(it, true);
  } else { applyCosmetic(it); sfx('ui'); }
  renderMenu('shop');
}
function card(it) { const own = S.owned[it.id], eq = own && isEquipped(it); return `<button class="card ${it.rar} ${eq ? 'eq' : ''}" data-id="${it.id}"><div class="sw" style="background:linear-gradient(135deg,${it.sw[0]} 0 55%,${it.sw[1]} 55%)"><span>${TYPEL[it.type]}</span>${eq ? '<em>✓ EQUIPPED</em>' : own ? '<em class="o">OWNED</em>' : ''}</div><b>${it.name}</b><small>${it.rar.toUpperCase()}</small><i>${own ? (it.type === 'emote' ? 'In emote wheel' : eq ? 'Click to unequip' : 'Click to equip') : it.crateOnly ? 'Relic Crate only' : '◆ ' + fmt(it.price)}</i></button>`; }
function renderMenu(tab) {
  menuTab = tab; let body = '';
  if (tab === 'shop') body = `<h3>FEATURED</h3><div class="cards">${SHOP.map(card).join('')}</div><div class="cratebox"><div><small>MYSTERY BOX</small><h2>RELIC CRATE</h2><p>One random cosmetic you don't own yet. Small chance of the ultra-rare Candy Tyrant mount skin.</p></div><div class="chest mini"><b></b><i></i></div><button class="btn" id="openCrate">${S.crates > 0 ? 'OPEN FREE CRATE ×' + S.crates : 'OPEN · ◆ 600'}</button></div>`;
  else if (tab === 'character') body = `<h3>CHARACTER</h3><div class="info"><p>Body <b>${S.look.body}</b> · Hair <b>${S.look.hair}</b> · Outfit <b>${S.look.outfit}</b> · Bow skin <b>${S.equip.bow || 'none'}</b> · Mount skin <b>${S.equip.mount || 'none'}</b></p><button class="btn" id="editChar">EDIT CHARACTER</button></div>`;
  else if (tab === 'tribe') {
    const left = humans.filter(e => e.out && e.alive).length, pets = dinos.filter(d => d.tamed && d.alive);
    body = `<h3>TRIBE RIVALRY</h3><div class="vs"><div class="t me"><b>EMBERHIDE</b><small>Your tribe</small></div><em>VS</em><div class="t foe"><b>ASHFANG</b><small>${S.won ? 'Outpost captured' : gate.alive ? 'Gate standing · ' + Math.round(Math.max(0, S.gate) / gate.max * 100) + '%' : 'Gate breached · ' + left + ' warriors left'}</small></div></div>
    <h3>SEASON 1 · ASHFALL</h3><div class="season"><div><b style="width:${(S.xp % 1500) / 15}%"></b></div><span>Tier ${S.tier} · ${fmt(S.xp % 1500)}/1,500 XP — every tier awards a free Relic Crate. Live events (Amber Storm, Alpha Hunt, Tribe Raid) rotate every few minutes.</span></div>
    <h3>ONLINE</h3><div class="mem">${NET.on ? `<span><b>${S.name || 'You'}</b> You · room ${NET.room}</span>` + [...NET.players.values()].map(r => `<span><b>${r.name}</b> Survivor</span>`).join('') + '<span>Invite friends: share this page address. Add ?room=yourname for a private room.</span>' : '<span>Offline — open the hosted game link to play with others.</span>'}</div>
    <h3>MEMBERS</h3><div class="mem"><span><b>You</b> Chieftain</span>${humans.filter(e => e.team === 'ally' && e.alive).map(e => `<span><b>${e.name}</b> Tribemate (AI)</span>`).join('')}${pets.map(d => `<span><b>${d.name}</b> ${d.def.name}</span>`).join('')}</div>
    <h3>RECORD</h3><div class="mem"><span><b>${S.stat.kills}</b> Kills</span><span><b>${S.stat.tames}</b> Tames</span><span><b>${S.pieces.length}</b> Structures</span></div>`;
  } else body = `<h3>CODEX</h3><div class="codex">${Object.keys(DINOS).map(k => { const d = DINOS[k], s = S.codex[k]; return `<div class="${s ? '' : 'unk'}"><b>${s ? d.name : '???'}</b><small>${s ? d.temper.toUpperCase() + (d.mount ? ' · RIDEABLE' : '') : 'Undiscovered'}</small><p>${s ? d.info : 'Get close to one to study it.'}</p></div>`; }).join('')}</div>
    <h3>CONTROLS</h3><div class="keys">${[['WASD', 'Move'], ['Mouse', 'Look'], ['Shift', 'Sprint'], ['Space', 'Jump / fly up'], ['LMB hold', 'Charge attack'], ['E', 'Interact / tame'], ['F', 'Ride / dismount'], ['Q hold', 'Weapon wheel'], ['1–6', 'Weapons'], ['G hold', 'Emote wheel'], ['Tab', 'Craft'], ['B', 'Build mode'], ['H', 'Eat'], ['P', 'This menu'], ['V', 'First / third person'], ['T', 'Rally tribe'], ['C', 'Fly down'], ['Arrows', 'Look (no mouse)']].map(k => `<span><kbd>${k[0]}</kbd>${k[1]}</span>`).join('')}</div><button class="btn ghost" id="resetSave">RESET SAVE</button>`;
  $('#menu').innerHTML = `<nav><div class="brand"><i>◆</i> AMBERFALL</div><div class="tabs">${['shop', 'character', 'tribe', 'codex'].map(t => `<button class="${t === tab ? 'on' : ''}" data-t="${t}">${t.toUpperCase()}</button>`).join('')}</div><div class="amb">◆ ${fmt(S.amber)} AMBER</div><button class="x" id="menuX">PLAY ▸</button></nav><main>${body}</main>`;
  $('#menu').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { sfx('ui'); renderMenu(b.dataset.t); });
  $('#menu').querySelectorAll('.card').forEach(b => b.onclick = () => shopClick(SHOP.find(s => s.id === b.dataset.id)));
  $('#menuX').onclick = closeOverlay;
  if ($('#openCrate')) $('#openCrate').onclick = openCrate;
  if ($('#editChar')) $('#editChar').onclick = () => { show('#menu', false); enterCreator(); };
  if ($('#resetSave')) $('#resetSave').onclick = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } S.created = false; location.reload(); };
}
function openCrate() {
  if (S.crates > 0) S.crates--; else if (S.amber >= 600) S.amber -= 600; else { toast('Not enough amber'); return; }
  const wgt = { ultra: 1, legend: 2, epic: 4, rare: 6 }, pool = []; SHOP.filter(i => !S.owned[i.id]).forEach(i => { for (let k = 0; k < wgt[i.rar]; k++) pool.push(i); });
  const it = pool.length ? pick(pool) : null, c = $('#crate'); sfx('craft');
  c.className = 'shake'; c.innerHTML = '<div class="chest"><b></b><i></i></div><p>Opening Relic Crate…</p>';
  setTimeout(() => {
    sfx('win'); c.className = 'reveal ' + (it ? it.rar : 'rare');
    if (it) { S.owned[it.id] = 1; applyCosmetic(it, true); c.innerHTML = `<div class="rv"><small>${it.rar.toUpperCase()} · ${TYPEL[it.type].toUpperCase()}</small><div class="sw" style="background:linear-gradient(135deg,${it.sw[0]} 0 55%,${it.sw[1]} 55%)"></div><h2>${it.name}</h2><p>Unlocked and equipped</p><button class="btn">CLAIM</button></div>`; }
    else { S.amber += 500; c.innerHTML = '<div class="rv"><small>COLLECTION COMPLETE</small><h2>+500 AMBER</h2><button class="btn">CLAIM</button></div>'; }
    c.querySelector('button').onclick = () => { c.className = 'hide'; renderMenu('shop'); };
  }, 1500);
}
