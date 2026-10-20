# Building and shipping the mobile games

## Purpose
How to build, test, publish and merge changes to the single-file HTML5 games in this repo (Span Sketch, Squad Surge, and future games) the way the owner expects.

## Scope
- Repo: `wawoodwa/wawoodwa`, the owner's GitHub profile repo. Games live one per directory: `bridge-game/`, `squad-game/`. They're listed in `GAMES.md`. `README.md` is the profile page and is never edited.
- Environment: Claude Code cloud sessions with the Artifact tool, the GitHub MCP tools, and Playwright and Chromium preinstalled (`/opt/node22/lib/node_modules/playwright`).
- Session date: 2026-10-18.

## Prerequisites
- [ ] Read the repo `CLAUDE.md`, then the `CLAUDE.md` inside the game's directory.
- [ ] For a new round of work on a game, check its `HANDOFF.md`. For a brand-new game, use the repo `HANDOFF.md`.
- [ ] `git fetch` and check for unmerged branches from other sessions before starting. Several sessions have worked on these games in parallel.

## Procedure

### Step 1: Branch
Work on a branch off `main`. Commit and push after each change (`git push -u origin <branch>`). Open a pull request only when the owner asks.

### Step 2: Make the change
- Games are one HTML5 file each: canvas and plain JS, libraries from cdnjs at a pinned version (Matter.js 0.19.0 for Span Sketch). There's no doctype or html/head/body, because the artifact host adds them. Themes use CSS variables in light and dark.
- Phone held upright: fit 360px wide, controls in a footer bar, and keep the layout stable so nothing resizes the play area.
- For many levels at once, generate them with a script, check them statically (clearance, slopes, budgets), then playtest every one.

### Step 3: Test headlessly
```shell
node bridge-game/tools/playtest.js cases.json 5          # Span Sketch: draw strokes, report win, steel and stars
node squad-game/tools/playtest.js 6-10 --shots <dir>     # Squad Surge: bot, replay check, UI replay, devices
node squad-game/tools/trace.js 9                         # Squad Surge: one bot run, step by step
```
For a local page, wrap `index.html` in a doctype and swap the CDN script for a local copy if needed (`playtest.js` does both). Look at screenshots of new content before publishing.

### Step 4: Publish
Republish to the game's existing artifact link: Span Sketch https://claude.ai/artifact/1YkSDNx7R8XVEyoGAhi553, Squad Surge https://claude.ai/artifact/8ik6JLBA8QhFJZcgQFFbLe. From a session that didn't publish it, read the artifact first, then publish with `url`.

### Step 5: Merge (when asked)
Check the branch contains `main`, `README.md` is unchanged, and the page loads with no errors. Open the pull request with the GitHub MCP tools, then merge with `expectedHeadSha` set to the **full 40-character** SHA.

## Gotchas / Lessons Learned
- **Matter.js compound bodies get the wrong inertia.** They sum part inertias without the parallel-axis term, so long drawn bridges spin wildly. Span Sketch sets the inertia by hand in `release()`. Codified: structural.
- **Drawn-only shapes don't collide.** Span Sketch's cabin was drawn but not part of the body, so the car passed through rock. Adding a weighted cabin broke 8 spans, so the cabin is near-weightless with the original inertia kept. Codified: structural.
- **Any physics change ripples through the levels.** Re-run a winning stroke on every level afterwards. Codified: procedural.
- **The `hidden` attribute loses to `display:flex`** when the page runs outside the artifact host's reset CSS. Both games add `[hidden]{display:none!important}`. Codified: structural.
- **An element that appears after the first win resizes the canvas.** The header's Best chip is always present, disabled with "No best yet". Codified: structural.
- **Sampling a spiral formation by stride makes pinwheel arms.** Draw a full formation of up to N figures instead. Codified: structural.
- **Squad Surge's bot can skip a weapon gate** and then lose with any boss hp. `tools/trace.js` finds this; a level named for a weapon should start with it. Codified: mechanical (`squad-game/tools/trace.js` shows it).
- **The GitHub app can't create repos or delete branches**, and pushing straight to a URL is blocked. Ask the owner to do those; push through `origin`. Codified: not yet.
- **Other sessions push branches in parallel.** Fetch, check for unmerged branches, and smoke-test work you didn't write before merging it. Codified: procedural.
- **Test-script regex escaping:** a Python heredoc with `\\{` silently didn't substitute, and a stale run looked like a pass. Check that each test run actually ran the intended cases. Codified: not yet.
- **The GitHub merge tool rejects short SHAs** for `expectedHeadSha`. Codified: n/a.

## Open Items / Next Steps
- [ ] Owner: delete old branches at https://github.com/wawoodwa/wawoodwa/branches. All are merged except `move-games-out`, which is closed.
- [ ] Squad Surge: more levels from 51 on, using the prompt in `squad-game/HANDOFF.md`.
- [ ] Squad Surge star thresholds on the snowballing levels (7–10 and later) may need lowering after the owner plays them.
- [ ] Squad Surge's artifact page is private; share it if others should play.
- [ ] Span Sketch: planned standalone build (doctype added, Matter.js inlined) for hosting outside claude.ai.
- [ ] Deferred: move the games to a `dev-website-games` repo. The owner must create it; the GitHub app can't.
- [ ] Next new game: use the repo `HANDOFF.md`.

## References
- [CLAUDE.md] -- repo rules and layout
- [HANDOFF.md] -- prompt for a new game
