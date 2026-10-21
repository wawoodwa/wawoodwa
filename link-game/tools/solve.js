// Level solver for Dot Link.
// Usage: node tools/solve.js [levels e.g. 1,3-5] [--out solutions.json]
// Runs inside the real page so it uses the game's own rules (window.__game.blocker):
// 1. Route each colour in turn with A* on a 5-unit grid (16 directions), around everything already routed.
// 2. Pull each route tight (shortcut to the farthest clear point, then nudge corners inward).
// 3. Try every routing order (up to 720). Where shortest routes block each other, negotiate instead: route all lines
//    with a rising price on crowding each other until none conflict, then pull them tight (6 seeds).
// 4. Keep the shortest board, then rip up and reroute each line until nothing improves.
// Routes keep MARGIN extra clearance, so a playtester drawing them with real pointer events never touches a limit.
// Prints each level's shortest total and suggested thresholds: three = round(L * 1.15), two = round(L * 1.4).
const fs = require('fs'), path = require('path'), os = require('os');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const sel = args.find(a => /^[\d,-]+$/.test(a));

function inPage([li, MARGIN]) {
  const G = window.__game, L = G.LEVELS[li], P = L.pairs.length;
  const CS = 5, NX = Math.floor(G.W / CS) + 1, NY = Math.floor(G.H / CS) + 1;
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
    [2, 1], [1, 2], [-2, 1], [-1, 2], [2, -1], [1, -2], [-2, -1], [-1, -2]];
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const ok = (a, b, p, lines) => !G.blocker(a, b, p, lines, null, MARGIN, L);

  function astar(p, lines) {
    const q = L.pairs[p], A = [q[0], q[1]], B = [q[2], q[3]];
    if (ok(A, B, p, lines)) return [A, B];
    const N = NX * NY, g = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-2);
    const free = new Int8Array(N);   // 0 unknown, 1 free, -1 blocked
    const pos = i => [(i % NX) * CS, Math.floor(i / NX) * CS];
    const isFree = i => { if (!free[i]) { const c = pos(i); free[i] = ok(c, c, p, lines) ? 1 : -1; } return free[i] > 0; };
    const heap = [];
    const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k) { const u = (k - 1) >> 1; if (heap[u][0] <= heap[k][0]) break; [heap[u], heap[k]] = [heap[k], heap[u]]; k = u; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    // start: grid points near A that A can reach
    const R = 3;
    const ax = Math.round(A[0] / CS), ay = Math.round(A[1] / CS);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = ax + dx, y = ay + dy; if (x < 0 || y < 0 || x >= NX || y >= NY) continue;
      const i = y * NX + x, c = pos(i);
      if (isFree(i) && ok(A, c, p, lines)) { const gg = d(A, c); if (gg < g[i]) { g[i] = gg; from[i] = -1; push(gg + d(c, B), i); } }
    }
    const bx = Math.round(B[0] / CS), by = Math.round(B[1] / CS);
    let bestEnd = -1, bestCost = Infinity;
    while (heap.length) {
      const [f, i] = pop();
      if (f >= bestCost) break;
      const c = pos(i), x = i % NX, y = (i - x) / NX;
      if (f > g[i] + d(c, B) + 1e-9) continue;
      if (Math.abs(x - bx) <= R && Math.abs(y - by) <= R && ok(c, B, p, lines)) {
        const cost = g[i] + d(c, B); if (cost < bestCost) { bestCost = cost; bestEnd = i; }
      }
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) continue;
        const j = ny * NX + nx; if (!isFree(j)) continue;
        const cj = pos(j), gg = g[i] + d(c, cj);
        if (gg >= g[j] - 1e-9) continue;
        if (!ok(c, cj, p, lines)) continue;
        g[j] = gg; from[j] = i; push(gg + d(cj, B), j);
      }
    }
    if (bestEnd < 0) return null;
    const pts = [B]; for (let i = bestEnd; i >= 0; i = from[i]) pts.push(pos(i)); pts.push(A);
    return pts.reverse();
  }
  function tighten(pts, p, lines) {
    // shortcut to the farthest clear point
    let out = [pts[0]], i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1; while (j > i + 1 && !ok(pts[i], pts[j], p, lines)) j--;
      out.push(pts[j]); i = j;
    }
    // nudge corners toward the straight line between their neighbours; drop corners that become unneeded
    for (let pass = 0; pass < 60; pass++) {
      let moved = false;
      for (let k = 1; k < out.length - 1; k++) {
        const a = out[k - 1], c = out[k + 1];
        if (ok(a, c, p, lines)) { out.splice(k, 1); k--; moved = true; continue; }
        const v = out[k], mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], dm = d(v, mid);
        if (dm < 1e-6) continue;
        for (const s of [4, 2, 1, 0.5, 0.25]) {
          const t = Math.min(1, s / dm), w = [v[0] + (mid[0] - v[0]) * t, v[1] + (mid[1] - v[1]) * t];
          if (ok(a, w, p, lines) && ok(w, c, p, lines)) { out[k] = w; moved = true; break; }
        }
      }
      if (!moved) break;
    }
    return out;
  }
  const len = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += d(pts[i - 1], pts[i]); return s; };

  // Negotiated routing (PathFinder): when shortest routes block each other, route every line through the static
  // board only, with a rising price on grid points too close to other lines, until no two lines conflict.
  function negotiate(seed) {
    const N = NX * NY, R = G.GAP + MARGIN + 2.5;
    const pos = i => [(i % NX) * CS, Math.floor(i / NX) * CS];
    const free = [...Array(P)].map(() => new Int8Array(N));
    const isFree = (p, i) => { const f = free[p]; if (!f[i]) { const c = pos(i); f[i] = ok(c, c, p, []) ? 1 : -1; } return f[i] > 0; };
    const edge = [...Array(P)].map(() => new Map());
    const okEdge = (p, i, k, a, b) => { const m = edge[p], key = i * 16 + k; let v = m.get(key); if (v === undefined) { v = ok(a, b, p, []); m.set(key, v); } return v; };
    const near = [...Array(P)].map(() => new Uint8Array(N));
    const hist = new Float32Array(N);
    let rnd = seed * 9301 + 49297; const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
    const jitter = new Float32Array(N).map(() => 1 + rand() * 0.02 * (seed > 0));
    const paths = [];
    function mark(p) {
      const m = near[p]; m.fill(0); const pts = paths[p]; if (!pts) return;
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1], b = pts[k];
        const x0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - R) / CS)), x1 = Math.min(NX - 1, Math.ceil((Math.max(a[0], b[0]) + R) / CS));
        const y0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - R) / CS)), y1 = Math.min(NY - 1, Math.ceil((Math.max(a[1], b[1]) + R) / CS));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (ptSegD([x * CS, y * CS], a, b) < R) m[y * NX + x] = 1;
      }
    }
    function ptSegD(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; let t = l ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]); }
    function rroute(p, pres) {
      const q = L.pairs[p], A = [q[0], q[1]], B = [q[2], q[3]];
      const occ = j => { let n = 0; for (let o = 0; o < P; o++) if (o !== p && near[o][j]) n++; return n; };
      const g = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-2), heap = [];
      const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k) { const u = (k - 1) >> 1; if (heap[u][0] <= heap[k][0]) break; [heap[u], heap[k]] = [heap[k], heap[u]]; k = u; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      const cost = (j, len) => len * jitter[j] * (1 + hist[j]) * (1 + pres * occ(j));
      const RR = 3, ax = Math.round(A[0] / CS), ay = Math.round(A[1] / CS), bx = Math.round(B[0] / CS), by = Math.round(B[1] / CS);
      for (let dy = -RR; dy <= RR; dy++) for (let dx = -RR; dx <= RR; dx++) {
        const x = ax + dx, y = ay + dy; if (x < 0 || y < 0 || x >= NX || y >= NY) continue;
        const i = y * NX + x, c = pos(i);
        if (isFree(p, i) && ok(A, c, p, [])) { const gg = cost(i, d(A, c)); if (gg < g[i]) { g[i] = gg; from[i] = -1; push(gg + d(c, B), i); } }
      }
      let bestEnd = -1, bestCost = Infinity;
      while (heap.length) {
        const [f, i] = pop(); if (f >= bestCost) break;
        const c = pos(i), x = i % NX, y = (i - x) / NX;
        if (f > g[i] + d(c, B) + 1e-9) continue;
        if (Math.abs(x - bx) <= RR && Math.abs(y - by) <= RR && ok(c, B, p, [])) { const cc = g[i] + d(c, B); if (cc < bestCost) { bestCost = cc; bestEnd = i; } }
        for (let k = 0; k < 16; k++) {
          const nx = x + DIRS[k][0], ny = y + DIRS[k][1]; if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) continue;
          const j = ny * NX + nx; if (!isFree(p, j)) continue;
          const cj = pos(j), gg = g[i] + cost(j, d(c, cj));
          if (gg >= g[j] - 1e-9 || !okEdge(p, i, k, c, cj)) continue;
          g[j] = gg; from[j] = i; push(gg + d(cj, B), j);
        }
      }
      if (bestEnd < 0) return null;
      const pts = [B]; for (let i = bestEnd; i >= 0; i = from[i]) pts.push(pos(i)); pts.push(A);
      return pts.reverse();
    }
    const conflicts = p => { let n = 0; const pts = paths[p]; for (let k = 1; k < pts.length; k++) if (G.blocker(pts[k - 1], pts[k], p, paths, null, MARGIN, L)) { n++; const j = Math.round(pts[k][1] / CS) * NX + Math.round(pts[k][0] / CS); if (j >= 0 && j < N) hist[j] += 0.4; } return n; };
    const order = [...Array(P).keys()];
    for (let i = order.length - 1; i > 0 && seed; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let pres = 0.5;
    for (let round = 0; round < 80; round++) {
      for (const p of order) { const r = rroute(p, pres); if (!r) return null; paths[p] = r; mark(p); }
      let bad = 0; for (const p of order) bad += conflicts(p);
      if (!bad) {
        // pull every line tight against the others, a few times round
        for (let k = 0; k < 4; k++) for (const p of order) { const others = paths.slice(); delete others[p]; paths[p] = tighten(paths[p], p, others); }
        return { total: paths.reduce((s, r) => s + len(r), 0), lines: paths.slice(), order };
      }
      pres *= 1.5;
    }
    return null;
  }
  const route = (p, lines) => { const r = astar(p, lines); return r && tighten(r, p, lines); };
  function perms(n) {
    const out = [], a = [...Array(n).keys()];
    const rec = k => { if (out.length >= 720) return; if (k === n) { out.push([...a]); return; } for (let i = k; i < n; i++) { [a[k], a[i]] = [a[i], a[k]]; rec(k + 1); [a[k], a[i]] = [a[i], a[k]]; } };
    rec(0); return out;
  }
  let best = null;
  for (const order of perms(P)) {
    const lines = [];
    let total = 0, okAll = true;
    for (const p of order) { const r = route(p, lines); if (!r) { okAll = false; break; } lines[p] = r; total += len(r); if (best && total >= best.total) { okAll = false; break; } }
    if (okAll && (!best || total < best.total)) best = { total, lines, order: [...order] };
  }
  for (let seed = 0; seed < 6; seed++) {
    const r = negotiate(seed);
    if (r && (!best || r.total < best.total - 0.5)) best = r;
  }
  if (!best) return null;
  // rip up and reroute until nothing improves; the drawing order becomes the order lines were (re)routed
  let order = [...best.order];
  for (let round = 0; round < 6; round++) {
    let improved = false;
    for (let p = 0; p < P; p++) {
      const lines = best.lines.slice(); delete lines[p];
      const r = route(p, lines);
      if (r && len(r) < len(best.lines[p]) - 0.5) {
        lines[p] = r; best.lines = lines; improved = true;
        order = order.filter(x => x !== p).concat(p);
      }
    }
    if (!improved) break;
  }
  best.total = best.lines.reduce((s, r) => s + len(r), 0);
  best.order = order;
  return { total: best.total, order, lines: best.lines.map(r => r.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100])) };
}

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dot-link-'));
  const page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(dir, 'test.html'),
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body>' + page + '</body></html>');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 740 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto('file://' + path.join(dir, 'test.html'));
  const LV = await p.evaluate(() => window.__game.LEVELS.map(l => ({ name: l.name, two: l.two, three: l.three })));
  let ids = LV.map((_, i) => i);
  if (sel) { ids = []; for (const part of sel.split(',')) { const [a, z] = part.split('-').map(Number); for (let i = a; i <= (z || a); i++) ids.push(i - 1); } }
  const out = {};
  let fails = 0;
  for (const i of ids) {
    const t0 = Date.now();
    const r = await p.evaluate(inPage, [i, 1.5]);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (!r) { fails++; console.log(`${String(i + 1).padStart(2)} ${LV[i].name.padEnd(16)} NO SOLUTION (${secs}s)`); continue; }
    out[i + 1] = r;
    const three = Math.round(r.total * 1.15), two = Math.round(r.total * 1.4);
    const flag = (LV[i].three === three && LV[i].two === two) ? '' : `   set three: ${three}, two: ${two}`;
    console.log(`${String(i + 1).padStart(2)} ${LV[i].name.padEnd(16)} L=${r.total.toFixed(1).padStart(7)}  order ${r.order.map(x => x + 1).join('')}  now three ${LV[i].three} two ${LV[i].two}${flag}  (${secs}s)`);
  }
  if (errors.length) { console.log('page errors:', errors); fails++; }
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(out));
  await b.close();
  process.exit(fails ? 1 : 0);
}

module.exports = { inPage };
if (require.main === module) main();
