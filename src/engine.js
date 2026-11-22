// ===================== SUPER LEAGUE ENGINE v2 =====================
const yr2 = n => (n >= 50 ? 1900 : 2000) + n;
function hash01(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
const rnd = Math.random;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = x => Math.round(x * 10) / 10;
function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) * 0.866; }
function pickW(arr, wf) { let t = 0; const ws = arr.map(x => { const w = Math.max(0, wf(x)); t += w; return w; }); if (!arr.length) return null; if (t <= 0) return arr[Math.floor(rnd() * arr.length)]; let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pickOne = a => a[Math.floor(rnd() * a.length)];

// ---------- player database ----------
const DB = [];
(function parseDB() {
  const seen = new Set();
  RAW_PLAYERS.split('\n').forEach(line => {
    const f = line.split('|'); if (f.length < 9) return;
    const name = f[0].trim(); if (!name || name.includes('?') || seen.has(name)) return;
    const clubs = f[7].split(',').map(s => { s = s.trim(); const m = s.match(/^(.*)\s(\d\d)$/); return m ? [m[1], yr2(+m[2])] : null; }).filter(Boolean);
    if (!clubs.length) return;
    const ov = {}; (f[9] || '').split(',').forEach(s => { const [a, b] = s.split('='); if (b) ov[yr2(+a)] = +b; });
    const p = { id: DB.length, name, nat: f[1], pos: f[2], born: yr2(+f[3]), peak: +f[4], peakY: yr2(+f[5]), end: yr2(+f[6]), clubs, tags: f[8] || '', ov };
    p.start = Math.max(1996, clubs[0][1], p.born + 17);
    p.realEnd = Math.min(p.end, 2026);
    p.retire = p.end >= 2026 ? Math.max(2026, p.born + (p.tags.includes('L') ? 38 : 35)) : p.end;
    if (p.start > p.realEnd) return;
    p.spans = clubs.map((c, i) => [c[0], c[1], i + 1 < clubs.length ? clubs[i + 1][1] - 1 : p.end]);
    { const w = name.split(' '); let k = w.length - 1; while (k > 0 && /^(de|De|di|Di|van|Van|der|Mac|El|Ben|Del|del|da|dos|Le|ter|Ter)$/.test(w[k - 1])) k--; p.short = w.slice(k).join(' '); if (w.length === 1) p.short = name; }
    if (['Xavi', 'Rodri', 'Pedri', 'Gavi', 'Koke', 'Pepe', 'Kaká', 'Ronaldinho', 'Neymar', 'Rivaldo', 'Cafu', 'Deco', 'Dida', 'Marcelo', 'Marquinhos', 'Casemiro', 'Fabinho', 'Jorginho', 'Vitinha', 'Isco', 'Juninho Pernambucano', 'Ronaldo Nazário', 'Lúcio', 'Edmílson', 'Juan', 'Cris', 'Dante', 'Miranda', 'Gabi', 'Raúl González', 'Joaquín', 'Vicente', 'Guti', 'Juanfran', 'Hulk', 'Jonas', 'Allan', 'Lauren', 'Silvinho', 'Rafinha', 'Raphinha', 'Rodrygo', 'Endrick', 'Pauleta', 'Mista', 'Aldair', 'Emerson', 'Danilo', 'Liedson', 'Naldo', 'Grafite', 'Aílton', 'Dede', 'Otávio', 'Pepê', 'Ederson', 'Alisson', 'Costinha', 'Maniche', 'Tiago Mendes', 'Nani', 'Pedro Rodríguez', 'Diego Ribas'].includes(name) || name.split(' ').length === 1) p.short = name.split(' ')[0];
    if (name === 'Ronaldo Nazário') p.short = 'Ronaldo R9';
    if (name === 'Cristiano Ronaldo') p.short = 'C. Ronaldo';
    seen.add(name); DB.push(p);
  });
})();

function rateAt(p, y) {
  const ed = typeof S !== 'undefined' && S && S.edits ? S.edits[p.id] : null;
  if (ed && ed[y] !== undefined) return ed[y];
  if (p.ov[y]) return clamp(p.ov[y] + (ed && ed.shift || 0), 40, 99);
  let r = p.peak; const L = p.tags.includes('L');
  if (y < p.peakY) { for (let t = y; t < p.peakY; t++) { const a = t - p.born; r -= a <= 20 ? 3 : a <= 23 ? 2.2 : a <= 26 ? 1.2 : 0.4; } }
  else for (let t = p.peakY + 1; t <= y; t++) { const a = t - p.born; let d = a <= 29 ? 0.6 : a <= 32 ? 1.6 : a <= 34 ? 2.6 : 3.5; if (L) d *= 0.5; r -= d; }
  return clamp(Math.round(r) + (ed && ed.shift || 0), 45, 99);
}
function realClubAt(p, y) { let c = p.clubs[0][0]; for (const [n, s] of p.clubs) if (s <= y) c = n; return c; }
const TEAMMATE_CACHE = {};
function realTeammates(a, b) {
  const k = a < b ? a + '_' + b : b + '_' + a; if (k in TEAMMATE_CACHE) return TEAMMATE_CACHE[k];
  const A = DB[a], B = DB[b]; let res = null;
  for (const x of A.spans) for (const y of B.spans) if (x[0] === y[0] && x[1] <= y[2] && y[1] <= x[2]) { res = x[0]; break; }
  return TEAMMATE_CACHE[k] = res;
}

const POS_GROUP = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', DM: 'MID', CM: 'MID', AM: 'MID', LW: 'ATT', RW: 'ATT', ST: 'ATT' };
const TPL = { ST: [-2, 3, -10, -3, -45, -5], LW: [3, -4, -6, 2, -45, -15], RW: [3, -4, -6, 2, -45, -15], AM: [-6, -4, 1, 1, -40, -15], CM: [-10, -10, 0, -5, -15, -6], DM: [-14, -20, -5, -12, 0, 0], CB: [-12, -40, -18, -25, 2, 0], LB: [0, -30, -10, -10, -5, -8], RB: [0, -30, -10, -10, -5, -8] };
const TAGB = { P: [8, 0, 0, 0, 0, 0], F: [0, 6, 0, 0, 0, 0], D: [0, 0, 0, 7, 0, 0], V: [0, 0, 7, 0, 0, 0], T: [0, 0, 0, 0, 6, 0], H: [0, 0, 0, 0, 0, 8], A: [0, 0, 0, 0, 0, 4], W: [0, 0, 3, 0, 0, 0], E: [0, 0, 0, 0, 0, 3], S: [0, 1, 2, 0, 0, 0] };
const ATTR_N = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
const GK_N = ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'];
const TAG_NAMES = { P: 'Pace', F: 'Finisher', D: 'Dribbler', V: 'Playmaker', T: 'Tackler', H: 'Physical', A: 'Aerial', W: 'Crosser', E: 'Engine', S: 'Set pieces', L: 'Longevity', K: 'Sweeper keeper', R: 'Shot stopper', N: "Doesn't press", Q: 'Genius IQ', X: 'Hothead' };
function makeAttrs(p, ovr, age, seed) {
  const j = k => Math.round((hash01(p.name + k + seed) - 0.5) * 6);
  if (p.pos === 'GK') {
    const a = GK_N.map((n, i) => ovr + j(n) + [0, -2, -8, 1, -20, 0][i]);
    if (p.tags.includes('K')) { a[2] += 9; a[4] += 10; }
    if (p.tags.includes('R')) { a[3] += 5; a[0] += 3; }
    return a.map(v => clamp(v, 30, 99));
  }
  const t = TPL[p.pos] || TPL.CM;
  const a = t.map((o, i) => ovr + o + j(ATTR_N[i]));
  for (const c of p.tags) if (TAGB[c]) TAGB[c].forEach((b, i) => a[i] += b);
  a[0] -= Math.max(0, age - 30) * 1.6;
  return a.map(v => clamp(Math.round(v), 25, 99));
}
function cardFor(p, y) {
  const age = y - p.born;
  const ovr = rateAt(p, y);
  const t = p.tags;
  const iq = clamp(Math.round(ovr - 8 + (t.includes('V') ? 6 : 0) + (t.includes('Q') ? 12 : 0) - (t.includes('X') ? 12 : 0) + Math.min(6, Math.max(0, age - 24)) + (hash01(p.name + 'iq') - 0.5) * 8), 40, 99);
  const wr = p.pos === 'GK' ? '–' : t.includes('N') ? 'Low' : (t.includes('E') || t.includes('T')) ? 'High' : 'Med';
  return { y, age, ovr, iq, wr, rclub: realClubAt(p, Math.min(y, 2026)), attrs: makeAttrs(p, ovr, age, y) };
}
function valueOf(pl) {
  const base = 2.2 * Math.pow(1.13, pl.ovr - 72);
  const a = pl.age; const af = a <= 21 ? 1.5 : a <= 24 ? 1.3 : a <= 27 ? 1.15 : a <= 29 ? 1 : a <= 31 ? 0.75 : a <= 33 ? 0.5 : 0.3;
  return r1(clamp(base * af, 0.2, 140));
}

// ---------- clubs & coaches ----------
const CLUBS = [
  ['Real Madrid', 'RMA', 100, '#f4f4f4', '#1c3d8f', 'S'], ['Barcelona', 'BAR', 98, '#a50044', '#edbb00', 'S'], ['Man Utd', 'MUN', 96, '#da291c', '#fbe122', 'N'],
  ['Bayern', 'FCB', 96, '#dc052d', '#ffffff', 'N'], ['Man City', 'MCI', 94, '#6cabdd', '#1c2c5b', 'N'], ['Liverpool', 'LIV', 94, '#c8102e', '#f6eb61', 'N'],
  ['Juventus', 'JUV', 93, '#111111', '#ffffff', 'S'], ['Chelsea', 'CHE', 92, '#034694', '#ffffff', 'N'], ['PSG', 'PSG', 92, '#004170', '#da291c', 'N'],
  ['Milan', 'MIL', 91, '#fb090b', '#111111', 'S'], ['Arsenal', 'ARS', 90, '#ef0107', '#ffffff', 'N'], ['Inter', 'INT', 89, '#0068a8', '#111111', 'S'],
  ['Atlético', 'ATM', 87, '#cb3524', '#272e61', 'S'], ['Dortmund', 'BVB', 85, '#fde100', '#111111', 'N'], ['Tottenham', 'TOT', 82, '#ffffff', '#132257', 'N'],
  ['Napoli', 'NAP', 82, '#12a0d7', '#ffffff', 'S'], ['Roma', 'ROM', 80, '#8e1f2f', '#f0bc42', 'S'], ['Leverkusen', 'B04', 80, '#e32221', '#111111', 'N'],
  ['Ajax', 'AJA', 80, '#ffffff', '#d2122e', 'N'], ['Porto', 'POR', 80, '#00428c', '#ffffff', 'S'], ['Benfica', 'BEN', 80, '#e83030', '#ffffff', 'S'],
  ['Valencia', 'VAL', 78, '#ffffff', '#ee7203', 'S'], ['Sevilla', 'SEV', 78, '#ffffff', '#d20a11', 'S'], ['Lazio', 'LAZ', 76, '#87d8f7', '#16234e', 'S'],
  ['Lyon', 'OL', 76, '#ffffff', '#1d2b5c', 'N'], ['Marseille', 'OM', 76, '#2faee0', '#ffffff', 'N'], ['Monaco', 'ASM', 74, '#e51b22', '#ffffff', 'N'],
  ['Sporting CP', 'SCP', 74, '#008057', '#ffffff', 'S'], ['PSV', 'PSV', 74, '#ed1c24', '#ffffff', 'N'], ['Galatasaray', 'GAL', 74, '#a90432', '#fdb912', 'S'],
];
const CONF_NAME = { N: 'North Conference', S: 'South Conference' };
const FAN_NICK = { RMA: 'LosBlancos', BAR: 'Cule', MUN: 'RedDevil', FCB: 'MiaSanMia', MCI: 'Cityzen', LIV: 'YNWA', JUV: 'Bianconero', CHE: 'BlueIsTheColour', PSG: 'Parisien', MIL: 'Rossonero', ARS: 'Gooner', INT: 'Nerazzurro', ATM: 'Colchonero', BVB: 'Schwarzgelb', TOT: 'COYS', NAP: 'Partenopeo', ROM: 'Giallorosso', B04: 'Werkself', AJA: 'Godenzonen', POR: 'Dragao', BEN: 'Aguia', VAL: 'Ches', SEV: 'Sevillista', LAZ: 'Aquilotto', OL: 'LesGones', OM: 'Olympien', ASM: 'Monegasque', SCP: 'LeaoForever', PSV: 'Boeren', GAL: 'Cimbom' };
const COACHES_RAW = [
  ['Pep Guardiola', 'ESP', 99, 'Possession', '4-3-3'], ['Sir Alex Ferguson', 'SCO', 98, 'Man-management', '4-4-2'], ['Carlo Ancelotti', 'ITA', 96, 'Balanced', '4-3-3'],
  ['José Mourinho', 'POR', 95, 'Counter', '4-2-3-1'], ['Jürgen Klopp', 'GER', 95, 'Gegenpress', '4-3-3'], ['Luis Enrique', 'ESP', 93, 'Possession', '4-3-3'],
  ['Zinedine Zidane', 'FRA', 92, 'Balanced', '4-3-3'], ['Diego Simeone', 'ARG', 91, 'Defensive', '4-4-2'], ['Jupp Heynckes', 'GER', 91, 'Balanced', '4-2-3-1'],
  ['Marcello Lippi', 'ITA', 91, 'Balanced', '4-3-1-2'], ['Arsène Wenger', 'FRA', 90, 'Attacking', '4-4-2'], ['Antonio Conte', 'ITA', 90, 'Wing-backs', '3-5-2'],
  ['Hansi Flick', 'GER', 90, 'High line', '4-2-3-1'], ['Xabi Alonso', 'ESP', 90, 'Wing-backs', '3-4-3'], ['Fabio Capello', 'ITA', 89, 'Defensive', '4-4-2'],
  ['Thomas Tuchel', 'GER', 89, 'Possession', '4-2-3-1'], ['Ottmar Hitzfeld', 'GER', 89, 'Balanced', '4-4-2'], ['Mikel Arteta', 'ESP', 88, 'Possession', '4-3-3'],
  ['Vicente del Bosque', 'ESP', 88, 'Balanced', '4-2-3-1'], ['Frank Rijkaard', 'NED', 87, 'Attacking', '4-3-3'], ['Simone Inzaghi', 'ITA', 87, 'Wing-backs', '3-5-2'],
  ['Arne Slot', 'NED', 87, 'Possession', '4-2-3-1'], ['Rafael Benítez', 'ESP', 86, 'Defensive', '4-2-3-1'], ['Massimiliano Allegri', 'ITA', 86, 'Pragmatic', '3-5-2'],
  ['Didier Deschamps', 'FRA', 86, 'Pragmatic', '4-2-3-1'], ['Louis van Gaal', 'NED', 86, 'Possession', '4-3-3'], ['Unai Emery', 'ESP', 85, 'Pragmatic', '4-4-2'],
  ['Guus Hiddink', 'NED', 85, 'Balanced', '4-4-2'], ['Luciano Spalletti', 'ITA', 85, 'Attacking', '4-3-3'], ['Gian Piero Gasperini', 'ITA', 85, 'Gegenpress', '3-4-3'],
  ['Mauricio Pochettino', 'ARG', 84, 'Gegenpress', '4-2-3-1'], ['Julian Nagelsmann', 'GER', 84, 'Gegenpress', '4-2-3-1'], ['Roberto Mancini', 'ITA', 84, 'Balanced', '4-4-2'],
  ['Vincent Kompany', 'BEL', 84, 'Possession', '4-2-3-1'], ['Maurizio Sarri', 'ITA', 83, 'Possession', '4-3-3'], ['Claudio Ranieri', 'ITA', 83, 'Counter', '4-4-2'],
  ['Ernesto Valverde', 'ESP', 83, 'Balanced', '4-3-3'], ['Luis Aragonés', 'ESP', 83, 'Balanced', '4-1-4-1'], ['Roberto De Zerbi', 'ITA', 82, 'Possession', '4-2-3-1'],
  ['Enzo Maresca', 'ITA', 82, 'Possession', '4-2-3-1'], ['Manuel Pellegrini', 'CHI', 82, 'Attacking', '4-4-2'], ['Jorge Jesus', 'POR', 81, 'Attacking', '4-4-2'],
  ['Ralf Rangnick', 'GER', 81, 'Gegenpress', '4-4-2'], ['Marcelo Bielsa', 'ARG', 81, 'Gegenpress', '3-4-3'], ['Lucien Favre', 'SUI', 80, 'Counter', '4-2-3-1'],
  ['Rúben Amorim', 'POR', 80, 'Wing-backs', '3-4-3'], ['Luiz Felipe Scolari', 'BRA', 80, 'Pragmatic', '4-2-3-1'], ['Laurent Blanc', 'FRA', 80, 'Possession', '4-3-3'],
  ['André Villas-Boas', 'POR', 79, 'High line', '4-3-3'], ['Erik ten Hag', 'NED', 79, 'Possession', '4-3-3'], ['Ronald Koeman', 'NED', 78, 'Balanced', '4-3-3'],
  ['Ange Postecoglou', 'AUS', 78, 'Attacking', '4-3-3'], ['Rudi Garcia', 'FRA', 77, 'Attacking', '4-3-3'], ['Paulo Fonseca', 'POR', 77, 'Possession', '4-2-3-1'],
];
const STYLE_PREFS = {
  'Possession': { pass: 'Short', press: 'High', tempo: 'Normal' }, 'Gegenpress': { press: 'High', tempo: 'Fast', line: 'High' },
  'Counter': { ment: 'Defensive', pass: 'Direct', line: 'Deep' }, 'Defensive': { ment: 'Defensive', line: 'Deep', press: 'Low' },
  'Attacking': { ment: 'Attacking', width: 'Wide' }, 'Wing-backs': { width: 'Wide', back3: true }, 'Balanced': {}, 'Pragmatic': { ment: 'Balanced', pass: 'Mixed' },
  'High line': { line: 'High', press: 'High' }, 'Man-management': {},
};
const TACTIC_OPTS = {
  ment: ['Defensive', 'Balanced', 'Attacking', 'All-out attack'], press: ['Low', 'Mid', 'High'], tempo: ['Slow', 'Normal', 'Fast'],
  width: ['Narrow', 'Normal', 'Wide'], line: ['Deep', 'Normal', 'High'], pass: ['Short', 'Mixed', 'Direct'],
  train: ['Balanced', 'Attacking', 'Defending', 'Fitness', 'Set pieces'], talk: ['Calm', 'Motivate', 'Demand more'],
};
function labelOf(k) { return { ment: 'Mentality', press: 'Pressing', tempo: 'Tempo', width: 'Width', line: 'Def. line', pass: 'Passing', train: 'Training', talk: 'Team talk', form: 'Formation' }[k] || k; }

// ---------- formations ----------
const FORMS = {
  '4-3-3': [['GK', 50, 6], ['LB', 14, 26], ['CB', 37, 20], ['CB', 63, 20], ['RB', 86, 26], ['CM', 28, 50], ['DM', 50, 40], ['CM', 72, 50], ['LW', 17, 76], ['ST', 50, 84], ['RW', 83, 76]],
  '4-4-2': [['GK', 50, 6], ['LB', 14, 26], ['CB', 37, 20], ['CB', 63, 20], ['RB', 86, 26], ['LM', 14, 54], ['CM', 38, 48], ['CM', 62, 48], ['RM', 86, 54], ['ST', 38, 82], ['ST', 62, 82]],
  '4-2-3-1': [['GK', 50, 6], ['LB', 14, 26], ['CB', 37, 20], ['CB', 63, 20], ['RB', 86, 26], ['DM', 37, 42], ['DM', 63, 42], ['LW', 17, 68], ['AM', 50, 64], ['RW', 83, 68], ['ST', 50, 86]],
  '3-5-2': [['GK', 50, 6], ['CB', 27, 22], ['CB', 50, 18], ['CB', 73, 22], ['LWB', 11, 50], ['CM', 32, 52], ['DM', 50, 40], ['CM', 68, 52], ['RWB', 89, 50], ['ST', 38, 82], ['ST', 62, 82]],
  '3-4-3': [['GK', 50, 6], ['CB', 27, 22], ['CB', 50, 18], ['CB', 73, 22], ['LWB', 11, 50], ['CM', 38, 46], ['CM', 62, 46], ['RWB', 89, 50], ['LW', 20, 75], ['ST', 50, 84], ['RW', 80, 75]],
  '5-3-2': [['GK', 50, 6], ['LWB', 10, 34], ['CB', 30, 20], ['CB', 50, 17], ['CB', 70, 20], ['RWB', 90, 34], ['CM', 30, 52], ['DM', 50, 42], ['CM', 70, 52], ['ST', 38, 80], ['ST', 62, 80]],
  '4-1-4-1': [['GK', 50, 6], ['LB', 14, 26], ['CB', 37, 20], ['CB', 63, 20], ['RB', 86, 26], ['DM', 50, 38], ['LM', 14, 60], ['CM', 38, 54], ['CM', 62, 54], ['RM', 86, 60], ['ST', 50, 84]],
  '4-3-1-2': [['GK', 50, 6], ['LB', 14, 26], ['CB', 37, 20], ['CB', 63, 20], ['RB', 86, 26], ['CM', 28, 46], ['DM', 50, 38], ['CM', 72, 46], ['AM', 50, 63], ['ST', 38, 83], ['ST', 62, 83]],
};
const PC = { GK: [0, 0], CB: [0, 1], LB: [-1, 1.2], RB: [1, 1.2], LWB: [-1, 2], RWB: [1, 2], DM: [0, 2], CM: [0, 2.6], LM: [-1, 2.8], RM: [1, 2.8], AM: [0, 3.4], LW: [-1, 3.8], RW: [1, 3.8], ST: [0, 4.4] };
function posPen(a, b) {
  if (a === b) return 0; if (a === 'GK' || b === 'GK') return 45;
  if ((a === 'LB' && b === 'LWB') || (a === 'RB' && b === 'RWB')) return 1;
  if ((a === 'LW' && b === 'LM') || (a === 'RW' && b === 'RM')) return 1.5;
  const [x1, y1] = PC[a], [x2, y2] = PC[b];
  return Math.abs(x1 - x2) * 2.5 + Math.abs(y1 - y2) * 5;
}
const SLOT_GROUP = s => s === 'GK' ? 'GK' : ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(s) ? 'DEF' : ['DM', 'CM', 'LM', 'RM'].includes(s) ? 'MID' : 'ATT';

const RIVALS = [['RMA', 'BAR', 'El Clásico'], ['RMA', 'ATM', 'Madrid Derby'], ['MIL', 'INT', 'Derby della Madonnina'], ['MUN', 'MCI', 'Manchester Derby'], ['MUN', 'LIV', 'North-West Derby'],
  ['ARS', 'TOT', 'North London Derby'], ['ROM', 'LAZ', 'Derby della Capitale'], ['BEN', 'SCP', 'Derby de Lisboa'], ['POR', 'BEN', 'O Clássico'], ['BVB', 'FCB', 'Der Klassiker'], ['JUV', 'INT', "Derby d'Italia"],
  ['PSG', 'OM', 'Le Classique'], ['AJA', 'PSV', 'De Topper'], ['OL', 'OM', 'Olympico'], ['CHE', 'ARS', 'London Derby'], ['LIV', 'MCI', 'Title Rivals'], ['BAR', 'VAL', 'Rivalry'], ['SEV', 'BAR', 'Rivalry'], ['GAL', 'JUV', 'Grudge Match'], ['NAP', 'JUV', 'Derby del Sole']];
function derbyName(a, b) { const sa = S.teams[a].short, sb = S.teams[b].short; const r = RIVALS.find(x => (x[0] === sa && x[1] === sb) || (x[0] === sb && x[1] === sa)); return r ? r[2] : null; }

// ---------- state ----------
let S = null, P = null;
const MAX_SQUAD = 22, MIN_SQUAD = 14, DRAFT_ROUNDS = 15;
const DIFF = {
  beginner: { name: 'Beginner', budget: 40, noise: 9, bonus: 1.6, desc: 'Bigger budget, weaker AI drafting, your team gets a small edge.' },
  pro: { name: 'Pro', budget: 30, noise: 3.5, bonus: 0, desc: 'The standard experience. Level playing field.' },
  ultimate: { name: 'Ultimate', budget: 22, noise: 1, bonus: -1.2, desc: 'Tight budget, sharp AI drafting, every match is a fight.' },
};
const diffOf = () => DIFF[(S && S.opts && S.opts.diff) || 'pro'] || DIFF.pro;
function buildDraftOrder(order, rounds, style) { const owner = []; for (let r = 0; r < rounds; r++) for (let i = 0; i < order.length; i++) owner.push(style === 'classic' || r % 2 === 0 ? order[i] : order[order.length - 1 - i]); return owner; }
function setDraftStyle(style) { const d = S.draft; S.opts.style = style; d.owner = buildDraftOrder(d.order, d.rounds, style); d.total = d.owner.length; }
function newState(userClubIdx, opts) {
  const st = {
    v: 2, season: 1, maxSeasons: 10, phase: 'predraft', userTeam: userClubIdx, opts: Object.assign({ finalTwoLegs: true, autoSubs: true, diff: 'pro', style: 'snake' }, opts || {}),
    players: [], teams: [], coaches: [], draft: null, gw: 0, fixtures: [], results: [], inbox: [], news: [], feed: [], totw: [], potm: [],
    playoffs: null, awards: null, history: [], offers: [], nego: {}, promises: [], legacy: { p: {}, club: {}, coach: {}, seasons: [] },
  };
  const HOLD = { GK: 0.08, CB: 0.18, LB: 0.12, RB: 0.12 };
  DB.forEach(p => {
    const y = ri(p.start, p.realEnd);
    const held = rnd() < (HOLD[p.pos] !== undefined ? HOLD[p.pos] : 0.35);
    st.players.push(Object.assign({ id: p.id, pos: p.pos, team: held ? -3 : -1, fit: 100, inj: 0, sus: 0, yel: 0, mor: 70, req: false, career: [] }, cardFor(p, y), { st: blankStats() }));
  });
  st.players.forEach(pl => pl.val = valueOf(pl));
  st.coaches = COACHES_RAW.map((c, i) => ({ id: i, name: c[0], nat: c[1], rating: c[2], style: c[3], form: c[4], team: -1 }));
  CLUBS.forEach((c, i) => st.teams.push({ id: i, name: c[0], short: c[1], rep: c[2], c1: c[3], c2: c[4], conf: c[5], budget: 30, squad: [], lineup: [], bench: [], coach: -1, tactics: defaultTactics(null), morale: 60, board: 60, captain: -1, pk: -1, user: i === userClubIdx, coachRound: ri(3, 12), earned: 0 }));
  st.teams[userClubIdx].budget = (DIFF[st.opts.diff] || DIFF.pro).budget;
  const order = shuffle(st.teams.map(t => t.id)); const owner = buildDraftOrder(order, DRAFT_ROUNDS, st.opts.style);
  st.draft = { kind: 'initial', order, owner, rounds: DRAFT_ROUNDS, pick: 0, total: owner.length, log: [] };
  st.edits = {};
  return st;
}
function blankStats() { return { app: 0, min: 0, g: 0, a: 0, xg: 0, xa: 0, sh: 0, sot: 0, kp: 0, dra: 0, drs: 0, tk: 0, int: 0, pas: 0, pc: 0, rt: 0, motm: 0, cs: 0, sv: 0, psxg: 0, ga: 0, yc: 0, rc: 0, totw: 0, starts: 0 }; }
function defaultTactics(co) {
  const t = { form: co ? co.form : '4-3-3', ment: 'Balanced', press: 'Mid', tempo: 'Normal', width: 'Normal', line: 'Normal', pass: 'Mixed', train: 'Balanced', talk: 'Calm' };
  if (co) { const pr = STYLE_PREFS[co.style] || {}; for (const k in pr) if (k !== 'back3') t[k] = pr[k]; }
  return t;
}
function coachFit(team) {
  const co = S.coaches[team.coach]; if (!co) return { fit: 0, bonus: -3, notes: ['No head coach: a caretaker is in charge'] };
  const pr = STYLE_PREFS[co.style] || {}; let n = 0, m = 0; const notes = [];
  for (const k in pr) { n++; if (k === 'back3') { if (team.tactics.form.startsWith('3') || team.tactics.form.startsWith('5')) m++; else notes.push('Prefers a back three'); } else if (team.tactics[k] === pr[k]) m++; else notes.push(`Prefers ${labelOf(k)}: ${pr[k]}`); }
  if (team.tactics.form === co.form) m += 0.5; else notes.push(`Favourite shape: ${co.form}`);
  const fit = n ? m / (n + 0.5) : (team.tactics.form === co.form ? 1 : 0.6);
  const bonus = (co.rating - 86) * 0.24 + fit * 2 + (co.style === 'Man-management' ? 1 : 0);
  return { fit, bonus, notes };
}

// ---------- chemistry ----------
function chemistry(ids, slotsById) {
  const pls = ids.map(id => P[id]).filter(Boolean);
  if (!pls.length) return { score: 50, bonus: 0, links: [], lazy: 0, vol: 0, iq: 70 };
  const iq = pls.reduce((s, p) => s + p.iq, 0) / pls.length;
  const links = [];
  for (let i = 0; i < pls.length; i++) for (let j = i + 1; j < pls.length; j++) { const c = realTeammates(pls[i].id, pls[j].id); if (c) links.push([pls[i].id, pls[j].id, c]); }
  const lazy = pls.filter(p => { const sl = (slotsById && slotsById[p.id]) || p.pos; return p.wr === 'Low' && (SLOT_GROUP(sl) === 'ATT' || sl === 'AM'); }).length;
  const vol = pls.filter(p => DB[p.id].tags.includes('X')).length;
  const score = clamp(Math.round(58 + (iq - 75) * 0.9 + Math.min(links.length, 7) * 2.6 - Math.max(0, lazy - 1) * 8 - vol * 3 - (vol >= 2 ? 6 : 0)), 10, 100);
  return { score, bonus: (score - 60) * 0.055, links, lazy, vol, iq };
}

// ---------- draft ----------
const DRAFT_T = { GK: [2, 2], CB: [3, 4], FB: [2, 3], MID: [3, 5], AMW: [2, 4], ST: [2, 3] };
const dgroup = pos => pos === 'GK' ? 'GK' : pos === 'CB' ? 'CB' : (pos === 'LB' || pos === 'RB') ? 'FB' : (pos === 'DM' || pos === 'CM') ? 'MID' : (pos === 'AM' || pos === 'LW' || pos === 'RW') ? 'AMW' : 'ST';
function isDrafting() { return S.phase === 'draft' || S.phase === 'sdraft'; }
function draftTeamOnClock() { const d = S.draft; return d.owner ? d.owner[d.pick] : (Math.floor(d.pick / 30) % 2 === 0 ? d.order[d.pick % 30] : d.order[29 - d.pick % 30]); }
function draftPool() { return S.players.filter(p => p.team === (S.draft && S.draft.kind === 'season' ? -4 : -1)); }
function teamPicks(t) { return S.draft.log.filter(l => l.team === t.id).length; }
function freePlayers() { return S.players.filter(p => p.team === -1); }
function freeCoaches() { return S.coaches.filter(c => c.team === -1); }
function groupCounts(team) { const c = { GK: 0, CB: 0, FB: 0, MID: 0, AMW: 0, ST: 0 }; team.squad.forEach(id => c[dgroup(P[id].pos)]++); return c; }
function aiDraftChoice(team) {
  if (team.squad.length >= MAX_SQUAD || !draftPool().length) return { pass: true };
  const c = groupCounts(team); const left = S.draft.owner.slice(S.draft.pick).filter(x => x === team.id).length;
  const needCoach = team.coach < 0 && S.draft.kind !== 'season' ? 1 : 0;
  let missing = needCoach; for (const g in DRAFT_T) missing += Math.max(0, DRAFT_T[g][0] - c[g]);
  const round = Math.floor(S.draft.pick / 30) + 1;
  const pool = draftPool().sort((a, b) => b.ovr - a.ovr).slice(0, 90);
  const bestCoach = freeCoaches().sort((a, b) => b.rating - a.rating)[0];
  if (needCoach && bestCoach) {
    if (left <= missing || round >= team.coachRound || (bestCoach.rating >= 95 && round >= 2 && rnd() < 0.2)) return { co: bestCoach.id };
  }
  let best = null, bs = -1e9;
  for (const pl of pool) {
    const g = dgroup(pl.pos); const [tg, mx] = DRAFT_T[g];
    let s = pl.ovr + rnd() * (team.user ? 3.5 : diffOf().noise) + (pl.age <= 23 ? 0.6 : 0) - (pl.age >= 34 ? 1 : 0);
    if (c[g] >= mx) s -= 40; else if (c[g] < tg) s += 2.5; else s -= 2.5;
    if (g === 'GK' && c.GK === 0 && round >= 3) s += 5; if (g === 'GK' && c.GK >= 1 && round < 9) s -= 6;
    if (S.draft.kind !== 'season' && left <= missing && c[g] >= tg) s -= 60;
    if (DB[pl.id].clubs.some(x => x[0] === team.name)) s += 1.2;
    if (s > bs) { bs = s; best = pl; }
  }
  return best ? { pl: best.id } : { pass: true };
}
function draftPick(choice) {
  const t = S.teams[draftTeamOnClock()];
  if (choice.pass) { S.draft.log.push({ pick: S.draft.pick, team: t.id, pass: true }); }
  else if (choice.co !== undefined) { if (t.coach >= 0) return false; const co = S.coaches[choice.co]; co.team = t.id; t.coach = co.id; t.tactics = defaultTactics(co); S.draft.log.push({ pick: S.draft.pick, team: t.id, co: co.id }); }
  else { const pl = P[choice.pl]; pl.team = t.id; t.squad.push(pl.id); S.draft.log.push({ pick: S.draft.pick, team: t.id, pl: pl.id }); }
  S.draft.pick++;
  if (S.draft.pick >= S.draft.total) { if (S.draft.kind === 'season') finishSeasonDraft(); else finishDraft(); }
  return true;
}
function draftAdvanceAI(stopAtUser) { while (isDrafting()) { const t = S.teams[draftTeamOnClock()]; if (t.user && stopAtUser) return; draftPick(aiDraftChoice(t)); } }
const pickValue = n => 100 * Math.exp(-n / 70);
function pickLabel(n) { return `R${Math.floor(n / 30) + 1} · #${n + 1}`; }
function teamFuturePicks(tid) { const d = S.draft; const out = []; for (let i = d.pick; i < d.total; i++) if (d.owner[i] === tid) out.push(i); return out; }
function evalPickTrade(mine, theirs) {
  const d = S.draft; if (!isDrafting()) return { ok: false, msg: 'Pick trades only happen during a draft.' };
  if (!mine.length || !theirs.length) return { ok: false, msg: 'Pick at least one pick on each side.' };
  const other = d.owner[theirs[0]];
  if (mine.some(i => d.owner[i] !== S.userTeam || i < d.pick) || theirs.some(i => d.owner[i] !== other || i < d.pick)) return { ok: false, msg: 'Those picks are no longer available.' };
  const give = mine.reduce((s, i) => s + pickValue(i), 0), get = theirs.reduce((s, i) => s + pickValue(i), 0);
  const need = get * 1.1;
  return { ok: give >= need, give, get: need, other, msg: give >= need ? `${S.teams[other].name} would accept.` : `${S.teams[other].name} want more value back.` };
}
function doPickTrade(mine, theirs) {
  const e2 = evalPickTrade(mine, theirs); if (!e2.ok) return e2;
  const d = S.draft; mine.forEach(i => d.owner[i] = e2.other); theirs.forEach(i => d.owner[i] = S.userTeam);
  pushNews(`🔁 Pick trade: ${S.teams[S.userTeam].name} get ${theirs.map(pickLabel).join(' + ')} from ${S.teams[e2.other].name} for ${mine.map(pickLabel).join(' + ')}.`);
  return { ok: true, msg: `Trade done! You now own ${theirs.map(pickLabel).join(' + ')}.` };
}
function aiPickTrades() {
  // occasional AI-AI swaps for flavour
  const d = S.draft; if (rnd() > 0.04) return;
  const i = d.pick + ri(1, 25), j = i + ri(5, 40); if (j >= d.total) return; const a = d.owner[i], b = d.owner[j];
  if (a === b || S.teams[a].user || S.teams[b].user) return;
  const k = j + ri(10, 60); if (k >= d.total || d.owner[k] !== b) return;
  d.owner[i] = b; d.owner[j] = a; d.owner[k] = a;
  pushNews(`🔁 ${S.teams[b].name} trade up to ${pickLabel(i)} with ${S.teams[a].name}.`);
}
function finishDraft() {
  S.phase = 'preseason';
  S.teams.forEach(t => {
    if (t.coach < 0) { const c = freeCoaches().sort((a, b) => b.rating - a.rating)[0]; if (c) { c.team = t.id; t.coach = c.id; t.tactics = defaultTactics(c); if (t.user) pushInbox(`📋 You didn't draft a coach, so the board appointed ${c.name} (${c.rating}).`); } }
    if (!t.user) aiFillSquad(t, 17);
  });
  S.teams.forEach(t => { setCaptainPK(t); autoLineup(t); });
  buildFixtures();
  pushNews(`The ${S.season === 1 ? 'inaugural ' : ''}Super League draft is complete. The pre-season window is open, so sign free agents to build depth.`);
  feedEvent('draft');
}
function aiFillSquad(t, n) {
  while (t.squad.length < n) {
    const c = groupCounts(t); let need = null; for (const g in DRAFT_T) if (c[g] < DRAFT_T[g][0]) { need = g; break; }
    const cands = freePlayers().filter(p => !need || dgroup(p.pos) === need).filter(p => p.val * 0.15 <= Math.max(0.5, t.budget * 0.3)).sort((a, b) => b.ovr - a.ovr);
    const fa = cands[0] || freePlayers().sort((a, b) => a.val - b.val)[0]; if (!fa) break;
    const fee = Math.min(t.budget, r1(fa.val * 0.15)); transferPlayer(fa, t.id, fee, true);
  }
}
function setCaptainPK(t) {
  const xi = t.squad.map(id => P[id]); if (!xi.length) return;
  if (t.captain === -1 || !P[t.captain] || P[t.captain].team !== t.id) t.captain = xi.slice().sort((a, b) => (b.ovr + b.age * 0.3 + b.iq * 0.1) - (a.ovr + a.age * 0.3 + a.iq * 0.1))[0].id;
  if (t.pk === -1 || !P[t.pk] || P[t.pk].team !== t.id) { const o = xi.filter(p => p.pos !== 'GK').sort((a, b) => b.attrs[1] - a.attrs[1])[0]; t.pk = o ? o.id : -1; }
  const spScore = p => p.attrs[2] + (DB[p.id].tags.includes('S') ? 12 : 0);
  if (t.fk === undefined || t.fk === -1 || !P[t.fk] || P[t.fk].team !== t.id) { const o = xi.filter(p => p.pos !== 'GK').sort((a, b) => (spScore(b) + b.attrs[1]) - (spScore(a) + a.attrs[1]))[0]; t.fk = o ? o.id : -1; }
  if (t.ck === undefined || t.ck === -1 || !P[t.ck] || P[t.ck].team !== t.id) { const o = xi.filter(p => p.pos !== 'GK').sort((a, b) => spScore(b) - spScore(a))[0]; t.ck = o ? o.id : -1; }
}

// ---------- lineup ----------
function moraleMod(pl) { return (pl.mor - 60) * 0.035 - (pl.req ? 1.2 : 0); }
function effRating(pl, slot, fit) { const f = fit === undefined ? pl.fit : fit; let r = pl.ovr - posPen(pl.pos, slot) + moraleMod(pl); r -= Math.max(0, 88 - f) * 0.22; return r; }
function available(pl) { return pl.inj <= 0 && pl.sus <= 0; }
function autoLineup(t, rotate) {
  const slots = FORMS[t.tactics.form];
  const avail = t.squad.map(id => P[id]).filter(available);
  const pairs = [];
  slots.forEach((s, si) => avail.forEach(pl => { let e = effRating(pl, s[0]); if (rotate && pl.fit < 72) e -= 8; pairs.push([e, si, pl.id]); }));
  pairs.sort((a, b) => b[0] - a[0]);
  const used = new Set(), filled = new Array(slots.length).fill(null);
  for (const [e, si, id] of pairs) { if (filled[si] !== null || used.has(id)) continue; filled[si] = id; used.add(id); }
  t.lineup = filled;
  t.bench = avail.filter(p => !used.has(p.id)).sort((a, b) => b.ovr - a.ovr).slice(0, 9).map(p => p.id);
}
function validateLineup(t) {
  const slots = FORMS[t.tactics.form];
  if (!t.lineup || t.lineup.length !== slots.length) { autoLineup(t); return; }
  const seen = new Set();
  t.lineup = t.lineup.map(id => (id !== null && P[id] && P[id].team === t.id && available(P[id]) && !seen.has(id) && seen.add(id)) ? id : null);
  if (t.lineup.some(x => x === null)) {
    const avail = t.squad.filter(id => available(P[id]) && !t.lineup.includes(id));
    t.lineup = t.lineup.map((id, i) => { if (id !== null) return id; avail.sort((a, b) => effRating(P[b], slots[i][0]) - effRating(P[a], slots[i][0])); return avail.length ? avail.shift() : null; });
  }
  const used = new Set(t.lineup);
  t.bench = t.squad.filter(id => !used.has(id) && available(P[id])).sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 9);
}

