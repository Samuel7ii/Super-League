// ===================== UI v2 =====================
const SAVE_KEY = 'superleague_save_v2';
const U = { tab: 'home', df: { pos: 'ALL', q: '', sort: 'ovr', n: 7 }, sel: null, gwView: null, totwGW: null, stat: 'g', statPos: 'ALL', statMine: false, tf: { pos: 'ALL', q: '', min: 0, free: false, max: 999 }, clubView: null, feedMine: false, live: null, speed: 1 };
const $ = s => document.querySelector(s);
const me = () => S.teams[S.userTeam];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fm = x => `€${(+x).toFixed(1)}m`;
const ord = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const tier = v => v >= 92 ? 'icon' : v >= 86 ? 'gold' : v >= 80 ? 'silver' : 'bronze';
const ob = v => `<span class="ovr t-${tier(v)}">${v}</span>`;
const yrTag = y => `<span class="yr">'${String(y).slice(2)}</span>`;
function crest(t, sz) {
  if (!t) return '<span class="crest fa">FA</span>';
  const s = sz === 'xl' ? 64 : sz === 'lg' ? 42 : sz === 'sm' ? 22 : 28;
  return `<svg class="crest" width="${s}" height="${s * 1.15}" viewBox="0 0 40 46"><path d="M20 1 L38 7 V22 C38 34 29 41 20 45 C11 41 2 34 2 22 V7 Z" fill="${t.c1}" stroke="${t.c2}" stroke-width="2.4"/><path d="M20 4 L35 9 V14 H5 V9 Z" fill="${t.c2}" opacity=".9"/><text x="20" y="31" text-anchor="middle" font-family="Oswald,Impact,sans-serif" font-weight="700" font-size="${t.short.length > 2 ? 11 : 13}" fill="${t.c2}">${t.short}</text></svg>`;
}
function pn(pl, opt) { const p = DB[pl.id]; return `<a class="pl" onclick="openPlayer(${pl.id})">${esc(opt === 'short' ? p.short : p.name)} ${yrTag(pl.y)}</a>`; }
const posChip = (pos, lg) => `<span class="pos g-${POS_GROUP[pos] || SLOT_GROUP(pos)} ${lg ? 'lg' : ''}">${pos}</span>`;
const moodFace = m => '';
function condOf(pl) { const j = (hash01(pl.id + ':' + S.season + ':' + S.gw) - 0.5) * 0.6; const v = (pl.fit - 82) / 18 * 0.4 + (pl.mor - 62) / 28 * 0.6 + j + (pl.inj > 0 ? -1.2 : 0); return v > 0.7 ? 1 : v > 0.3 ? 2 : v > -0.2 ? 3 : v > -0.6 ? 4 : 5; }
const condA = pl => { const c = condOf(pl); return `<i class="cond c${c}" title="Condition (fitness and morale)">${['', '↑', '↗', '→', '↘', '↓'][c]}</i>`; };
function save() { if (U.live) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function load() { try { const s = localStorage.getItem(SAVE_KEY); if (s) { S = JSON.parse(s); P = S.players; return true; } } catch (e) { } return false; }
const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
const noEmo = s => String(s).replace(/(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{23E9}-\u{23FA}]\u{FE0F}?)\s?/gu, '').trim();
function toast(msg, ok) { msg = noEmo(msg); const d = document.createElement('div'); d.className = 'toast ' + (ok === false ? 'bad' : ''); d.innerHTML = msg; const box = $('#toasts'); box.appendChild(d); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => d.remove(), 4500); }
function res(r) { if (!r) return; toast(r.msg, r.ok); save(); render(); if (S && S.breaking && S.breaking.length && $('#modal').style.display !== 'block') { U.scenAfter = true; showBreaking(); } }
function theme() { const t = S && me(); const r = document.documentElement; if (t) { r.style.setProperty('--c1', t.c1); r.style.setProperty('--c2', t.c2); } }

// ---------- setup ----------
function renderSetup() {
  document.documentElement.style.setProperty('--c1', '#1c7c3c'); document.documentElement.style.setProperty('--c2', '#fff');
  $('#app').innerHTML = `
  <div class="setup">
    <div class="hero"><h1>SUPER <span>LEAGUE</span></h1><p>Draft. Manage. Build a dynasty.</p></div>
    ${hasSave() ? `<div class="card resume"><div><b>Saved career found</b><br><small class="muted">Pick up where you left off</small></div><button class="btn lime" onclick="resumeGame()">Continue ▶</button></div>` : ''}
    <div class="card"><h3>Pick your club</h3><div class="clubgrid">${CLUBS.map((c, i) => `<button class="clubpick ${U.pick === i ? 'on' : ''}" style="--k1:${c[3]};--k2:${c[4]}" onclick="U.pick=${i};renderSetup()">${crest({ c1: c[3], c2: c[4], short: c[1] }, 'lg')}<span>${c[0]}</span></button>`).join('')}</div></div>
    <div class="card"><h3>Difficulty</h3><div class="optgrid">${Object.keys(DIFF).map(k => `<button class="optpick d-${k} ${(U.diff || 'pro') === k ? 'on' : ''}" onclick="U.diff='${k}';renderSetup()"><b>${DIFF[k].name}</b><small>${DIFF[k].desc}</small><em>Start budget €${DIFF[k].budget}m</em></button>`).join('')}</div></div>
    <div class="go"><label class="tog"><input type="checkbox" ${U.final1 ? '' : 'checked'} onchange="U.final1=!this.checked"> Two-legged final</label><br><br><button class="btn lime big" ${U.pick === undefined ? 'disabled' : ''} onclick="startGame()">${U.pick === undefined ? 'Pick a club to continue' : `Continue as ${CLUBS[U.pick][0]} ▶`}</button></div>
  </div>`;
}
function startGame() { S = newState(U.pick, { finalTwoLegs: !U.final1, diff: U.diff || 'pro' }); P = S.players; U.pd = { pos: 'ALL', q: '', n: 60 }; save(); render(); window.scrollTo(0, 0); }
function renderPreDraft() {
  const u = me(); const d = S.draft; const f = U.pd || (U.pd = { pos: 'ALL', q: '', n: 60 });
  const style = S.opts.style || 'snake'; const myFirst = d.order.indexOf(S.userTeam) + 1;
  const myPicks = d.owner.map((t, i) => t === S.userTeam ? i + 1 : 0).filter(Boolean);
  const grp = { DEF: ['CB', 'LB', 'RB'], MID: ['DM', 'CM', 'AM'], ATT: ['LW', 'RW', 'ST'] };
  const list = draftPool().filter(p => (f.pos === 'ALL' || p.pos === f.pos || (grp[f.pos] || []).includes(p.pos)) && (!f.q || DB[p.id].name.toLowerCase().includes(f.q.toLowerCase()))).sort((a, b) => b.ovr - a.ovr || a.age - b.age);
  const rows = list.slice(0, f.n).map((p, i) => { const k = k2(p.ovr); return `<tr onclick="openPlayer(${p.id})"><td class="muted">${i + 1}</td><td><span class="kb k-${k[1]}">${p.ovr}</span></td><td>${posChip(p.pos)}</td><td><b>${esc(DB[p.id].name)}</b></td><td class="muted">'${String(p.y).slice(2)} · ${esc(p.rclub)}</td><td class="muted">${DB[p.id].nat}</td><td>${p.age}</td><td class="ktn">${k[2]}</td></tr>`; }).join('');
  const sopt = (k, t, dsc) => `<button class="optpick ${style === k ? 'on' : ''}" onclick="setDraftStyle('${k}');save();render()"><b>${t}</b><small>${dsc}</small></button>`;
  document.documentElement.style.setProperty('--c1', u.c1); document.documentElement.style.setProperty('--c2', u.c2);
  $('#app').innerHTML = `<div class="setup predraft">
    <div class="pdhead">${crest(u, 'xl')}<div><small>${diffOf().name} · €${u.budget}m budget</small><h2>${u.name}: Draft Day</h2><p class="muted">You pick <b>#${myFirst}</b> in round 1. Your picks: ${myPicks.slice(0, 5).map(n => '#' + n).join(', ')}…</p></div></div>
    <div class="card"><h3>Draft style</h3><div class="optgrid two">${sopt('snake', 'Snake', 'Order reverses every round. Last pick in round 1 gets first pick in round 2.')}${sopt('classic', 'Classic', 'Same order every round. The team picking first always picks first.')}</div></div>
    <div class="card"><div class="hrow"><h3>Draft order · drawn at random</h3><button class="btn sm" onclick="rerollOrder()">Re-roll order</button></div>
      <div class="dorder">${d.order.map((t, i) => `<div class="${t === S.userTeam ? 'me' : ''}"><small>${i + 1}</small>${crest(S.teams[t], 'sm')}<span>${S.teams[t].short}</span></div>`).join('')}</div>
      <p class="fine">Round 1 order. ${style === 'snake' ? 'It reverses every round (snake).' : 'It stays the same every round (classic).'}</p></div>
    <div class="go pdgo"><button class="btn lime big" onclick="beginDraft()">Start Draft ▶</button><button class="btn big" onclick="randomTeam()">Random Team</button><button class="btn ghost" onclick="S=null;render()">Back</button></div>
    <div class="card"><h3>Player pool · ${draftPool().length} players · ${freeCoaches().length} coaches</h3>
      <div class="filters">${['ALL', 'GK', 'DEF', 'CB', 'LB', 'RB', 'MID', 'DM', 'CM', 'AM', 'ATT', 'LW', 'RW', 'ST'].map(p => `<button class="chip ${f.pos === p ? 'on' : ''}" onclick="U.pd.pos='${p}';U.pd.n=60;render()">${p}</button>`).join('')}
        <input placeholder="Search a player…" value="${esc(f.q)}" oninput="U.pd.q=this.value;clearTimeout(window._t);window._t=setTimeout(()=>{render();const i=document.querySelector('.filters input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)"></div>
      <div class="tblwrap"><table class="tbl pdlist"><thead><tr><th>#</th><th>OVR</th><th>Pos</th><th>Player</th><th>Season</th><th>Nat</th><th>Age</th><th>Card</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="muted">No players match.</td></tr>'}</tbody></table></div>
      ${list.length > f.n ? `<button class="btn more" onclick="U.pd.n+=100;render()">Show more (${list.length - f.n} left)</button>` : ''}
    </div></div>`;
}
function rerollOrder() { shuffle(S.draft.order); setDraftStyle(S.opts.style || 'snake'); save(); render(); }
function beginDraft() { S.phase = 'draft'; U.tab = 'draft'; save(); render(); window.scrollTo(0, 0); }
function randomTeam() { S.phase = 'draft'; while (isDrafting()) { const t = S.teams[draftTeamOnClock()]; draftPick(t.user ? randomChoice(t) : aiDraftChoice(t)); } U.tab = 'home'; save(); render(); window.scrollTo(0, 0); toast(`Your random squad is in. ${me().squad.length} players drafted.`); }
function randomChoice(t) { const c = aiDraftChoice(t); if (c.pass || c.co !== undefined) return c; const g = dgroup(P[c.pl].pos); const pool = draftPool().filter(p => dgroup(p.pos) === g).sort((a, b) => b.ovr - a.ovr).slice(0, 12); return { pl: pool[ri(0, pool.length - 1)].id }; }
function resumeGame() { if (load()) { migrate(); U.tab = isDrafting() ? 'draft' : S.phase === 'over' ? 'legacy' : 'home'; render(); } }
function newGameUI() { openModal(`<h2>Start a new reality?</h2><p class="muted">Your current save will be deleted.</p><div class="row"><button class="btn red" onclick="try{localStorage.removeItem(SAVE_KEY)}catch(e){};S=null;closeModal();render()">Yes, start over</button><button class="btn" onclick="closeModal()">Cancel</button></div>`); }

