# Handoff: next session

Start a session with `wawoodwa/wawoodwa` selected and paste the prompt below. Fill in the game you want where it says so.

---

Build me a new mobile game. **[Describe the game here.]**

My games live in `wawoodwa/wawoodwa`, my GitHub profile repo, one directory per game. `README.md` there is my profile page, so don't change it. List each game in `GAMES.md` instead. Read the repo `CLAUDE.md` first.

Three games exist already. Read their `CLAUDE.md` files and reuse the approach, not the games:
- **Span Sketch** (`bridge-game/`): a bridge-drawing physics puzzle with 100 levels. `bridge-game/tools/playtest.js` is a headless Playwright playtester. Live: https://claude.ai/artifact/1YkSDNx7R8XVEyoGAhi553
- **Squad Surge** (`squad-game/`): a squad runner shooter. Live: https://claude.ai/artifact/8ik6JLBA8QhFJZcgQFFbLe
- **Dot Link** (`link-game/`): a free-drawing link puzzle scored by total line length. `link-game/tools/solve.js` solves levels to set star thresholds. Live: https://claude.ai/artifact/B2r2i4xd1v49b3fY6bPfG1

Put the new game in its own directory and add it to `GAMES.md`.

How I like to work:
- **Platform:** a phone held upright, played with a finger. It must fit a 360px-wide screen without sideways scrolling. Put the controls in a footer bar. Don't put buttons in pop-ups when the footer already has them.
- **Format:** one HTML5 file with a canvas and plain JavaScript. Load libraries from cdnjs at a pinned version, for example Matter.js 0.19.0 for physics. Support light and dark themes through CSS variables. Keep the screen layout stable: nothing should appear or disappear in a way that resizes the play area.
- **Delivery:** publish it as a claude.ai artifact and give me the link. Republish to the same link for updates. Work on a branch, and commit and push after every change. No pull requests unless I ask.
- **Testing:** test every change headlessly before publishing. Playwright and Chromium are preinstalled; use `/opt/node22/lib/node_modules/playwright`. For physics games, use a fixed timestep so replays are exact. After any physics change, re-run the tests on every level. Look at screenshots of new content before publishing.
- **Levels:** name every level after what's in it, never a generic name like "Final Exam". Keep names short enough not to be cut off on a phone. Every level must be winnable with the top rating. When I ask for many levels at once, generate them with a script, check them automatically, playtest all of them, then publish.
- **No caps:** don't cap counts that the player grows, such as soldiers or crowd size. If a huge number would hurt performance or layout, limit what's drawn, never the real count.
- **Scoring:** I set the star thresholds and level budgets and may tune them after playing, so keep those values as plain numbers per level. A top-rated win should say "Great job!" rather than suggest improvements.
- **Saving progress:** use localStorage for best scores and saved replays, wrapped in try/catch. Features I liked: replaying the last attempt, and a button that replays my best run on the current level.
- **Updates:** keep replies short and say what you tested. When I report a bug, find the root cause and check whether the same bug affects other levels or parts of the game.

Ask me anything about the new game that's genuinely unclear. Then build a playable first version with a few levels, publish it, and give me the link.