// ---------- fixtures (two conferences: 14 conference games + 1 cross-conference) ----------
function buildFixtures() {
  const confs = { N: shuffle(S.teams.filter(t => t.conf === 'N').map(t => t.id)), S: shuffle(S.teams.filter(t => t.conf === 'S').map(t => t.id)) };
  const rr = ids => { const arr = ids.concat([-1]); const n = arr.length; const rounds = []; for (let r = 0; r < n - 1; r++) { const ms = []; let bye = null; for (let i = 0; i < n / 2; i++) { const a = arr[i], b = arr[n - 1 - i]; if (a === -1) bye = b; else if (b === -1) bye = a; else ms.push((r + i) % 2 === 0 ? { h: a, a: b } : { h: b, a: a }); } rounds.push({ ms, bye }); arr.splice(1, 0, arr.pop()); } return rounds; };
  const RN = rr(confs.N), RS = rr(confs.S);
  S.fixtures = RN.map((r, i) => { const ms = r.ms.concat(RS[i].ms); ms.push(i % 2 ? { h: r.bye, a: RS[i].bye, x: 1 } : { h: RS[i].bye, a: r.bye, x: 1 }); return ms; });
  S.results = S.fixtures.map(() => []); S.gw = 0;
  S.table = {}; S.teams.forEach(t => S.table[t.id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, xgf: 0, xga: 0, pts: 0, form: [] });
}
const NGW = 15;
function standings(conf) {
  return S.teams.filter(t => !conf || t.conf === conf).map(t => Object.assign({ id: t.id }, S.table[t.id])).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}
