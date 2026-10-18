# Handoff: next session

Paste the prompt below into a new session. Fill in the game you want where it says so.

---

I want you to build me a new mobile game, a different game from the one in the last session. **[Describe the game here.]**

Last session we built **Span Sketch**, a bridge-drawing physics puzzle, as a single HTML5 file. It's in the `wawoodwa/dev-website-games` repo, in `bridge-game/`. `bridge-game/CLAUDE.md` documents it, and `bridge-game/tools/playtest.js` is a headless Playwright playtester. Read both before you start; reuse the approach, not the game.

How I like to work, carried over from that session:
- **Platform:** a phone held upright, played with a finger. It must fit a 360px-wide screen without sideways scrolling. Put the controls in a footer bar. Don't put buttons in pop-ups when the footer already has them.
- **Format:** one HTML5 file with a canvas and plain JavaScript. Load libraries from cdnjs at a pinned version, for example Matter.js 0.19.0 for physics. Support light and dark themes through CSS variables. Keep the screen layout stable: nothing should appear or disappear in a way that resizes the play area.
- **Delivery:** publish it as a claude.ai artifact and give me the link. Republish the same file path so the link stays the same. Put the game in its own directory in `wawoodwa/dev-website-games` (one directory per game, next to `bridge-game/`), work on a branch, and commit and push after every change. No pull requests unless I ask.
- **Testing:** test every change headlessly before publishing. Playwright and Chromium are preinstalled; use `/opt/node22/lib/node_modules/playwright`. For physics games, use a fixed timestep so replays are exact. After any physics change, re-run the tests on every level. Look at screenshots of new content before publishing.
- **Levels:** name every level after what's in it, never a generic name like "Final Exam". Keep names short enough not to be cut off on a phone. Every level must be winnable with the top rating. When I ask for many levels at once, generate them with a script, check them automatically, playtest all of them, then publish.
- **Scoring:** I set the star thresholds and level budgets and may tune them after playing, so keep those values as plain numbers per level. A top-rated win should say "Great job!" rather than suggest improvements.
- **Saving progress:** use localStorage for best scores and saved replays, wrapped in try/catch. Features I liked: replaying the last attempt, and a button that replays my best run on the current level.
- **Updates:** keep replies short and say what you tested. When I report a bug, find the root cause and check whether the same bug affects other levels or parts of the game.

Start by asking me anything about the new game that's genuinely unclear. Then build a playable first version with a few levels, publish it, and give me the link.
