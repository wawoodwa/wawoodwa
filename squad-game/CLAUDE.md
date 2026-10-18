# Squad Surge: squad runner shooter

A portrait-phone arcade shooter. A squad runs forward and fires automatically. The player drags left and right to steer it through paired gates (+N, −N, ×N, ÷N, or a weapon for the whole squad), around hordes of foes, and into a boss at the end. Stars count the soldiers alive when the boss falls.

- **Live page:** https://claude.ai/artifact/8ik6JLBA8QhFJZcgQFFbLe (published from `index.html`). Republish updates to this same link.
- **Owner preferences:** same as Span Sketch (see `../bridge-game/CLAUDE.md` and the repo `CLAUDE.md`).

## Files

| Path | What it is |
|---|---|
| `index.html` | The entire game: styles, markup, levels, simulation and rendering. Canvas + plain JS, no libraries. Like Span Sketch, it has no doctype/html/head/body; the artifact host adds them. |
| `tools/playtest.js` | Headless Playwright playtester (bot + UI replay + drag check + screenshots). |

## Simulation

- Fixed 60 Hz tick (`tick(s, tx)`); `tx` is the steering target x, rounded to whole units. The state is plain data, so it can be `structuredClone`d. Replays are recorded inputs `[[tick, x], ...]` and reproduce runs exactly.
- Track is `W = 360` units wide, `MID = 180` splits gate sides. The squad moves forward at `SPEED` until `len`, then holds while the boss walks in (`BOSS_WAKE` units before `len`).
- Gates trigger when the squad centre passes their z; the side is the side of `MID` the centre is on. Squad size is capped at `MAXN = 150`.
- Firing: up to `SHOOTERS = 36` soldiers fire; with more soldiers each shot carries `n / 36` damage. Weapons in `WEAPONS` (fire interval in ticks, pellets).
- Foes in `FOES`: hp, forward speed, sideways chase speed, `bite` (soldiers lost on contact), radius. They wake within `WAKE` units.
- Loss: squad reaches 0, the boss reaches the squad, or 4 minutes pass.
- Bullets fly `RANGE = 600` units, past the top of a portrait phone screen. It is a constant, not screen-based, so replays match on every device.
- **Saved runs are tied to the simulation.** Bump `SIM_V` on any change to `tick()`, constants or levels' contents; runs saved under another version are dropped.
- `window.__sim` exposes the simulation core for the playtester; `window.__speed` speeds up the real-time loop in tests.

## Level format (`LEVELS`)

```js
{ name: 'Rifle Fork', start: 5, weapon: 'pistol', len: 2600, boss: 700, two: 23, three: 37, rows: [
    g(250, 'rifle', '+4'), w(500, 12, 'grunt'), ... ] },
```
- `g(z, left, right)`: gate pair; a side can be `null` (open).
- `w(z, count, type, x0 = 40, x1 = 320)`: block of foes.
- `boss`: boss hp. `two` / `three`: soldiers needed for 2 and 3 stars, plain numbers the owner tunes. Initial values are 50% / 80% of the bot's result.

### Rules
1. Name levels after what's in them, short (about 16 characters or fewer).
2. Every level must be winnable with 3 stars: the bot's survivors must be at least `three`.
3. A 3-star win's card says "Great job!" with no hint to improve.

## UI
- Header: level number and current weapon, name, squad count, progress meter, Best chip (always present).
- Footer: **Levels · Replay · Retry · Next**. The result card has no buttons.
- localStorage (try/catch): `squad-surge-best` (stars), `squad-surge-runs-v<SIM_V>` (most-survivors run per level), `squad-surge-level`.

## Testing

```bash
node squad-game/tools/playtest.js                 # all levels
node squad-game/tools/playtest.js 2,4-5 --shots /path/to/dir
```
Reports, per level: the bot's result, whether its inputs re-run identically, and the result card when the real UI replays the run through the Best chip. Also checks that a drag moves the squad and that the page doesn't overflow at 360px. After any change to the simulation, re-run all levels. Look at the screenshots (start, play, boss, end, dark mode) before publishing new content.