function confPos(id) { const t = S.teams[id]; return standings(t.conf).findIndex(r => r.id === id) + 1; }

// ---------- match engine (minute by minute) ----------
const SHOOT_W = { ST: 4.4, LW: 3.2, RW: 3.2, AM: 3, LM: 1.8, RM: 1.8, CM: 1.3, DM: 0.5, LWB: 0.6, RWB: 0.6, LB: 0.4, RB: 0.4, CB: 0.55, GK: 0 };
const CREATE_W = { AM: 3.2, LW: 2.8, RW: 2.8, CM: 2.2, LM: 2.4, RM: 2.4, ST: 1.5, LWB: 1.8, RWB: 1.8, LB: 1.5, RB: 1.5, DM: 1.1, CB: 0.3, GK: 0.02 };
const PASS_B = { GK: 28, CB: 55, LB: 48, RB: 48, LWB: 46, RWB: 46, DM: 66, CM: 60, LM: 42, RM: 42, AM: 46, LW: 34, RW: 34, ST: 22 };
const DRIB_F = { LW: 1.4, RW: 1.4, LM: 1.1, RM: 1.1, AM: 1.0, ST: 0.75, CM: 0.5, LWB: 0.6, RWB: 0.6, LB: 0.45, RB: 0.45, DM: 0.3, CB: 0.1, GK: 0 };
const TACK_F = { DM: 1.35, CB: 1.0, LB: 1.1, RB: 1.1, LWB: 1.0, RWB: 1.0, CM: 0.9, LM: 0.6, RM: 0.6, AM: 0.35, LW: 0.3, RW: 0.3, ST: 0.2, GK: 0 };