// ---------- shell ----------
const TABS = [['home', 'Club House'], ['squad', 'Team Management'], ['tactics', 'Formation & Tactics'], ['fixtures', 'Schedule'], ['table', 'Standings'], ['stats', 'Records'], ['awards', 'Awards'], ['transfers', 'Transfers'], ['fans', 'Fan Zone'], ['coaches', 'Coaching Staff'], ['clubs', 'Club Search']];
function phaseLabel() {
  if (isDrafting()) return `${S.phase === 'sdraft' ? 'Season draft' : 'Draft'} · round ${Math.floor(S.draft.pick / 30) + 1} of ${S.draft.rounds}`;
  if (S.phase === 'preseason') return 'Pre-season · window open';
  if (S.phase === 'season') return `Gameweek ${S.gw + 1} of ${NGW}${windowOpen() ? ' · window open' : ''}`;
  if (S.phase === 'playoffs') { const po = S.playoffs; return `${po.names[po.round]}${po.round === 2 && !S.opts.finalTwoLegs ? '' : ' · leg ' + (po.leg + 1)}`; }
  if (S.phase === 'over') return 'Reality complete';
  return 'Season complete';
}
function nextLabel() { if (S.phase === 'preseason') return 'Matchday 1'; if (S.phase === 'season') return `GW ${S.gw + 1}`; if (S.phase === 'playoffs') { const po = S.playoffs; return po.round === 2 && !S.opts.finalTwoLegs ? 'Final' : `${['QF', 'SF', 'Final'][po.round]} leg ${po.leg + 1}`; } return ''; }
function userInRound() { const R = S.phase === 'playoffs' ? S.playoffs.rounds[S.playoffs.round].some(t => t.hi === S.userTeam || t.lo === S.userTeam) : true; return R; }
function actionBtns() {
  if (['preseason', 'season', 'playoffs'].includes(S.phase)) return `${userInRound() ? `<button class="btn lime" onclick="playLive()">Play ${nextLabel()}</button>` : ''}<button class="btn" onclick="advance(1)">Quick sim</button>${S.phase !== 'playoffs' ? `<button class="btn ghost" onclick="advance(99)">Sim to playoffs</button>` : ''}`;
  if (S.phase === 'awards') return S.season >= S.maxSeasons ? `<button class="btn lime" onclick="goNextSeason()">Final recap ▶</button>` : `<button class="btn ghost" onclick="U.tab='awards';render()">Awards</button><button class="btn lime" onclick="goNextSeason()">Start Season ${S.season + 1}</button>`;
  if (S.phase === 'over') return `<button class="btn lime" onclick="U.tab='legacy';render()">Legacy recap</button>`;
  return '';
}
function render() {
  if (!S) return renderSetup();
  if (S.phase === 'predraft') return renderPreDraft();
  theme();
  const u = me();
  let tabs = S.phase === 'draft' ? [['draft', 'Draft Room'], ['clubs', 'Club Search']] : S.phase === 'sdraft' ? [['draft', 'Season Draft'], ['squad', 'Team Management'], ['clubs', 'Club Search'], ['fans', 'Fan Zone'], ['awards', 'Awards']] : TABS.slice();
  if (S.phase === 'over') tabs = [['legacy', 'Legacy']].concat(tabs);
  if (!tabs.some(t => t[0] === U.tab)) U.tab = tabs[0][0];
  const unread = S.offers.length + S.inbox.filter(x => x.kind === 'req').length;
  const wk = isDrafting() ? phaseLabel() : S.phase === 'season' ? `Week ${S.gw + 1}` : phaseLabel();
  $('#app').innerHTML = `
  <header class="tab-${U.tab}">
    <div class="topbar">
      <div class="mode" onclick="U.tab='home';render()"><b>SUPER LEAGUE</b><span>MASTER CAREER</span></div>
      <div class="club">${crest(u, 'lg')}<div><b>${u.name}</b><small>${S.coaches[u.coach] ? S.coaches[u.coach].name : 'Caretaker'}</small></div></div>
      <div class="date"><small>Season ${S.season} / ${S.maxSeasons}</small><b>${wk}</b></div>
      <div class="money"><small>Funds</small><b>${fm(u.budget)}</b></div>
      <div class="acts">${actionBtns()}</div>
    </div>
  </header>
  <div class="shell">
    <nav><div class="navttl">MENU</div>${tabs.map(([k, l]) => `<button class="${U.tab === k ? 'on' : ''}" onclick="U.tab='${k}';U.sel=null;render()">${l}${k === 'transfers' && unread ? `<em>${unread}</em>` : ''}</button>`).join('')}
      <button class="navsys" onclick="settingsUI()">System / Save</button></nav>
    <main id="main"></main>
  </div>
  <footer class="prompts">${promptBar()}</footer>
`;
  const f = { draft: vDraft, home: vHome, squad: vSquad, tactics: vTactics, fixtures: vFixtures, table: vTable, stats: vStats, awards: vAwards, transfers: vTransfers, coaches: vCoaches, clubs: vClubs, fans: vFans, legacy: vLegacy }[U.tab];
  $('#main').innerHTML = f();
  draftTimer();
}
function promptBar() {
  const p = (k, lbl, js) => `<span class="pr" onclick="${js}"><i class="b-${k}"></i>${lbl}</span>`;
  const out = [];
  if (['preseason', 'season', 'playoffs'].includes(S.phase)) { if (userInRound()) out.push(p('x', 'Play Match', 'playLive()')); out.push(p('sq', 'Quick Sim', 'advance(1)')); out.push(p('tri', 'Tactics', "U.tab='tactics';render()")); }
  if (isDrafting()) out.push(p('x', 'Draft', "U.tab='draft';render()"), p('sq', 'Skip Pick', 'aiPickNow()'));
  out.push(p('o', 'Club House', "U.tab='home';render()"));
  out.push(p('st', 'System', 'settingsUI()'));
  return out.join('');
}
document.addEventListener('keydown', e => { if (!S || U.live || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return; const k = e.key.toLowerCase(); if ($('#modal').style.display === 'block') return;
  if (k === 'x' && ['preseason', 'season', 'playoffs'].includes(S.phase) && userInRound()) playLive(); else if (k === 's' && ['preseason', 'season', 'playoffs'].includes(S.phase)) advance(1); else if (k === 't' && !isDrafting()) { U.tab = 'tactics'; render(); } else if (k === 'h') { U.tab = isDrafting() ? 'draft' : 'home'; render(); } });
function advance(n) {
  let last = null, played = 0;
  for (let i = 0; i < n; i++) {
    if (!['preseason', 'season', 'playoffs'].includes(S.phase)) break;
    const wasPO = S.phase === 'playoffs';
    const r = playRoundQuick(); if (!r) break; played++;
    const um = r.Ms.find(m => m.h === S.userTeam || m.a === S.userTeam); if (um) last = um;
    if (wasPO || S.phase === 'playoffs' && n > 1) break;
  }
  save(); render();
  if (last && played === 1) { const isH = last.h === S.userTeam; const gf = isH ? last.hg : last.ag, ga = isH ? last.ag : last.hg; toast(`${gf > ga ? 'Win' : gf === ga ? 'Draw' : 'Loss'} ${gf}-${ga} vs ${S.teams[isH ? last.a : last.h].name}`); }
  else if (played > 1) toast(`Simmed ${played} rounds.`);
  if (S.phase === 'awards') { U.tab = 'awards'; render(); }
  if (S.phase !== 'awards') { U.scenAfter = true; afterAction(); }
}
function scenCard(modal) { const sc = S.scenario; if (!sc) return ''; return `<div class="${modal ? '' : 'card '}scen"><small class="kicker">Something's happened · GW${sc.gw}</small><h2>${noEmo(sc.title)}</h2><p>${sc.text}</p><div class="row">${sc.choices.map(([k, l], i) => `<button class="btn ${i === 0 ? 'lime' : ''}" onclick="U.seenScen='${sc.id}';closeModal();res(resolveScenario('${k}'))">${l}</button>`).join('')}</div>${modal && sc.choices.length > 1 ? '<p class="fine">If you don\'t decide before the next match, your assistant will pick the first option.</p>' : ''}</div>`; }
function showBreaking() {
  if (U.live || !S.breaking || !S.breaking.length) return false;
  const b = S.breaking.shift(); save(); const p = P[b.pl]; const f = S.teams[b.from], t = S.teams[b.to];
  openModal(`<div class="breaking"><div class="tape">BREAKING · TRANSFER BOMBSHELL · BREAKING · TRANSFER BOMBSHELL · </div>
    <h1>HERE WE GO!</h1><div class="bmove">${crest(f, 'xl')}<div class="barrow">➜</div>${futCard(p)}<div class="barrow">➜</div>${crest(t, 'xl')}</div>
    <h2>${esc(DB[p.id].name)} ${yrTag(p.y)} joins ${t.name}</h2><p class="bfee">${b.trade ? 'Blockbuster trade' : `€${b.fee}m`} · from ${f.name}</p>
    <div class="row center"><button class="btn lime big" onclick="closeModal()">${S.breaking.length ? 'Next story ▶' : 'Wow. Continue'}</button></div></div>`, 'wide bmodal');
  return true;
}
function afterAction() { if (!showBreaking()) showScenario(); }
function showScenario() { if (S.scenario && U.seenScen !== S.scenario.id && !U.live) { U.seenScen = S.scenario.id; openModal(scenCard(true)); } }
function goNextSeason() { nextSeason(); U.tab = S.phase === 'over' ? 'legacy' : 'home'; save(); render(); }

// ---------- draft ----------
const K2 = [[96, 'dm', 'Dark Matter'], [93, 'opal', 'Galaxy Opal'], [91, 'pink', 'Pink Diamond'], [89, 'dia', 'Diamond'], [87, 'ame', 'Amethyst'], [85, 'ruby', 'Ruby'], [82, 'sapph', 'Sapphire'], [79, 'emer', 'Emerald'], [76, 'gold', 'Gold'], [72, 'silv', 'Silver'], [0, 'bron', 'Bronze']];
const k2 = v => K2.find(x => v >= x[0]);
function futCard(p, action) {
  const d = DB[p.id]; const names = p.pos === 'GK' ? GK_N : ATTR_N;
  const top = p.attrs.map((v, i) => [names[i], v]).sort((x, y) => y[1] - x[1]).slice(0, 3);
  const k = k2(p.ovr);
  return `<div class="fut k-${k[1]}" onclick="openPlayer(${p.id})"><div class="k-tier">${k[2]}</div>
    <div class="fut-top"><div><b>${p.ovr}</b><span>${p.pos}</span></div><small>${d.nat}</small></div>
    <div class="fut-name">${esc(d.short)}</div><div class="fut-yr">'${String(p.y).slice(2)} · ${esc(p.rclub)}</div>
    <div class="fut-attrs">${top.map(([k, v]) => `<span><b>${v}</b>${k}</span>`).join('')}</div>
    <div class="fut-meta"><span title="Football IQ">${p.iq}</span><span title="Work rate">${p.wr === 'Low' ? '' : p.wr === 'High' ? '' : ''} ${p.wr}</span><span>${p.age}y</span></div>
    ${action || ''}</div>`;
}
function coachCard(c, action) { const k = k2(c.rating); return `<div class="fut coachc k-${k[1]}"><div class="k-tier">${k[2]} · Coach</div><div class="fut-top"><div><b>${c.rating}</b><span>COACH</span></div><small>${c.nat}</small></div><div class="fut-name">${esc(c.name.split(' ').slice(-1)[0])}</div><div class="fut-yr">${esc(c.name)}</div><div class="fut-attrs"><span><b>${c.form}</b>shape</span><span><b>${c.style}</b>style</span></div>${action || ''}</div>`; }
function vDraft() {
  const d = S.draft; const on = S.teams[draftTeamOnClock()]; const mine = on.user; const u = me();
  const round = Math.floor(d.pick / 30) + 1, pk = d.pick % 30 + 1;
  let nxt = d.pick; while (nxt < d.total && d.owner[nxt] !== S.userTeam) nxt++; const seasonD = d.kind === 'season'; const full = u.squad.length >= MAX_SQUAD;
  const f = U.df; if (seasonD && f.pos === 'COACH') f.pos = 'ALL'; const btn = (js, lbl) => mine && !full ? `<button class="btn lime sm full" onclick="event.stopPropagation();${js}">${lbl}</button>` : '';
  let grid = '';
  if (f.pos === 'COACH') {
    grid = freeCoaches().sort((a, b) => b.rating - a.rating).map(c => coachCard(c, u.coach < 0 ? btn(`userDraft({co:${c.id}})`, 'Draft coach') : '')).join('');
  } else {
    let list = draftPool().filter(p => (f.pos === 'ALL' || p.pos === f.pos || (f.pos === 'DEF' && ['CB', 'LB', 'RB'].includes(p.pos)) || (f.pos === 'MID' && ['DM', 'CM', 'AM'].includes(p.pos)) || (f.pos === 'ATT' && ['LW', 'RW', 'ST'].includes(p.pos))) && (!f.q || DB[p.id].name.toLowerCase().includes(f.q.toLowerCase())));
    const sorts = { ovr: (a, b) => b.ovr - a.ovr || a.age - b.age, age: (a, b) => a.age - b.age || b.ovr - a.ovr, iq: (a, b) => b.iq - a.iq, year: (a, b) => a.y - b.y };
    list.sort(sorts[f.sort]);
    grid = list.slice(0, f.n).map(p => futCard(p, btn(`userDraft({pl:${p.id}})`, 'Draft'))).join('') + (list.length > f.n ? `<button class="btn more" onclick="U.df.n+=7;render()">Show 7 more (${list.length - f.n} left)</button>` : '');
  }
  const c = groupCounts(u);
  const lbl = { GK: 'Goalkeepers', CB: 'Centre-backs', FB: 'Full-backs', MID: 'DM / CM', AMW: 'AM / Wingers', ST: 'Strikers' };
  return `<div class="clock ${mine ? 'me' : ''}">
      <div class="clock-l">${crest(on, 'xl')}<div><small>${seasonD ? `Season ${S.season} draft · ` : ''}Round ${round} of ${d.rounds} · pick ${pk} · #${d.pick + 1} overall</small><h2>${mine ? "You're on the clock!" : on.name + ' are picking'}</h2>
      <small>${nxt < d.total ? (nxt === d.pick ? (full ? 'Your squad is full (22): pass or trade the pick.' : seasonD ? 'Choose a player below.' : 'Choose a player or a coach below.') : `Your next pick is #${nxt + 1}, ${nxt - d.pick} picks away.`) : 'All your picks are in.'}</small></div></div>
      <div class="row"><button class="btn" onclick="openPickTrade()">Trade picks</button>${mine ? `${full ? '' : `<button class="btn" onclick="userDraft(aiDraftChoice(me()))">Auto-pick</button>`}<button class="btn ghost" onclick="userDraft({pass:true})">Pass</button>` : `<div class="dtimer ${U.dtPaused ? 'paused' : ''}"><b id="dtSec">10</b><small>sec</small></div><button class="btn" onclick="U.dtPaused=!U.dtPaused;render()">${U.dtPaused ? '▶ Resume' : 'Pause'}</button><button class="btn lime" onclick="aiPickNow()">Skip next pick</button><button class="btn" onclick="draftAdvanceAI(true);save();render()">Sim to my pick </button>`}<button class="btn ghost" onclick="autoDraftAll()">Auto-draft the rest</button></div>
    </div>
    ${justPicked()}
    <div class="cols">
      <div class="grow">
        <div class="filters">${['ALL', 'GK', 'DEF', 'CB', 'LB', 'RB', 'MID', 'DM', 'CM', 'AM', 'ATT', 'LW', 'RW', 'ST'].map(p => `<button class="chip ${f.pos === p ? 'on' : ''}" onclick="U.df.pos='${p}';U.df.n=7;render()">${p}</button>`).join('')}${seasonD ? '' : `<button class="chip coach ${f.pos === 'COACH' ? 'on' : ''}" onclick="U.df.pos='COACH';render()">COACHES</button>`}
          <input placeholder="Search a player…" value="${esc(f.q)}" oninput="U.df.q=this.value;clearTimeout(window._t);window._t=setTimeout(()=>{render();const i=document.querySelector('.filters input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)">
          <select onchange="U.df.sort=this.value;render()">${[['ovr', 'Best rated'], ['age', 'Youngest'], ['iq', 'Highest IQ'], ['year', 'Oldest season']].map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="futgrid">${grid}</div>
      </div>
      <div class="side">
        <div class="card"><h3>Your draft · ${teamPicks(u)} made · ${teamFuturePicks(S.userTeam).length} left</h3>
          <div class="need coachline"><span>Coach</span><b>${u.coach >= 0 ? S.coaches[u.coach].name + ' (' + S.coaches[u.coach].rating + ')' : '<span class="warn">none yet</span>'}</b></div>
          ${Object.keys(lbl).map(g => `<div class="need"><span>${lbl[g]}</span><b class="${c[g] < DRAFT_T[g][0] ? 'warn' : 'okc'}">${c[g]}/${DRAFT_T[g][0]}</b></div>`).join('')}
          <div class="mypicks">${u.squad.map(id => P[id]).map(p => `<div>${posChip(p.pos)}${pn(p, 'short')} ${ob(p.ovr)}</div>`).join('') || '<p class="muted">No picks yet.</p>'}</div>
          <div class="mypickslist">${teamFuturePicks(S.userTeam).slice(0, 8).map(i => `<span class="pill">${pickLabel(i)}</span>`).join('')}</div>
          <p class="fine">${seasonD ? `Squad: ${u.squad.length}/${MAX_SQUAD}.` : `You'll be able to add free agents after the draft (up to ${MAX_SQUAD} players).`}</p>
        </div>
        <div class="card"><h3>Recent picks</h3><div class="feedmini">${d.log.slice(-12).reverse().map(l => `<div><small>#${l.pick + 1}</small>${crest(S.teams[l.team], 'sm')} ${l.pass ? '<span class="muted">passed</span>' : l.co !== undefined ? `<b>${esc(S.coaches[l.co].name)}</b> ${ob(S.coaches[l.co].rating)}` : `${pn(P[l.pl], 'short')} ${ob(P[l.pl].ovr)}`}</div>`).join('') || '<p class="muted">The draft is about to begin.</p>'}</div></div>
      </div></div>`;
}
const DRAFT_SECS = 10;
function aiPickNow() { if (!S || !isDrafting()) return; const t = S.teams[draftTeamOnClock()]; if (t.user) return; aiPickTrades(); draftPick(aiDraftChoice(t)); if (!isDrafting()) { U.tab = 'home'; toast('Draft complete!'); } save(); render(); }
function draftTimer() {
  clearInterval(U.dtT);
  if (!S || !isDrafting() || U.tab !== 'draft' || S.teams[draftTeamOnClock()].user) return;
  if (U.dtPick !== S.draft.pick) { U.dtPick = S.draft.pick; U.dtLeft = DRAFT_SECS * 1000; }
  let last = Date.now();
  U.dtT = setInterval(() => {
    const now = Date.now(); if (!U.dtPaused && !(document.getElementById('modal').style.display === 'block')) U.dtLeft -= now - last; last = now;
    const el = document.getElementById('dtSec'); if (el) el.textContent = Math.max(0, Math.ceil(U.dtLeft / 1000));
    if (U.dtLeft <= 0) { clearInterval(U.dtT); aiPickNow(); }
  }, 200);
}
function justPicked() {
  const d = S.draft; const l = d.log.slice().reverse().find(x => !x.pass); if (!l) return '';
  const t = S.teams[l.team]; const r = Math.floor(l.pick / 30) + 1, pk = l.pick % 30 + 1;
  const isCo = l.co !== undefined; const p = isCo ? null : P[l.pl]; const c = isCo ? S.coaches[l.co] : null;
  const big = isCo ? c.rating >= 93 : p.ovr >= 90;
  return `<div class="justpicked ${big ? 'big' : ''} ${t.user ? 'mine' : ''}" style="--k1:${t.c1}" key="${l.pick}">
    <div class="jp-l">${crest(t, 'xl')}<div><small>THE PICK IS IN · Round ${r}, pick ${pk} (#${l.pick + 1})</small><h2>${t.name} select ${isCo ? '' + esc(c.name) : esc(DB[p.id].name)} ${isCo ? '' : yrTag(p.y)}</h2>
    <p>${isCo ? `${c.style} coach · ${c.form}` : `${p.pos} · ${p.age} years old · ${esc(p.rclub)} ${p.y}/${String(p.y + 1).slice(2)}`}${big ? ' · <b class="gold">Blockbuster pick</b>' : ''}</p></div></div>
    <div class="jp-ovr t-${tier(isCo ? c.rating : p.ovr)}">${isCo ? c.rating : p.ovr}<small>${isCo ? 'COACH' : p.pos}</small></div></div>`;
}
function userDraft(choice) { U.df.n = 7; if (!isDrafting() || !S.teams[draftTeamOnClock()].user) return; if (choice.co !== undefined && me().coach >= 0) return toast('You already have a coach.', false); draftPick(choice); draftAdvanceAI(true); if (!isDrafting()) { U.tab = 'home'; toast('Draft complete! Sign free agents, set tactics, then kick off.'); } save(); render(); }
function autoDraftAll() { while (isDrafting()) draftPick(aiDraftChoice(S.teams[draftTeamOnClock()])); U.tab = 'home'; save(); render(); toast('Draft complete!'); }

function openPickTrade() {
  const d = S.draft; U.pt = U.pt || { mine: [], theirs: [], team: null };
  const pt = U.pt; pt.mine = pt.mine.filter(i => d.owner[i] === S.userTeam && i >= d.pick); pt.theirs = pt.theirs.filter(i => d.owner[i] === pt.team && i >= d.pick);
  const others = S.teams.filter(t => !t.user && teamFuturePicks(t.id).length);
  if (pt.team === null || !others.some(t => t.id === pt.team)) pt.team = others[0] ? others[0].id : null;
  const e = pt.mine.length && pt.theirs.length ? evalPickTrade(pt.mine, pt.theirs) : null;
  const chips = (list, sel, fn) => list.map(i => `<button class="chip ${sel.includes(i) ? 'on' : ''}" onclick="${fn}(${i})">${pickLabel(i)} <small>(${Math.round(pickValue(i))})</small></button>`).join('') || '<p class="muted">No picks left.</p>';
  openModal(`<h2>Trade draft picks</h2><p class="fine">Each pick has a value (shown in brackets): earlier picks are worth much more. AI clubs want about 10% extra to agree.</p>
   <div class="grid2"><div><h3 class="plainh">Your picks</h3><div class="row">${chips(teamFuturePicks(S.userTeam), pt.mine, 'ptMine')}</div></div>
   <div><h3 class="plainh">Their picks <select onchange="U.pt.team=+this.value;U.pt.theirs=[];openPickTrade()">${others.map(t => `<option value="${t.id}" ${t.id === pt.team ? 'selected' : ''}>${t.name}</option>`).join('')}</select></h3><div class="row">${pt.team !== null ? chips(teamFuturePicks(pt.team), pt.theirs, 'ptTheirs') : ''}</div></div></div>
   <div class="dealbox">${e ? `<div class="kv"><span>You give</span><b>${Math.round(e.give)}</b></div><div class="kv"><span>They want</span><b>${Math.round(e.get)}</b></div><p class="${e.ok ? 'okc' : 'warn'}">${e.msg}</p>` : '<p class="muted">Select picks on both sides.</p>'}</div>
   <div class="row"><button class="btn lime" ${e && e.ok ? '' : 'disabled'} onclick="const r=doPickTrade(U.pt.mine,U.pt.theirs);U.pt=null;closeModal();res(r)">Make the trade</button><button class="btn" onclick="closeModal()">Close</button></div>`, 'wide');
}
function ptMine(i) { const a = U.pt.mine; U.pt.mine = a.includes(i) ? a.filter(x => x !== i) : a.concat([i]); openPickTrade(); }
function ptTheirs(i) { const a = U.pt.theirs; U.pt.theirs = a.includes(i) ? a.filter(x => x !== i) : a.concat([i]); openPickTrade(); }
async function exportSave() {
  const json = JSON.stringify(S); let code = '';
  try { const cs = new CompressionStream('gzip'); const buf = await new Response(new Blob([json]).stream().pipeThrough(cs)).arrayBuffer(); let bin = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 8192) bin += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); code = 'SLZ1:' + btoa(bin); }
  catch (e) { code = 'SLJ1:' + btoa(unescape(encodeURIComponent(json))); }
  document.getElementById('savecode').value = code; document.getElementById('savesize').textContent = `${Math.round(code.length / 1024)} KB code`;
}
async function importSave() {
  const code = document.getElementById('savecode').value.trim(); try {
    let json;
    if (code.startsWith('SLZ1:')) { const bin = atob(code.slice(5)); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); json = await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); }
    else if (code.startsWith('SLJ1:')) json = decodeURIComponent(escape(atob(code.slice(5))));
    else throw 0;
    const st = JSON.parse(json); if (!st.players || !st.teams) throw 0; S = st; P = S.players; save(); closeModal(); U.tab = isDrafting() ? 'draft' : 'home'; render(); toast('Save loaded!');
  } catch (e) { toast('That save code is not valid.', false); }
}
function copySave() { const t = document.getElementById('savecode'); t.select(); try { navigator.clipboard.writeText(t.value).then(() => toast('Copied! Paste it somewhere safe.')).catch(() => toast('Select the text and copy it manually.', false)); } catch (e) { toast('Select the text and copy it manually.', false); } }
function settingsUI() {
  openModal(`<h2>Settings & save</h2>
   <p class="fine">Your career saves automatically in this browser. To back it up or move it to another device, export a save code and keep it somewhere safe (notes app, email to yourself). Paste a code below and press Import to load it.</p>
   <textarea id="savecode" class="savecode" placeholder="Your save code appears here, or paste one to import…"></textarea><small id="savesize" class="muted"></small>
   <div class="row"><button class="btn lime" onclick="exportSave()">Export save code</button><button class="btn" onclick="copySave()">Copy</button><button class="btn" onclick="importSave()">Import</button></div>
   <hr class="sep"><div class="row"><label class="tog"><input type="checkbox" ${S.opts.autoSubs ? 'checked' : ''} onchange="S.opts.autoSubs=this.checked;save()"> Assistant makes subs in live matches</label></div>
   <hr class="sep"><button class="btn red" onclick="newGameUI()">Start a new game</button>`, 'wide');
}
function openFill() {
  const ids = suggestFill(); U.fillSel = new Set(ids);
  const u = me(); const total = ids.reduce((s, id) => s + r1(P[id].val * 0.15), 0);
  openModal(`<h2>Fill squad</h2><p class="fine">The best free agents you can afford for the positions you're short in (up to 18 players). Signing-on fees come out of your €${u.budget.toFixed(1)}m budget.</p>
   ${ids.length ? `<table class="tbl">${ids.map(id => { const p = P[id]; return `<tr class="click" onclick="this.classList.toggle('off');U.fillSel.has(${id})?U.fillSel.delete(${id}):U.fillSel.add(${id})"><td></td><td>${posChip(p.pos)}${esc(DB[id].name)} ${yrTag(p.y)}</td><td>${p.age}y</td><td>${ob(p.ovr)}</td><td>${fm(r1(p.val * 0.15))}</td></tr>`; }).join('')}</table>
   <p class="fine">Total: ${fm(total)} · tap a row to leave it out.</p><div class="row"><button class="btn lime" onclick="closeModal();res(signMany([...U.fillSel]))">Sign selected</button><button class="btn" onclick="closeModal()">Cancel</button></div>` : '<p class="muted">No suitable free agents you can afford, or your squad is already full.</p>'}`, 'wide');
}
function editRating(id, mode) {
  const p = P[id]; const v = clamp(+document.getElementById('edov').value || p.ovr, 40, 99); S.edits = S.edits || {};
  const ed = S.edits[id] || (S.edits[id] = {});
  if (mode === 'career') { const base = rateAt(DB[id], p.y) - (ed.shift || 0); ed.shift = v - base; delete ed[p.y]; } else ed[p.y] = v;
  Object.assign(p, cardFor(DB[id], p.y)); p.val = valueOf(p); save(); openPlayer(id); render(); toast(`${DB[id].short} '${String(p.y).slice(2)} is now ${p.ovr}.`);
}

// ---------- home ----------
function nextFixture() {
  if (S.phase === 'preseason' || S.phase === 'season') { const f = S.fixtures[S.gw]; return f ? f.find(m => m.h === S.userTeam || m.a === S.userTeam) : null; }
  if (S.phase === 'playoffs') { const po = S.playoffs; const tie = po.rounds[po.round].find(t => t.hi === S.userTeam || t.lo === S.userTeam); if (!tie) return null; const single = po.round === 2 && !S.opts.finalTwoLegs; return single ? { h: tie.hi, a: tie.lo, n: 1 } : po.leg === 0 ? { h: tie.lo, a: tie.hi } : { h: tie.hi, a: tie.lo }; }
  return null;
}
function lastUserMatch() { for (let g = S.gw - 1; g >= 0; g--) { const i = (S.results[g] || []).findIndex(m => m.h === S.userTeam || m.a === S.userTeam); if (i >= 0) return [g, i]; } return null; }
function vHome() {
  const u = me(); const nf = nextFixture(); const co = S.coaches[u.coach];
  const inj = u.squad.map(id => P[id]).filter(p => p.inj > 0 || p.sus > 0);
  const lm = lastUserMatch();
  let hero = '';
  if (S.playoffs) hero = `<div class="card hero-po">${bracketHTML()}${nf ? `<div class="row center">${actionBtns()}</div>` : S.phase === 'playoffs' ? `<p class="muted center">You're out. Watch how the rest of the playoffs play out.</p><div class="row center">${actionBtns()}</div>` : `<div class="row center">${actionBtns()}</div>`}</div>`;
  else if (nf) { const opp = S.teams[nf.h === u.id ? nf.a : nf.h]; hero = `<div class="card matchday" style="--h1:${S.teams[nf.h].c1};--a1:${S.teams[nf.a].c1}">
      <small class="md-k">${S.phase === 'preseason' ? 'Opening day' : `Gameweek ${S.gw + 1}`}${nf.x ? ' · Crossover match' : ''}</small>${derbyName(nf.h, nf.a) ? `<div class="derby">DERBY DAY · ${derbyName(nf.h, nf.a)}</div>` : ''}
      <div class="md">${crest(S.teams[nf.h], 'xl')}<div class="md-mid"><b>${S.teams[nf.h].name}</b><span>VS</span><b>${S.teams[nf.a].name}</b></div>${crest(S.teams[nf.a], 'xl')}</div>
      <div class="md-info">${opp.name}: ${ord(confPos(opp.id))} in the ${CONF_NAME[opp.conf].split(' ')[0]} · ${S.coaches[opp.coach] ? S.coaches[opp.coach].name : 'caretaker'} · ${opp.tactics.form} · form ${S.table[opp.id].form.map(f => `<i class="fm ${f}">${f}</i>`).join('') || '–'}</div>
      <div class="row center">${actionBtns()}<button class="btn ghost" onclick="U.tab='tactics';render()">Tactics</button></div></div>`; }
  const feed = S.feed.filter(f => f.mine).slice(0, 5);
  return `<div class="home">
    <div class="hcol">${scenCard()}${hero}
      ${S.phase === 'preseason' && u.squad.length < 18 ? `<div class="card tip"><div class="hrow"><span>You only have ${u.squad.length} players. Injuries will hurt.</span><button class="btn lime" onclick="openFill()">Fill squad</button></div></div>` : ''}
      ${lm ? (() => { const m = S.results[lm[0]][lm[1]]; return `<div class="card"><h3>Last result</h3><div class="score click" onclick="openReport(${lm[0]},${lm[1]})">${crest(S.teams[m.h])}<b>${m.hg} – ${m.ag}</b>${crest(S.teams[m.a])}</div><div class="scorers">${goalsLine(m)}</div><small class="muted center block">Tap for the match report</small></div>`; })() : ''}
      <div class="card"><h3>Inbox</h3><div class="inbox">${S.inbox.slice(0, 7).map(inboxItem).join('') || '<p class="muted">Nothing yet.</p>'}</div></div>
      <div class="card"><div class="hrow"><h3>What the fans are saying</h3><a class="link" onclick="U.tab='fans';render()">All posts →</a></div>${feed.map(postHTML).join('') || '<p class="muted">The fans are quiet… for now.</p>'}</div>
    </div>
    <div class="hcol side2">
      <div class="card clubcard"><h3>${u.name}</h3>
        <div class="kv"><span>Conference</span><b>${S.table ? ord(confPos(u.id)) + ' · ' + CONF_NAME[u.conf].split(' ')[0] : '–'}</b></div>
        <div class="kv"><span>Board expects</span><b>${ord(expectedRank(u))}</b></div>
        <div class="kv"><span>Board confidence</span>${bar(u.board)}</div>
        <div class="kv"><span>Team morale</span>${bar(u.morale)}</div>
        <div class="kv"><span>Coach</span><b>${co ? `${co.name} <span class="ovr t-${tier(co.rating)}">${co.rating}</span>` : '<span class="warn">Caretaker</span>'}</b></div>
        <div class="kv"><span>Squad</span><b>${u.squad.length}/${MAX_SQUAD}</b></div>
        ${inj.length ? `<div class="kv"><span>Unavailable</span><b>${inj.map(p => `${pn(p, 'short')} ${p.inj ? '<i class="inj"></i>' : '<i class="rcard"></i>'}`).join(', ')}</b></div>` : ''}
      </div>
      ${S.table ? `<div class="card"><h3>${CONF_NAME[u.conf]}</h3>${confTable(u.conf, true)}</div>` : ''}
      ${S.gw > 0 ? `<div class="card"><h3>Top scorers</h3>${S.players.filter(p => p.team >= 0 && p.st.g > 0).sort((a, b) => b.st.g - a.st.g || b.st.a - a.st.a).slice(0, 5).map((p, i) => `<div class="lrow"><span class="rk">${i + 1}</span>${crest(S.teams[p.team], 'sm')} ${pn(p, 'short')}<b>${p.st.g}</b></div>`).join('')}</div>` : ''}
      ${S.totw.length ? `<div class="card"><h3>Team of the Week · GW${S.totw[S.totw.length - 1].gw}</h3>${S.totw[S.totw.length - 1].xi.map(x => `<div class="lrow">${posChip(x.slot)}${pn(P[x.id], 'short')} ${crest(S.teams[x.team], 'sm')}<b class="rt ${rtc(x.rt)}">${x.rt.toFixed(1)}</b></div>`).join('')}</div>` : ''}
      <div class="card"><h3>Around the league</h3><div class="feedmini">${S.news.slice(0, 10).map(n => `<div>${noEmo(n.s)}</div>`).join('')}</div></div>
    </div></div>`;
}
function inboxItem(n) {
  let act = '';
  if (n.kind === 'req' && P[n.pl] && P[n.pl].team === S.userTeam) act = `<div class="row"><button class="btn sm" onclick="res(handleRequest(${n.pl},'promise'))">Promise game time</button><button class="btn sm" onclick="res(handleRequest(${n.pl},'list'))">Transfer-list him</button><button class="btn sm red" onclick="res(handleRequest(${n.pl},'refuse'))">Refuse</button></div>`;
  return `<div class="msg ${n.kind ? 'act' : ''}">${noEmo(n.s)}${act}</div>`;
}
function goalsLine(m) { const g = s => m.ev.filter(e => e.t === 'goal' && e.side === s).map(e => `${esc(DB[e.p].short)} ${e.m}'${e.pen ? ' (p)' : ''}`).join(', '); return `<span>${g(0) || '–'}</span><span>${g(1) || '–'}</span>`; }
const bar = v => `<span class="bar"><i style="width:${v}%;background:${v > 65 ? 'var(--ok)' : v > 35 ? 'var(--gold)' : 'var(--bad)'}"></i></span>`;
const rtc = r => r >= 8.5 ? 'r5' : r >= 7.5 ? 'r4' : r >= 6.8 ? 'r3' : r >= 6 ? 'r2' : 'r1';
function confTable(conf, mini) {
  const st = standings(conf);
  return `<table class="tbl ${mini ? 'mini' : ''}"><thead><tr><th>#</th><th>Club</th><th>P</th>${mini ? '' : '<th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th>'}<th>GD</th><th>Pts</th>${mini ? '' : '<th class="hide-s">Form</th>'}</tr></thead><tbody>${st.map((r, i) => `<tr class="${r.id === S.userTeam ? 'mine' : ''} ${i < 4 ? 'po' : ''}"><td><span class="rk">${i + 1}</span></td><td class="click" onclick="U.clubView=${r.id};U.tab='clubs';render()">${crest(S.teams[r.id], 'sm')} ${S.teams[r.id].name}</td><td>${r.p}</td>${mini ? '' : `<td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td>`}<td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td>${mini ? '' : `<td class="hide-s">${r.form.map(f => `<i class="fm ${f}">${f}</i>`).join('')}</td>`}</tr>`).join('')}</tbody></table>`;
}
function postHTML(p) { const t = p.team >= 0 ? S.teams[p.team] : null; return `<div class="post"><div class="av" style="background:${t ? t.c1 : '#3b82f6'};color:${t ? t.c2 : '#fff'}">${t ? t.short.slice(0, 2) : '⚽'}</div><div class="pb"><div class="ph"><b>${esc(p.h)}</b><small>S${p.season} · GW${p.gw}</small></div><div class="pt">${esc(p.txt.replace(/ '\d\d\b/g, ''))}</div><div class="pf"><span>💬 ${Math.round(p.likes / 40)}</span><span>🔁 ${p.rt}</span><span>❤️ ${p.likes.toLocaleString()}</span></div></div></div>`; }

// ---------- squad ----------
const POS_ORDER = 'GK CB LB RB DM CM AM LW RW ST';
function vSquad() {
  const u = me(); const sq = u.squad.map(id => P[id]).sort((a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr);
  const xi = new Set(u.lineup);
  return `<div class="card"><div class="hrow"><h3>${u.name} · ${sq.length} players</h3><small class="muted">Tap a player for his profile, contract talk and transfers</small></div>
  <div class="tscroll"><table class="tbl big"><thead><tr><th>Pos</th><th>Player</th><th>Age</th><th>OVR</th><th title="Football IQ">IQ</th><th title="Work rate">Work</th><th>Cond.</th><th>Fit</th><th>Apps</th><th>Goals</th><th>Assists</th><th>Avg</th><th class="hide-s">Value</th></tr></thead><tbody>
  ${sq.map(p => { const s = p.st; return `<tr class="${xi.has(p.id) ? 'xi' : ''}"><td>${posChip(p.pos)}</td><td>${pn(p)} ${u.captain === p.id ? '<span class="cap">C</span>' : ''}${u.pk === p.id ? '<span class="cap pk">P</span>' : ''}${p.req ? '<span class="pill badb">wants out</span>' : ''}${p.listed ? '<span class="pill">listed</span>' : ''}${p.inj ? ` <i class="inj"></i>${p.inj}w` : ''}${p.sus ? ' <i class="rcard"></i>' : ''}${DB[p.id].clubs.some(c => c[0] === u.name) ? ' <span class="leg" title="Played here in real life">★</span>' : ''}</td><td>${p.age}</td><td>${ob(p.ovr)}</td><td>${p.iq}</td><td>${p.wr}</td><td title="Morale ${Math.round(p.mor)}">${condA(p)} <small class="muted">${Math.round(p.mor)}</small></td><td>${fitB(p.fit)}</td><td>${s.app}</td><td><b>${s.g}</b></td><td><b>${s.a}</b></td><td>${s.app ? (s.rt / s.app).toFixed(2) : '–'}</td><td class="hide-s">${fm(p.val)}</td></tr>`; }).join('')}
  </tbody></table></div><p class="fine">The blue edge marks your starting XI. Arrows show condition (fitness and morale): ↑ excellent, ↗ good, → normal, ↘ poor, ↓ terrible. ★ = played for this club in real life. Players lose morale when they don't start, and very unhappy players hand in transfer requests.</p></div>`;
}
const fitB = f => `<span class="fit" style="color:${f > 85 ? 'var(--ok)' : f > 70 ? 'var(--gold)' : 'var(--bad)'}">${Math.round(f)}%</span>`;

// ---------- tactics ----------
function teamChem(t) { const slots = FORMS[t.tactics.form]; const ids = t.lineup.filter(x => x !== null); const sb = {}; t.lineup.forEach((id, i) => { if (id !== null) sb[id] = slots[i][0]; }); return chemistry(ids, sb); }
function vTactics() {
  const u = me(); validateLineup(u); const slots = FORMS[u.tactics.form]; const cf = coachFit(u); const co = S.coaches[u.coach];
  const sel = U.sel; const xi = new Set(u.lineup); const ch = teamChem(u);
  const list = u.squad.map(id => P[id]).sort((a, b) => sel !== null ? effRating(b, slots[sel][0]) - effRating(a, slots[sel][0]) : POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr);
  const opt = k => `<label>${labelOf(k)}<select onchange="setTac('${k}',this.value)">${TACTIC_OPTS[k].map(o => `<option ${u.tactics[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  const lazyF = u.lineup.filter((id, i) => id !== null && P[id].wr === 'Low' && (SLOT_GROUP(slots[i][0]) === 'ATT' || slots[i][0] === 'AM')).map(id => DB[id].short);
  return `<div class="cols tac">
   <div class="card pitchcard">
     <div class="hrow"><h3>Starting XI</h3><div class="row"><select onchange="setTac('form',this.value)">${Object.keys(FORMS).map(f => `<option ${u.tactics.form === f ? 'selected' : ''}>${f}</option>`).join('')}</select><button class="btn sm" onclick="autoLineup(me());U.sel=null;save();render()">Auto-pick XI</button></div></div>
     <div class="pitch">${slots.map((s, i) => { const id = u.lineup[i]; const p = id !== null ? P[id] : null; const e = p ? Math.round(effRating(p, s[0])) : 0; return `<div class="slot g-${SLOT_GROUP(s[0])} ${sel === i ? 'sel' : ''} ${p && posPen(p.pos, s[0]) > 3 ? 'oop' : ''}" style="left:${s[1]}%;bottom:${pby(s[2])}%" onclick="selSlot(${i})"><span class="ovr t-${tier(e)}">${p ? e : '?'}</span><b>${p ? condA(p) + esc(DB[p.id].short) : 'empty'}</b><small>${s[0]}${p ? ' · ' + yrTag(p.y) : ''}${u.captain === id ? ' · ©' : ''}</small></div>`; }).join('')}</div>
     <p class="fine">${sel === null ? 'Tap a position, then tap a player in the list to put him there. A red outline means he is out of position.' : `Choosing a player for <b>${slots[sel][0]}</b>. The list is sorted by how well each player fits the role.`}</p>
   </div>
   <div class="side wide">
     <div class="card chem"><div class="hrow"><h3>Chemistry</h3><span class="chemscore ${ch.score >= 70 ? 'good' : ch.score >= 50 ? 'mid' : 'bad'}">${ch.score}</span></div>
       <div class="kv"><span>Avg football IQ</span><b>${ch.iq.toFixed(0)}</b></div>
       ${ch.links.length ? `<div class="links">${ch.links.slice(0, 6).map(([a, b, c]) => `<span class="pill okb">${esc(DB[a].short)} + ${esc(DB[b].short)} <small>(${esc(c)})</small></span>`).join('')}</div>` : '<p class="fine">No real-life teammates in your XI. Players who played together at a real club get a chemistry boost.</p>'}
       ${lazyF.length >= 2 ? `<p class="warn">${lazyF.join(', ')} don't press. You'll score more, but you'll concede a lot more too.</p>` : lazyF.length === 1 ? `<p class="fine">${lazyF[0]} doesn't track back. One is fine; two or more makes games wide open.</p>` : ''}
       ${ch.vol ? `<p class="warn">${ch.vol} hothead${ch.vol > 1 ? 's' : ''} in the XI: low IQ and volatile, which hurts chemistry and earns more cards.</p>` : ''}
     </div>
     <div class="card"><h3>${sel === null ? 'Squad' : 'Pick for ' + slots[sel][0]}</h3><div class="tscroll short"><table class="tbl"><tbody>
       ${list.map(p => { const e = sel !== null ? Math.round(effRating(p, slots[sel][0])) : p.ovr; return `<tr class="${xi.has(p.id) ? 'xi' : ''} ${available(p) ? '' : 'dim'}" ${sel !== null && available(p) ? `onclick="assign(${p.id})" style="cursor:pointer"` : ''}><td>${posChip(p.pos)}</td><td>${esc(DB[p.id].short)} ${yrTag(p.y)} ${p.inj ? '<i class="inj"></i>' : ''}${p.sus ? '<i class="rcard"></i>' : ''}</td><td>${condA(p)}</td><td>${fitB(p.fit)}</td><td>${ob(e)}</td></tr>`; }).join('')}
     </tbody></table></div></div>
     <div class="card"><h3>Player instructions</h3>${slots.map((s, i) => { const id = u.lineup[i]; if (id === null) return ''; const g = SLOT_GROUP(s[0]); const opts = Object.entries(INSTR).filter(([k, d]) => d.g.includes(g) && (!d.wideOnly || ['LB', 'RB', 'LWB', 'RWB'].includes(s[0]))); const cur = (u.instr || {})[id]; const d = cur && INSTR[cur]; return `<div class="instr">${posChip(s[0])}<span class="iname">${esc(DB[id].short)}</span><select onchange="setInstr(${id},this.value)"><option value="">Default</option>${opts.map(([k, o]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${o.lbl}</option>`).join('')}</select>${d && d.g.includes(g) ? `<div class="idesc"><span class="okc">▲ ${d.up}</span><span class="warn">▼ ${d.down}</span></div>` : ''}</div>`; }).join('')}</div>
     <div class="card"><h3>Instructions</h3><div class="tacgrid">${['ment', 'press', 'tempo', 'width', 'line', 'pass', 'train', 'talk'].map(opt).join('')}
       <label>Captain<select onchange="me().captain=+this.value;save();render()">${u.squad.map(id => `<option value="${id}" ${u.captain === id ? 'selected' : ''}>${esc(DB[id].name)}</option>`).join('')}</select></label>
       <label>Penalties<select onchange="me().pk=+this.value;save();render()">${u.squad.filter(id => P[id].pos !== 'GK').map(id => `<option value="${id}" ${u.pk === id ? 'selected' : ''}>${esc(DB[id].name)}</option>`).join('')}</select></label>
       <label>Free kicks<select onchange="me().fk=+this.value;save();render()">${u.squad.filter(id => P[id].pos !== 'GK').map(id => `<option value="${id}" ${u.fk === id ? 'selected' : ''}>${esc(DB[id].name)}${DB[id].tags.includes('S') ? ' ★' : ''}</option>`).join('')}</select></label>
       <label>Corners<select onchange="me().ck=+this.value;save();render()">${u.squad.filter(id => P[id].pos !== 'GK').map(id => `<option value="${id}" ${u.ck === id ? 'selected' : ''}>${esc(DB[id].name)}${DB[id].tags.includes('S') ? ' ★' : ''}</option>`).join('')}</select></label></div>
       <div class="coachfit"><b>${co ? co.name : 'Caretaker'}</b> ${co ? `<span class="ovr t-${tier(co.rating)}">${co.rating}</span> · ${co.style} · loves a ${co.form}` : ''}<div>Familiarity ${bar(Math.round(cf.fit * 100))} <b class="${cf.bonus >= 0 ? 'okc' : 'warn'}">${cf.bonus >= 0 ? '+' : ''}${cf.bonus.toFixed(1)}</b> to team rating</div>${cf.notes.length ? `<small class="muted">${cf.notes.join(' · ')}</small>` : '<small class="okc">Your coach loves this setup.</small>'}</div>
       <details><summary>How it all works</summary><ul class="fine">
       <li><b>Ratings, coach and chemistry</b> drive results. A 99 coach in his favourite system is worth several points of team rating.</li><li><b>High press</b> creates chances, but tires players and barely works with forwards who don't press.</li><li><b>High line</b> is risky against fast forwards. A <b>deep</b> line concedes less but creates less.</li><li><b>Wide</b> suits pacey or crossing wide players. <b>Direct</b> suits fast or aerial strikers.</li><li><b>Training</b>: Fitness means faster recovery and fewer injuries.</li><li><b>Team talk</b>: Motivate helps underdogs. Demand more helps favourites.</li></ul></details>
     </div>
   </div></div>`;
}
function selSlot(i) { U.sel = U.sel === i ? null : i; render(); }
function assign(id) { const u = me(); const i = U.sel; if (i === null) return; const cur = u.lineup.indexOf(id); if (cur >= 0) u.lineup[cur] = u.lineup[i]; u.lineup[i] = id; U.sel = null; validateLineup(u); save(); render(); }
function setInstr(id, k) { const u = me(); u.instr = u.instr || {}; if (k) u.instr[id] = k; else delete u.instr[id]; save(); render(); }
function setTac(k, v) { const u = me(); u.tactics[k] = v; if (k === 'form') { autoLineup(u); U.sel = null; } save(); render(); }

// ---------- live match centre ----------
function playLive() {
  if (U.live) return;
  const R = prepareRound(); if (!R) return;
  const Ms = []; let L = null;
  R.matches.forEach((m, i) => {
    if (i === R.userIdx) { const side = m.h === S.userTeam ? 0 : 1; L = startMatch(S.teams[m.h], S.teams[m.a], Object.assign({}, m.opts, { live: true, userSide: side })); Ms.push(null); }
    else Ms.push(simFull(S.teams[m.h], S.teams[m.a], m.opts));
  });
  if (!L) { commitRound(R, Ms); save(); render(); return; }
  U.live = { L, R, Ms, seen: 0, playing: true, panel: 'xi', subOut: null, comm: [] };
  renderMC(true); runClock();
}
function runClock() {
  clearInterval(U.liveT); const ms = { 1: 380, 2: 160, 4: 55 }[U.speed];
  U.liveT = setInterval(() => { const lv = U.live; if (!lv || !lv.playing) return; if (lv.L.done) { clearInterval(U.liveT); renderMC(); return; } stepMinute(lv.L); tickComm(); renderMC(); }, ms);
}
function liveSkip() { const lv = U.live; while (!lv.L.done) { stepMinute(lv.L); tickComm(true); } renderMC(true); }
function tickComm(quiet) {
  const lv = U.live; const L = lv.L; const ut = S.userTeam; const us = L.opts.userSide;
  while (lv.seen < L.ev.length) {
    const e = L.ev[lv.seen++]; const tn = s => S.teams[s === 0 ? L.h : L.a];
    const nm = id => esc(DB[id].short); let txt = '', cls = '';
    if (e.t === 'ko') txt = `Kick-off! ${tn(0).name} vs ${tn(1).name}.`;
    else if (e.t === 'goal') { cls = e.side === us ? 'goal us' : 'goal them'; txt = `⚽ GOAL! ${nm(e.p)} scores for ${tn(e.side).name}!${e.pen ? ' From the penalty spot.' : ''}${e.as ? ` Assisted by ${nm(e.as)}.` : ''} <b>${L.hg}-${L.ag}</b>`; if (!quiet) { const mine = e.side === us; const pst = post(ut, mine ? 'goalLive' : 'concedeLive', { p: DB[e.p].short, gk: (() => { const g = onPitch(L, us).find(x => x.slot === 'GK'); return g ? DB[g.id].short : 'the keeper'; })() }, { mine: true }); lv.fanPop = pst; } }
    else if (e.t === 'save') txt = `${e.gk !== null && e.gk !== undefined ? nm(e.gk) : 'The keeper'} denies ${nm(e.p)}${e.pen ? ' from the spot!' : ' with a big save!'}`;
    else if (e.t === 'miss') txt = e.xg > 0.25 ? `${nm(e.p)} misses a huge chance!` : pickOne([`${nm(e.p)} shoots wide.`, `${nm(e.p)} fires over the bar.`, `${nm(e.p)} drags it wide.`]);
    else if (e.t === 'yc') txt = `<i class="ycard"></i> ${nm(e.p)} is booked.`;
    else if (e.t === 'rc') { cls = 'red'; txt = `<i class="rcard"></i> ${nm(e.p)} is SENT OFF!`; }
    else if (e.t === 'sub') txt = `${tn(e.side).short}: ${nm(e.p)} replaces ${nm(e.out)}.`;
    else if (e.t === 'shape') txt = `${tn(e.side).short} switch to a ${e.v}.`;
    else if (e.t === 'ht') { cls = 'whistle'; txt = `Half-time. ${L.hg}-${L.ag}.`; }
    else if (e.t === 'et') { cls = 'whistle'; txt = 'Level on aggregate. We are going to extra time!'; }
    else if (e.t === 'pens') { cls = 'whistle'; txt = `Penalties! ${tn(0).short} ${e.pens[0]}–${e.pens[1]} ${tn(1).short}`; }
    else if (e.t === 'ft') { cls = 'whistle'; txt = `Full-time! ${tn(0).name} ${L.hg}-${L.ag} ${tn(1).name}.`; }
    if (txt) lv.comm.unshift({ m: e.m, txt, cls });
    if (['goal', 'yc', 'rc', 'sub', 'shape'].includes(e.t)) lv.panelDirty = true;
  }
  if (!quiet && L.min % 12 === 0 && L.min > 0 && rnd() < 0.7 && !L.done) { const us2 = L.opts.userSide; const ids = onPitch(L, rnd() < 0.7 ? us2 : 1 - us2).map(x => x.id); const tm = S.teams[us2 === 0 ? L.h : L.a], op = S.teams[us2 === 0 ? L.a : L.h]; const co = S.coaches[tm.coach]; lv.fanPop = trollPost(tm.id, pickOne(ids), tm.name, op.name, co ? DB.length && co.name.split(' ').slice(-1)[0] : 'the caretaker', true); }
  if (!quiet && L.min % 7 === 0 && rnd() < 0.5 && !L.done) { const s = rnd() * 100 < L.possT ? 0 : 1; lv.comm.unshift({ m: L.min, txt: pickOne([`${S.teams[s === 0 ? L.h : L.a].short} keeping the ball well.`, `Patient build-up from ${S.teams[s === 0 ? L.h : L.a].short}.`, `${S.teams[s === 0 ? L.h : L.a].short} pushing forward.`, 'A scrappy spell in midfield.', 'The crowd is getting restless.']), cls: 'flavor' }); }
}
function renderMC(full) {
  const lv = U.live; if (!lv) return; const L = lv.L; const H = S.teams[L.h], A = S.teams[L.a]; const us = L.opts.userSide;
  const poss = L.min ? Math.round(L.possSum / L.min) : 50;
  if (full || !$('#mc')) {
    $('#modal').innerHTML = `<div class="mbg"></div><div id="mc" class="mc">
      ${L.derby ? `<div class="mcderby">${L.derby}</div>` : ''}<div class="mc-board" style="--h1:${H.c1};--a1:${A.c1}"><div class="mc-team">${crest(H, 'lg')}<b>${H.name}</b></div><div class="mc-score"><div id="mcSc"></div><div id="mcMin"></div></div><div class="mc-team r"><b>${A.name}</b>${crest(A, 'lg')}</div></div>
      <div id="mcBar" class="mc-bar"></div>
      <div class="mc-ctrl"><div class="row"><button class="btn" id="mcPlay" onclick="U.live.playing=!U.live.playing;renderMC()"></button>${[1, 2, 4].map(s => `<button class="btn sm ${U.speed === s ? 'on' : ''}" onclick="U.speed=${s};runClock();renderMC(true)">${s}x</button>`).join('')}<button class="btn sm ghost" onclick="liveSkip()">Skip to FT </button></div><label class="tog"><input type="checkbox" ${S.opts.autoSubs ? 'checked' : ''} onchange="S.opts.autoSubs=this.checked"> Assistant makes subs</label></div>
      <div class="mc-body"><div class="mc-comm card" id="mcComm"></div><div class="mc-side"><div class="card" id="mcViz"></div><div class="card" id="mcStats"></div><div class="card" id="mcPanel"></div><div class="card" id="mcOther"></div></div></div>
      <div id="mcFoot" class="mc-foot"></div></div>`;
    $('#modal').style.display = 'block';
    renderPanel();
  }
  $('#mcSc').innerHTML = `${L.hg}<span>-</span>${L.ag}`;
  $('#mcMin').innerHTML = L.done ? (L.pens ? `PENS ${L.pens[0]}-${L.pens[1]}` : L.aet ? 'AET' : 'FT') : `${L.min}'`;
  $('#mcBar').innerHTML = `<i style="width:${Math.min(100, L.min / L.end * 100)}%"></i>`;
  $('#mcPlay').textContent = L.done ? '✔ Done' : lv.playing ? 'Pause' : '▶ Play';
  $('#mcComm').innerHTML = (lv.fanPop ? `<div class="fanpop">${postHTML(lv.fanPop)}</div>` : '') + lv.comm.slice(0, 60).map(c => `<div class="cm ${c.cls}"><span>${c.m}'</span><p>${c.txt}</p></div>`).join('');
  $('#mcViz').innerHTML = vizHTML(L, H, A);
  $('#mcStats').innerHTML = `<h3>Match stats</h3>${[['Possession', poss + '%', (100 - poss) + '%'], ['Shots', L.hsh, L.ash], ['On target', L.hsot, L.asot]].map(([k, a, b]) => `<div class="msr"><b>${a}</b><span>${k}</span><b>${b}</b></div>`).join('')}<div class="msr small"><b>${L.hxg.toFixed(1)}</b><span>xG</span><b>${L.axg.toFixed(1)}</b></div>`;
  const others = lv.Ms.map((M, i) => M ? `<div class="oth">${crest(S.teams[M.h], 'sm')} <b>${M.ev.filter(e => e.t === 'goal' && e.side === 0 && e.m <= L.min).length} - ${M.ev.filter(e => e.t === 'goal' && e.side === 1 && e.m <= L.min).length}</b> ${crest(S.teams[M.a], 'sm')}</div>` : '').join('');
  $('#mcOther').innerHTML = `<h3>Around the grounds</h3><div class="othgrid">${others}</div>`;
  $('#mcFoot').innerHTML = L.done ? `<button class="btn lime big" onclick="finishLive()">Continue ▶</button>` : '';
  if (full === undefined && lv.panelDirty) { renderPanel(); lv.panelDirty = false; }
  if (L.min % 5 === 0) renderPanelFit();
}
function vizHTML(L, H, A) {
  const mom = L.mom || []; const w = 360, h = 90, bw = w / Math.max(90, L.end);
  const bars = mom.map((v, i) => { const hh = Math.abs(v) / 3 * (h / 2 - 4); return `<rect x="${i * bw}" y="${v >= 0 ? h / 2 - hh : h / 2}" width="${Math.max(1, bw - 0.6)}" height="${hh}" fill="${v >= 0 ? H.c1 : A.c1}" opacity=".9"/>`; }).join('');
  const goals = L.ev.filter(e => e.t === 'goal').map(e => `<text x="${(e.m - 1) * bw}" y="${e.side === 0 ? 10 : h - 2}" font-size="10">⚽</text>`).join('');
  const bx = L.ball === undefined ? 50 : L.ball; const by = 50 + Math.sin(L.min * 1.7) * 28;
  return `<h3>Momentum</h3><svg class="momsvg" viewBox="0 0 ${w} ${h}"><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="#ffffff33"/><line x1="${45 * bw}" y1="0" x2="${45 * bw}" y2="${h}" stroke="#ffffff22" stroke-dasharray="3"/>${bars}${goals}</svg>
   <div class="minipitch"><div class="mp-half"></div><div class="mp-circle"></div><div class="mp-box l"></div><div class="mp-box r"></div><div class="mp-ball" style="left:${bx}%;top:${by}%"></div><span class="mp-lbl l">${H.short} ⇢</span><span class="mp-lbl r">⇠ ${A.short}</span></div>`;
}
function renderPanel() {
  const lv = U.live; const L = lv.L; const us = L.opts.userSide; const sd = L.sides[us]; const t = sd.t;
  const on = onPitch(L, us).sort((a, b) => 'GK LB LWB CB RB RWB DM CM LM RM AM LW RW ST'.split(' ').indexOf(a.slot) - 'GK LB LWB CB RB RWB DM CM LM RM AM LW RW ST'.split(' ').indexOf(b.slot));
  let html = `<div class="tabs2"><button class="${lv.panel === 'xi' ? 'on' : ''}" onclick="U.live.panel='xi';renderPanel()">Your XI · ${sd.subs} subs left</button><button class="${lv.panel === 'tac' ? 'on' : ''}" onclick="U.live.panel='tac';renderPanel()">Tactics</button></div>`;
  if (lv.panel === 'xi') {
    if (lv.subOut !== null) {
      html += `<p class="fine">Bringing on a replacement for <b>${esc(DB[lv.subOut].short)}</b>. Pick from the bench: <a class="link" onclick="U.live.subOut=null;renderPanel()">cancel</a></p>` + sd.bench.map(id => `<div class="xir click" onclick="liveDoSub(${id})">${posChip(P[id].pos)}<span>${esc(DB[id].short)} ${yrTag(P[id].y)}</span>${ob(Math.round(effRating(P[id], L.ps[lv.subOut].slot, L.fit[id])))}</div>`).join('');
    } else html += on.map(x => `<div class="xir">${posChip(x.slot)}<span>${esc(DB[x.id].short)} ${'⚽'.repeat(L.ps[x.id].g)}${'<i class="asst">A</i>'.repeat(L.ps[x.id].a)}${L.ps[x.id].yc ? '<i class="ycard"></i>' : ''}</span><span class="fbar" data-id="${x.id}"><i style="width:${L.fit[x.id]}%"></i></span>${!L.done && sd.subs > 0 && sd.bench.length ? `<button class="btn sm" onclick="U.live.subOut=${x.id};U.live.playing=false;renderPanel();renderMC()">Sub</button>` : ''}</div>`).join('');
  } else {
    html += `<div class="tacgrid">${['form', 'ment', 'press', 'line', 'tempo', 'width'].map(k => `<label>${labelOf(k)}<select onchange="liveTac('${k}',this.value)" ${L.done ? 'disabled' : ''}>${(k === 'form' ? Object.keys(FORMS) : TACTIC_OPTS[k]).map(o => `<option ${t.tactics[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`).join('')}</div><p class="fine">Changes take effect straight away. Chasing a goal? Try All-out attack with a high press.</p>`;
  }
  $('#mcPanel').innerHTML = html;
}
function renderPanelFit() { document.querySelectorAll('.fbar').forEach(el => { const id = +el.dataset.id; const f = U.live.L.fit[id]; el.firstChild.style.width = f + '%'; el.firstChild.style.background = f > 70 ? 'var(--ok)' : f > 50 ? 'var(--gold)' : 'var(--bad)'; }); }
function liveDoSub(inId) { const lv = U.live; const L = lv.L; L.sides[L.opts.userSide].manual = true; doSub(L, L.opts.userSide, lv.subOut, inId); lv.subOut = null; tickComm(true); lv.playing = true; renderPanel(); renderMC(); }
function liveTac(k, v) { const L = U.live.L; liveSetTactic(L, L.opts.userSide, k, v); tickComm(true); renderPanel(); renderMC(); }
function finishLive() {
  const lv = U.live; clearInterval(U.liveT);
  const M = finishMatch(lv.L); lv.Ms[lv.R.userIdx] = M;
  const R = lv.R; const wasPO = R.kind === 'po'; const gwBefore = S.gw;
  const rIdx = wasPO ? S.playoffs.round : -1; const ti = wasPO ? S.playoffs.rounds[rIdx].findIndex(t => t.hi === S.userTeam || t.lo === S.userTeam) : -1;
  commitRound(R, lv.Ms); U.live = null; save(); closeModal(); render(); U.scenAfter = true;
  if (!wasPO) openReport(gwBefore, S.results[gwBefore].findIndex(m => m.h === S.userTeam || m.a === S.userTeam));
  else if (ti >= 0) { const tie = S.playoffs.rounds[rIdx][ti]; showReport(tie.legs[tie.legs.length - 1], S.playoffs.names[rIdx]); }
  if (S.phase === 'awards') { U.tab = 'awards'; render(); }
}

// ---------- fixtures & reports ----------
function vFixtures() {
  if (!S.fixtures.length) return '<div class="card">No fixtures yet.</div>';
  const g = U.gwView === null ? Math.min(S.gw, NGW - 1) : U.gwView; const played = g < S.gw;
  const list = played ? S.results[g] : S.fixtures[g];
  const strip = S.fixtures.map((fx, gi) => { const m = fx.find(x => x.h === S.userTeam || x.a === S.userTeam); const r = gi < S.gw ? S.results[gi].find(x => x.h === m.h && x.a === m.a) : null; const isH = m.h === S.userTeam; const opp = S.teams[isH ? m.a : m.h]; let cls = ''; if (r) { const gf = isH ? r.hg : r.ag, ga = isH ? r.ag : r.hg; cls = gf > ga ? 'W' : gf === ga ? 'D' : 'L'; } return `<button class="fxchip ${cls} ${gi === g ? 'on' : ''}" onclick="U.gwView=${gi};render()"><small>GW${gi + 1}</small>${crest(opp, 'sm')}<small>${isH ? 'H' : 'A'}${m.x ? ' ✕' : ''}</small>${r ? `<b>${isH ? r.hg : r.ag}-${isH ? r.ag : r.hg}</b>` : ''}</button>`; }).join('');
  return `${S.playoffs ? `<div class="card">${bracketHTML()}</div>` : ''}<div class="card"><h3>Your season</h3><div class="fxstrip">${strip}</div><p class="fine">✕ = crossover match against the other conference.</p></div>
  <div class="card"><div class="hrow"><h3>Gameweek ${g + 1}</h3><div class="row"><button class="btn sm" ${g <= 0 ? 'disabled' : ''} onclick="U.gwView=${g - 1};render()">◀</button><button class="btn sm" ${g >= NGW - 1 ? 'disabled' : ''} onclick="U.gwView=${g + 1};render()">▶</button></div></div>
  <div class="matches">${list.map((m, i) => `<div class="match ${m.h === S.userTeam || m.a === S.userTeam ? 'mine' : ''} ${played ? 'click' : ''}" ${played ? `onclick="openReport(${g},${i})"` : ''}><span class="t r">${S.teams[m.h].name} ${crest(S.teams[m.h], 'sm')}</span><b class="sc">${played ? `${m.hg} - ${m.ag}` : 'v'}</b><span class="t">${crest(S.teams[m.a], 'sm')} ${S.teams[m.a].name}</span>${m.x ? '<small class="xtag">crossover</small>' : derbyName(m.h, m.a) ? `<small class="xtag">${derbyName(m.h, m.a)}</small>` : ''}</div>`).join('')}</div></div>`;
}
function bracketHTML() {
  const po = S.playoffs;
  const tieHTML = (t, ri, ti) => `<div class="tie">${[t.hi, t.lo].map(id => `<div class="${t.winner === id ? 'win' : t.winner !== null ? 'out' : ''} ${id === S.userTeam ? 'mine' : ''}">${crest(S.teams[id], 'sm')}<span>${S.teams[id].name}</span><small>${S.teams[id].conf}${confPos(id)}</small><b>${t.legs.map(l => l.h === id ? l.hg : l.ag).join(' · ')}</b></div>`).join('')}${t.legs.length ? `<a class="link fine" onclick="openPOReport(${ri},${ti},${t.legs.length - 1})">Report${t.legs[t.legs.length - 1].pens ? ' · pens ' + t.legs[t.legs.length - 1].pens.join('-') : t.legs[t.legs.length - 1].aet ? ' · aet' : ''}</a>` : ''}</div>`;
  const cols = [0, 1, 2].map(ri => po.rounds[ri] ? `<div class="bcol"><small>${po.names[ri]}</small>${po.rounds[ri].map((t, ti) => tieHTML(t, ri, ti)).join('')}</div>` : `<div class="bcol"><small>${po.names[ri]}</small><div class="tie tbd">TBD</div></div>`).join('');
  return `<div class="hrow"><h2>Super League Playoffs</h2>${po.champion !== null ? `<span class="pill gold">Champions: ${S.teams[po.champion].name}</span>` : ''}</div><div class="bracket">${cols}${po.champion !== null ? `<div class="bcol champ">${crest(S.teams[po.champion], 'xl')}<b>${S.teams[po.champion].name}</b><small>Champions</small></div>` : ''}</div>`;
}
function openPOReport(r, t, l) { showReport(S.playoffs.rounds[r][t].legs[l], `${S.playoffs.names[r]} · leg ${l + 1}`); }
function openReport(g, i) { if (i < 0) return; showReport(S.results[g][i], `Gameweek ${g + 1}`); }
function showReport(m, title) {
  const order = 'GK LB LWB CB RB RWB DM CM LM RM AM LW RW ST'.split(' ');
  const side = s => Object.entries(m.ps).filter(([id, v]) => v.side === s).sort((a, b) => (a[1].sub - b[1].sub) || (order.indexOf(a[1].slot) - order.indexOf(b[1].slot)));
  const full = Object.values(m.ps)[0] && Object.values(m.ps)[0].tk !== undefined;
  const col = s => `<div class="rcol">${side(s).map(([id, v]) => `<div class="${+id === m.motm ? 'motm' : ''}">${posChip(v.slot)}${pn(P[id], 'short')}${v.sub ? `<small class="muted"> (${v.min}')</small>` : ''} ${'⚽'.repeat(v.g)}${'<i class="asst">A</i>'.repeat(v.a)}${v.yc ? '<i class="ycard"></i>' : ''}${v.rc ? '<i class="rcard"></i>' : ''}${+id === m.motm ? ' ★' : ''}<b class="rt ${rtc(v.rt)}">${v.rt.toFixed(1)}</b>${full ? `<small class="muted det">${P[id].pos === 'GK' ? `${v.sv} saves · ${(v.psxg - v.ga) >= 0 ? '+' : ''}${(v.psxg - v.ga).toFixed(1)} goals prevented` : `${v.kp} key passes · ${v.drs}/${v.dra} dribbles · ${v.tk + v.int} tackles+int · ${v.pas ? Math.round(v.pc / v.pas * 100) : 0}% passing`}</small>` : ''}</div>`).join('')}</div>`;
  openModal(`<small class="muted">${title}</small>
    <div class="rhead" style="--h1:${S.teams[m.h].c1};--a1:${S.teams[m.a].c1}">${crest(S.teams[m.h], 'xl')}<div><div class="big">${m.hg} – ${m.ag}</div>${m.aet ? '<small>after extra time</small>' : ''}${m.pens ? `<small>${m.pens[0]}-${m.pens[1]} on penalties</small>` : ''}</div>${crest(S.teams[m.a], 'xl')}</div>
    <div class="rnames"><b>${S.teams[m.h].name}</b><b>${S.teams[m.a].name}</b></div>
    <div class="goals">${goalsLine(m)}</div>
    <div class="mstats">${[['Possession', m.poss + '%', (100 - m.poss) + '%'], ['Shots', m.hsh, m.ash], ['On target', m.hsot, m.asot]].map(([k, a, b]) => `<div class="msr"><b>${a}</b><span>${k}</span><b>${b}</b></div>`).join('')}<div class="msr small"><b>${m.hxg.toFixed(1)}</b><span>xG</span><b>${m.axg.toFixed(1)}</b></div></div>
    <div class="motmline">★ Man of the Match: ${pn(P[m.motm])} · ${m.ps[m.motm].rt.toFixed(1)}</div>
    <div class="rcols">${col(0)}${col(1)}</div>`, 'wide');
}

// ---------- table ----------
function vTable() {
  if (!S.table) return '<div class="card">The tables appear after the draft.</div>';
  const all = standings();
  return `<div class="grid2">${['N', 'S'].map(c => `<div class="card"><h3>${CONF_NAME[c]}</h3><div class="tscroll">${confTable(c)}</div></div>`).join('')}</div>
  <p class="fine">The top 4 in each conference (highlighted) make the two-legged playoffs. The best regular-season record overall wins the Shield (currently ${S.teams[all[0].id].name}, ${all[0].pts} pts).</p>`;
}

// ---------- stats ----------
const STATS = {
  g: ['⚽ Goals', p => p.st.g], a: ['<i class="asst">A</i> Assists', p => p.st.a], ga: ['Goals + assists', p => p.st.g + p.st.a], rt: ['Average rating (min 5 apps)', p => p.st.app >= 5 ? p.st.rt / p.st.app : -1, 2], motm: ['Man of the Match', p => p.st.motm], totw: ['Team of the Week picks', p => p.st.totw],
  kp: ['Key passes', p => p.st.kp], drs: ['Dribbles completed', p => p.st.drs], ti: ['Tackles + interceptions', p => p.st.tk + p.st.int], pc: ['Pass completion % (min 300)', p => p.st.pas >= 300 ? p.st.pc / p.st.pas * 100 : -1, 1], sot: ['Shots on target', p => p.st.sot],
  cs: ['Clean sheets', p => p.pos === 'GK' ? p.st.cs : -1], sv: ['Saves', p => p.pos === 'GK' ? p.st.sv : -1], gp: ['Goals prevented (GK)', p => p.pos === 'GK' ? p.st.psxg - p.st.ga : -99, 1],
  xg: ['Advanced · xG', p => p.st.xg, 1], xa: ['Advanced · xA', p => p.st.xa, 1], gxg: ['Advanced · Goals minus xG', p => p.st.g - p.st.xg, 1], yc: ['Yellow cards', p => p.st.yc],
};
function vStats() {
  const [lbl, f, dp] = STATS[U.stat];
  let list = S.players.filter(p => p.team >= 0 && p.st.app > 0 && (!U.statMine || p.team === S.userTeam) && (U.statPos === 'ALL' || POS_GROUP[p.pos] === U.statPos));
  list = list.map(p => [p, f(p)]).filter(x => x[1] > -1 || U.stat === 'gxg' || (U.stat === 'gp' && x[1] > -99)).sort((a, b) => b[1] - a[1]).slice(0, 50);
  return `<div class="card"><div class="filters"><select onchange="U.stat=this.value;render()">${Object.entries(STATS).map(([k, v]) => `<option value="${k}" ${U.stat === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
  ${['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(p => `<button class="chip ${U.statPos === p ? 'on' : ''}" onclick="U.statPos='${p}';render()">${p}</button>`).join('')}
  <label class="tog"><input type="checkbox" ${U.statMine ? 'checked' : ''} onchange="U.statMine=this.checked;render()"> My club only</label></div>
  <div class="tscroll"><table class="tbl big"><thead><tr><th>#</th><th>Player</th><th>Club</th><th>Apps</th><th class="hl">${lbl.replace('Advanced · ', '')}</th><th>Goals</th><th>Assists</th><th>Avg</th></tr></thead><tbody>
  ${list.map(([p, v], i) => `<tr class="${p.team === S.userTeam ? 'mine' : ''}"><td><span class="rk">${i + 1}</span></td><td>${posChip(p.pos)}${pn(p)}</td><td>${crest(S.teams[p.team], 'sm')}</td><td>${p.st.app}</td><td class="hl"><b>${dp ? v.toFixed(dp) : v}</b></td><td>${p.st.g}</td><td>${p.st.a}</td><td>${(p.st.rt / p.st.app).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan=8 class="muted">No matches played yet.</td></tr>'}
  </tbody></table></div></div>`;
}

// ---------- awards ----------
function vAwards() {
  const tw = S.totw; const gi = U.totwGW === null || U.totwGW >= tw.length ? tw.length - 1 : U.totwGW; const A = S.awards;
  const aw = (title, id, extra) => id === null || id === undefined ? '' : `<div class="award"><small>${title}</small><div>${pn(P[id])} ${crest(S.teams[P[id].team], 'sm')}</div><span class="muted">${extra(P[id])}</span></div>`;
  return `${A ? `<div class="card ballon"><div class="bd-head"><div><small class="kicker">Season ${S.season}</small><h2>Ballon d'Or</h2></div>${futCard(P[A.ballon[0].id])}</div>
    <div class="bwin">${pn(P[A.ballon[0].id])} <span class="muted">· ${S.teams[P[A.ballon[0].id].team].name} · ${P[A.ballon[0].id].st.g} goals, ${P[A.ballon[0].id].st.a} assists</span></div>
    <ol class="blist">${A.ballon.map(r => `<li class="${P[r.id].team === S.userTeam ? 'mine' : ''}"><span>${pn(P[r.id], 'short')} ${crest(S.teams[P[r.id].team], 'sm')} <small class="muted">${P[r.id].st.g}G ${P[r.id].st.a}A</small></span><b>${r.pts}</b></li>`).join('')}</ol></div>
   <div class="grid3"><div class="card"><h3>Season awards</h3>
     <div class="award"><small>Super League champions</small><div>${crest(S.teams[S.playoffs.champion], 'sm')} <b>${S.teams[S.playoffs.champion].name}</b></div></div>
     <div class="award"><small>Shield (best regular season)</small><div>${crest(S.teams[S.shield], 'sm')} <b>${S.teams[S.shield].name}</b></div></div>
     ${aw('<i class="asst">A</i> Golden Boot', A.gb, p => `${p.st.g} goals`)}${aw('Playmaker', A.pm, p => `${p.st.a} assists`)}${aw('Best goalkeeper', A.gg, p => `${p.st.cs} clean sheets`)}${aw('Young Player (≤21)', A.yp, p => `${p.st.g} goals, ${p.st.a} assists`)}${aw('Dribbler of the Year', A.dr, p => `${p.st.drs} dribbles`)}${aw('Defender of the Year', A.def, p => `${p.st.tk + p.st.int} tackles + interceptions`)}
     ${A.coy ? `<div class="award"><small>Coach of the Year</small><div><b>${S.coaches[A.coy.coach].name}</b> ${crest(S.teams[A.coy.team], 'sm')}</div></div>` : ''}</div>
    <div class="card span2"><h3>Team of the Season</h3>${pitchXI(A.tos)}</div></div>` : ''}
  ${tw.length ? `<div class="card"><div class="hrow"><h3>Team of the Week · GW ${tw[gi].gw}</h3><div class="row"><button class="btn sm" ${gi <= 0 ? 'disabled' : ''} onclick="U.totwGW=${gi - 1};render()">◀</button><button class="btn sm" ${gi >= tw.length - 1 ? 'disabled' : ''} onclick="U.totwGW=${gi + 1};render()">▶</button></div></div>${pitchXI(tw[gi].xi)}</div>` : '<div class="card muted">The Team of the Week appears after Gameweek 1.</div>'}
  <div class="card"><h3>Player of the Month</h3><div class="potm">${S.potm.filter(x => x.season === S.season).map(x => `<div class="award"><small>${x.month}</small><div>${pn(P[x.id])} ${crest(S.teams[x.team], 'sm')}</div><span class="muted">${x.g} goals, ${x.a} assists</span></div>`).join('') || '<p class="muted">Awarded every 4 gameweeks.</p>'}</div></div>
  ${S.history.length ? historyCard() : ''}`;
}
function historyCard() { return `<div class="card"><h3>Hall of Fame</h3><div class="tscroll"><table class="tbl"><thead><tr><th>Season</th><th>Champion</th><th>Shield</th><th>Ballon d'Or</th><th>Golden Boot</th><th>You</th></tr></thead><tbody>${S.history.map(h => `<tr><td>${h.season}</td><td>${crest(S.teams[h.champion], 'sm')} ${S.teams[h.champion].name}</td><td>${S.teams[h.shield].name}</td><td>${esc(DB[h.ballon].name)}</td><td>${esc(DB[h.gb].name)} (${h.gbG})</td><td>${h.userChamp ? 'Champions' : ord(h.userPos) + ' ' + h.userConf}</td></tr>`).join('')}</tbody></table></div></div>`; }
function pitchXI(xi) {
  const coords = { GK: [[50, 7]], LB: [[14, 30]], CB: [[37, 24], [63, 24]], RB: [[86, 30]], CM: [[25, 52], [50, 47], [75, 52]], LW: [[17, 78]], ST: [[50, 85]], RW: [[83, 78]] };
  const used = {};
  return `<div class="pitch small">${xi.map(x => { const k = x.slot; used[k] = used[k] || 0; const c = (coords[k] || [[50, 50]])[used[k]++] || [50, 50]; const p = P[x.id]; return `<div class="slot g-${SLOT_GROUP(x.slot)}" style="left:${c[0]}%;bottom:${pby(c[1])}%" onclick="openPlayer(${x.id})"><span class="rt ${rtc(x.rt)}">${x.rt.toFixed(1)}</span><b>${esc(DB[p.id].short)}</b><small>${crest(S.teams[p.team] || null, 'sm')} ${yrTag(p.y)}</small></div>`; }).join('')}</div>`;
}

// ---------- fans ----------
function vFans() {
  const list = S.feed.filter(p => !U.feedMine || p.mine).slice(0, 80);
  return `<div class="fanwrap"><div class="card"><div class="hrow"><h3>Fan feed</h3><div class="row"><button class="chip ${U.feedMine ? '' : 'on'}" onclick="U.feedMine=false;render()">Everyone</button><button class="chip ${U.feedMine ? 'on' : ''}" onclick="U.feedMine=true;render()">About ${me().name}</button></div></div>
  ${list.map(postHTML).join('') || '<p class="muted">Nobody has posted yet.</p>'}</div></div>`;
}

// ---------- transfers ----------
function vTransfers() {
  const u = me(); const f = U.tf; const open = windowOpen();
  let list = S.players.filter(p => p.team !== S.userTeam && p.team >= -1 && (!f.free || p.team === -1) && (f.pos === 'ALL' || p.pos === f.pos) && p.ovr >= f.min && (!f.q || DB[p.id].name.toLowerCase().includes(f.q.toLowerCase())));
  list = list.map(p => [p, p.team === -1 ? r1(p.val * 0.15) : askingPrice(p)]).filter(x => x[1] <= f.max).sort((a, b) => b[0].ovr - a[0].ovr).slice(0, 80);
  const reqs = u.squad.map(id => P[id]).filter(p => p.req);
  return `<div class="card tbanner"><div><h3>Transfer centre</h3><p class="fine">Budget <b class="okc">${fm(u.budget)}</b> · Squad ${u.squad.length}/${MAX_SQUAD} (min ${MIN_SQUAD}) · Windows: pre-season, and after GW7 until after GW9. Free agents can be signed any time.</p></div><div class="row"><button class="btn lime" onclick="openFill()">Fill squad</button><span class="pill ${open ? 'okb' : 'badb'}">${open ? 'Window OPEN' : 'Window closed'}</span></div></div>
  ${reqs.length ? `<div class="card"><h3>Transfer requests</h3>${reqs.map(p => inboxItem({ s: `${pn(p)} wants to leave (morale ${Math.round(p.mor)}).`, kind: 'req', pl: p.id })).join('')}</div>` : ''}
  ${S.offers.length ? `<div class="card"><h3>Bids for your players</h3>${S.offers.map(o => `<div class="offer">${crest(S.teams[o.team], 'sm')} <b>${S.teams[o.team].name}</b> offer <b class="okc">${fm(o.fee)}</b> for ${pn(P[o.pl])} ${ob(P[o.pl].ovr)} <span class="muted">value ${fm(P[o.pl].val)}</span><span class="row"><button class="btn sm lime" onclick="res(respondOffer('${o.id}','accept'))">Accept</button><input type="number" id="ctr_${o.id}" value="${r1(o.fee * 1.25)}" step="0.5"><button class="btn sm" onclick="res(respondOffer('${o.id}','counter',+document.getElementById('ctr_${o.id}').value))">Counter</button><button class="btn sm red" onclick="res(respondOffer('${o.id}','reject'))">Reject</button></span></div>`).join('')}</div>` : ''}
  <div class="card"><div class="filters">${['ALL', 'GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'].map(p => `<button class="chip ${f.pos === p ? 'on' : ''}" onclick="U.tf.pos='${p}';render()">${p}</button>`).join('')}
   <input placeholder="Search…" value="${esc(f.q)}" onchange="U.tf.q=this.value;render()">
   <select onchange="U.tf.min=+this.value;render()">${[0, 75, 80, 85, 88, 90].map(v => `<option value="${v}" ${f.min === v ? 'selected' : ''}>OVR ≥ ${v}</option>`).join('')}</select>
   <select onchange="U.tf.max=+this.value;render()">${[999, 60, 30, 15, 5].map(v => `<option value="${v}" ${f.max === v ? 'selected' : ''}>${v === 999 ? 'Any price' : 'Up to €' + v + 'm'}</option>`).join('')}</select>
   <label class="tog"><input type="checkbox" ${f.free ? 'checked' : ''} onchange="U.tf.free=this.checked;render()"> Free agents only</label></div>
  <div class="tscroll"><table class="tbl big"><thead><tr><th>Pos</th><th>Player</th><th>Age</th><th>OVR</th><th>Club</th><th>Price</th><th></th></tr></thead><tbody>
  ${list.map(([p, ask]) => { const ut = untouchable(p); return `<tr><td>${posChip(p.pos)}</td><td>${pn(p)} ${p.req ? '<span class="pill badb">wants out</span>' : ''}</td><td>${p.age}</td><td>${ob(p.ovr)}</td><td>${p.team >= 0 ? crest(S.teams[p.team], 'sm') + ' ' + S.teams[p.team].name : '<span class="pill okb">Free agent</span>'}</td><td>${ut ? '<span class="pill badb"><i class="key">KEY</i> Not for sale</span>' : p.team === -1 ? fm(ask) + ' <small class="muted">fee</small>' : fm(ask)}</td><td><button class="btn sm" onclick="openPlayer(${p.id})">${p.team === -1 ? 'Sign' : ut ? 'View' : 'Deal'}</button></td></tr>`; }).join('')}
  </tbody></table></div></div>`;
}

// ---------- coaches ----------
function vCoaches() {
  const u = me(); const co = S.coaches[u.coach]; const cf = coachFit(u);
  const free = freeCoaches().sort((a, b) => b.rating - a.rating);
  return `<div class="grid3"><div class="card"><h3>Your head coach</h3>${co ? `<div class="coachbig">${coachCard(co)}<div class="kv"><span>Familiarity</span>${bar(Math.round(cf.fit * 100))}</div><div class="kv"><span>Team rating effect</span><b class="${cf.bonus >= 0 ? 'okc' : 'warn'}">${cf.bonus >= 0 ? '+' : ''}${cf.bonus.toFixed(1)}</b></div>
   <button class="btn red full" onclick="confirmFire()">Fire him (${fm(fireCost(co))} compensation)</button><button class="btn ghost full" onclick="applyCoachTactics()">Use his preferred tactics</button></div>` : `<p class="warn">No head coach. A caretaker is in charge, which costs you team rating. Hire someone.</p>`}</div>
  <div class="card span2"><h3>Available coaches</h3><div class="tscroll short"><table class="tbl big"><thead><tr><th>Coach</th><th>Rating</th><th>Style</th><th>Shape</th><th>Fee</th><th></th></tr></thead><tbody>
   ${free.map(c => `<tr><td><b>${c.name}</b> <small class="muted">${c.nat}</small></td><td>${ob(c.rating)}</td><td>${c.style}</td><td>${c.form}</td><td>${fm(hireCost(c))}</td><td><button class="btn sm lime" ${u.coach >= 0 ? 'disabled title="Fire your coach first"' : ''} onclick="res(hireCoach(${c.id}))">Hire</button></td></tr>`).join('') || '<tr><td class="muted">Nobody is available.</td></tr>'}
   </tbody></table></div></div></div>
  <div class="card"><h3>Coaches around the league</h3><div class="coachgrid">${S.teams.map(t => { const c = S.coaches[t.coach]; return `<div>${crest(t, 'sm')} <b>${c ? c.name : 'Caretaker'}</b>${c ? ob(c.rating) : ''}<small class="muted">${c ? c.style : ''}</small></div>`; }).join('')}</div></div>`;
}
function confirmFire() { openModal(`<h2>Fire ${S.coaches[me().coach].name}?</h2><p class="muted">Compensation is ${fm(fireCost(S.coaches[me().coach]))}. Morale drops a little, and a caretaker takes over until you hire someone.</p><div class="row"><button class="btn red" onclick="closeModal();res(fireCoach())">Fire him</button><button class="btn" onclick="closeModal()">Cancel</button></div>`); }
function applyCoachTactics() { const u = me(); const co = S.coaches[u.coach]; Object.assign(u.tactics, defaultTactics(co)); autoLineup(u); save(); toast(`Tactics switched to ${co.name}'s ${co.form}.`); render(); }

// ---------- clubs ----------
function vClubs() {
  const id = U.clubView === null ? S.userTeam : U.clubView; const t = S.teams[id]; const co = S.coaches[t.coach];
  if (t.squad.length) validateLineup(t);
  const slots = FORMS[t.tactics.form]; const ch = t.lineup && t.lineup.length ? teamChem(t) : null;
  const sq = t.squad.map(i => P[i]).sort((a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos) || b.ovr - a.ovr);
  const xi = new Set(t.lineup || []);
  const bench = sq.filter(p => !xi.has(p.id));
  const tac = ['ment', 'press', 'tempo', 'width', 'line', 'pass'].map(k => `<span class="pill">${labelOf(k)}: <b>${t.tactics[k]}</b></span>`).join('');
  const pitch = t.squad.length ? `<div class="pitch">${slots.map((s, i) => { const pid = t.lineup[i]; const p = pid !== null && pid !== undefined ? P[pid] : null; return `<div class="slot g-${SLOT_GROUP(s[0])} ${p && posPen(p.pos, s[0]) > 3 ? 'oop' : ''}" style="left:${s[1]}%;bottom:${pby(s[2])}%" ${p ? `onclick="openPlayer(${p.id})"` : ''}><span class="ovr t-${tier(p ? p.ovr : 60)}">${p ? p.ovr : '?'}</span><b>${p ? esc(DB[p.id].short) : 'empty'}</b><small>${s[0]}${p ? ' · ' + yrTag(p.y) : ''}${p && t.captain === p.id ? ' · ©' : ''}${p && untouchable(p) ? ' <i class="key">KEY</i>' : ''}</small></div>`; }).join('')}</div>` : '<p class="muted">No players yet.</p>';
  return `<div class="card"><div class="clubsel">${S.teams.map(x => `<button class="${x.id === id ? 'on' : ''}" onclick="U.clubView=${x.id};render()" title="${x.name}">${crest(x, 'sm')}</button>`).join('')}</div></div>
  <div class="card clubhead" style="--k1:${t.c1}"><div class="hrow"><div class="row">${crest(t, 'xl')}<div><h2>${t.name}</h2><small class="muted">${CONF_NAME[t.conf]}${S.table ? ' · ' + ord(confPos(id)) : ''} · budget ${fm(t.budget)}</small></div></div>${S.legacy.club[id] ? `<span class="pill gold">${S.legacy.club[id].titles} title${S.legacy.club[id].titles !== 1 ? 's' : ''}</span>` : ''}</div></div>
  <div class="cols tac">
    <div class="card pitchcard"><div class="hrow"><h3>How they line up · ${t.tactics.form}</h3>${S.table && S.table[id] ? `<span>${S.table[id].form.map(f => `<i class="fm ${f}">${f}</i>`).join('')}</span>` : ''}</div>${pitch}<p class="fine">Tap a player to see his profile, or to make an offer.</p></div>
    <div class="side wide">
      <div class="card"><h3>Dugout</h3>${co ? coachCard(co) : '<p class="warn">Caretaker in charge</p>'}
        <div class="tacpills">${tac}</div></div>
      ${ch ? `<div class="card chem"><div class="hrow"><h3>Chemistry</h3><span class="chemscore ${ch.score >= 70 ? 'good' : ch.score >= 50 ? 'mid' : 'bad'}">${ch.score}</span></div>
        <div class="kv"><span>Avg football IQ</span><b>${ch.iq.toFixed(0)}</b></div>
        ${ch.links.length ? `<div class="links">${ch.links.slice(0, 6).map(([a, b, c]) => `<span class="pill okb">${esc(DB[a].short)} + ${esc(DB[b].short)}</span>`).join('')}</div>` : ''}
        ${ch.lazy >= 2 ? `<p class="warn">${ch.lazy} forwards who don't press, so expect open games.</p>` : ''}</div>` : ''}
      <div class="card"><h3>Bench & reserves</h3>${bench.map(p => `<div class="lrow">${posChip(p.pos)}${pn(p, 'short')}${p.inj ? ' <i class="inj"></i>' : ''}${p.sus ? ' <i class="rcard"></i>' : ''}<b>${ob(p.ovr)}</b></div>`).join('') || '<p class="muted">Nobody on the bench.</p>'}</div>
    </div></div>
  <details class="card"><summary>Full squad stats</summary><div class="tscroll"><table class="tbl big"><thead><tr><th>Pos</th><th>Player</th><th>Age</th><th>OVR</th><th>IQ</th><th>Apps</th><th>Goals</th><th>Assists</th><th>Avg</th></tr></thead><tbody>
  ${sq.map(p => `<tr class="${xi.has(p.id) ? 'xi' : ''}"><td>${posChip(p.pos)}</td><td>${pn(p)} ${untouchable(p) ? '<i class="key">KEY</i>' : ''} ${DB[p.id].clubs.some(c => c[0] === t.name) ? '<span class="leg">★</span>' : ''}</td><td>${p.age}</td><td>${ob(p.ovr)}</td><td>${p.iq}</td><td>${p.st.app}</td><td>${p.st.g}</td><td>${p.st.a}</td><td>${p.st.app ? (p.st.rt / p.st.app).toFixed(2) : '–'}</td></tr>`).join('')}
  </tbody></table></div><p class="fine"><i class="key">KEY</i> = untouchable: the club won't sell or trade him.</p></details>`;
}

// ---------- legacy recap ----------
function vLegacy() {
  const ids = Object.keys(S.legacy.p).map(Number).map(id => [id, legacyScore(id)]).sort((a, b) => b[1] - a[1]);
  const top = ids.slice(0, 15); const goat = top[0]; const L0 = S.legacy.p[goat[0]];
  const clubs = Object.entries(S.legacy.club).sort((a, b) => b[1].titles - a[1].titles || b[1].shields - a[1].shields).slice(0, 6);
  const coaches = Object.entries(S.legacy.coach).sort((a, b) => b[1].titles - a[1].titles).slice(0, 5);
  const h = S.history; const uTitles = h.filter(x => x.userChamp).length; const avgPos = h.reduce((s, x) => s + x.userPos, 0) / h.length;
  let bestSeason = null; S.players.forEach(p => p.career.forEach(c => { if (!bestSeason || c.g > bestSeason.g) bestSeason = Object.assign({ id: p.id }, c); }));
  const byPos = g => ids.filter(([id]) => POS_GROUP[DB[id].pos] === g);
  const allTime = [['GK', 1], ['DEF', 4], ['MID', 3], ['ATT', 3]].flatMap(([g, n]) => byPos(g).slice(0, n).map(x => [x[0], g]));
  const ln = id => S.legacy.p[id];
  return `<div class="card goat"><small class="kicker">The ${S.history.length}-season reality is over</small><h1>The GOAT of this reality</h1>
    <div class="goatrow"><div class="goatname"><h2>${esc(DB[goat[0]].name)}</h2><p>${L0.g} goals · ${L0.a} assists · ${L0.app} apps · ${L0.bdo} Ballon d'Or${L0.bdo !== 1 ? 's' : ''} · ${L0.titles} title${L0.titles !== 1 ? 's' : ''}</p><div class="legscore">Legacy score <b>${Math.round(goat[1])}</b></div></div></div></div>
  <div class="grid3"><div class="card span2"><h3>Legacy rankings</h3><div class="tscroll"><table class="tbl big"><thead><tr><th>#</th><th>Player</th><th>Legacy</th><th></th><th></th><th>Goals</th><th>Assists</th><th>Apps</th><th>Avg</th></tr></thead><tbody>
    ${top.map(([id, sc], i) => { const l = ln(id); return `<tr><td><span class="rk">${i + 1}</span></td><td>${posChip(DB[id].pos)}<a class="pl" onclick="openPlayer(${id})">${esc(DB[id].name)}</a></td><td><b class="okc">${Math.round(sc)}</b></td><td>${l.bdo}</td><td>${l.titles}</td><td>${l.g}</td><td>${l.a}</td><td>${l.app}</td><td>${(l.rt / l.app).toFixed(2)}</td></tr>`; }).join('')}</tbody></table></div><p class="fine">The legacy score adds up goals, assists, appearances, ratings, Ballon d'Ors, top-3 finishes, titles, Teams of the Season and Golden Boots, across every version of a player.</p></div>
   <div class="card"><h3>Your manager career</h3><div class="kv"><span>Club</span><b>${me().name}</b></div><div class="kv"><span>Titles</span><b>${uTitles} </b></div><div class="kv"><span>Playoff appearances</span><b>${h.filter(x => x.userPO).length}</b></div><div class="kv"><span>Avg conference finish</span><b>${avgPos.toFixed(1)}</b></div><div class="kv"><span>Verdict</span><b>${uTitles >= 3 ? 'Dynasty builder ' : uTitles >= 1 ? 'Champion manager' : avgPos <= 4 ? 'Solid contender' : 'Sacked in most realities '}</b></div>
   <h3 style="margin-top:18px">Dynasties</h3>${clubs.map(([id, c]) => `<div class="lrow">${crest(S.teams[id], 'sm')} ${S.teams[id].name}<b>${c.titles} · ${c.shields} </b></div>`).join('')}
   <h3 style="margin-top:18px">Best coaches</h3>${coaches.map(([id, c]) => `<div class="lrow">${S.coaches[id].name}<b>${c.titles} </b></div>`).join('')}
   ${bestSeason ? `<h3 style="margin-top:18px">Record</h3><div class="lrow">Most goals in a season: ${esc(DB[bestSeason.id].name)} '${String(bestSeason.y).slice(2)}<b>${bestSeason.g}</b></div>` : ''}</div></div>
  <div class="card"><h3>All-time XI of this reality</h3><div class="atxi">${allTime.map(([id, g]) => `<div class="fut mini k-${k2(Math.min(99, 80 + Math.round(legacyScore(id) / 40)))[1]}"><div class="fut-top"><div><b>${Math.round(legacyScore(id))}</b><span>${g}</span></div></div><div class="fut-name">${esc(DB[id].short)}</div></div>`).join('')}</div></div>
  <div class="card"><h3>Ballon d'Or roll of honour</h3><div class="potm">${S.history.map(x => `<div class="award"><small>Season ${x.season}</small><div><b>${esc(DB[x.ballon].name)}</b></div><span class="muted">Champions: ${S.teams[x.champion].name}</span></div>`).join('')}</div></div>
  <div class="center"><button class="btn lime big" onclick="newGameUI()">Start a new reality ▶</button></div>`;
}

// ---------- player modal ----------
const pby = y => 7 + y * 0.86;
function hexRadar(vals, names) {
  const cx = 110, cy = 100, R = 78; const pt = (i, r) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const ring = f => vals.map((_, i) => pt(i, R * f).join(',')).join(' ');
  const shape = vals.map((v, i) => pt(i, R * Math.max(0.15, (v - 30) / 69)).join(',')).join(' ');
  return `<svg class="hex" viewBox="0 0 220 200">${[1, .75, .5, .25].map(f => `<polygon points="${ring(f)}" class="hr"/>`).join('')}${vals.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" class="hr"/>`).join('')}
  <polygon points="${shape}" class="hs"/>${vals.map((v, i) => { const [x, y] = pt(i, R + 15); return `<text x="${x}" y="${y + 4}" text-anchor="middle" class="ht">${names[i]} <tspan class="hv">${v}</tspan></text>`; }).join('')}</svg>`;
}
function openPlayer(id) {
  const p = P[id]; const d = DB[id]; const t = p.team >= 0 ? S.teams[p.team] : null; const mine = p.team === S.userTeam; const s = p.st;
  const names = p.pos === 'GK' ? GK_N : ATTR_N;
  const realYears = []; for (let y = d.start; y <= Math.min(d.retire, Math.max(d.realEnd, p.y)); y++) realYears.push(y);
  let act = '';
  if (!isDrafting() && S.phase !== 'over') {
    if (mine) act = `<div class="row"><button class="btn" onclick="me().captain=${id};save();closeModal();render()">© Make captain</button>${p.pos !== 'GK' ? `<button class="btn" onclick="me().pk=${id};save();closeModal();render()">Penalty taker</button>` : ''}<button class="btn lime" onclick="getSellOffers(${id})">Find buyers</button><button class="btn" onclick="P[${id}].listed=!P[${id}].listed;save();closeModal();render()">${p.listed ? 'Remove from list' : 'Transfer-list'}</button><button class="btn red" onclick="closeModal();res(releasePlayer(${id}))">Release</button></div><div id="sellbox"></div>`;
    else if (p.team === -1) act = `<div class="row"><button class="btn lime" onclick="closeModal();res(userBid(${id},0))">Sign free agent (${fm(p.val * 0.15)} signing-on fee)</button></div>`;
    else if (p.team < -2) act = `<div class="dealbox"><b>Draft pool</b><p class="fine">He's being held for the next season draft. You can't sign him now, but you can draft him after the season.</p></div>`;
    else if (p.team >= 0) {
      if (untouchable(p)) act = `<div class="dealbox"><b><i class="key">KEY</i> ${t.name} consider him untouchable.</b><p class="fine">Key players and club legends are not for sale or trade, at any price.</p></div>`;
      else { const n = S.nego[id]; const ask = n && n.ask ? n.ask : askingPrice(p); act = `<div class="dealbox"><div class="hrow"><b>Negotiate with ${t.name}</b><span class="muted">Their price: <b class="okc">${fm(ask)}</b>${!windowOpen() ? ' <span class="warn">· window closed</span>' : ''}</span></div>
       ${n && n.hist.length ? `<div class="nego">${n.hist.map(([w, v]) => `<span class="${w}">${w === 'you' ? 'You' : t.short}: €${v}m</span>`).join('')}</div>` : ''}
       <div class="row"><input id="bidamt" type="number" step="0.5" value="${r1(ask * 0.85)}"><button class="btn lime" onclick="doBid(${id})">Make offer</button>${n && n.ask ? `<button class="btn" onclick="doBid(${id},${n.ask})">Accept their €${n.ask}m</button>` : ''}<button class="btn" onclick="openTrade(${id})">Propose trade</button></div></div>`; }
    }
  }
  openModal(`<div class="phead k-${k2(p.ovr)[1]}"><div class="k-tier">${k2(p.ovr)[2]}</div><div class="ovrbig">${p.ovr}<small>${p.pos}</small></div><div class="grow"><h2>${esc(d.name)} <span class="yr big">'${String(p.y).slice(2)}</span></h2><small>${d.nat} · age ${p.age} · ${p.y}/${String(p.y + 1).slice(2)} version (${esc(p.rclub)}) · ${t ? t.name : p.team === -2 ? 'Retired' : p.team < -2 ? 'Draft pool' : 'Free agent'}</small>
    <div class="row pmeta"><span class="pill">IQ ${p.iq}</span><span class="pill">${p.wr === 'Low' ? '' : p.wr === 'High' ? '' : ''} Work rate: ${p.wr}</span><span class="pill">${condA(p)} Morale ${Math.round(p.mor)}</span><span class="pill">${fm(p.val)}</span>${p.req ? '<span class="pill badb">Wants out</span>' : ''}</div></div>${t ? crest(t, 'xl') : ''}</div>
   ${act ? `<div class="pact">${act}</div>` : ''}
   <div class="grid2">
    <div><h3>Attributes</h3>${hexRadar(p.attrs, names)}${p.attrs.map((v, i) => `<div class="attr"><span>${names[i]}</span><span class="abar"><i style="width:${v}%;background:${v >= 85 ? 'var(--ok)' : v >= 70 ? 'var(--gold)' : 'var(--mut)'}"></i></span><b>${v}</b></div>`).join('')}
     <div class="tags">${[...d.tags].map(c => TAG_NAMES[c]).filter(Boolean).map(x => `<span class="pill">${x}</span>`).join('')}</div></div>
    <div><h3>Season ${S.season}</h3><div class="sgrid">${(p.pos === 'GK' ? [['Apps', s.app], ['Clean sheets', s.cs], ['Saves', s.sv], ['Conceded', s.ga], ['Avg rating', s.app ? (s.rt / s.app).toFixed(2) : '–'], ['MOTM', s.motm], ['Goals prevented', (s.psxg - s.ga).toFixed(1)], ['TOTW', s.totw]] :
      [['Apps', s.app], ['Goals', s.g], ['Assists', s.a], ['Avg rating', s.app ? (s.rt / s.app).toFixed(2) : '–'], ['MOTM', s.motm], ['TOTW', s.totw], ['Shots', `${s.sh} (${s.sot})`], ['Key passes', s.kp], ['Dribbles', `${s.drs}/${s.dra}`], ['Tackles + int', s.tk + s.int], ['Pass %', s.pas ? Math.round(s.pc / s.pas * 100) + '%' : '–'], ['Cards', `${s.yc}<i class="ycard"></i> ${s.rc}<i class="rcard"></i>`]]).map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
     ${p.pos !== 'GK' ? `<p class="fine">Advanced: xG ${s.xg.toFixed(1)} · xA ${s.xa.toFixed(1)}</p>` : ''}</div>
   </div>
   <h3>Real career arc</h3><div class="arc">${realYears.map(y => { const r = rateAt(d, y); return `<div class="${y === p.y ? 'cur' : ''} ${y > 2026 ? 'proj' : ''}" title="${y}: ${y <= 2026 ? realClubAt(d, y) : 'projected'}"><b>${r}</b><i style="height:${(r - 50) * 2}px"></i><small>${String(y).slice(2)}</small></div>`; }).join('')}</div>
   <p class="fine">${d.clubs.map(c => `${esc(c[0])} (${c[1]})`).join(' → ')}. Each new season moves him one real year along this curve. When he retires, a new random version of him re-enters the free-agent pool.</p>
   ${p.career.filter(c => c.app).length ? `<h3>Super League career</h3><table class="tbl"><thead><tr><th>Season</th><th>Version</th><th>Club</th><th>Apps</th><th>Goals</th><th>Assists</th><th>Avg</th></tr></thead><tbody>${p.career.filter(c => c.app).map(c => `<tr><td>${c.season}</td><td>'${String(c.y).slice(2)} (${c.ovr})</td><td>${c.team >= 0 ? S.teams[c.team].name : '–'}</td><td>${c.app}</td><td>${c.g}</td><td>${c.a}</td><td>${c.rt}</td></tr>`).join('')}</tbody></table>` : ''}
   <details class="editr"><summary>Edit his rating</summary><div class="row"><input id="edov" type="number" min="40" max="99" value="${p.ovr}"><button class="btn sm" onclick="editRating(${id},'year')">This version only ('${String(p.y).slice(2)})</button><button class="btn sm" onclick="editRating(${id},'career')">Shift his whole career</button></div><p class="fine">Disagree with a rating? Change it here. "Shift his whole career" moves every year of his curve by the same amount.</p></details>`, 'wide');
}
function doBid(id, amt) { const a = amt !== undefined ? amt : +document.getElementById('bidamt').value; const r = userBid(id, a); toast(r.msg, r.ok); save(); if (r.ok) { closeModal(); render(); } else openPlayer(id); }
function getSellOffers(id) {
  if (!windowOpen()) { $('#sellbox').innerHTML = '<p class="warn">The transfer window is closed.</p>'; return; }
  const o = sellOffers(id);
  $('#sellbox').innerHTML = o.length ? `<div class="dealbox">${o.map(x => `<div class="offer">${crest(S.teams[x.team], 'sm')} ${S.teams[x.team].name} offer <b class="okc">${fm(x.fee)}</b> <button class="btn sm lime" onclick="closeModal();res(acceptSale(${id},${x.team},${x.fee}))">Accept</button></div>`).join('')}</div>` : '<p class="muted">No club can afford him right now.</p>';
}
function openTrade(targetId) {
  const tgt = P[targetId]; const T = S.teams[tgt.team]; U.trade = U.trade && U.trade.t === targetId ? U.trade : { t: targetId, give: [], cash: 0 };
  const tr = U.trade; const e = evalTrade(targetId, tr.give, tr.cash);
  openModal(`<h2>Trade for ${esc(DB[targetId].name)} ${yrTag(tgt.y)}</h2><p class="muted">${T.name} value him at about <b>${fm(askingPrice(tgt) * 1.05)}</b> in a trade. They value your players based on what they need.</p>
   <div class="tscroll short"><table class="tbl">${me().squad.map(id => P[id]).sort((a, b) => b.ovr - a.ovr).map(p => `<tr class="click ${tr.give.includes(p.id) ? 'mine' : ''}" onclick="toggleGive(${p.id})"><td>${tr.give.includes(p.id) ? '' : ''}</td><td>${posChip(p.pos)}${esc(DB[p.id].name)} ${yrTag(p.y)}</td><td>${ob(p.ovr)}</td><td>${fm(tradeValueFor(T, p))}</td></tr>`).join('')}</table></div>
   <div class="row" style="margin-top:12px"><label class="tog">+ Cash (€m) <input type="number" min="0" step="0.5" value="${tr.cash}" onchange="U.trade.cash=Math.max(0,+this.value);openTrade(${targetId})"></label></div>
   <div class="dealbox"><div class="kv"><span>Your offer is worth</span><b>${fm(e.got || 0)}</b></div><div class="kv"><span>They want</span><b>${fm(e.want || askingPrice(tgt) * 1.05)}</b></div>${e.msg ? `<p class="${e.accept ? 'okc' : 'warn'}">${e.msg}</p>` : `<p class="okc">${T.name} would accept this.</p>`}</div>
   <div class="row"><button class="btn lime" ${e.accept ? '' : 'disabled'} onclick="const r=doTrade(${targetId},U.trade.give,U.trade.cash);U.trade=null;closeModal();res(r)">Propose trade</button><button class="btn" onclick="openPlayer(${targetId})">Back</button></div>`, 'wide');
}
function toggleGive(id) { const tr = U.trade; tr.give = tr.give.includes(id) ? tr.give.filter(x => x !== id) : tr.give.concat([id]); openTrade(tr.t); }

// ---------- modal ----------
function openModal(html, cls) { $('#modal').innerHTML = `<div class="mbg" onclick="closeModal()"></div><div class="mbox ${cls || ''}"><button class="mx" onclick="closeModal()" aria-label="Close">✕</button>${html}</div>`; $('#modal').style.display = 'block'; if (!U.mHist && !U.backPending) { try { history.pushState({ m: 1 }, ''); U.mHist = true; } catch (e) { } } }
const modalOpen = () => $('#modal').style.display === 'block';
window.addEventListener('popstate', () => {
  if (U.backPending) { U.backPending = false; if (modalOpen() && !U.mHist) { try { history.pushState({ m: 1 }, ''); U.mHist = true; } catch (e) { } } return; }
  if (U.mHist) { U.mHist = false; if (U.live) { try { history.pushState({ m: 1 }, ''); U.mHist = true; } catch (e) { } return; } closeModal(); }
});
function closeModal() { if (U.live) return; $('#modal').style.display = 'none'; $('#modal').innerHTML = ''; if (U.mHist) { U.mHist = false; U.backPending = true; history.back(); } if (S && U.scenAfter) { setTimeout(() => { if (S.breaking && S.breaking.length) showBreaking(); else { U.scenAfter = false; showScenario(); } }, 60); } }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function migrate() { if (!S.draft) return; if (!S.draft.owner) { const d = S.draft; d.kind = d.kind || 'initial'; d.rounds = d.rounds || DRAFT_ROUNDS; d.owner = []; for (let r = 0; r < d.rounds; r++) for (let i = 0; i < 30; i++) d.owner.push(r % 2 === 0 ? d.order[i] : d.order[29 - i]); d.total = d.owner.length; } S.edits = S.edits || {}; }
(function boot() { if (load() && S.v === 2) { migrate(); U.tab = isDrafting() ? 'draft' : S.phase === 'over' ? 'legacy' : 'home'; } else S = null; render(); })();
