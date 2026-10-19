// Trace one bot run for Squad Surge: squad size, weapon and boss hp every 2 seconds.
// Use it when a level's bot loses or its numbers look odd (e.g. the bot skips a weapon gate).
// Usage: node tools/trace.js <level number, 1-based>
const fs = require('fs'), path = require('path'), os = require('os');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.join(__dirname, '..');
const li = (+process.argv[2] || 1) - 1;
// Reuse the playtester's bot so the trace matches what playtest.js reports.
const src = fs.readFileSync(path.join(__dirname, 'playtest.js'), 'utf8');
const botSrc = src.slice(src.indexOf('function bot(li)'), src.indexOf('(async () => {')).trim();

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'squad-trace-'));
  fs.writeFileSync(path.join(dir, 'test.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + '</body></html>');
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto('file://' + path.join(dir, 'test.html')); await p.waitForTimeout(300);
  const log = await p.evaluate(([code, li]) => {
    const r = eval('(' + code + ')')(li);
    const { create, tick, LEVELS } = window.__sim, s = create(li, true), out = [];
    let i = 0, tx = 180;
    out.push(`${LEVELS[li].name}: start ${s.n} ${s.wpn}, boss hp ${s.boss.hp}`);
    while (!s.over) {
      while (i < r.inputs.length && r.inputs[i][0] <= s.t) tx = r.inputs[i++][1];
      tick(s, tx);
      if (s.t % 120 === 0) out.push(`${(s.t / 60).toFixed(0).padStart(3)}s  z ${String(Math.round(s.z)).padStart(5)}  soldiers ${String(s.n).padStart(6)}  ${s.wpn.padEnd(7)}  boss hp ${Math.round(s.boss.hp)}  boss gap ${Math.round(s.boss.z - s.z)}`);
    }
    out.push(`END ${s.over.won ? 'WIN' : 'LOSE (' + s.over.why + ')'} with ${s.n} soldiers`);
    return out;
  }, [botSrc, li]);
  console.log(log.join('\n'));
  await b.close();
})();