const INSTR = {
  cutin: { g: ['ATT'], lbl: 'Cut inside', up: 'More shots and goals for him', down: 'Less width, fewer crosses', att: 0.4, wide: -1, shoot: 1.6, create: 0.85 },
  wide: { g: ['ATT', 'MID'], lbl: 'Stay wide', up: 'Stretches the defence, more crosses and assists', down: 'Fewer shots for him', wide: 1, shoot: 0.7, create: 1.35 },
  forward: { g: ['ATT'], lbl: 'Stay forward', up: 'Fresher legs, deadly on the counter', down: 'No defensive help, so the team concedes more', att: 0.6, def: -0.7, fat: 0.75 },
  comeshort: { g: ['ATT'], lbl: 'Come short', up: 'Links play, more key passes', down: 'Fewer shots, less threat in behind', mid: 0.5, shoot: 0.7, create: 1.4 },
  pressfront: { g: ['ATT', 'MID'], lbl: 'Press from the front', up: 'Team press works much better', down: 'Tires much faster', press: 0.3, def: 0.25, fat: 1.35 },
  getforward: { g: ['MID'], lbl: 'Get forward', up: 'Late runs into the box, more goals', down: 'Leaves gaps behind him', att: 0.5, def: -0.5, shoot: 1.5 },
  holdpos: { g: ['MID'], lbl: 'Hold position', up: 'Protects the back line', down: 'Less support in attack', def: 0.6, att: -0.4, shoot: 0.6 },
  playmaker: { g: ['MID'], lbl: 'Playmaker', up: 'Team keeps the ball, more key passes', down: 'Fewer tackles, opponents target him', mid: 0.6, create: 1.5, def: -0.3 },
  boxtobox: { g: ['MID'], lbl: 'Box-to-box', up: 'Helps in both boxes', down: 'Tires very quickly', att: 0.3, def: 0.3, fat: 1.4 },
  overlap: { g: ['DEF'], wideOnly: true, lbl: 'Overlap', up: 'Extra width and crosses', down: 'Leaves space behind him', wide: 1, create: 1.6, att: 0.2, def: -0.5, fat: 1.15 },
  stayback: { g: ['DEF'], lbl: 'Stay back', up: 'Rock solid defensively', down: 'Adds nothing going forward', def: 0.5, create: 0.5, att: -0.2 },
  ballplay: { g: ['DEF'], lbl: 'Ball-playing', up: 'Better build-up and possession', down: 'Risky: the odd costly error', mid: 0.5, err: 0.05 },
  mark: { g: ['DEF', 'MID'], lbl: 'Man-mark', up: 'Shuts down their best attacker', down: 'Tires faster, gets dragged out', def: 0.5, fat: 1.2, mid: -0.2 },
  sweeper: { g: ['GK'], lbl: 'Sweeper keeper', up: 'Covers a high line against fast forwards', down: 'Sometimes caught out of his goal', cover: 1, err: 0.03 },
  online: { g: ['GK'], lbl: 'Stay on line', up: 'Better at stopping shots', down: 'A high line becomes riskier', gk: 1.5, cover: -1 },
};
function instrFor(t, id, slot) { const k = t.instr && t.instr[id]; const d = k && INSTR[k]; if (!d) return null; if (!d.g.includes(SLOT_GROUP(slot))) return null; return d; }
function sideProfile(L, s) {
  const sd = L.sides[s]; const t = sd.t;
  const on = sd.on.filter(x => x.to === null);
  const g = { GK: [], DEF: [], MID: [], ATT: [] };
  on.forEach(x => { x.eff = effRating(P[x.id], x.slot, L.fit[x.id]); g[SLOT_GROUP(x.slot)].push(x); });
  const avg = (a, d) => a.length ? a.reduce((s, x) => s + x.eff, 0) / a.length : d;
  const wing = on.filter(x => ['LB', 'RB', 'LWB', 'RWB'].includes(x.slot));
  const dm = on.filter(x => x.slot === 'DM');
  const missing = 11 - on.length;
  let att = avg(g.ATT, 60) * 0.65 + avg(g.MID, 60) * 0.25 + avg(wing, 60) * 0.10;
  let mid = avg(g.MID, 60) * 0.7 + avg(g.ATT, 60) * 0.15 + avg(g.DEF, 60) * 0.15;
  let def = avg(g.DEF, 55) * 0.72 + (dm.length ? avg(dm, 60) : avg(g.MID, 60)) * 0.2 + avg(g.GK, 45) * 0.08;
  const slotsById = {}; on.forEach(x => slotsById[x.id] = x.slot);
  const ch = chemistry(on.map(x => x.id), slotsById);
  const lazy = on.filter(x => P[x.id].wr === 'Low' && ['ATT'].includes(SLOT_GROUP(x.slot)) || (P[x.id].wr === 'Low' && x.slot === 'AM')).length;
  const cf = coachFit(t);
  const b = cf.bonus + (t.morale - 60) * 0.03 + ch.bonus + (t.user ? diffOf().bonus : 0);
  att += b; mid += b; def += b;
  att -= missing * 3; mid -= missing * 4; def -= missing * 4;
  let wideX = 0, pressX = 0, err = 0, cover = 0, gkX = 0;
  on.forEach(x => { const d = instrFor(t, x.id, x.slot); if (!d) return; att += d.att || 0; def += d.def || 0; mid += d.mid || 0; wideX += d.wide || 0; pressX += d.press || 0; err += d.err || 0; cover += d.cover || 0; gkX += d.gk || 0; });
  if (L.derby) { att += 0.5; def -= 0.3; }
  const gk = (g.GK[0] ? g.GK[0].eff : 40) + gkX;
  const pace = a => a.length ? a.reduce((s, x) => s + (P[x.id].attrs[0] || 60), 0) / a.length : 60;
  return { att, mid, def, gk, chem: ch, lazy, pressX, err, cover, attPace: pace(g.ATT), wideQ: wideX + on.filter(x => ['LB', 'RB', 'LWB', 'RWB', 'LW', 'RW', 'LM', 'RM'].includes(x.slot) && /[WP]/.test(DB[x.id].tags)).length, aerial: g.ATT.filter(x => DB[x.id].tags.includes('A')).length, coach: cf };
}
function tacticMult(t, A, B) {
  let o = 1, d = 1;
  o *= { 'Defensive': 0.8, 'Balanced': 1, 'Attacking': 1.14, 'All-out attack': 1.28 }[t.ment];
  d *= { 'Defensive': 0.8, 'Balanced': 1, 'Attacking': 1.1, 'All-out attack': 1.28 }[t.ment];
  const pressEff = clamp(1 - A.lazy * 0.35 + A.pressX, 0, 1.6);
  if (t.press === 'High') { o *= 1 + 0.06 * pressEff; d *= 1 - 0.03 * pressEff; } else if (t.press === 'Low') { o *= 0.95; d *= 0.95; }
  if (t.line === 'High') { o *= 1.03; d *= 1 + (B.attPace - 78) * 0.008 * (A.cover > 0 ? 0.4 : A.cover < 0 ? 1.5 : 1); } else if (t.line === 'Deep') { o *= 0.95; d *= 0.92; }
  if (t.tempo === 'Fast') { o *= 1.04; d *= 1.04; } else if (t.tempo === 'Slow') { o *= 0.96; d *= 0.95; }
  if (t.width === 'Wide') o *= 1 + (A.wideQ - 2) * 0.015; else if (t.width === 'Narrow') { o *= 0.98; d *= 0.97; }
  if (t.pass === 'Direct') o *= 1 + (A.aerial - 0.5) * 0.03 + (A.attPace - 80) * 0.003; else if (t.pass === 'Short') d *= 0.98;
  if (t.train === 'Attacking') o *= 1.03; else if (t.train === 'Defending') d *= 0.97; else if (t.train === 'Set pieces') o *= 1.015;
  // non-pressing forwards: dangerous going forward, but the team leaks more
  o *= 1 + A.lazy * 0.035; d *= 1 + A.lazy * 0.075 + A.err;
  return [o, d];
}
function recalc(L) {
  const A = sideProfile(L, 0), B = sideProfile(L, 1); L.prof = [A, B];
  const th = L.sides[0].t.tactics, ta = L.sides[1].t.tactics;
  const [ho, hd] = tacticMult(th, A, B), [ao, ad] = tacticMult(ta, B, A);
  const ha = L.opts.neutral ? 1 : 1.1, aa = L.opts.neutral ? 1 : 0.92;
  const talk = (t, und) => t.talk === 'Motivate' ? (und ? 1.04 : 0.99) : t.talk === 'Demand more' ? (und ? 0.98 : 1.04) : 1;
  const hs = A.att + A.def, as = B.att + B.def;
  let lh = 1.15 * Math.exp((A.att - B.def) * 0.07 + (A.mid - B.mid) * 0.03) * ha * ho * ad * talk(th, as > hs + 2) * L.luck[0];
  let la = 1.15 * Math.exp((B.att - A.def) * 0.07 + (B.mid - A.mid) * 0.03) * aa * ao * hd * talk(ta, hs > as + 2) * L.luck[1];
  L.lam = [clamp(lh, 0.12, 4.8), clamp(la, 0.12, 4.8)];
  const padj = t => (t.pass === 'Short' ? 4 : t.pass === 'Direct' ? -4 : 0) + (t.press === 'High' ? 2 : t.press === 'Low' ? -3 : 0) + (t.ment === 'Defensive' ? -4 : t.ment === 'Attacking' ? 2 : t.ment === 'All-out attack' ? 4 : 0) + (t.tempo === 'Slow' ? 2 : 0);
  L.possT = clamp(50 + (A.mid - B.mid) * 1.3 + padj(th) - padj(ta), 26, 74);
}
function newPS(L, id, side, slot, from, sub) { L.ps[id] = { side, slot, from, to: null, sub: !!sub, clr: 0, g: 0, a: 0, xg: 0, xa: 0, sh: 0, sot: 0, kp: 0, dra: 0, drs: 0, tk: 0, int: 0, pas: 0, pc: 0, sv: 0, psxg: 0, ga: 0, yc: 0, rc: 0, rt: 6 }; }
function startMatch(home, away, opts) {
  opts = opts || {};
  const L = { h: home.id, a: away.id, derby: derbyName(home.id, away.id), opts, min: 0, end: 90, sides: [], ev: [], ps: {}, fit: {}, hg: 0, ag: 0, hxg: 0, axg: 0, hsh: 0, ash: 0, hsot: 0, asot: 0, possSum: 0, done: false, luck: [0.9 + rnd() * 0.2, 0.9 + rnd() * 0.2], aet: false, pens: null };
  [home, away].forEach((t, s) => {
    validateLineup(t);
    const slots = FORMS[t.tactics.form];
    const on = []; t.lineup.forEach((id, i) => { if (id !== null) { on.push({ id, slot: slots[i][0], from: 0, to: null }); newPS(L, id, s, slots[i][0], 0); L.fit[id] = P[id].fit; } });
    L.sides.push({ t, on, bench: t.bench.slice(), subs: 5, red: 0, manual: false });
    t.bench.forEach(id => L.fit[id] = P[id].fit);
  });
  recalc(L);
  L.ev.push({ m: 0, t: 'ko' });
  return L;
}
const onPitch = (L, s) => L.sides[s].on.filter(x => x.to === null);
function stepMinute(L) {
  if (L.done) return;
  L.min++; const m = L.min;
  for (let s = 0; s < 2; s++) {
    const t = L.sides[s].t.tactics;
    onPitch(L, s).forEach(x => { const pl = P[x.id]; const tg = DB[x.id].tags; const ins = instrFor(L.sides[s].t, x.id, x.slot); L.fit[x.id] = Math.max(25, L.fit[x.id] - (pl.pos === 'GK' ? 0.03 : 0.13 * (ins && ins.fat || 1) * (t.press === 'High' ? 1.25 : t.press === 'Low' ? 0.85 : 1) * (t.tempo === 'Fast' ? 1.1 : 1) * (tg.includes('E') ? 0.75 : 1) * (pl.age >= 32 ? 1.15 : 1))); });
  }
  if (m % 15 === 0) recalc(L);
  L.possSum += L.possT;
  const sh0 = L.hsh, sh1 = L.ash, g0 = L.hg, g1 = L.ag;
  for (let s = 0; s < 2; s++) {
    const lam = L.lam[s] * (m > 75 ? 1.12 : 1);
    if (rnd() < lam / 90 / 0.105) shotEvent(L, s, m);
    if (rnd() < 0.0029 * (L.derby ? 1.8 : 1)) cardEvent(L, s, m, false);
    if (rnd() < 0.00025) cardEvent(L, s, m, true);
    if (!(L.opts.live && s === L.opts.userSide && L.sides[s].manual) && !(L.opts.live && s === L.opts.userSide && !S.opts.autoSubs)) aiSubs(L, s, m);
  }
  { let v = (L.possT - 50) / 45 + (rnd() - 0.5) * 0.5 + (L.hsh - sh0) * 1.3 - (L.ash - sh1) * 1.3 + (L.hg - g0) * 1.5 - (L.ag - g1) * 1.5; (L.mom || (L.mom = [])).push(clamp(v, -3, 3));
    L.ball = clamp((L.ball === undefined ? 50 : L.ball) + v * 9 + (rnd() - 0.5) * 18, 4, 96); if (L.hsh > sh0) L.ball = 92; if (L.ash > sh1) L.ball = 8; }
  if (m === 45) L.ev.push({ m, t: 'ht' });
  if (m >= L.end) {
    if (L.opts.decider && !L.aet && L.end === 90) {
      const a = aggNow(L); if (a[0] === a[1]) { L.end = 120; L.aet = true; L.ev.push({ m, t: 'et' }); return; }
    }
    if (L.opts.decider && L.aet) { const a = aggNow(L); if (a[0] === a[1]) { L.pens = penalties(L); L.ev.push({ m, t: 'pens', pens: L.pens }); } }
    L.done = true; L.ev.push({ m, t: 'ft' });
  }
}
function aggNow(L) { const d = L.opts.decider; return [d.before[0] + L.hg, d.before[1] + L.ag]; }
function aiSubs(L, s, m) {
  const sd = L.sides[s]; if (sd.subs <= 0 || !sd.bench.length) return;
  if (![58, 66, 74, 81].includes(m)) return;
  const cands = onPitch(L, s).filter(x => x.slot !== 'GK').sort((a, b) => L.fit[a.id] - L.fit[b.id]);
  const o = cands[0]; if (!o) return;
  if (L.fit[o.id] > 72 && rnd() < 0.6) return;
  const inn = sd.bench.slice().sort((a, b) => effRating(P[b], o.slot, L.fit[b]) - effRating(P[a], o.slot, L.fit[a]))[0];
  if (!inn) return;
  if (effRating(P[inn], o.slot, L.fit[inn]) < effRating(P[o.id], o.slot, L.fit[o.id]) - 6) return;
  doSub(L, s, o.id, inn);
}
function doSub(L, s, outId, inId) {
  const sd = L.sides[s]; const o = sd.on.find(x => x.id === outId && x.to === null); if (!o || sd.subs <= 0 || !sd.bench.includes(inId)) return false;
  o.to = L.min; L.ps[outId].to = L.min; sd.subs--; sd.bench = sd.bench.filter(i => i !== inId);
  sd.on.push({ id: inId, slot: o.slot, from: L.min, to: null }); newPS(L, inId, s, o.slot, L.min, true);
  L.ev.push({ m: L.min, side: s, t: 'sub', p: inId, out: outId });
  recalc(L); return true;
}
function liveSetTactic(L, s, k, v) {
  const t = L.sides[s].t; t.tactics[k] = v;
  if (k === 'form') {
    const slots = FORMS[v].map(x => x[0]); const on = onPitch(L, s); const used = new Set(); const pairs = [];
    slots.forEach((sl, si) => on.forEach(x => pairs.push([effRating(P[x.id], sl, L.fit[x.id]), si, x.id])));
    pairs.sort((a, b) => b[0] - a[0]); const filled = {};
    for (const [e, si, id] of pairs) { if (filled[si] !== undefined || used.has(id)) continue; filled[si] = id; used.add(id); }
    on.forEach(x => { const si = Object.keys(filled).find(k2 => filled[k2] === x.id); if (si !== undefined) { x.slot = slots[si]; L.ps[x.id].slot = slots[si]; } });
    L.ev.push({ m: L.min, side: s, t: 'shape', v });
  }
  recalc(L);
}
function cardEvent(L, s, m, straight) {
  const on = onPitch(L, s).filter(x => x.slot !== 'GK'); if (!on.length) return;
  const x = pickW(on, y => TACK_F[y.slot] + 0.2 + (DB[y.id].tags.includes('X') ? 1 : 0) + (DB[y.id].tags.includes('T') ? 0.4 : 0));
  const ps = L.ps[x.id];
  if (straight || ps.yc) { ps.rc = 1; x.to = m; ps.to = m; L.sides[s].red++; L.ev.push({ m, side: s, t: 'rc', p: x.id }); recalc(L); }
  else { ps.yc = 1; L.ev.push({ m, side: s, t: 'yc', p: x.id }); }
}
function shotEvent(L, side, minute) {
  const T = L.sides[side], D = L.sides[1 - side];
  const onp = onPitch(L, side); if (!onp.length) return;
  const gkx = onPitch(L, 1 - side).find(x => x.slot === 'GK'); const gk = gkx ? P[gkx.id] : null;
  const gkEff = gk ? effRating(gk, 'GK', L.fit[gk.id]) : 45;
  const setPiece = rnd() < 0.2; let pen = false;
  let xg = clamp(-Math.log(1 - rnd() * 0.995) * 0.105, 0.01, 0.82);
  let shooter;
  if (rnd() < 0.022) { pen = true; xg = 0.78; shooter = onp.find(x => x.id === T.t.pk) || pickW(onp, x => SHOOT_W[x.slot] * P[x.id].attrs[1]); }
  else if (setPiece && rnd() < 0.22 && onp.find(x => x.id === T.t.fk)) { shooter = onp.find(x => x.id === T.t.fk); xg = clamp(0.05 + ((P[shooter.id].attrs[1] || 60) - 75) * 0.002 + (DB[shooter.id].tags.includes('S') ? 0.03 : 0), 0.03, 0.12); var directFK = true; }
  else shooter = pickW(onp, x => { const pl = P[x.id]; const tg = DB[pl.id].tags; const ins = instrFor(T.t, x.id, x.slot); let w = (setPiece && x.slot === 'CB' ? 1.6 : SHOOT_W[x.slot]) * Math.pow((pl.attrs[1] || 30) / 75, 2) * (ins && ins.shoot || 1); if (tg.includes('F')) w *= 1.25; if (setPiece && tg.includes('A')) w *= 1.8; return w; });
  const sp = P[shooter.id]; const ps = L.ps[shooter.id];
  let creator = null;
  if (!pen && !(typeof directFK !== 'undefined' && directFK) && rnd() < 0.8) {
    const cands = onp.filter(x => x.id !== shooter.id); const ck = setPiece ? cands.find(x => x.id === T.t.ck) : null;
    creator = ck && rnd() < 0.7 ? ck : pickW(cands, x => { const pl = P[x.id]; const tg = DB[pl.id].tags; const ins = instrFor(T.t, x.id, x.slot); let w = CREATE_W[x.slot] * Math.pow((pl.attrs[2] || 40) / 75, 3) * (pl.iq / 80) * (ins && ins.create || 1); if (tg.includes('V')) w *= 1.3; if (tg.includes('W') && ['LB', 'RB', 'LWB', 'RWB', 'RW', 'LW', 'RM', 'LM'].includes(x.slot)) w *= 1.4; if (setPiece && tg.includes('S')) w *= 2.5; return w; });
    if (creator) { L.ps[creator.id].kp++; L.ps[creator.id].xa += xg; }
  }
  ps.sh++; ps.xg += xg; if (side === 0) { L.hxg += xg; L.hsh++; } else { L.axg += xg; L.ash++; }
  const sho = sp.attrs[1] || 40;
  const fm = clamp(1 + (sho - 83) * 0.011 + (DB[sp.id].tags.includes('F') ? 0.04 : 0), 0.55, 1.35);
  const kf = clamp(1 - (gkEff - 81) * 0.014, 0.6, 1.4);
  const pOn = clamp(0.3 + (sho - 75) * 0.006 + xg * 0.5, 0.2, 0.85);
  const ev = { m: minute, side, p: shooter.id, xg, pen, sp: setPiece, fk: typeof directFK !== 'undefined' && directFK };
  if (rnd() < pOn) {
    ps.sot++; if (side === 0) L.hsot++; else L.asot++;
    const psxg = clamp(xg * fm / pOn, 0.01, 0.97);
    if (gk) L.ps[gk.id].psxg += psxg;
    if (rnd() < psxg * kf) {
      ps.g++; if (side === 0) L.hg++; else L.ag++;
      if (gk) L.ps[gk.id].ga++;
      let asst = null; if (creator && rnd() < 0.92) { asst = creator.id; L.ps[asst].a++; }
      ev.t = 'goal'; ev.as = asst;
    } else { if (gk) L.ps[gk.id].sv++; ev.t = 'save'; ev.gk = gk ? gk.id : null; ev.big = psxg > 0.3; }
  } else { ev.t = 'miss'; }
  if (ev.t === 'goal' || ev.t === 'save' && (ev.big || pen) || ev.t === 'miss' && xg > 0.25 || L.opts.live && rnd() < 0.35) L.ev.push(ev);
}
function penalties(L) {
  const g = s => { const x = onPitch(L, s).find(y => y.slot === 'GK'); return x ? P[x.id].ovr : 60; };
  const ph = clamp(0.76 - (g(1) - 82) * 0.006, 0.6, 0.88), pa = clamp(0.76 - (g(0) - 82) * 0.006, 0.6, 0.88);
  let x = 0, y = 0; for (let i = 0; i < 5; i++) { if (rnd() < ph) x++; if (rnd() < pa) y++; }
  while (x === y) { x += rnd() < ph ? 1 : 0; y += rnd() < pa ? 1 : 0; }
  return [x, y];
}
function finishMatch(L) {
  const poss = Math.round(L.possSum / Math.max(1, L.min));
  const res = L.hg > L.ag ? [1, -1] : L.hg < L.ag ? [-1, 1] : [0, 0];
  for (const id in L.ps) {
    const s = L.ps[id]; const pl = P[id]; const side = s.side; const T = L.sides[side].t;
    const to = s.to === null ? L.min : s.to; s.min = Math.max(1, to - s.from);
    const f = s.min / 90; const at = pl.attrs; const tg = DB[pl.id].tags; const isGK = pl.pos === 'GK';
    const pshare = side === 0 ? poss / 100 : 1 - poss / 100; const conc = side === 0 ? L.ag : L.hg;
    const PAS = at[2], DRI = isGK ? 30 : at[3], DEF = isGK ? 30 : at[4];
    s.pas = Math.round(PASS_B[s.slot] * pshare * 2 * f * (0.85 + rnd() * 0.3));
    const pct = clamp(0.62 + (PAS - 60) * 0.008 + (pl.iq - 75) * 0.002 + (T.tactics.pass === 'Short' ? 0.03 : T.tactics.pass === 'Direct' ? -0.04 : 0) + gauss() * 0.03, 0.5, 0.96);
    s.pc = Math.round(s.pas * pct);
    s.dra = Math.round(Math.max(0, (DRI - 55) / 16) * DRIB_F[s.slot] * f * (tg.includes('D') ? 1.35 : 1) * (0.5 + rnd()));
    s.drs = 0; const dp = clamp(0.36 + (DRI - 70) * 0.012 + (tg.includes('D') ? 0.05 : 0), 0.15, 0.85); for (let i = 0; i < s.dra; i++) if (rnd() < dp) s.drs++;
    s.tk = Math.round(Math.max(0, (DEF - 35) / 38) * TACK_F[s.slot] * f * (1 - pshare) * 2.1 * (tg.includes('T') ? 1.2 : 1) * (T.tactics.press === 'High' ? 1.15 : 1) * (pl.wr === 'Low' ? 0.5 : pl.wr === 'High' ? 1.2 : 1) * (0.4 + rnd() * 1.2));
    s.int = Math.round(Math.max(0, (DEF - 40) / 44) * TACK_F[s.slot] * f * (1 - pshare) * 2 * (pl.iq / 78) * (0.4 + rnd() * 1.2));
    const g = SLOT_GROUP(s.slot);
    const oppSh = side === 0 ? L.ash : L.hsh;
    s.clr = isGK ? 0 : Math.round(Math.max(0, (DEF - 45) / 22) * ({ CB: 1.7, LB: 0.8, RB: 0.8, LWB: 0.6, RWB: 0.6, DM: 0.7 }[s.slot] || 0.15) * f * (oppSh / 11) * (DB[pl.id].tags.includes('A') ? 1.3 : 1) * (0.5 + rnd()));
    let r = 6.25 + s.g * 1.05 + s.a * 0.7 + s.kp * 0.19 + s.drs * 0.12 + s.tk * 0.16 + s.int * 0.14 + s.clr * 0.09 + s.sot * 0.08;
    if (s.pas) r += (s.pc / s.pas - 0.82) * (g === 'MID' ? 2.2 : 2) + (g === 'MID' ? Math.min(0.2, s.pc / 250) : 0);
    r += res[side] * 0.32;
    if (g === 'DEF' || g === 'GK' || s.slot === 'DM') { if (conc === 0 && f > 0.6) r += g === 'GK' ? 0.6 : g === 'DEF' ? 0.65 : 0.4; r -= conc * (g === 'GK' ? 0.12 : 0.12); }
    if (g === 'DEF') r += 0.12 + (DEF - 78) * 0.012;
    if (g === 'MID') r -= 0.22;
    if (isGK) r += s.sv * 0.17 + (s.psxg - s.ga) * 0.55;
    if (g === 'ATT' && s.g === 0 && s.a === 0) r -= 0.15;
    r += gauss() * 0.3 - s.yc * 0.2 - s.rc * 1.5;
    if (s.min < 60) r = 6.4 + (r - 6.4) * Math.max(0.4, f);
    s.rt = r1(clamp(r, 3.5, 10));
  }
  let best = null; for (const id in L.ps) if (!best || L.ps[id].rt > L.ps[best].rt) best = id;
  return { h: L.h, a: L.a, hg: L.hg, ag: L.ag, hxg: L.hxg, axg: L.axg, poss, hsh: L.hsh, ash: L.ash, hsot: L.hsot, asot: L.asot, ev: L.ev.filter(e => ['goal', 'yc', 'rc', 'sub', 'save', 'miss', 'ht', 'ft', 'et', 'pens', 'shape', 'ko'].includes(e.t)), ps: L.ps, motm: +best, aet: L.aet, pens: L.pens, x: L.opts.x, tie: L.opts.tie, derby: L.derby, mom: L.mom };
}
function simFull(home, away, opts) { const L = startMatch(home, away, opts); while (!L.done) stepMinute(L); return finishMatch(L); }

