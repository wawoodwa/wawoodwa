# Dot Link: free-drawing link puzzle

A portrait-phone puzzle. Each colour has two dots. The player draws any curve from a dot to its match. Lines can't cross each other, touch another colour's dot, or run through walls and posts. When every pair is linked, the score is the **total line length** (shorter is better). 12 levels.

- **Live page:** https://claude.ai/artifact/B2r2i4xd1v49b3fY6bPfG1 (published from `index.html`)
- **Repo:** `wawoodwa/wawoodwa`, directory `link-game/`. Never edit the repo's `README.md` (the owner's profile page).

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole game: styles, markup, levels and code. Canvas + plain JS, no libraries. No doctype/html/head/body: the artifact host adds them. |
| `tools/solve.js` | Solver. Runs inside the real page with the game's own `blocker()` rules and prints each level's shortest board and suggested thresholds. `--out file.json` saves the solutions. |
| `tools/playtest.js` | Headless playtester. Draws the solver's lines with real pointer drags and checks the 3-star win, the "Great job!" card, Replay, the Best chip, the rules (crossing blocked, early release, tap to remove) and no sideways scroll. |

```shell
node link-game/tools/solve.js --out /tmp/sol.json            # all levels, ~1 min
node link-game/tools/playtest.js --sol /tmp/sol.json --shots /tmp/shots   # ~2 min; omit --sol to solve inline
node link-game/tools/playtest.js 6-8                          # some levels
```

## Rules and constants (top of the script)

- Board: `W x H = 360 x 600` world units, scaled to fit the stage and centred.
- `DOT_R 13`, `LINE_W 7`. A line's centre stays `GAP 12` from other lines, `DOT_CLEAR 21` from other colours' dot centres, `WALL_CLEAR 6` from walls and posts, `EDGE 7` inside the board.
- Drawing samples the finger every `STEP 6` units and checks each new segment with `blocker()`. A blocked segment isn't added; a dashed red ghost shows where the finger is.
- Reaching within `SNAP 22` of the matching dot completes the line. It is then smoothed (Ramer-Douglas-Peucker, `SMOOTH 3`, only through clear shortcuts).
- Dragging back over your own line rubs it out. Letting go before the match drops the line. Touching a dot redraws that colour. Tapping a line removes it.
- After a win the board is locked; tapping it hides or shows the card. Retry clears the board.

## Level format (`LEVELS` array)

```js
{ name: 'Narrow Gate', three: 1678, two: 2043, pairs: [[60, 150, 300, 450], ...],
  walls: [[0, 285, 166, 30], [200, 285, 130, 30]], posts: [[180, 300, 22]] },
```

- `pairs`: `[ax, ay, bx, by]` per colour, in colour order (red, blue, green, yellow, purple, orange; up to 6).
- `walls`: `[x, y, w, h]` rectangles. `posts`: `[x, y, r]` circles.
- Stars: total length `<= three` is 3★, `<= two` is 2★, any finished board is 1★. Plain numbers per level; the owner tunes them.
- Thresholds were set from the solver: `three = round(L * 1.15)`, `two = round(L * 1.4)`, where L is the solver's shortest total (routed with 1.5 units of extra clearance, so it's slightly above the true optimum).

## Levels

| # | Name | Pairs | Solver L | 3★ | 2★ |
|---|---|---|---|---|---|
| 1 | Single Link | 1 | 300 | 345 | 420 |
| 2 | Side by Side | 2 | 640 | 736 | 896 |
| 3 | Crossed Pairs | 2 | 761 | 875 | 1065 |
| 4 | Center Wall | 2 | 902 | 1038 | 1263 |
| 5 | Three Crossings | 3 | 1545 | 1777 | 2163 |
| 6 | Narrow Gate | 3 | 1459 | 1678 | 2043 |
| 7 | Corridor Run | 2 | 1758 | 2022 | 2462 |
| 8 | Four Corners | 4 | 2078 | 2389 | 2909 |
| 9 | Boxed In | 3 | 1235 | 1420 | 1729 |
| 10 | Swap Sides | 4 | 1855 | 2133 | 2597 |
| 11 | Blocked Routes | 4 | 2198 | 2527 | 3077 |
| 12 | Six Colors | 6 | 3051 | 3509 | 4272 |

## Adding levels

1. Append entries to `LEVELS` with placeholder thresholds. Name each after what's in it, about 16 characters or fewer.
2. Run `solve.js` on the new levels. "NO SOLUTION" usually means a gap is too tight: the solver works on a 5-unit grid with 1.5 extra clearance, so a gap that fits exactly N lines in the game may fit fewer in the solver. Widen it by a few units.
3. Set `three` / `two` to the printed values, then playtest the new levels with `--shots` and look at the screenshots.

## Saving

localStorage, all wrapped in try/catch: `dot-link-best` (shortest run per level name), `dot-link-runs-v1` (last finished run per level name, for Replay), `dot-link-level` (current level). A run is `{ len, lines: [{ p, pts }] }` in the order the lines were finished; replay draws them at `REPLAY_V` units per second.

## Pitfalls

- The solver's first pass (shortest route per colour, every order) fails where easy routes block each other (Corridor Run). The negotiated pass (PathFinder-style congestion pricing) handles those; keep both.
- A gap needs whole grid points for the solver: Narrow Gate's 30-unit gate fit two lines in the game but not in the solver until it was 34.
