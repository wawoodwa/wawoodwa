// Headless playtest for Squad Surge.
// Usage: node tools/playtest.js [levels e.g. 1,3-5] [--shots dir]
// 1. A bot plays each level through the page's own simulation (window.__sim) and keeps its run.
// 2. The bot's run is saved as the level's best run, and the real UI replays it (Best chip) at high speed;
//    the result card must match the headless result, which checks the game loop and replay determinism.
// 3. A pointer drag on level 1 must move the squad.
// Needs Playwright (preinstalled in Claude Code cloud sessions at /opt/node22/lib/node_modules/playwright).
const fs = require('fs'), path = require('path'), os = require('os');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const sel = args.find(a => /^[\d,-]+$/.test(a));

// Greedy bot with lookahead: every D ticks, try each lane, hold it for LOOK ticks, keep the best outcome.
function bot(li) {
  const { create, tick, starsFor } = window.__sim;
  const D = 20, LOOK = 330, LANES = [];
  for (let x = 20; x <= 340; x += 32) LANES.push(x);
  const DPS = { pistol: 2, rifle: 5, shotgun: 7, minigun: 12 };
  const score = t => t.over ? (t.over.won ? 1e6 + t.n * 1000 : -1e6 + t.z) : t.n * DPS[t.wpn] + t.n * 2 - t.foes.length * 0.01 - t.boss.hp * 0.5;
  let s = create(li, true);
  const inputs = [];
  let cur = 180;
  while (!s.over) {
    let bestX = cur, bestS = -Infinity;
    for (const x of LANES) {
      const t = structuredClone(s);
      for (let k = 0; k < LOOK && !t.over; k++) tick(t, x);
      const v = score(t) - Math.abs(x - cur) * 0.001;
      if (v > bestS) { bestS = v; bestX = x; }
    }
    if (bestX !== cur || !inputs.length) { inputs.push([s.t, bestX]); cur = bestX; }
    for (let k = 0; k < D && !s.over; k++) tick(s, cur);
  }
  return { won: s.over.won, why: s.over.why, n: s.n, t: s.t, stars: starsFor(li, s.over.won, s.n), inputs };
}