function applyMatch(M) {
  const th = S.teams[M.h], ta = S.teams[M.a];
  const appeared = new Set();
  for (const id in M.ps) {
    appeared.add(+id);
    const s = M.ps[id], pl = P[id], st = pl.st;
    st.app++; st.min += s.min; if (!s.sub) st.starts++;
    for (const k of ['g', 'a', 'xg', 'xa', 'sh', 'sot', 'kp', 'dra', 'drs', 'tk', 'int', 'pas', 'pc', 'rt', 'sv', 'psxg', 'ga', 'yc', 'rc']) st[k] += s[k];
    if (pl.pos === 'GK' && s.min >= 60 && s.ga === 0) st.cs++;
    if (+id === M.motm) st.motm++;
    const E = DB[pl.id].tags.includes('E') ? 0.75 : 1;
    pl.fit = clamp(pl.fit - (s.min / 90) * (pl.pos === 'GK' ? 3 : 13) * E * (pl.age >= 32 ? 1.15 : 1), 30, 100);
    if (s.yc) { pl.yel++; if (pl.yel % 5 === 0) { pl.sus = Math.max(pl.sus, 1); if (pl.team === S.userTeam) pushInbox(`🟨 ${dispName(pl)} picked up a 5th yellow and is suspended for the next match.`); } }
    if (s.rc) { pl.sus = Math.max(pl.sus, 1); if (pl.team === S.userTeam) pushInbox(`🟥 ${dispName(pl)} was sent off and is suspended for the next match.`); }
    if (pl.rush > 0) pl.rush--;
    const injP = 0.011 * (s.min / 90) * (pl.rush > 0 ? 3.5 : 1) * (S.teams[pl.team].tactics.train === 'Fitness' ? 0.7 : 1) * (pl.fit < 60 ? 1.8 : 1);
    if (rnd() < injP) { pl.inj = ri(1, 5); if (pl.team === S.userTeam) pushInbox(`🚑 ${dispName(pl)} is injured and will miss about ${pl.inj} week${pl.inj > 1 ? 's' : ''}.`); }
  }
  const d = M.hg - M.ag;
  [[th, d], [ta, -d]].forEach(([t, dd]) => {
    const dm2 = M.derby ? 2 : 1; t.morale = clamp(t.morale + (dd > 0 ? 6 : dd < 0 ? -6 : 0) * dm2 + (60 - t.morale) * 0.1, 20, 95);
    const inc = dd > 0 ? 1.5 : dd === 0 ? 0.6 : 0.2; t.budget = r1(t.budget + inc); t.earned = r1((t.earned || 0) + inc);
    // player morale
    const top11 = new Set(t.squad.slice().sort((a, b) => P[b].ovr - P[a].ovr).slice(0, 11));
    t.squad.forEach(id => {
      const pl = P[id]; const s = M.ps[id];
      let dm = dd > 0 ? 1.5 : dd < 0 ? -1.5 : 0;
      if (s && !s.sub) dm += 1.5; else if (s && s.sub) dm += 0.3; else if (available(pl)) dm += top11.has(id) ? -4 : -0.8;
      if (id === t.captain) dm += 0.5;
      pl.mor = clamp(pl.mor + dm + (65 - pl.mor) * 0.03, 0, 100);
    });
  });
}
function recoverWeek() {
  S.players.forEach(pl => {
    if (pl.team < 0) { pl.fit = 100; return; }
    const t = S.teams[pl.team];
    pl.fit = clamp(pl.fit + 14 + (t.tactics.train === 'Fitness' ? 4 : 0) - (pl.age >= 33 ? 3 : 0), 0, 100);
    if (pl.inj > 0) { pl.inj--; if (pl.inj === 0 && pl.team === S.userTeam) pushInbox(`✅ ${dispName(pl)} is back in training.`); }
  });
}

// ---------- rounds (gameweek or playoff leg) ----------
function dispName(pl) { return `${DB[pl.id].name} '${String(pl.y).slice(2)}`; }
function shortName(pl) { return DB[pl.id].short; }
function pushNews(s) { S.news.unshift({ s, season: S.season, gw: S.gw }); if (S.news.length > 150) S.news.length = 150; }
function pushInbox(s, data) { S.inbox.unshift(Object.assign({ s, season: S.season, gw: S.gw, id: Math.random().toString(36).slice(2) }, data || {})); if (S.inbox.length > 80) S.inbox.length = 80; }
function windowOpen() { return S.phase === 'preseason' || (S.phase === 'season' && S.gw >= 7 && S.gw <= 9); }
function aiPrepare(t) { if (t.user) { validateLineup(t); setCaptainPK(t); return; } autoLineup(t, true); setCaptainPK(t); }

function prepareRound() {
  if (S.phase === 'preseason') { S.phase = 'season'; pushNews('⚽ The Super League season kicks off!'); S.offers = []; }
  S.teams.forEach(aiPrepare);
  const out = { matches: [] };
  if (S.phase === 'season') {
    out.kind = 'gw'; out.gw = S.gw;
    S.fixtures[S.gw].forEach(f => out.matches.push({ h: f.h, a: f.a, opts: { x: f.x } }));
  } else if (S.phase === 'playoffs') {
    const po = S.playoffs; out.kind = 'po';
    const single = po.round === 2 && !S.opts.finalTwoLegs;
    po.rounds[po.round].forEach((tie, ti) => {
      let h, a; if (single) { h = tie.hi; a = tie.lo; } else if (po.leg === 0) { h = tie.lo; a = tie.hi; } else { h = tie.hi; a = tie.lo; }
      const opts = { neutral: single, tie: ti };
      if (single || po.leg === 1) { const b = [0, 0]; tie.legs.forEach(l => { if (l.h === h) { b[0] += l.hg; b[1] += l.ag; } else { b[0] += l.ag; b[1] += l.hg; } }); opts.decider = { before: b }; }
      out.matches.push({ h, a, opts });
    });
  } else return null;
  out.userIdx = out.matches.findIndex(m => m.h === S.userTeam || m.a === S.userTeam);
  return out;
}
function commitRound(R, Ms) {
  Ms.forEach(applyMatch);
  if (R.kind === 'gw') {
    const ratings = []; const res = [];
    Ms.forEach(M => {
      [[M.h, M.hg, M.ag, M.hxg, M.axg], [M.a, M.ag, M.hg, M.axg, M.hxg]].forEach(([id, gf, ga, xf, xa]) => {
        const r = S.table[id]; r.p++; r.gf += gf; r.ga += ga; r.xgf += xf; r.xga += xa;
        if (gf > ga) { r.w++; r.pts += 3; r.form.push('W'); } else if (gf === ga) { r.d++; r.pts++; r.form.push('D'); } else { r.l++; r.form.push('L'); }
        if (r.form.length > 5) r.form.shift();
      });
      for (const id in M.ps) ratings.push({ id: +id, rt: M.ps[id].rt });
      res.push(slimMatch(M));
    });
    Ms.forEach(M => { if (M.derby) pushNews(`🔥 ${M.derby}: ${S.teams[M.h].name} ${M.hg}-${M.ag} ${S.teams[M.a].name}${M.hg === M.ag ? '' : ` — bragging rights to ${S.teams[M.hg > M.ag ? M.h : M.a].name}`}.`); });
    S.results[R.gw] = res; S.gw++;
    const totw = pickBestXI(ratings, x => x.rt); totw.forEach(x => P[x.id].st.totw++);
    S.totw.push({ gw: S.gw, xi: totw.map(x => ({ id: x.id, rt: x.rt, slot: x.slot, team: P[x.id].team })) });
    if (S.gw % 4 === 0 || S.gw === NGW) awardPOTM();
    serveSuspensions(Ms);
    recoverWeek(); weeklyMorale(); aiManagement(); updateBoard();
    feedRound(Ms);
    if (S.gw === 7) pushNews('🪟 The January transfer window is open until after Gameweek 9.');
    if (S.gw >= NGW) startPlayoffs();
  } else {
    const po = S.playoffs; const ties = po.rounds[po.round]; const single = po.round === 2 && !S.opts.finalTwoLegs;
    Ms.forEach(M => {
      const tie = ties[M.tie]; const sm = slimMatch(M); tie.legs.push(sm);
      if (single || po.leg === 1) {
        const agg = {}; agg[tie.hi] = 0; agg[tie.lo] = 0; tie.legs.forEach(l => { agg[l.h] += l.hg; agg[l.a] += l.ag; });
        if (agg[tie.hi] === agg[tie.lo] && sm.pens) agg[sm.pens[0] > sm.pens[1] ? sm.h : sm.a] += 0.5;
        tie.winner = agg[tie.hi] > agg[tie.lo] ? tie.hi : tie.lo; tie.agg = agg;
      }
    });
    serveSuspensions(Ms); recoverWeek(); weeklyMorale(); feedRound(Ms, true);
    if (single || po.leg === 1) {
      const winners = ties.map(t => t.winner);
      ties.forEach(t => { const prize = [3, 6, 10][po.round]; S.teams[t.winner].budget += prize; pushNews(`${po.names[po.round]}: ${S.teams[t.winner].name} beat ${S.teams[t.winner === t.hi ? t.lo : t.hi].name} ${fmtAgg(t)}`); });
      if (po.round === 2) { po.champion = winners[0]; S.teams[po.champion].budget += 15; pushNews(`🏆 ${S.teams[po.champion].name} are Super League champions!`); feedEvent('champion', { team: po.champion }); seasonAwards(); }
      else { po.round++; po.leg = 0; const nr = []; for (let i = 0; i < winners.length; i += 2) { const a = winners[i], b = winners[i + 1]; nr.push(seedVal(a) <= seedVal(b) ? { hi: a, lo: b, legs: [], winner: null } : { hi: b, lo: a, legs: [], winner: null }); } po.rounds.push(nr); }
    } else po.leg = 1;
  }
  if (S.phase === 'season' || S.phase === 'playoffs') maybeScenario();
  S.pending = null;
}
function serveSuspensions(Ms) { const played = new Set(); Ms.forEach(M => { played.add(M.h); played.add(M.a); }); S.players.forEach(p => { if (p.sus > 0 && played.has(p.team) && !Ms.some(M => M.ps[p.id] && M.ps[p.id].rc)) p.sus--; }); }
function slimMatch(M) {
  const isUser = M.h === S.userTeam || M.a === S.userTeam;
  return { derby: M.derby, h: M.h, a: M.a, hg: M.hg, ag: M.ag, hxg: r1(M.hxg * 10) / 10, axg: r1(M.axg * 10) / 10, poss: M.poss, hsh: M.hsh, ash: M.ash, hsot: M.hsot, asot: M.asot, motm: M.motm, x: M.x, aet: M.aet, pens: M.pens,
    ev: M.ev.filter(e => isUser ? !['save', 'miss', 'ko', 'shape'].includes(e.t) || e.big : ['goal', 'rc'].includes(e.t)).map(e => { const o = Object.assign({}, e); delete o.xg; if (!isUser) delete o.sp; return o; }),
    ps: isUser ? M.ps : Object.fromEntries(Object.entries(M.ps).map(([k, v]) => [k, { side: v.side, rt: v.rt, g: v.g, a: v.a, slot: v.slot, min: v.min, sub: v.sub }])) };
}
// quick: whole round without live
function playRoundQuick() {
  const R = prepareRound(); if (!R) return null;
  const Ms = R.matches.map(m => Object.assign(simFull(S.teams[m.h], S.teams[m.a], m.opts), { tie: m.opts.tie }));
  commitRound(R, Ms);
  return { R, Ms };
}

const TOTW_SHAPE = [['GK', 'GK'], ['DEF', 'LB'], ['DEF', 'CB'], ['DEF', 'CB'], ['DEF', 'RB'], ['MID', 'CM'], ['MID', 'CM'], ['MID', 'CM'], ['ATT', 'LW'], ['ATT', 'ST'], ['ATT', 'RW']];
function pickBestXI(list, score) {
  const sorted = list.slice().sort((a, b) => score(b) - score(a));
  const used = new Set(); const out = [];
  const take = (pred, slot) => { const x = sorted.find(x => !used.has(x.id) && pred(P[x.id])); if (x) { used.add(x.id); out.push(Object.assign({}, x, { slot })); } };
  take(p => p.pos === 'GK', 'GK'); take(p => p.pos === 'LB', 'LB'); take(p => p.pos === 'CB', 'CB'); take(p => p.pos === 'CB', 'CB'); take(p => p.pos === 'RB', 'RB');
  for (let i = 0; i < 3; i++) take(p => ['DM', 'CM', 'AM'].includes(p.pos), 'CM');
  take(p => p.pos === 'LW', 'LW'); take(p => p.pos === 'ST', 'ST'); take(p => p.pos === 'RW', 'RW');
  TOTW_SHAPE.forEach(([g, slot]) => { if (out.filter(o => o.slot === slot).length < TOTW_SHAPE.filter(s => s[1] === slot).length) take(p => POS_GROUP[p.pos] === g, slot); });
  return out;
}
const MONTHS = ['September', 'October', 'December', 'February'];
function awardPOTM() {
  const startGW = S.gw === NGW ? 13 : S.gw - 3; const agg = {};
  for (let g = startGW - 1; g < S.gw; g++) (S.results[g] || []).forEach(m => { for (const id in m.ps) { const s = m.ps[id]; const a = agg[id] || (agg[id] = { n: 0, rt: 0, g: 0, a: 0 }); a.n++; a.rt += s.rt; a.g += s.g; a.a += s.a; } });
  let best = null, bs = -1;
  for (const id in agg) { const a = agg[id]; if (a.n < 2) continue; const sc = a.rt / a.n * 10 + a.g * 1.5 + a.a; if (sc > bs) { bs = sc; best = { id: +id, n: a.n, rt: a.rt / a.n, g: a.g, a: a.a }; } }
  if (!best) return;
  const month = MONTHS[Math.min(3, Math.floor((S.gw - 1) / 4))];
  S.potm.push(Object.assign({ month, season: S.season, team: P[best.id].team }, best));
  leg(best.id).potm++;
  pushNews(`🏅 ${month} Player of the Month: ${dispName(P[best.id])} (${S.teams[P[best.id].team].name}): ${best.g} goals, ${best.a} assists`);
}
function squadStrength(t) { const xs = t.squad.map(id => P[id].ovr).sort((a, b) => b - a).slice(0, 14); return xs.reduce((s, v) => s + v, 0) / Math.max(1, xs.length) + (S.coaches[t.coach] ? (S.coaches[t.coach].rating - 86) * 0.15 : -1); }
function expectedRank(t) { const arr = S.teams.filter(x => x.conf === t.conf).sort((a, b) => squadStrength(b) - squadStrength(a)); return arr.indexOf(t) + 1; }
function updateBoard() {
  if (S.gw < 2) return;
  const u = S.teams[S.userTeam]; const pos = confPos(u.id); const exp = expectedRank(u); const last = S.table[u.id].form.slice(-1)[0];
  u.board = clamp(u.board + ((exp - pos) * 0.9 + (last === 'W' ? 2 : last === 'L' ? -2.5 : 0)) * 0.6 + (60 - u.board) * 0.04, 0, 100);
  if (u.board < 20 && !S._warned) { S._warned = true; pushInbox('⚠️ The board are unhappy with results. Improve quickly, or think about changing your coach.'); }
  if (u.board > 35) S._warned = false;
}
function weeklyMorale() {
  // promises
  S.promises = S.promises.filter(pr => {
    const pl = P[pr.id]; if (!pl || pl.team !== S.userTeam) return false;
    if (pl.st.starts > pr.starts) { pl.mor = clamp(pl.mor + 6, 0, 100); return false; }
    if (S.gw >= pr.until) { pl.mor = clamp(pl.mor - 22, 0, 100); pushInbox(`😠 ${dispName(pl)} says you broke your promise of more game time.`); feedEvent('broken', { pl: pl.id }); return false; }
    return true;
  });
  S.teams.forEach(t => {
    const med = t.squad.map(id => P[id].ovr).sort((a, b) => b - a)[Math.floor(t.squad.length / 2)] || 0;
    t.squad.forEach(id => {
      const pl = P[id];
      if (!pl.req && pl.mor < 22 && pl.ovr >= med + 2 && S.gw >= 3) {
        pl.req = true;
        if (t.user) { pushInbox(`📝 ${dispName(pl)} has handed in a transfer request (morale ${Math.round(pl.mor)}).`, { kind: 'req', pl: pl.id }); }
        if (t.user || pl.ovr >= 86) { pushNews(`📝 ${dispName(pl)} has asked to leave ${t.name}.`); feedEvent('request', { pl: pl.id }); }
      }
      if (pl.req && pl.mor > 60) { pl.req = false; if (t.user) pushInbox(`🙂 ${dispName(pl)} has withdrawn his transfer request.`); }
    });
  });
}
function handleRequest(plId, action) {
  const pl = P[plId]; S.inbox = S.inbox.filter(x => !(x.kind === 'req' && x.pl === plId));
  if (action === 'list') { pl.listed = true; pl.mor = clamp(pl.mor + 15, 0, 100); return { ok: true, msg: `${dispName(pl)} is transfer-listed. Clubs will bid when the window is open.` }; }
  if (action === 'refuse') { pl.mor = clamp(pl.mor - 10, 0, 100); return { ok: true, msg: `You refused. ${DB[plId].short} isn't happy about it.` }; }
  if (action === 'promise') { pl.mor = clamp(pl.mor + 18, 0, 100); pl.req = false; S.promises.push({ id: plId, until: S.gw + 3, starts: pl.st.starts }); return { ok: true, msg: `You promised ${DB[plId].short} more game time. Start him within 3 matches.` }; }
}


