// Headless playtest for Dot Link.
// Usage: node tools/playtest.js [levels e.g. 1,3-5] [--shots dir] [--sol solutions.json]
// For each level:
// 1. Solve it (tools/solve.js, or read --sol from `solve.js --out`).
// 2. Draw every solver line through real pointer drags on a 360 x 740 phone page.
// 3. The board must be won with 3 stars, length <= three, and the card must say "Great job!".
// 4. Replay and the Best chip must play back and return to the won board.
// Also checks: a line can't cross another, letting go early drops the line, tapping a line removes it,
// no sideways scroll at 320 and 360 px wide, and no page errors.
// Needs Playwright (preinstalled in Claude Code cloud sessions at /opt/node22/lib/node_modules/playwright).
const fs = require('fs'), path = require('path'), os = require('os');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const { inPage } = require('./solve.js');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const solFile = args.includes('--sol') ? args[args.indexOf('--sol') + 1] : null;
const sel = args.find(a => /^[\d,-]+$/.test(a));
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

async function drag(page, pts) {
  const c = await page.evaluate(ps => ps.map(([x, y]) => window.__game.toClient(x, y)), pts);
  await page.mouse.move(c[0][0], c[0][1]);
  await page.mouse.down();
  for (let i = 1; i < c.length; i++) {
    const [x0, y0] = c[i - 1], [x1, y1] = c[i], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8));
    for (let k = 1; k <= n; k++) await page.mouse.move(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n);
  }
  await page.mouse.up();
}
const waitState = (page, s, ms) => page.waitForFunction(st => window.__game.state === st, s, { timeout: ms });

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dot-link-'));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(dir, 'test.html'),
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body>' + html + '</body></html>');
  const url = 'file://' + path.join(dir, 'test.html');
  const b = await chromium.launch();
  const errors = [];
  const page = await b.newPage({ viewport: { width: 360, height: 740 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload(); await page.waitForTimeout(200);
  const LV = await page.evaluate(() => window.__game.LEVELS.map(l => ({ name: l.name, two: l.two, three: l.three, n: l.pairs.length })));
  let ids = LV.map((_, i) => i);
  if (sel) { ids = []; for (const part of sel.split(',')) { const [a, z] = part.split('-').map(Number); for (let i = a; i <= (z || a); i++) ids.push(i - 1); } }
  const sols = solFile ? JSON.parse(fs.readFileSync(solFile, 'utf8')) : {};
  let fails = 0;
  const fail = (...m) => { fails++; console.log('  FAIL', ...m); };

  for (const i of ids) {
    const lv = LV[i];
    const sol = sols[i + 1] || await page.evaluate(inPage, [i, 1.5]);
    if (!sol) { fail(`${i + 1} ${lv.name}: no solution`); continue; }
    await page.evaluate(k => window.__game.load(k), i);
    for (const p of sol.order) {
      await drag(page, sol.lines[p]);
      const has = await page.evaluate(q => !!window.__game.lines[q], p);
      if (!has) fail(`${i + 1} ${lv.name}: colour ${p + 1} did not link`);
    }
    const r = await page.evaluate(() => ({
      state: window.__game.state, len: window.__game.totalLen(),
      on: document.getElementById('cardStars').innerHTML.split('<span')[0].length,
      text: document.getElementById('cardText').textContent, card: !document.getElementById('card').hidden,
      sw: document.documentElement.scrollWidth,
    }));
    const ok3 = r.state === 'won' && r.on === 3 && r.len <= lv.three && /^Great job!/.test(r.text) && r.card;
    console.log(`${String(i + 1).padStart(2)} ${lv.name.padEnd(16)} drawn ${r.len.toFixed(1).padStart(7)}  solver ${sol.total.toFixed(1).padStart(7)}  3★ ≤ ${lv.three}  2★ ≤ ${lv.two}  ${ok3 ? '3★ ok' : ''}`);
    if (!ok3) fail(`${i + 1} ${lv.name}:`, JSON.stringify(r));
    if (shotDir) await page.screenshot({ path: path.join(shotDir, `${String(i + 1).padStart(2, '0')}-won.png`) });
    // Replay and Best play back, then return to the won board with its card.
    for (const btn of ['#btnReplay', '#bestBtn']) {
      await page.click(btn);
      try {
        await waitState(page, 'replay', 1000);
        await page.waitForTimeout(300);
        if (shotDir && btn === '#btnReplay' && i === ids[0]) await page.screenshot({ path: path.join(shotDir, `${String(i + 1).padStart(2, '0')}-replay.png`) });
        await waitState(page, 'won', 30000);
        if (await page.evaluate(() => document.getElementById('card').hidden)) fail(`${i + 1} ${btn}: card not back after replay`);
      } catch (e) { fail(`${i + 1} ${btn}: ${e.message.split('\n')[0]}`); }
    }
  }

  // Rules checks on level 3 (Crossed Pairs): crossing is blocked, letting go early drops the line, tapping removes a line.
  {
    await page.evaluate(() => window.__game.load(2));
    const G = await page.evaluate(() => window.__game.LEVELS[2].pairs);
    await drag(page, [[G[0][0], G[0][1]], [G[0][2], G[0][3]]]);                 // straight red line
    await drag(page, [[G[1][0], G[1][1]], [G[1][2], G[1][3]]]);                 // straight blue line would cross it
    const r1 = await page.evaluate(() => [!!window.__game.lines[0], !!window.__game.lines[1]]);
    if (!(r1[0] && !r1[1])) fail('crossing check', JSON.stringify(r1)); else console.log('rules: a crossing line is blocked');
    await drag(page, [[G[1][0], G[1][1]], [G[1][0], G[1][1] - 60]]);           // let go early
    if (await page.evaluate(() => !!window.__game.lines[1])) fail('early release kept a line'); else console.log('rules: letting go early drops the line');
    const mid = [(G[0][0] + G[0][2]) / 2, (G[0][1] + G[0][3]) / 2];
    const [cx, cy] = await page.evaluate(([x, y]) => window.__game.toClient(x, y), mid);
    await page.mouse.click(cx, cy);
    if (await page.evaluate(() => !!window.__game.lines[0])) fail('tap did not remove line'); else console.log('rules: tapping a line removes it');
  }
  // Layout: no sideways scroll on narrow phones; dark theme screenshot.
  for (const w of [320, 360]) {
    await page.setViewportSize({ width: w, height: 640 });
    await page.waitForTimeout(100);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) fail(`sideways scroll at ${w}px: ${sw}`); else console.log(`layout: no sideways scroll at ${w}px`);
  }
  if (shotDir) {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; window.__game.load(window.__game.LEVELS.length - 1); });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(shotDir, 'dark-start.png') });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    await page.click('#btnLevels'); await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(shotDir, 'levels.png') });
  }
  if (errors.length) fail('page errors:', errors);
  console.log(fails ? `${fails} failure(s)` : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
