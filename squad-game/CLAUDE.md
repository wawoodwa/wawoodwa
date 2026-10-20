# Squad Surge: squad runner shooter

A portrait-phone arcade shooter. A squad runs forward and fires automatically. The player drags left and right to steer it through paired gates (+N, −N, ×N, ÷N, or a weapon for the whole squad), around hordes of foes, and into a boss at the end. Stars count the soldiers alive when the boss falls.

- **Live page:** https://claude.ai/artifact/8ik6JLBA8QhFJZcgQFFbLe (published from `index.html`; the page is private). Republish updates to this same link: pass `url` to the Artifact tool, and read the artifact first if this session didn't publish it.
- **Repo:** `wawoodwa/wawoodwa` (the owner's GitHub profile repo), directory `squad-game/`. Never touch the repo's `README.md`; list games in `GAMES.md`.
- **Owner preferences:** see the repo `CLAUDE.md`, `HANDOFF.md` and `../bridge-game/CLAUDE.md`. The ones specific to this game are under "Owner rules" below.

## Files

| Path | What it is |
|---|---|
| `index.html` | The entire game: styles, markup, levels, simulation and rendering. Canvas + plain JS, no libraries. Like Span Sketch, it has no doctype/html/head/body; the artifact host adds them. |
| `tools/playtest.js` | Headless Playwright playtester: bot run per level, replay check, real-UI replay through the Best chip, drag and overflow checks on phone and iPad sizes, screenshots. |
| `tools/trace.js` | Prints one bot run every 2 seconds (soldiers, weapon, boss hp, boss distance). Use it to find out why a level's bot loses. |
| `HANDOFF.md` | Copy-paste prompt for a session that adds more levels. |

## Owner rules for this game

1. **No caps on soldiers.** The count is unbounded; ×2 chains can reach thousands. Limit only what's drawn, never the real count.
2. **Don't draw every soldier.** At most `SPREAD = 300` figures, as a full, even formation. Never sample a bigger spiral by stride: it makes pinwheel arms.
3. **Faster, gate-dense levels** are what the owner asked for after the first 5: levels 6–10 scroll at 100–140 with a gate pair every 160–170 units; levels 11–20 at 142–160 with a gate pair every 180 down to 152 units. Levels 21–50 scroll at 161–180 with a gate pair every 160 down to 150 units.
4. **Clean ending:** when a level ends, bullets finish their flight and, after a win, the squad scrolls off the bottom at the level's speed before the card shows.
5. **Bullets are colored by weapon**, so the current gun is readable at a glance.
6. **Level names** describe what's in the level, about 16 characters or fewer, and are never generic.
7. **Every level must be winnable with 3 stars.** Stars start at 50% (2 stars) and 80% (3 stars) of the bot's survivors, as plain numbers per level that the owner may tune.
8. A 3-star win's card says "Great job!" with no hint to improve. The result card has no buttons.

## Levels

| # | Name | Speed | Start | Weapon | Boss hp | 2★ | 3★ | Bot's survivors |
|---|---|---|---|---|---|---|---|---|
| 1 | Pistol Patrol | 70 | 3 | pistol | 260 | 10 | 16 | 19 |
| 2 | Rifle Fork | 70 | 5 | pistol | 700 | 23 | 37 | 46 |
| 3 | Divide Trap | 70 | 8 | rifle | 1100 | 38 | 62 | 78 |
| 4 | Brute Column | 70 | 10 | rifle | 1600 | 25 | 40 | 50 |
| 5 | Shotgun Swarm | 70 | 12 | pistol | 2200 | 40 | 64 | 80 |
| 6 | Gate Sprint | 100 | 6 | pistol | 700 | 17 | 27 | 34 |
| 7 | Double Lanes | 110 | 5 | rifle | 3600 | 126 | 201 | 251 |
| 8 | Runner Rapids | 120 | 8 | pistol | 4200 | 210 | 336 | 420 |
| 9 | Shotgun Express | 130 | 10 | shotgun | 3000 | 934 | 1494 | 1868 |
| 10 | Minigun Dash | 140 | 12 | rifle | 7000 | 2208 | 3533 | 4416 |
| 11 | Brute Buckshot | 142 | 12 | shotgun | 20000 | 2458 | 3933 | 4916 |
| 12 | Pistol Gamble | 144 | 10 | pistol | 17000 | 1714 | 2742 | 3428 |
| 13 | Minigun Stampede | 146 | 14 | minigun | 17000 | 1713 | 2741 | 3426 |
| 14 | Triple or Plus | 148 | 6 | rifle | 8000 | 1602 | 2562 | 3203 |
| 15 | Brute Gauntlet | 150 | 10 | rifle | 1500 | 145 | 231 | 289 |
| 16 | Gun Swap Relay | 152 | 12 | pistol | 8000 | 804 | 1286 | 1608 |
| 17 | Divide or Drop | 154 | 30 | rifle | 25000 | 2498 | 3997 | 4996 |
| 18 | Three-Foe Horde | 156 | 14 | shotgun | 22000 | 2078 | 3325 | 4156 |
| 19 | Downgrade Dare | 158 | 12 | minigun | 15000 | 4948 | 7917 | 9896 |
| 20 | Minigun Finale | 160 | 12 | minigun | 240000 | 24261 | 38818 | 48522 |
| 21 | Rifle Ramp | 161 | 12 | rifle | 3000 | 708 | 1132 | 1416 |
| 22 | Runner Riot | 162 | 10 | pistol | 11000 | 2824 | 4518 | 5648 |
| 23 | Buckshot Halves | 162 | 14 | shotgun | 7400 | 884 | 1414 | 1768 |
| 24 | Brute Wall | 163 | 12 | rifle | 5900 | 620 | 992 | 1240 |
| 25 | Triple Threat | 164 | 8 | rifle | 180000 | 46560 | 74496 | 93120 |
| 26 | Minigun Mirage | 164 | 12 | pistol | 320000 | 30061 | 48097 | 60122 |
| 27 | Pistol Purist | 165 | 14 | pistol | 7600 | 4521 | 7233 | 9042 |
| 28 | Halving Highway | 166 | 30 | rifle | 15000 | 3599 | 5758 | 7198 |
| 29 | Swap Shop | 166 | 12 | pistol | 52000 | 5327 | 8523 | 10654 |
| 30 | Grunt Flood | 167 | 14 | shotgun | 130000 | 15444 | 24710 | 30888 |
| 31 | Runner Blitz | 168 | 12 | minigun | 230000 | 5792 | 9267 | 11584 |
| 32 | Brute Brigade | 168 | 16 | minigun | 210000 | 8580 | 13728 | 17160 |
| 33 | Plus or Times | 169 | 10 | rifle | 15000 | 3620 | 5792 | 7241 |
| 34 | Shotgun Sprint | 170 | 12 | pistol | 26000 | 3364 | 5382 | 6728 |
| 35 | Double or Half | 170 | 12 | rifle | 230000 | 52062 | 83299 | 104124 |
| 36 | Rifle Recall | 171 | 14 | minigun | 240000 | 52614 | 84182 | 105228 |
| 37 | Minus Maze | 171 | 40 | shotgun | 15000 | 1732 | 2771 | 3464 |
| 38 | Brute Escort | 172 | 12 | rifle | 16000 | 3245 | 5192 | 6490 |
| 39 | Pistol Payday | 173 | 10 | pistol | 80000 | 133296 | 213273 | 266592 |
| 40 | Minigun Meltdown | 173 | 14 | minigun | 630000 | 115288 | 184461 | 230577 |
| 41 | Lane Lottery | 174 | 12 | shotgun | 86000 | 10164 | 16262 | 20328 |
| 42 | Grunt Phalanx | 175 | 12 | rifle | 27000 | 6574 | 10518 | 13148 |
| 43 | Times Four | 175 | 8 | pistol | 120000 | 65704 | 105126 | 131408 |
| 44 | Weapon Roulette | 176 | 12 | rifle | 530000 | 53520 | 85632 | 107040 |
| 45 | Runner Swarm | 177 | 14 | shotgun | 260000 | 15196 | 24313 | 30392 |
| 46 | Shotgun Siege | 177 | 12 | shotgun | 190000 | 10972 | 17555 | 21944 |
| 47 | Split Decision | 178 | 12 | rifle | 230000 | 21878 | 35004 | 43756 |
| 48 | Rifle Rush | 179 | 12 | rifle | 22000 | 6888 | 11020 | 13776 |
| 49 | Horde Highway | 179 | 14 | shotgun | 3500 | 472 | 755 | 944 |
| 50 | Times Five Rush | 180 | 12 | minigun | 6700000 | 729624 | 1167398 | 1459248 |

## Simulation

- Fixed 60 Hz tick (`tick(s, tx)`); `tx` is the steering target x, rounded to whole units. The state is plain data, so it can be `structuredClone`d. Replays are recorded inputs `[[tick, x], ...]` and reproduce runs exactly.
- Track is `W = 360` units wide, and `MID = 180` splits the gate sides. The squad moves forward at the level's `speed` (default `SPEED = 70`) until `len`, then holds while the boss walks in (`BOSS_WAKE` units before `len`).
- Gates trigger when the squad centre passes their z; the side is the side of `MID` the centre is on.
- Squad size has **no cap**. The crowd spreads until `SPREAD = 300` soldiers, then packs tighter so it stays narrower than the road (`spacing`, `radius`). The drawing shows at most `SPREAD` figures as a full, even formation (`off(i, drawN)`); the count label shows the real number.
- Firing: up to `SHOOTERS = 36` soldiers fire; with more soldiers each shot carries `n / 36` damage. Weapons in `WEAPONS` (fire interval in ticks, pellets): pistol 2 shots/s, rifle 5/s, shotgun 4 pellets every 24 ticks (about 10 pellets/s), minigun 12/s. `SHOT_COLOR` maps each weapon to a CSS color token.
- Foes in `FOES`: hp, forward speed, sideways chase speed, `bite` (soldiers lost on contact), radius. They wake within `WAKE` units.
- Loss: squad reaches 0, the boss reaches the squad, or 4 minutes pass.
- **Ending (visual only):** `finish()` records results immediately. Then `outro` runs: no new shots, bullets in flight finish, and after a win the camera (`cz` in `render`) keeps scrolling at the level's speed so the squad slides off the bottom. It's capped at `OUTRO_MAX` ms, and the card shows after it.
- **View:** every screen shows the same slice of the track, `W` wide by `VIEW_H = 600` deep (`VIEW_BACK = 120` of it behind the squad), scaled with `sc = min(cw / W, ch / VIEW_H)` and centred with offset `ox`. Tablets and landscape screens get plain shoulders at the sides, so gameplay matches the phone. Everything drawn on the canvas, including text and line widths, scales with `sc`.
- Bullets fly `RANGE = 600` units, past the top of a portrait phone screen. It's a constant, not screen-based, so replays match on every device.
- **Saved runs are tied to the simulation.** Bump `SIM_V` (currently 3) on any change to `tick()`, simulation constants or an existing level's contents; runs saved under another version are dropped. **Appending** new levels at the end doesn't need a bump, because runs are keyed by level index. Inserting or reordering levels does.
- `window.__sim` exposes the simulation core for the playtester; `window.__speed` speeds up the real-time loop in tests.

## Level format (`LEVELS`)

```js
{ name: 'Gate Sprint', speed: 100, start: 6, weapon: 'pistol', len: 3000, boss: 700, two: 17, three: 27, rows: [
    g(200, '+3', '-2'), w(285, 8, 'grunt'), g(370, '+2', 'x2'), ... ] },
```
- `g(z, left, right)`: a gate pair; a side can be `'+N'`, `'-N'`, `'xN'`, `'/N'`, a weapon key (`'rifle'`, `'shotgun'`, `'minigun'`, `'pistol'`) or `null` (open).
- `w(z, count, type, x0 = 40, x1 = 320)`: a block of foes (`'grunt'`, `'runner'`, `'brute'`), laid out in rows across x0..x1.
- `speed` (optional): scroll speed in units/s; default 70.
- `boss`: boss hp. `two` / `three`: soldiers needed for 2 and 3 stars.

## Adding levels

1. Append to `LEVELS` (don't insert or reorder; see `SIM_V` above). For many levels, generate the `rows` with a small script, using gate pairs every `gap` units and a foe block halfway between, then paste the output in.
2. Start the bosses generous, run `node squad-game/tools/playtest.js <levels>`, and adjust until the bot wins each one.
3. Set `two` / `three` to 50% / 80% of the bot's survivors.
4. Re-run the playtester on the new levels and on levels 1–5 (as a regression check), with `--shots`, and look at the screenshots: gates, crowd, boss, end and dark mode.
5. Republish to the same link, commit and push on a branch.

Levels 11–20 have trade-off gates: ×3 next to a big +N, weapon gates next to ×2, downgrades (pistol) next to ×2/×3, and "lesser evil" pairs (÷2 next to −N) where the better side depends on the squad size. Their bosses were set to about 10% of the damage the bot deals before an unkillable boss reaches it (patch the bot's score to drop the `t.boss.hp` term when you measure this, or a huge boss hp makes it prefer dying).

Levels 21–50 were generated by a script: 21 gate pairs each, a repeating gate pattern per level (mirrored every other repeat), and a foe block halfway between pairs. Their bosses are 10% of the damage the bot deals to an unkillable boss (same bot, `- t.boss.hp * 0.5` dropped from its score), rounded to two significant figures; all 30 were won on the first pass.

### Pitfalls from tuning levels 6–50
- **The bot can skip a weapon gate.** On Shotgun Express it took +5 over the shotgun, got ground down by runners, and lost to the boss with the same survivors whatever the boss hp. `tools/trace.js` showed it. If a level is named for a weapon, start with that weapon.
- **Faster scrolling means less time to shoot the boss.** A pistol-only level at speed 100 needed the boss cut to 700 hp.
- **×2 chains snowball.** With no cap, a near-perfect bot multiplies to thousands, so the 3★ thresholds on levels 7–10 are steep. One missed ×2 halves the result. Tell the owner the numbers; they may want them lower.
- **The playtester's device check clicks the Best chip** of the first selected level, so it crashes with a click timeout if that level's bot lost. Read that crash as "the first level lost".
- **Lesser-evil gates need growth around them.** Divide or Drop first alternated one good and one bad pair and the bot was wiped; two good pairs per bad one works.
- **×3, ×4 and ×5 gates snowball harder.** Levels 25, 35, 36, 39, 40, 43, 44 and 50 end with 60,000 to 1.4 million soldiers, so their thresholds are huge numbers. The owner may want them lower.
- **Slow bot runs:** the bot clones the whole state for lookahead, so levels that end with thousands of soldiers take about 2 minutes per bot run. Give commands a long timeout.

## UI
- Header: level number and current weapon, name, squad count, progress meter, Best chip (always present).
- Footer: **Levels · Replay · Retry · Next**. The result card has no buttons.
- localStorage (try/catch): `squad-surge-best` (stars), `squad-surge-runs-v<SIM_V>` (most-survivors run per level), `squad-surge-level`.

## Testing

```bash
node squad-game/tools/playtest.js                 # all levels
node squad-game/tools/playtest.js 6-10 --shots /path/to/dir
node squad-game/tools/trace.js 9                  # one bot run, step by step
```
`playtest.js` reports, per level: the bot's result, whether its inputs re-run identically, and the result card when the real UI replays the run through the Best chip. It also checks that a drag moves the squad and that the page doesn't overflow, on phone and iPad sizes (portrait and landscape), with a screenshot per device. After any change to the simulation, re-run all levels. Look at the screenshots (start, play, boss, end, dark mode) before publishing new content.