// ---------- random scenarios ----------
function squadPick(t, filt, wf) { return pickW(t.squad.map(id => P[id]).filter(p => p.inj <= 0 && (!filt || filt(p))), wf || (p => Math.pow(1.12, p.ovr - 75))); }
function nm(p) { return dispName(p); }
const SCENARIOS = [
  { k: 'trainInj', w: 3, make(t) { const p = squadPick(t); if (!p) return null; return { pl: p.id, title: '🚑 Training ground injury', text: `${nm(p)} has picked up a knock in training. The physio wants 3 weeks, but says he could be patched up in 1.`, choices: [['rest', 'Rest him properly (3 weeks)'], ['rush', 'Rush him back (1 week, high re-injury risk)']] }; } },
  { k: 'wantsOut', w: 2, make(t) { const p = squadPick(t, p => !p.req && p.ovr >= 80); if (!p) return null; const rival = pickOne(S.teams.filter(x => !x.user && x.rep >= t.rep - 4)); if (!rival) return null; return { pl: p.id, team: rival.id, title: '📞 Big club interest', text: `${rival.name} have made it clear they want ${nm(p)}, and his agent says he wants to hear them out.`, choices: [['talk', 'Let him talk to them'], ['block', 'Block it: he stays'], ['role', 'Promise him a bigger role']] }; } },
  { k: 'bustup', w: 2, make(t) { const a = squadPick(t); const b = squadPick(t, p => a && p.id !== a.id); if (!a || !b) return null; return { pl: a.id, pl2: b.id, title: '🥊 Training ground bust-up', text: `${nm(a)} and ${nm(b)} had to be pulled apart after a fight in training. The whole squad saw it.`, choices: [['fine', 'Fine them both'], ['drop', 'Drop both for the next match'], ['ignore', "Ignore it, boys will be boys"]] }; } },
  { k: 'party', w: 2, make(t) { const p = squadPick(t, p => p.age <= 30); if (!p) return null; return { pl: p.id, title: '🍾 Caught partying', text: `${nm(p)} was photographed leaving a nightclub at 3am, two days before a match. The papers are loving it.`, choices: [['fine', 'Fine him a week\'s wages'], ['drop', 'Drop him for the next match'], ['ignore', 'Say nothing']] }; } },
  { k: 'agent', w: 1.5, make(t) { const p = squadPick(t, p => p.ovr >= 84); if (!p) return null; const c = r1(Math.max(1, p.val * 0.08)); return { pl: p.id, cost: c, title: '✍️ Contract demands', text: `${nm(p)}'s agent says his client is underpaid for a player of his status and wants a €${c}m bonus.`, choices: [['pay', `Pay the €${c}m`], ['refuse', 'Refuse']] }; } },
  { k: 'viral', w: 1.2, make(t) { const p = squadPick(t); if (!p) return null; return { pl: p.id, title: '🔥 Fan favourite', text: `${nm(p)}'s celebration has gone viral. Shirts with his name are selling out.`, choices: [['ok', 'Love to see it (+€1.5m in shirt sales)']] }; } },
  { k: 'mentor', w: 1, make(t) { const v = squadPick(t, p => p.age >= 31); const k = squadPick(t, p => p.age <= 22); if (!v || !k) return null; return { pl: k.id, pl2: v.id, title: '🧓 Veteran mentor', text: `${nm(v)} has taken young ${nm(k)} under his wing after training.`, choices: [['ok', 'Encourage it']] }; } },
  { k: 'bug', w: 1, make(t) { const ps = shuffle(t.squad.slice()).slice(0, 3); if (ps.length < 3) return null; return { pls: ps, title: '🤒 Bug in the dressing room', text: `A stomach bug is going round. ${ps.map(id => nm(P[id])).join(', ')} are feeling rough.`, choices: [['ok', 'Ugh. Fine.']] }; } },
  { k: 'sponsor', w: 1, cond: t => t.board >= 55, make(t) { return { title: '💼 Sponsor bonus', text: 'A sponsor is delighted with how things are going and offers a bonus.', choices: [['cash', 'Take €4m for the transfer budget'], ['facilities', 'Spend it on the training ground (squad fitness and morale up)']] }; } },
];
function maybeScenario() {
  const u = S.teams[S.userTeam];
  if (S.scenario) resolveScenario(S.scenario.choices[0][0], true);
  if (rnd() < 0.45) {
    const pool = SCENARIOS.filter(s => !s.cond || s.cond(u));
    for (let tries = 0; tries < 4; tries++) { const sc = pickW(pool, s => s.w); const d = sc.make(u); if (d) { S.scenario = Object.assign({ k: sc.k, id: Math.random().toString(36).slice(2), season: S.season, gw: S.gw }, d); break; } }
  }
  // league-wide stories
  if (rnd() < 0.5) {
    const t = pickOne(S.teams.filter(x => !x.user)); const p = squadPick(t, p => p.ovr >= 84);
    if (p) {
      if (rnd() < 0.55) { p.inj = Math.max(p.inj, ri(1, 3)); pushNews(`🚑 ${t.name} blow: ${nm(p)} is injured in training (${p.inj} wk).`); post(t.id, 'loss', { coach: 'the physio', flop: shortName(p), score: '', opp: '', club: t.name, star: shortName(p) }); }
      else { p.mor = Math.min(p.mor, 20); pushNews(`📞 Reports: ${nm(p)} is unsettled at ${t.name}.`); }
    }
  }
}
function resolveScenario(key, auto) {
  const sc = S.scenario; if (!sc) return null; S.scenario = null;
  const u = S.teams[S.userTeam]; const p = sc.pl !== undefined ? P[sc.pl] : null; const p2 = sc.pl2 !== undefined ? P[sc.pl2] : null;
  if (p && p.team !== u.id && sc.k !== 'bug') return { ok: true, msg: 'That situation has resolved itself.' };
  const mor = (x, d) => { if (x) x.mor = clamp(x.mor + d, 0, 100); };
  let msg = '';
  switch (sc.k) {
    case 'trainInj': if (key === 'rush') { p.inj = Math.max(p.inj, 1); p.rush = 3; msg = `${DB[p.id].short} will be back in a week. Fingers crossed.`; } else { p.inj = Math.max(p.inj, 3); msg = `${DB[p.id].short} is out for 3 weeks.`; } break;
    case 'wantsOut': if (key === 'talk') { p.listed = true; mor(p, 10); const t = S.teams[sc.team]; if (windowOpen() && t.budget >= p.val * 0.7) { S.offers.push({ pl: p.id, team: t.id, fee: r1(Math.min(t.budget, p.val * (1 + rnd() * 0.3))), exp: S.gw + 2, id: Math.random().toString(36).slice(2), rounds: 0 }); msg = `${t.name} have made an offer. Check Transfers.`; } else msg = `${DB[p.id].short} is listed. ${t.name} will bid when the window opens.`; }
      else if (key === 'block') { mor(p, -18); msg = `${DB[p.id].short} is furious you blocked the move.`; feedEvent('request', { pl: p.id }); }
      else { mor(p, 10); S.promises.push({ id: p.id, until: S.gw + 3, starts: p.st.starts }); msg = `You promised ${DB[p.id].short} a bigger role. Start him within 3 matches.`; } break;
    case 'bustup': if (key === 'fine') { mor(p, -8); mor(p2, -8); u.morale = clamp(u.morale + 3, 20, 95); msg = 'Both fined. The squad respects the discipline.'; }
      else if (key === 'drop') { p.sus = Math.max(p.sus, 1); p2.sus = Math.max(p2.sus, 1); mor(p, -4); mor(p2, -4); msg = 'Both dropped for the next match.'; }
      else { u.morale = clamp(u.morale - 6, 20, 95); msg = 'The tension is still there. Team morale drops.'; } break;
    case 'party': if (key === 'fine') { mor(p, -10); u.morale = clamp(u.morale + 2, 20, 95); msg = `${DB[p.id].short} fined.`; }
      else if (key === 'drop') { p.sus = Math.max(p.sus, 1); mor(p, -6); msg = `${DB[p.id].short} is dropped for the next match.`; }
      else { p.fit = clamp(p.fit - 20, 30, 100); u.morale = clamp(u.morale - 5, 20, 95); msg = `${DB[p.id].short} is still hungover, and the squad noticed you said nothing.`; } break;
    case 'agent': if (key === 'pay' && u.budget >= sc.cost) { u.budget = r1(u.budget - sc.cost); mor(p, 15); msg = `Paid. ${DB[p.id].short} is happy.`; } else { mor(p, -15); msg = `${DB[p.id].short} is unhappy about the snub.`; } break;
    case 'viral': mor(p, 12); u.budget = r1(u.budget + 1.5); u.morale = clamp(u.morale + 2, 20, 95); msg = `${DB[p.id].short} is buzzing. +€1.5m in shirt sales.`; break;
    case 'mentor': mor(p, 10); p.ovr = Math.min(99, p.ovr + 1); p.val = valueOf(p); msg = `${DB[p.id].short} is learning fast (+1 OVR).`; break;
    case 'bug': sc.pls.forEach(id => { if (P[id].team === u.id) P[id].fit = clamp(P[id].fit - 25, 30, 100); }); msg = 'Three players are low on fitness this week.'; break;
    case 'sponsor': if (key === 'cash') { u.budget = r1(u.budget + 4); msg = '+€4m added to the budget.'; } else { u.squad.forEach(id => { P[id].fit = clamp(P[id].fit + 10, 0, 100); mor(P[id], 4); }); u.morale = clamp(u.morale + 4, 20, 95); msg = 'New facilities: fitness and morale up.'; } break;
  }
  pushInbox(`${sc.title}: ${msg}${auto ? ' (handled by your assistant)' : ''}`);
  return { ok: true, msg };
}

// ---------- AI management ----------
function aiManagement() {
  S.teams.forEach(t => {
    if (t.user) return;
    const pos = confPos(t.id); const exp = expectedRank(t);
    const fp = S.table[t.id].form.reduce((s, x) => s + (x === 'W' ? 3 : x === 'D' ? 1 : 0), 0);
    if (S.gw >= 5 && S.gw < 14 && pos - exp >= 5 && fp <= 4 && rnd() < 0.22 && t.coach >= 0) {
      const old = S.coaches[t.coach]; old.team = -1; old.sackedBy = t.id; t.coach = -1;
      const free = freeCoaches().filter(c => c.sackedBy !== t.id).sort((a, b) => b.rating - a.rating);
      const pickc = free[ri(0, Math.min(2, free.length - 1))];
      let msg = `🔴 ${t.name} have sacked ${old.name} (${ordinalE(pos)} in the ${CONF_NAME[t.conf]}).`;
      if (pickc) { pickc.team = t.id; t.coach = pickc.id; t.tactics = defaultTactics(pickc); msg += ` ${pickc.name} takes over.`; }
      pushNews(msg); feedEvent('sack', { team: t.id, coach: old.name });
    }
    if (t.coach === -1) { const f = freeCoaches().sort((a, b) => b.rating - a.rating)[0]; if (f) { f.team = t.id; t.coach = f.id; t.tactics = defaultTactics(f); } }
  });
  if (windowOpen()) { aiTransfers(); aiTrades(); }
  S.offers = S.offers.filter(o => o.exp >= S.gw && windowOpen());
}
const ordinalE = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

