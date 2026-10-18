# Span Sketch: bridge drawing game

A portrait-phone physics puzzle. The player draws a bridge with a finger. On lift, gravity turns on, the bridge drops as one rigid piece, and a car drives across. 100 spans ("levels").

- **Live page:** https://claude.ai/artifact/1YkSDNx7R8XVEyoGAhi553 (published from `index.html`; republish the same file path to keep the URL)
- **Branch:** `bridge-game` in `wawoodwa/wawoodwa`
- **Owner preferences:** designed for a phone held upright. The owner tests on their phone and gives short, direct feedback. Make the change, verify it, publish, commit and push.

## Files

| Path | What it is |
|---|---|
| `index.html` | The entire game: styles, markup, all 100 levels and the game code. HTML5 canvas + plain JS. |
| `tools/playtest.js` | Headless Playwright playtester: draws strokes on spans and reports win/fail, steel and stars. |
| `tools/example-cases.json` | Example input for the playtester. |

`index.html` deliberately has **no `<!doctype>`, `<html>`, `<head>` or `<body>`**. The artifact host wraps the page in that skeleton when it publishes. It starts with `<title>`, a viewport meta tag, the Google Fonts link and `<style>`.

### External dependencies
- **Matter.js 0.19.0** from cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js`). Required: the physics engine.
- **Google Fonts:** Architects Daughter (titles), IBM Plex Sans (UI) and IBM Plex Mono (numbers). Optional; fallback fonts are declared.

**Planned:** a standalone build that runs anywhere, offline included. Add `<!doctype html>` and the html/head/body wrapper, and inline Matter.js (~80 KB). Keep the artifact version as is, because the artifact host adds its own wrapper.

## Coordinates and units

- World units: **20 units = 1 m**. The view window is `VIEW = {x:0, y:120, w:400, h:640}`, scaled to fit the canvas and centred. Cliffs extend far left, right and down, so wider screens show more terrain.
- y grows downward. A level's `L: {x, y}` is the **left cliff lip** (the top-right corner of the left cliff). `R: {x, y}` is the **right cliff lip**.
- Car: chassis 48×12 plus a cabin, wheels with r = 11. Its roof sits **36 units above the road**. It starts at `x = max(32, L.x - 72)`, and the flag is at `min(380, R.x + 62)`.
- Bridge thickness `T = 6`. A stroke's centreline is the bridge centreline, so the bridge top is `y - 3`.

## Level format (`LEVELS` array)

```js
{ name: 'Zigzag', L: { x: 90, y: 330 }, R: { x: 320, y: 330 }, ink: 460, rocks: [
    boulder(155, 302, 13), boulder(255, 360, 14) ] },