(async () => {
  // The published page gets its doctype/head wrapper from the artifact host; add one for local runs.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-surge-'));
  const page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(dir, 'test.html'),
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body>' + page + '</body></html>');
  const url = 'file://' + path.join(dir, 'test.html');
  const b = await chromium.launch();
  const errors = [];
  const newPage = async (init) => {
    const p = await b.newPage({ viewport: { width: 360, height: 740 } });
    p.on('pageerror', e => errors.push(e.message));
    if (init) await p.addInitScript(init.fn, init.arg);
    await p.goto(url); await p.waitForTimeout(300);
    return p;
  };

  const probe = await newPage();
  const RUNS_KEY = await probe.evaluate(() => window.__sim.RUNS_KEY);
  const LV = await probe.evaluate(() => window.__sim.LEVELS.map(l => ({ name: l.name, two: l.two, three: l.three })));
  let want = LV.map((_, i) => i);
  if (sel) want = sel.split(',').flatMap(r => { const [a, z] = r.split('-').map(Number); return Array.from({ length: (z || a) - a + 1 }, (_, k) => a - 1 + k); });

  // 1. Bot runs, one page per level in parallel.
  const res = {};
  await Promise.all(want.map(async li => {
    const p = await newPage();
    res[li] = await p.evaluate(bot, li);
    // The recorded inputs must reproduce the run exactly.
    res[li].rerun = await p.evaluate(([li, inp]) => window.__sim.run(li, inp), [li, res[li].inputs]);
    await p.close();
  }));

  // 2. Replay each bot run through the real UI via the Best chip.
  const runs = {}; for (const li of want) if (res[li].won) runs[li] = { n: res[li].n, in: res[li].inputs };
  const ui = await newPage({ fn: ([k, r]) => { localStorage.setItem(k, r); window.__speed = 12; }, arg: [RUNS_KEY, JSON.stringify(runs)] });
  for (const li of want) {
    if (!res[li].won) { res[li].ui = '(no win to replay)'; continue; }
    await ui.click('#btnLevels'); await ui.click(`.lvl[data-i="${li}"]`); await ui.waitForTimeout(100);
    if (shotDir) { fs.mkdirSync(shotDir, { recursive: true }); await ui.screenshot({ path: path.join(shotDir, `L${li + 1}-start.png`) }); }
    await ui.click('#bestBtn');
    let shot = 0;
    res[li].ui = 'timeout';
    for (let k = 0; k < 300; k++) {
      await ui.waitForTimeout(100);
      if (shotDir && shot < 2 && k === [8, 22][shot]) await ui.screenshot({ path: path.join(shotDir, `L${li + 1}-play${++shot}.png`) });
      if (shotDir && shot < 3 && await ui.evaluate(() => { const c = window.__sim.cur; return c.z >= window.__sim.LEVELS[c.li].len && c.boss.hp > 0; })) {
        shot = 3; await ui.screenshot({ path: path.join(shotDir, `L${li + 1}-boss.png`) });
      }
      if (await ui.isVisible('#card')) { res[li].ui = (await ui.textContent('#cardTitle')) + ' | ' + (await ui.textContent('#cardText')); break; }
    }
    if (shotDir) await ui.screenshot({ path: path.join(shotDir, `L${li + 1}-end.png`) });
  }

  // 3. Pointer drag moves the squad.
  const d = await newPage();
  const box = await d.locator('#c').boundingBox();
  await d.mouse.move(box.x + 180, box.y + 500); await d.mouse.down();
  await d.mouse.move(box.x + 280, box.y + 500, { steps: 10 }); await d.waitForTimeout(500);
  const sx = await d.evaluate(() => window.__sim.cur.x);
  await d.mouse.up();
  const overflow = await d.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (shotDir) { await d.emulateMedia({ colorScheme: 'dark' }); await d.waitForTimeout(1500); await d.screenshot({ path: path.join(shotDir, 'dark.png') }); }

  // 4. Other screen sizes: mid-run screenshot of a best-run replay, and a drag check, on phones and tablets.
  const DEVICES = [['phone-360x740', 360, 740], ['phone-430x932', 430, 932], ['ipad-mini-744x1133', 744, 1133],
    ['ipad-820x1180', 820, 1180], ['ipad-landscape-1180x820', 1180, 820]];
  const li0 = want.find(li => res[li].won);
  for (const [name, vw, vh] of DEVICES) {
    const p = await b.newPage({ viewport: { width: vw, height: vh } });
    p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(([k, r, li]) => { localStorage.setItem(k, r); localStorage.setItem('squad-surge-level', li); window.__speed = 4; }, [RUNS_KEY, JSON.stringify(runs), li0]);
    await p.goto(url); await p.waitForTimeout(300);
    const bx = await p.locator('#c').boundingBox();
    // Drag a quarter of the track width; the squad should follow by the same world distance on every screen.
    const sc = Math.min(bx.width / 360, bx.height / 600);
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height * 0.7); await p.mouse.down();
    await p.mouse.move(bx.x + bx.width / 2 + 90 * sc, bx.y + bx.height * 0.7, { steps: 10 }); await p.waitForTimeout(400);
    const dx = await p.evaluate(() => window.__sim.cur.x); await p.mouse.up();
    const ovf = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await p.click('#btnRetry'); await p.click('#bestBtn'); await p.waitForTimeout(2500);
    if (shotDir) await p.screenshot({ path: path.join(shotDir, `device-${name}.png`) });
    console.log(`${name.padEnd(24)} scale ${sc.toFixed(2)} | drag 180 -> ${dx.toFixed(0)} (expect ~270) | overflow ${ovf}`);
    await p.close();
  }

  for (const li of want) {
    const r = res[li], lv = LV[li];
    const same = r.rerun.n === r.n && r.rerun.won === r.won && r.rerun.t === r.t;
    console.log(String(li + 1).padStart(2), lv.name.padEnd(16), r.won ? `WIN ${r.n} left` : `LOSE (${r.why}) ${r.n} left`,
      `| ${(r.t / 60).toFixed(0)}s | stars ${r.stars} (2★ ${lv.two}, 3★ ${lv.three}) | rerun ${same ? 'same' : 'DIFFERENT'}\n    UI: ${r.ui}`);
  }
  console.log(`drag: squad x 180 -> ${sx.toFixed(0)} (expect ~280); horizontal overflow: ${overflow}`);
  if (errors.length) console.log('page errors:', [...new Set(errors)]);
  await b.close();
})();