// ---------- transfers ----------
function untouchable(pl) {
  if (pl.team < 0) return false; const t = S.teams[pl.team]; if (t.user) return false;
  if (pl.req || pl.listed) return false;
  const top = t.squad.map(id => P[id]).sort((a, b) => b.ovr - a.ovr).slice(0, 2).map(p => p.id);
  if (top.includes(pl.id) && pl.ovr >= 84) return true;
  if (t.captain === pl.id) return true;
  const yrs = DB[pl.id].spans.filter(s => s[0] === t.name).reduce((s, x) => s + (x[2] - x[1] + 1), 0);
  return yrs >= 6 && pl.ovr >= 83;
}
function askingPrice(pl) {
  const t = S.teams[pl.team]; if (!t) return 0;
  const key = t.lineup && t.lineup.includes(pl.id);
  return r1(pl.val * (key ? 1.35 : 1.1) * (pl.req || pl.listed ? 0.82 : 1) * (t.budget < 8 ? 0.9 : 1));
}
const canAfford = (t, x) => t.budget >= x - 1e-6;
function transferPlayer(pl, to, fee, silent, trade) {
  const from = pl.team >= 0 ? S.teams[pl.team] : null;
  if (from && pl.ovr >= 90 && S.phase !== 'draft') blockbuster(pl, from.id, to, fee, trade);
  if (from) { from.squad = from.squad.filter(i => i !== pl.id); from.lineup = from.lineup.map(i => i === pl.id ? null : i); from.bench = from.bench.filter(i => i !== pl.id); from.budget = r1(from.budget + fee); if (from.captain === pl.id) from.captain = -1; if (from.pk === pl.id) from.pk = -1; setCaptainPK(from); validateLineup(from); }
  const tt = S.teams[to]; tt.squad.push(pl.id); tt.budget = r1(tt.budget - fee); pl.team = to; pl.req = false; pl.listed = false; pl.mor = clamp(Math.max(pl.mor, 70) + 8, 0, 100); validateLineup(tt);
  S.offers = S.offers.filter(o => o.pl !== pl.id); delete S.nego[pl.id];
  if (!silent && (to === S.userTeam || (from && from.user))) feedEvent('transfer', { pl: pl.id, to, fee });
}
function userBid(plId, amount) {
  const pl = P[plId]; const u = S.teams[S.userTeam];
  if (!windowOpen() && pl.team !== -1) return { ok: false, msg: 'The transfer window is closed. You can still sign free agents.' };
  if (u.squad.length >= MAX_SQUAD) return { ok: false, msg: `Your squad is full (${MAX_SQUAD}). Sell or release someone first.` };
  if (pl.team === -1) {
    const fee = r1(pl.val * 0.15);
    if (!canAfford(u, fee)) return { ok: false, msg: `The €${fee}m signing-on fee is over your budget.` };
    transferPlayer(pl, u.id, fee); pushNews(`✍️ ${u.name} sign free agent ${dispName(pl)}.`); return { ok: true, msg: `${dispName(pl)} signed for a €${fee}m signing-on fee.` };
  }
  const t = S.teams[pl.team];
  if (untouchable(pl)) return { ok: false, msg: `${t.name}: "${DB[plId].short} is not for sale. At any price."`, flat: true };
  if (!canAfford(u, amount)) return { ok: false, msg: 'Not enough budget.' };
  if (t.squad.length <= 15) return { ok: false, msg: `${t.name} won't sell: their squad is too thin.` };
  const n = S.nego[plId] || (S.nego[plId] = { round: 0, ask: askingPrice(pl), walk: -1, hist: [] });
  if (n.walk > S.gw) return { ok: false, msg: `${t.name} have ended talks. Try again after Gameweek ${n.walk}.` };
  n.hist.push(['you', amount]);
  if (amount >= n.ask - 1e-6) { transferPlayer(pl, u.id, amount); pushNews(`💰 ${u.name} sign ${dispName(pl)} from ${t.name} for €${amount}m.`); return { ok: true, msg: `Deal done! ${dispName(pl)} joins for €${amount}m.` }; }
  const ratio = amount / n.ask;
  if (ratio < 0.55) { n.round += 2; }
  else { n.round++; const floor = askingPrice(pl) * (0.8 + rnd() * 0.06); n.ask = r1(Math.max(floor, n.ask - (n.ask - amount) * (0.25 + rnd() * 0.2), amount + 0.1)); }
  if (n.round >= 4) { n.walk = S.gw + 2; n.round = 0; n.ask = askingPrice(pl); n.hist = []; return { ok: false, msg: `${t.name} are fed up with your bids and have walked away from talks.` }; }
  n.hist.push(['them', n.ask]);
  return { ok: false, counter: n.ask, msg: ratio < 0.55 ? `${t.name} call that bid insulting. They still want €${n.ask}m.` : `${t.name} counter: €${n.ask}m.` };
}
function suggestFill() {
  const u = S.teams[S.userTeam]; const c = groupCounts(u); const out = []; let budget = u.budget * 0.8; const taken = new Set();
  const want = []; for (const g in DRAFT_T) for (let i = c[g]; i < DRAFT_T[g][0]; i++) want.push(g);
  const extra = ['CB', 'MID', 'AMW', 'FB', 'ST', 'MID'];
  let k = 0; while (u.squad.length + want.length < 18 && k < extra.length) want.push(extra[k++]);
  want.forEach(g => { const fa = freePlayers().filter(p => !taken.has(p.id) && dgroup(p.pos) === g && r1(p.val * 0.15) <= budget).sort((a, b) => b.ovr - a.ovr)[0]; if (fa) { taken.add(fa.id); budget -= r1(fa.val * 0.15); out.push(fa.id); } });
  return out.slice(0, MAX_SQUAD - u.squad.length);
}
function signMany(ids) { const r = ids.map(id => userBid(id, 0)).filter(x => x.ok).length; return { ok: r > 0, msg: `Signed ${r} free agent${r !== 1 ? 's' : ''}.` }; }
function sellOffers(plId) {
  const pl = P[plId];
  const buyers = S.teams.filter(t => !t.user && t.squad.length < MAX_SQUAD && t.budget > pl.val * 0.5);
  return shuffle(buyers).slice(0, 3).map(t => ({ team: t.id, fee: r1(Math.min(t.budget, pl.val * (0.75 + rnd() * 0.4) * (pl.listed || pl.req ? 0.9 : 1))) })).sort((a, b) => b.fee - a.fee);
}
function acceptSale(plId, teamId, fee) {
  const pl = P[plId]; const u = S.teams[S.userTeam];
  if (u.squad.length <= MIN_SQUAD) return { ok: false, msg: `You need at least ${MIN_SQUAD} players.` };
  if (!windowOpen()) return { ok: false, msg: 'The transfer window is closed.' };
  transferPlayer(pl, teamId, fee); pushNews(`💸 ${S.teams[teamId].name} sign ${dispName(pl)} from ${u.name} for €${fee}m.`);
  return { ok: true, msg: `Sold ${dispName(pl)} to ${S.teams[teamId].name} for €${fee}m.` };
}
function releasePlayer(plId) {
  const pl = P[plId]; const u = S.teams[S.userTeam]; if (u.squad.length <= MIN_SQUAD) return { ok: false, msg: `You need at least ${MIN_SQUAD} players.` };
  u.squad = u.squad.filter(i => i !== pl.id); u.lineup = u.lineup.map(i => i === pl.id ? null : i); pl.team = -1; pl.req = false; pl.listed = false; setCaptainPK(u); validateLineup(u);
  return { ok: true, msg: `${dispName(pl)} released. He is now a free agent.` };
}
// player-for-player trades
function tradeValueFor(team, pl) { const c = groupCounts(team); const g = dgroup(pl.pos); const need = c[g] < DRAFT_T[g][0] ? 1.15 : c[g] >= DRAFT_T[g][1] ? 0.8 : 1; return pl.val * need * (pl.req ? 0.9 : 1); }
function evalTrade(targetId, giveIds, cash) {
  const tgt = P[targetId]; const T = S.teams[tgt.team]; const u = S.teams[S.userTeam];
  if (!windowOpen()) return { ok: false, msg: 'Trades are only possible while the window is open.' };
  if (untouchable(tgt)) return { ok: false, msg: `${T.name}: "${DB[targetId].short} is not available. Not even in a trade."` };
  if (!giveIds.length && !cash) return { ok: false, msg: 'Add at least one player or some cash.' };
  if (T.squad.length - 1 + giveIds.length > MAX_SQUAD) return { ok: false, msg: `${T.name} don't have the squad space.` };
  if (u.squad.length + 1 - giveIds.length < MIN_SQUAD) return { ok: false, msg: `You'd drop below ${MIN_SQUAD} players.` };
  if (cash > 0 && !canAfford(u, cash)) return { ok: false, msg: 'Not enough budget for that cash part.' };
  const want = askingPrice(tgt) * 1.05;
  const got = giveIds.reduce((s, id) => s + tradeValueFor(T, P[id]), 0) + cash;
  if (got >= want) return { ok: true, accept: true, want, got };
  return { ok: false, accept: false, want, got, msg: `${T.name} want roughly €${r1(want - got)}m more value.` };
}
function doTrade(targetId, giveIds, cash) {
  const e = evalTrade(targetId, giveIds, cash); if (!e.accept) return e;
  const tgt = P[targetId]; const T = S.teams[tgt.team]; const u = S.teams[S.userTeam];
  giveIds.forEach(id => transferPlayer(P[id], T.id, 0, true, true));
  transferPlayer(tgt, u.id, 0, true, true); u.budget = r1(u.budget - cash); T.budget = r1(T.budget + cash);
  const names = giveIds.map(id => dispName(P[id])).join(' + ');
  pushNews(`🔁 Trade: ${u.name} get ${dispName(tgt)} from ${T.name} for ${names}${cash ? ` + €${cash}m` : ''}.`);
  feedEvent('trade', { pl: targetId });
  return { ok: true, msg: `Trade agreed! ${dispName(tgt)} joins ${u.name}.` };
}
function aiTransfers(force) {
  S.teams.forEach(t => {
    if (t.user || rnd() > (force ? 0.5 : t.budget > 40 ? 0.4 : 0.2)) return;
    // sell requested players
    const want = t.squad.map(id => P[id]).find(p => p.req);
    if (want) { const buyers = S.teams.filter(b => !b.user && b.id !== t.id && b.budget >= want.val * 0.85 && b.squad.length < MAX_SQUAD); const b = pickOne(buyers); if (b) { transferPlayer(want, b.id, r1(want.val * 0.9)); pushNews(`💰 ${b.name} sign unsettled ${dispName(want)} from ${t.name} for €${r1(want.val * 0.9)}m.`); return; } }
    if (t.budget > 45 && t.squad.length < MAX_SQUAD && rnd() < 0.6) {
      const xi = t.lineup.filter(x => x !== null).map(id => P[id]); const weak = xi.sort((a, b) => a.ovr - b.ovr)[0];
      if (weak) { const tgt = S.players.filter(p => p.team >= 0 && p.team !== t.id && !S.teams[p.team].user && dgroup(p.pos) === dgroup(weak.pos) && p.ovr >= weak.ovr + 3 && !untouchable(p) && S.teams[p.team].squad.length > 16 && askingPrice(p) <= t.budget * 0.8).sort((a, b) => b.ovr - a.ovr)[0];
        if (tgt) { const fee = askingPrice(tgt); const from = S.teams[tgt.team].name; transferPlayer(tgt, t.id, fee); pushNews(`💰 ${t.name} splash €${fee}m on ${dispName(tgt)} from ${from}.`); return; } }
    }
    const c = groupCounts(t); let need = null; for (const g in DRAFT_T) if (c[g] < DRAFT_T[g][0]) need = g;
    const sq = t.squad.map(id => P[id]); const weakest = sq.filter(p => !need || dgroup(p.pos) === need).sort((a, b) => a.ovr - b.ovr)[0];
    const g = need || (weakest ? dgroup(weakest.pos) : 'MID'); const minOvr = weakest ? weakest.ovr + 2 : 70;
    const fa = freePlayers().filter(p => dgroup(p.pos) === g && p.ovr >= minOvr && p.val * 0.15 <= t.budget).sort((a, b) => b.ovr - a.ovr)[0];
    if (fa && t.squad.length < MAX_SQUAD) { transferPlayer(fa, t.id, r1(fa.val * 0.15)); pushNews(`✍️ ${t.name} sign free agent ${dispName(fa)}.`); return; }
    const targets = S.players.filter(p => p.team >= 0 && p.team !== t.id && !S.teams[p.team].user && dgroup(p.pos) === g && p.ovr >= minOvr + 2 && !untouchable(p) && S.teams[p.team].squad.length > 16 && askingPrice(p) <= t.budget).sort((a, b) => a.val - b.val).slice(0, 5);
    const tg = pickOne(targets);
    if (tg && t.squad.length < MAX_SQUAD) { const fee = askingPrice(tg); const from = S.teams[tg.team].name; transferPlayer(tg, t.id, fee); pushNews(`💰 ${t.name} sign ${dispName(tg)} from ${from} for €${fee}m.`); }
  });
  // bids for user players
  const u = S.teams[S.userTeam];
  const listed = u.squad.map(id => P[id]).filter(p => (p.listed || p.req) && !S.offers.some(o => o.pl === p.id));
  const tryBid = (pl, gen) => {
    const buyers = S.teams.filter(t => !t.user && t.budget > pl.val * 0.6 && t.squad.length < MAX_SQUAD); if (!buyers.length) return;
    const b = pickOne(buyers); const fee = r1(Math.min(b.budget, pl.val * (gen ? 0.85 + rnd() * 0.5 : 0.8 + rnd() * 0.3)));
    S.offers.push({ pl: pl.id, team: b.id, fee, exp: S.gw + 2, id: Math.random().toString(36).slice(2), rounds: 0 });
    pushInbox(`📨 ${b.name} bid €${fee}m for ${dispName(pl)} (value €${pl.val}m). Respond in Transfers.`);
  };
  listed.forEach(p => tryBid(p, false));
  if (rnd() < 0.4 && u.squad.length > MIN_SQUAD + 1) { const cands = u.squad.map(id => P[id]).filter(p => !S.offers.some(o => o.pl === p.id)); const pl = pickW(cands, p => Math.pow(1.15, p.ovr - 75)); if (pl) tryBid(pl, true); }
}
function aiTrades() {
  if (rnd() > 0.35) return;
  const ai = S.teams.filter(t => !t.user); const a = pickOne(ai), b = pickOne(ai.filter(t => t !== a));
  const pa = pickOne(a.squad.map(id => P[id]).filter(p => !untouchable(p))); if (!pa) return;
  const pb = b.squad.map(id => P[id]).filter(p => !untouchable(p) && dgroup(p.pos) !== dgroup(pa.pos) && Math.abs(p.val - pa.val) < pa.val * 0.2)[0]; if (!pb) return;
  transferPlayer(pa, b.id, 0, true, true); transferPlayer(pb, a.id, 0, true, true);
  pushNews(`🔁 Trade: ${a.name} send ${dispName(pa)} to ${b.name} for ${dispName(pb)}.`);
}
function respondOffer(oid, action, counter) {
  const o = S.offers.find(x => x.id === oid); if (!o) return { ok: false, msg: 'That offer has expired.' };
  const pl = P[o.pl]; const t = S.teams[o.team];
  if (action === 'reject') {
    S.offers = S.offers.filter(x => x.id !== oid);
    if (t.rep > S.teams[S.userTeam].rep + 3 || pl.req) { pl.mor = clamp(pl.mor - 10, 0, 100); return { ok: true, msg: `Rejected. ${DB[pl.id].short} is upset you blocked a move to ${t.name}.` }; }
    return { ok: true, msg: 'Offer rejected.' };
  }
  if (action === 'counter') {
    o.rounds++; const max = pl.val * (1.25 + rnd() * 0.25);
    if (counter <= max && counter <= t.budget && o.rounds <= 2) { o.fee = r1(counter); return { ok: true, msg: `${t.name} agree to €${o.fee}m. Accept it to finish the deal.`, agreed: true }; }
    if (o.rounds >= 2) { S.offers = S.offers.filter(x => x.id !== oid); return { ok: false, msg: `${t.name} walk away from the deal.` }; }
    o.fee = r1(Math.min(t.budget, (o.fee + Math.min(counter, max)) / 2)); return { ok: false, msg: `${t.name} meet you partway: €${o.fee}m.` };
  }
  S.offers = S.offers.filter(x => x.id !== oid);
  if (!canAfford(t, o.fee)) return { ok: false, msg: `${t.name} can no longer afford him.` };
  return acceptSale(o.pl, o.team, o.fee);
}

// ---------- blockbuster moves (90+ OVR) ----------
function blockbuster(pl, fromId, toId, fee, trade) {
  const from = S.teams[fromId], to = S.teams[toId];
  const feeTxt = trade ? 'a blockbuster trade' : `€${fee}m`;
  pushNews(`🚨 BLOCKBUSTER: ${dispName(pl)} (${pl.ovr}) leaves ${from.name} for ${to.name} in ${trade ? 'a stunning trade' : `a €${fee}m deal`}!`);
  const v = { p: DB[pl.id].short, to: to.name, from: from.name, fee: trade ? 'that trade' : `€${fee}m` };
  post(toId, 'bombIn', v, { mine: to.user }); post(toId, 'bombIn', v, { mine: to.user });
  post(fromId, 'bombOut', v, { mine: from.user }); post(fromId, 'bombOut', v, { mine: from.user });
  post(-1, 'bombN', v); post(-1, 'bombN', v);
  (S.breaking = S.breaking || []).push({ pl: pl.id, from: fromId, to: toId, fee, trade: !!trade, season: S.season, gw: S.gw });
  if (S.breaking.length > 6) S.breaking.shift();
}

// ---------- coaches ----------
function hireCost(co) { return r1(Math.max(0.5, (co.rating - 75) * 0.45)); }
function fireCost(co) { return r1(Math.max(1, (co.rating - 70) * 0.25)); }
function fireCoach() {
  const u = S.teams[S.userTeam]; if (u.coach < 0) return { ok: false, msg: 'There is no coach to fire.' };
  const co = S.coaches[u.coach]; const c = fireCost(co);
  if (!canAfford(u, c)) return { ok: false, msg: `The €${c}m compensation is over budget.` };
  u.budget = r1(u.budget - c); co.team = -1; co.sackedBy = u.id; u.coach = -1; u.morale = clamp(u.morale - 3, 20, 95);
  pushNews(`🔴 ${u.name} have sacked ${co.name}.`); feedEvent('sack', { team: u.id, coach: co.name });
  return { ok: true, msg: `${co.name} sacked (€${c}m compensation). A caretaker takes over.` };
}
function hireCoach(cid) {
  const u = S.teams[S.userTeam]; const co = S.coaches[cid];
  if (co.team !== -1) return { ok: false, msg: 'He is not available.' };
  if (u.coach >= 0) return { ok: false, msg: 'Fire your current coach first.' };
  const c = hireCost(co); if (!canAfford(u, c)) return { ok: false, msg: `The €${c}m hiring fee is over budget.` };
  u.budget = r1(u.budget - c); co.team = u.id; u.coach = co.id; u.morale = clamp(u.morale + 5, 20, 95);
  pushNews(`🟢 ${u.name} appoint ${co.name}.`);
  return { ok: true, msg: `${co.name} appointed (€${c}m). He likes ${co.style.toLowerCase()} football in a ${co.form}.` };
}

// ---------- playoffs ----------
function seedVal(id) { const t = S.teams[id]; return confPos(id) * 10 - S.table[id].pts * 0.01; }
function startPlayoffs() {
  S.phase = 'playoffs';
  const N = standings('N').slice(0, 4).map(r => r.id), Sx = standings('S').slice(0, 4).map(r => r.id);
  const all = standings(); S.shield = all[0].id;
  S.teams.forEach(t => { const p = confPos(t.id); const prize = r1((16 - p) * 1.4 + 4); t.budget = r1(t.budget + prize); });
  pushNews(`🛡️ ${S.teams[all[0].id].name} win the Shield for the best regular-season record. ${S.teams[N[0]].name} and ${S.teams[Sx[0]].name} top their conferences.`);
  const mk = (a, b) => ({ hi: a, lo: b, legs: [], winner: null });
  S.playoffs = { round: 0, leg: 0, names: ['Quarter-finals', 'Semi-finals', 'Final'], champion: null, rounds: [[mk(N[0], Sx[3]), mk(Sx[1], N[2]), mk(N[1], Sx[2]), mk(Sx[0], N[3])]] };
  feedEvent('playoffs');
}
function fmtAgg(t) { const a = t.agg; const w = Math.floor(a[t.winner]), l = Math.floor(a[t.winner === t.hi ? t.lo : t.hi]); const last = t.legs[t.legs.length - 1]; return `(${t.legs.length > 1 ? 'agg ' : ''}${w}-${l}${last.pens ? `, ${Math.max(...last.pens)}-${Math.min(...last.pens)} on pens` : last.aet ? ' aet' : ''})`; }

// ---------- awards & legacy ----------
function leg(id) { return S.legacy.p[id] || (S.legacy.p[id] = { bdo: 0, top3: 0, titles: 0, shields: 0, tots: 0, potm: 0, gb: 0, g: 0, a: 0, app: 0, rt: 0, seasons: 0, best: null }); }
function seasonAwards() {
  S.phase = 'awards';
  const po = S.playoffs; const fin = po.rounds[2][0]; const loser = fin.winner === fin.hi ? fin.lo : fin.hi;
  const sfL = po.rounds[1].map(t => t.winner === t.hi ? t.lo : t.hi);
  const all = S.players.filter(p => p.team >= 0 && p.st.app >= 8);
  const score = p => {
    const s = p.st; const avg = s.rt / s.app; const cp = confPos(p.team);
    let sc = avg * 13 + s.g * 1.3 + s.a * 0.85 + s.motm * 0.8 + p.ovr * 0.18 + s.totw * 0.7;
    if (p.pos === 'GK') sc += (s.psxg - s.ga) * 1.8 + s.cs * 0.9;
    if (['CB', 'LB', 'RB', 'DM'].includes(p.pos)) sc += (s.tk + s.int) * 0.08;
    sc += cp === 1 ? 6 : cp <= 4 ? 3 : 0;
    sc += p.team === po.champion ? 10 : p.team === loser ? 5 : sfL.includes(p.team) ? 2 : 0;
    return sc;
  };
  const ranked = all.map(p => ({ id: p.id, sc: score(p) })).sort((a, b) => b.sc - a.sc).slice(0, 30);
  const top = ranked[0].sc, last = ranked[ranked.length - 1].sc;
  ranked.forEach((r, i) => r.pts = Math.round(Math.max(5, (r.sc - last + 4) / (top - last + 4) * 600 * (1 - i * 0.004))));
  const best = (f, filt) => S.players.filter(p => p.team >= 0 && (!filt || filt(p))).sort((a, b) => f(b) - f(a))[0];
  const gb = best(p => p.st.g + p.st.a * 0.001), pm = best(p => p.st.a + p.st.kp * 0.001);
  const gg = best(p => p.st.psxg - p.st.ga, p => p.pos === 'GK' && p.st.app >= 8), cs = best(p => p.st.cs + p.st.app * 0.001, p => p.pos === 'GK');
  const yp = best(p => p.st.app >= 8 ? p.st.rt / p.st.app * 10 + p.st.g + p.st.a : 0, p => p.age <= 21);
  const dr = best(p => p.st.drs), df = best(p => p.st.tk + p.st.int, p => ['CB', 'LB', 'RB', 'DM'].includes(p.pos));
  const coy = S.teams.filter(t => t.coach >= 0).map(t => ({ t, d: expectedRank(t) - confPos(t.id) + (t.id === po.champion ? 4 : 0) })).sort((a, b) => b.d - a.d)[0];
  const tos = pickBestXI(all.map(p => ({ id: p.id, rt: p.st.rt / p.st.app })), x => x.rt);
  S.awards = { ballon: ranked, gb: gb.id, pm: pm.id, gg: gg ? gg.id : null, cs: cs ? cs.id : null, yp: yp ? yp.id : null, dr: dr.id, def: df ? df.id : null, coy: coy ? { team: coy.t.id, coach: coy.t.coach } : null, tos: tos.map(x => ({ id: x.id, slot: x.slot, rt: x.rt })) };
  const w = P[ranked[0].id];
  pushNews(`🌟 ${dispName(w)} (${S.teams[w.team].name}) wins the Ballon d'Or!`);
  feedEvent('bdo', { pl: w.id });
  // legacy
  ranked.slice(0, 3).forEach(r => leg(r.id).top3++); leg(ranked[0].id).bdo++; leg(gb.id).gb++;
  tos.forEach(x => leg(x.id).tots++);
  S.players.forEach(p => { if (p.team >= 0 && p.st.app) { const L = leg(p.id); L.g += p.st.g; L.a += p.st.a; L.app += p.st.app; L.rt += p.st.rt; L.seasons++; if (p.team === po.champion) L.titles++; if (p.team === S.shield) L.shields++; } });
  const cl = id => S.legacy.club[id] || (S.legacy.club[id] = { titles: 0, shields: 0, finals: 0 });
  cl(po.champion).titles++; cl(S.shield).shields++; cl(loser).finals++;
  const champCoach = S.teams[po.champion].coach; if (champCoach >= 0) { const c = S.legacy.coach[champCoach] || (S.legacy.coach[champCoach] = { titles: 0 }); c.titles++; }
  { const fin = standings().map(r => r.id).filter(id => id !== po.champion && id !== loser); S.lastOrder = [po.champion, loser].concat(fin); }
  S.history.push({ season: S.season, champion: po.champion, shield: S.shield, ballon: ranked[0].id, gb: gb.id, gbG: gb.st.g, userPos: confPos(S.userTeam), userConf: S.teams[S.userTeam].conf, userChamp: po.champion === S.userTeam, userPO: po.rounds[0].some(t => t.hi === S.userTeam || t.lo === S.userTeam), runnerUp: loser });
}
function legacyScore(id) {
  const L = S.legacy.p[id]; if (!L) return 0;
  const avg = L.app ? L.rt / L.app : 6.5;
  return L.g * 1 + L.a * 0.7 + L.app * 0.12 + Math.max(0, avg - 6.6) * L.app * 0.6 + L.bdo * 45 + L.top3 * 12 + L.titles * 14 + L.shields * 5 + L.tots * 8 + L.potm * 3 + L.gb * 10;
}