```

- `rocks`: convex polygons `[[x,y], ...]` or `boulder(cx, cy, r)` (an octagon). Polygons must be **convex**; poly-decomp isn't loaded.
- Pillars rising from the depths: `[[x-8,top],[x+8,top],[x+16,1600],[x-16,1600]]`. Spikes hanging from above: `[[x-20,240],[x+20,240],[x+4,bottom],[x-4,bottom]]`.
- `ink`: the steel allowance in world units. The display shows metres with one decimal, so keep it even.

### Rules the owner set (follow these)
1. **Name every span after its terrain**, e.g. "Twin Stalactites", "Boulder Hump", "Crag Descent". No generic names like "Final Exam" or "Grand Finale". Names must be unique and short enough not to be cut off in the header on a 390px-wide phone, roughly 16 characters or fewer.
2. **Allowance:** `ink = round((lipDistance + 20) / 0.6 / 2) * 2`, where `lipDistance = hypot(R.x - L.x, R.y - L.y)`. That puts the gap plus 1 m at exactly 60%, the 3-star mark. Write it as a plain number per span; the owner may hand-tune it after testing.
3. **Every span must be winnable with 3 stars.** If the leanest winning bridge is over 60%, raise that span's `ink` to `leanest / 0.6`. That has been done for Zigzag (460) and Underpass (430). Don't add slack to spans that are already beatable.
4. **Stars:** use the rounded percentage shown on the card. 60% or less = 3, 80% or less = 2, any other win = 1. A 3-star win's card says "Great job!" with no "use less steel" hint.

### Level design constraints (learned the hard way)
- `L.x >= 90`. Otherwise the no-draw zone around the car leaves no cliff to anchor a bridge on.
- Slopes over about 30° make the car stall or flip. Keep the lip-to-lip rise to 80 units or less and drops to about 120 or less.
- **Overhead rock:** roof clearance needs the stroke `y >= rockBottom + 42` (about +46 for margin) wherever the car is within about 24 units horizontally of the rock. A rock bottom at `lipY - 42` forces a gentle sag.
- **Rock that pokes up:** the stroke must stay at `y <= rockTop - 8`.
- Drawing is blocked within 4.5 units of any rock and of the car's box. A stroke that clips rock just stops growing, so test strokes run a short flat stretch 5 units above the lip before heading into the gap.
- A bridge resting only on the very tips of its ends can slide off. Short level stretches resting on each cliff make it stable.

## Game mechanics (where to look in `index.html`)

| Area | Function or variable | Notes |
|---|---|---|
| Level setup | `buildLevel(i)` | Builds the Matter engine, terrain, car, flag and the gap measurement line's height. |
| Drawing | `addPoint`, `blocked`, `segBlocked`, `endStroke` | Each point is at least 6 units from the last; steel use is capped at `ink`. |
| Bridge | `release()` | One rigid compound body: rectangles plus joint circles. Inertia is **manually corrected** (parallel-axis term), because Matter underestimates it for compound bodies. |
| Car | in `buildLevel` | The chassis is a compound of body and cabin. The cabin is near-weightless (`density 0.00005`) and inertia is reset to the body's, so the roof collides without changing handling. `carOff` maps the centre of mass to the drawing origin. |
| Driving | `step()` | Wheel spin plus a grounded drive force on the chassis, with an **equal and opposite force on the bridge**, so a loose bridge can be shoved off. |
| Win/fail | `step()` | Past the flag the car brakes. It wins after 500 ms upright (under 1 rad) with at least one wheel touching rock or bridge, using a slightly larger `wheelProbe`. Fails: fell below y 950, flipped for over 1 s, stuck for 3.5 s, or not settled 3 s after reaching the flag. |
| Determinism | fixed `STEP = 1000/60` | Replays reproduce runs exactly, given the same stroke points. |
| Replay | `startReplay`, `advanceReplay` | Rebuilds the span and redraws the stroke at 0.32 units per ms, then calls `release()`. |
| Best runs | `runs` / `span-sketch-runs` | The least-steel winning stroke per span, saved at full precision. The header chip replays it. |
| Stars | `best` / `span-sketch-best` | Best stars per span, shown in the Spans menu. |
| Rendering | `render()` | Theme colours come from CSS variables via `readColors()`: graph paper in light mode, blueprint in dark. |
| Measurement line | `clearDimY()` | Picks the nearest height to 46 units above the lip that clears every rock; drawn after the terrain. |

### UI layout rules
- Header: span number, gap, name, steel meter, and the **Best chip, which is always present** ("No best yet" when disabled) so the canvas never resizes.
- Footer: **Spans · Replay · Redraw · Next**.
- Result card: title, stars and text only, **no buttons**, because the footer has them.
- Must fit a 360px-wide phone without overflow.

## Testing

```bash
cd bridge-game
node tools/playtest.js tools/example-cases.json 5   # 5 parallel browser pages
```

- Cases are `[spanIndex0, [[x, y], ...]]` in world units. About 10 s per case per page, so 100 cases take about 2 minutes with 6 workers.
- "timeout" usually means the stroke clipped rock and was never released.
- For new levels: write a regular stroke (ends 10 units past each lip) and a lean one (6 units past). Check them statically: not blocked, slopes under 33°, lean length 60% of `ink` or less. Then playtest both. Both should win, and at least one should earn 3 stars.
- After any physics change, re-run a winning stroke on **all** spans. Small physics changes ripple through: adding cabin mass broke 8 spans.
- Before publishing, look at a screenshot of each new span: terrain matches the name, and the measurement line is clear of rock.

## Workflow
1. Edit `index.html`.
2. Playtest, using a temp copy with a doctype and a local Matter.js. `tools/playtest.js` does this.
3. Publish: Artifact tool with `file_path: bridge-game/index.html`, no `url`, same path. This keeps the URL.
4. Commit on `bridge-game` and push with `git push -u origin bridge-game`. No pull request unless asked.
