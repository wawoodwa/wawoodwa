// Headless playtest for Span Sketch.
// Usage: node tools/playtest.js cases.json [workers]
// cases.json: [[spanIndex (0-based), [[x, y], [x, y], ...]], ...] -- stroke points in world units.
// Needs Playwright (preinstalled in Claude Code cloud sessions at /opt/node22/lib/node_modules/playwright).
const fs = require('fs'), path = require('path'), os = require('os');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.join(__dirname, '..');
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const N = +(process.argv[3] || 5);
const MATTER = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';

(async () => {
  // The published page gets its doctype/head wrapper from the artifact host; add one for local runs.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'span-sketch-'));
  const matter = await (await fetch(MATTER)).text();
  fs.writeFileSync(path.join(dir, 'matter.min.js'), matter);
  const page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(MATTER, 'matter.min.js');
  fs.writeFileSync(path.join(dir, 'test.html'),
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body>' + page + '</body></html>');

  const b = await chromium.launch();
  const results = [];
  async function worker(slice) {
    const p = await b.newPage({ viewport: { width: 390, height: 760 } });
    p.on('pageerror', e => console.error('page error:', e.message));
    await p.goto('file://' + path.join(dir, 'test.html')); await p.waitForTimeout(400);
    const r = await p.locator('#c').boundingBox();
    // Same world-to-screen transform as resize() in index.html (VIEW = 0,120 400x640).
    const sc = Math.min(r.width / 400, r.height / 640), ox = (r.width - 400 * sc) / 2, oy = (r.height - 640 * sc) / 2 - 120 * sc;
    const W = (x, y) => [r.x + ox + x * sc, r.y + oy + y * sc];
    for (const [i, pts] of slice) {
      await p.click('#btnLevels'); await p.click(`.lvl[data-i="${i}"]`); await p.waitForTimeout(150);
      await p.mouse.move(...W(...pts[0])); await p.mouse.down();
      for (const q of pts.slice(1)) await p.mouse.move(...W(...q), { steps: 25 });
      await p.mouse.up();
      let res = 'timeout (stroke probably clipped rock and never released)';
      for (let k = 0; k < 45; k++) {
        await p.waitForTimeout(400);
        if (await p.isVisible('#card')) { res = (await p.textContent('#cardTitle')) + ' | ' + (await p.textContent('#cardText')); break; }
      }
      results.push([i + 1, await p.textContent('#spanName'), JSON.stringify(pts), res]);
    }
  }
  const slices = Array.from({ length: N }, (_, k) => cases.filter((_, j) => j % N === k));
  await Promise.all(slices.map(worker));
  results.sort((a, b) => a[0] - b[0]);
  for (const r of results) console.log(String(r[0]).padStart(3), r[1].padEnd(20), r[2], '\n     ', r[3]);
  await b.close();
})();