// ---------- next season ----------
function nextSeason() {
  if (S.season >= S.maxSeasons) { S.phase = 'over'; return; }
  if (S.scenario) resolveScenario(S.scenario.choices[0][0], true);
  const retired = [], reborn = [];
  S.players.forEach(pl => {
    if (pl.team === -2) return;
    pl.career.push({ season: S.season, y: pl.y, team: pl.team, app: pl.st.app, g: pl.st.g, a: pl.st.a, rt: pl.st.app ? r1(pl.st.rt / pl.st.app * 10) / 10 : 0, ovr: pl.ovr });
    const p = DB[pl.id]; const ny = pl.y + 1;
    if (ny > p.retire) {
      const was = dispName(pl);
      if (pl.team >= 0) { const t = S.teams[pl.team]; t.squad = t.squad.filter(i => i !== pl.id); retired.push(`${was} (${t.name})`); if (t.captain === pl.id) t.captain = -1; if (t.pk === pl.id) t.pk = -1; }
      // a new random-season version of him re-enters the free-agent pool
      const y2 = ri(p.start, Math.max(p.start, Math.min(p.realEnd, p.retire - 3)));
      Object.assign(pl, cardFor(p, y2), { team: -4, st: blankStats(), fit: 100, inj: 0, sus: 0, yel: 0, mor: 70, req: false, listed: false }); pl.val = valueOf(pl); pl.reborn = (pl.reborn || 0) + 1;
      reborn.push(dispName(pl)); return;
    }
    Object.assign(pl, cardFor(p, ny)); pl.val = valueOf(pl); pl.st = blankStats(); pl.fit = 100; pl.inj = 0; pl.sus = 0; pl.yel = 0; pl.mor = clamp(pl.mor * 0.5 + 35, 0, 100); pl.req = false; pl.listed = false;
  });
  S.season++; S.gw = 0; S.totw = []; S.playoffs = null; S.awards = null; S.offers = []; S.nego = {}; S.promises = [];
  if (retired.length) pushNews(`👋 Retirements: ${retired.slice(0, 12).join(', ')}${retired.length > 12 ? ` and ${retired.length - 12} more` : ''}.`);
  if (reborn.length) pushNews(`🔄 New versions entering the season draft: ${reborn.slice(0, 10).join(', ')}${reborn.length > 10 ? ` and ${reborn.length - 10} more` : ''}.`);
  S.retiredLog = retired;
  S.teams.forEach(t => {
    const wages = r1(t.squad.reduce((s2, id) => s2 + P[id].val, 0) * 0.16 + (S.coaches[t.coach] ? (S.coaches[t.coach].rating - 70) * 0.15 : 0));
    t.budget = r1(t.budget - wages); t.lastWages = wages;
    if (t.user) pushInbox(`💼 Season wage bill paid: €${wages}m. Budget now €${t.budget}m.`);
    t.morale = 60; t.earned = 0;
    // luxury tax & solidarity
    if (t.budget > 80) { const tax = r1((t.budget - 80) * 0.5); t.budget = r1(t.budget - tax); if (t.user) pushInbox(`🏦 Luxury tax: €${tax}m taken from your budget above €80m.`); }
    if (t.budget < 12) { const sol = r1(12 - t.budget); t.budget = 12; if (t.user) pushInbox(`🤝 Solidarity payment: +€${sol}m.`); }
  });
  startSeasonDraft();
}

// ---------- season draft ----------
function startSeasonDraft() {
  const held = S.players.filter(p => p.team === -3);
  const n = Math.ceil(held.length / Math.max(1, S.maxSeasons - S.season + 1));
  shuffle(held).slice(0, n).forEach(pl => { const p = DB[pl.id]; Object.assign(pl, cardFor(p, ri(p.start, p.realEnd)), { team: -4, st: blankStats() }); pl.val = valueOf(pl); });
  const pool = S.players.filter(p => p.team === -4).length;
  const rounds = clamp(Math.floor(pool / 30), 1, 3);
  const last = S.lastOrder || S.teams.map(t => t.id);
  const order = last.slice().reverse();
  const owner = []; for (let r = 0; r < rounds; r++) order.forEach(t => owner.push(t));
  S.draft = { kind: 'season', order, owner, rounds, pick: 0, total: owner.length, log: [] };
  S.phase = 'sdraft';
  pushNews(`📝 Season ${S.season} draft: ${pool} new players enter the league (${n} debutants plus new versions of retired stars). ${rounds} round${rounds > 1 ? 's' : ''}, worst teams pick first.`);
}
function finishSeasonDraft() {
  S.players.forEach(p => { if (p.team === -4) p.team = -1; });
  S.teams.forEach(t => { if (!t.user) aiFillSquad(t, 16); });
  for (let i = 0; i < 3; i++) aiTransfers(true);
  S.teams.forEach(t => { setCaptainPK(t); autoLineup(t); });
  const u = S.teams[S.userTeam]; if (u.squad.length < MIN_SQUAD) pushInbox(`You have ${u.squad.length} players. Sign at least ${MIN_SQUAD - u.squad.length} more. Try ⚡ Fill squad in Transfers.`);
  buildFixtures(); S.phase = 'preseason';
  pushNews(`📅 Season ${S.season} of ${S.maxSeasons}. The pre-season window is open.`);
}

// ---------- fan feed ----------
const FT = {
  bigWin: ['{score} 😂😂 {opp} got absolutely f**king battered', '{star} is HIM. Not up for debate.', 'Bring on anyone. ANYONE. We are flying 🔥🔥', '{coach} masterclass. I take back every word I said about him', 'Not a f**king chance anyone stops us playing like that'],
  win: ['Ugly win but 3 points is 3 points 🙌', '{star} carried us again tbh', 'GET IN!!! {score} vs {opp}', 'Nervy as hell at the end but we move', "Didn't play well and still won. Champions do that"],
  draw: ['A draw against {opp}?? Not good enough mate', "Point's a point I guess 🤷", 'We need a proper striker, this is sh*t', '{flop} was invisible today, absolute passenger', 'Should have won that. Same old story'],
  loss: ['{coach} OUT. I am f**king done with this', '{flop} should never wear this shirt again', 'Embarrassing. {score}. Absolutely embarrassing.', 'Who picked this XI?? Sort it out {coach}', 'b****y hell that was hard to watch'],
  bigLoss: ['{score}?!? What the f**k is this sh*t', 'Sell the whole squad. All of them.', "I've seen Sunday league sides defend better than this", "{coach} has lost the dressing room. No doubt about it"],
  rival: ['LMAOOO {club} getting cooked by {opp} 🍳', '{club} fans real quiet today 🤫', 'Imagine supporting {club} 💀', '{opp} 2 good. {club} 2 sh*t.'],
  neutral: ['{star} is the best player in this league and it isn\'t close', '{p} with another one. Ballon d\'Or watch 👀', '{club} look like real title contenders', 'Who is stopping {club} this season?'],
  hat: ['{p} with a HAT-TRICK 🎩🎩🎩 GOAT behaviour', 'Somebody check on {opp}\'s defence after {p} today 💀'],
  sack: ['About f**king time. {coach} gone 👋', 'Harsh on {coach} tbh, the squad just isn\'t good enough', '{coach} out. Who\'s next? Please be someone good'],
  transferIn: ['{p} signed?? WE ARE SO BACK 🔥', '€{fee}m for {p}... bit steep but I trust it', '{p} is gonna cook in our system'],
  transferOut: ['Selling {p}?? What the f**k is the plan here', 'Thanks for everything {p} 👋', 'Fair deal for {p} tbh'],
  request: ['{p} wants out?? Snake 🐍 never liked him anyway', "Can't blame {p} tbh, the club's a mess right now", 'Give {p} what he wants and get the money'],
  broken: ['{p} benched AGAIN after we promised him minutes?? This club 🤦', 'No wonder {p} is fuming'],
  bdo: ['{p} winning the Ballon d\'Or is a f**king robbery', 'Deserved. {p} was on another planet this season 🐐', '{p} Ballon d\'Or. Cry about it.'],
  champion: ['CHAMPIONS!!! 🏆🏆🏆 f**k yes!!!', 'Super League champions. Say it louder. 🏆', 'Crying actual tears rn. CHAMPIONS'],
  goalLive: ['GOOOOAAALLL {p}!!! 🔥🔥', '{p} YOU BEAUTY', 'f**k yes!!! {p}!!!', 'WHAT A F**KING GOAL', 'GET IN THERE {p} 🗣️🗣️'],
  concedeLive: ["oh for f**k's sake", 'defending like they\'ve never met each other 🤦', 'sh*t sh*t sh*t', '{gk} has to save that', 'every single week man'],
  draft: ['This draft has been absolutely mental', 'The Super League is BACK baby 🔥'],
  playoffs: ['Playoff football. Squeaky bum time 😬', 'Two legs. No excuses.'],
};
FT.bombIn = ['HERE WE GO 🚨🚨 {p} IS OURS', 'I am actually shaking. {p}. In OUR shirt.', 'WE GOT {p}!!! BOARD I LOVE YOU', 'season tickets renewed, {p} is coming 🔥', '{p} at our club. Pinch me.', 'the rest of the league should just forfeit now. {p} is here'];
FT.bombOut = ['WHAT THE F**K. WHY WOULD WE SELL {p}', 'selling {p} is the worst decision in the history of this club', 'board OUT. selling {p} for that? are you joking', "I'm cancelling my season ticket. {p} gone 😭", 'can’t believe {p} is gone. end of an era 💔', '{p} betrayed us. or we betrayed him. either way I’m sad'];
FT.bombN = ['🚨 BREAKING: {p} to {to}. This league is mental', '{to} just got {p}?? title race over', '{from} fans in absolute shambles right now 💀', '{fee} for {p}?? robbery or bargain, I can’t decide', 'the {p} transfer is the biggest thing to happen to football since the invention of the ball', 'genuinely did not see {p} to {to} coming'];
FT.derbyW = ['DERBY DAY BELONGS TO US 🔥🔥 {opp} fans where are you??', 'Beating {opp} >>> winning the league. Fact.', 'bragging rights secured. see you at work Monday {opp} lads 😂', 'nothing better than shutting up {opp} fans'];
FT.derbyL = ['losing the {derby} is unforgivable. UNFORGIVABLE.', "I can't go to work tomorrow. {opp} fans will never let me hear the end of it", 'lose any game but THAT one. f**k sake', 'Absolutely gutted. Worst day of the season.'];
FT.trollP = TROLL_P; FT.trollC = TROLL_C; FT.trollG = TROLL_G;
function trollPost(teamFor, pl, club, opp, coach, mine) {
  const r = rnd(); const cat = pl && r < 0.5 ? 'trollP' : r < 0.75 ? 'trollC' : 'trollG';
  return post(rnd() < 0.7 ? teamFor : -1, cat, { p: pl ? DB[pl].short : 'this guy', club, opp, coach }, { mine });
}
const NEUTRAL_HANDLES = ['FootyTakesDaily', 'TacticalTimes', 'BallonDOrWatch', 'SuperLeagueMemes', 'xGfraud', 'TransferGuru', 'SundayLeagueLegend', 'GoalsOnlyFC', 'TheFootyRat', 'CleanSheetCarl'];
function fanHandle(teamId) { if (teamId === undefined || teamId < 0) return '@' + pickOne(NEUTRAL_HANDLES); const n = FAN_NICK[S.teams[teamId].short] || S.teams[teamId].short; return '@' + n + pickOne(['', '_', '4life', '_till_i_die', '1899', '_ultra', 'Dave', '_Sam', '99', 'FC', '_Official?', 'Mike']).replace('?', '') + (rnd() < 0.4 ? ri(1, 99) : ''); }
function fill(tpl, v) { return tpl.replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m); }
function post(team, cat, vars, extra) { const recent = new Set(S.feed.slice(0, 40).map(x => x.tpl)); let tpl = pickOne(FT[cat]); for (let i = 0; i < 6 && recent.has(tpl); i++) tpl = pickOne(FT[cat]); const liveNow = typeof U !== 'undefined' && U.live; const p = Object.assign({ h: fanHandle(team), team, tpl, txt: fill(tpl, vars), likes: Math.round(Math.pow(rnd(), 2) * 9000) + ri(3, 60), rt: ri(0, 900), season: S.season, gw: Math.max(1, S.gw + (liveNow ? 1 : 0)), cat }, extra || {}); S.feed.unshift(p); if (S.feed.length > 220) S.feed.length = 220; return p; }
function matchVars(M, side) {
  const tid = side === 0 ? M.h : M.a, oid = side === 0 ? M.a : M.h;
  const mine = Object.entries(M.ps).filter(([id, v]) => v.side === side);
  const star = mine.slice().sort((a, b) => b[1].rt - a[1].rt)[0]; const flop = mine.filter(x => !x[1].sub).sort((a, b) => a[1].rt - b[1].rt)[0];
  const co = S.coaches[S.teams[tid].coach];
  return { score: side === 0 ? `${M.hg}-${M.ag}` : `${M.ag}-${M.hg}`, opp: S.teams[oid].name, club: S.teams[tid].name, star: star ? shortName(P[star[0]]) : '', flop: flop ? shortName(P[flop[0]]) : '', coach: co ? co.name.split(' ').slice(-1)[0] : 'the caretaker' };
}
function feedRound(Ms) {
  Ms.forEach(M => {
    [0, 1].forEach(side => {
      const tid = side === 0 ? M.h : M.a; const isUser = tid === S.userTeam;
      const gf = side === 0 ? M.hg : M.ag, ga = side === 0 ? M.ag : M.hg; const d = gf - ga;
      const cat = d >= 3 ? 'bigWin' : d > 0 ? 'win' : d === 0 ? 'draw' : d <= -3 ? 'bigLoss' : 'loss';
      const v = matchVars(M, side);
      const n = isUser ? ri(2, 4) : (Math.abs(d) >= 3 && rnd() < 0.5 ? 1 : 0);
      for (let i = 0; i < n; i++) post(tid, cat, v, { mine: isUser });
      if (M.derby && d !== 0) { for (let i = 0; i < (isUser ? 3 : 1); i++) post(tid, d > 0 ? 'derbyW' : 'derbyL', Object.assign({ derby: M.derby }, v), { mine: isUser }); }
      if (isUser && d < 0 && rnd() < 0.7) post(side === 0 ? M.a : M.h, 'rival', Object.assign({}, v, { club: S.teams[tid].name, opp: S.teams[side === 0 ? M.a : M.h].name }), { mine: true });
      const nT = isUser ? ri(2, 4) : (rnd() < 0.25 ? 1 : 0);
      for (let i = 0; i < nT; i++) { const ids = Object.keys(M.ps).filter(id => rnd() < 0.7 ? M.ps[id].side === side : true); trollPost(tid, +pickOne(ids), S.teams[tid].name, v.opp, v.coach, isUser); }
      Object.entries(M.ps).forEach(([id, s]) => { if (s.side === side && s.g >= 3) post(rnd() < 0.5 ? tid : -1, 'hat', { p: shortName(P[id]), opp: S.teams[side === 0 ? M.a : M.h].name }, { mine: isUser }); });
    });
  });
  if (rnd() < 0.6 && S.phase === 'season') { const st = standings(); const top = S.teams[st[0].id]; const sc = S.players.filter(p => p.team >= 0).sort((a, b) => b.st.g - a.st.g)[0]; post(-1, 'neutral', { star: shortName(sc), p: shortName(sc), club: top.name }); }
}
function feedEvent(kind, d) {
  d = d || {};
  if (kind === 'sack') { post(d.team, 'sack', { coach: d.coach }, { mine: d.team === S.userTeam }); post(-1, 'sack', { coach: d.coach }); }
  else if (kind === 'transfer') { const pl = P[d.pl]; const mineIn = d.to === S.userTeam; post(S.userTeam, mineIn ? 'transferIn' : 'transferOut', { p: shortName(pl), fee: d.fee }, { mine: true }); }
  else if (kind === 'trade') post(S.userTeam, 'transferIn', { p: shortName(P[d.pl]), fee: 0 }, { mine: true });
  else if (kind === 'request') { const pl = P[d.pl]; post(pl.team, 'request', { p: shortName(pl) }, { mine: pl.team === S.userTeam }); }
  else if (kind === 'broken') post(S.userTeam, 'broken', { p: shortName(P[d.pl]) }, { mine: true });
  else if (kind === 'bdo') { post(-1, 'bdo', { p: shortName(P[d.pl]) }); post(ri(0, 29), 'bdo', { p: shortName(P[d.pl]) }); }
  else if (kind === 'champion') { for (let i = 0; i < 3; i++) post(d.team, 'champion', {}, { mine: d.team === S.userTeam }); }
  else if (FT[kind]) post(-1, kind, {});
}

if (typeof module !== 'undefined') module.exports = { DB, get S() { return S; }, set S(v) { S = v; P = v.players; }, newState, draftAdvanceAI, draftPick, aiDraftChoice, draftTeamOnClock, playRoundQuick, prepareRound, commitRound, startMatch, stepMinute, finishMatch, nextSeason, standings, rateAt, legacyScore, evalTrade, doTrade, userBid };
