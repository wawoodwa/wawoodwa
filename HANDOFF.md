# Handoff: next session

Create the empty `wawoodwa/dev-website-games` repo first. Then start a session with both `wawoodwa/wawoodwa` and `wawoodwa/dev-website-games` selected, and paste the prompt below. Fill in the game you want where it says so.

---

Two tasks: first finish moving my games into their own repo, then build me a new game.

**Task 1: finish the move.** I created an empty repo, `wawoodwa/dev-website-games`. A previous session prepared its contents and saved them as branch `dev-website-games-import` in `wawoodwa/wawoodwa`. That branch holds the full history plus a final commit with a new README, a repo-level CLAUDE.md, and paths updated to the new repo.
1. Push that branch to `main` of `wawoodwa/dev-website-games` and confirm the files are there: `README.md`, `CLAUDE.md`, `HANDOFF.md`, and `bridge-game/` with `index.html`, `CLAUDE.md` and `tools/`.
2. In `wawoodwa/wawoodwa`, my GitHub profile repo, open a pull request that removes `bridge-game/` and `HANDOFF.md` so only my profile `README.md` remains. Delete the `bridge-game` and `dev-website-games-import` branches there. Show me the pull request before merging.

**Task 2: a new game.** **[Describe the game here.]** Put it in its own directory in `wawoodwa/dev-website-games`, next to `bridge-game/`, and add it to the README's table of games.

The last game, **Span Sketch**, is a bridge-drawing physics puzzle in `bridge-game/`. `bridge-game/CLAUDE.md` documents it, and `bridge-game/tools/playtest.js` is a headless Playwright playtester. Read both before you start; reuse the approach, not the game. Its live link is https://claude.ai/artifact/1YkSDNx7R8XVEyoGAhi553. Future updates to Span Sketch should publish to that same link.

How I like to work:
- **Platform:** a phone held upright, played with a finger. It must fit a 360px-wide screen without sideways scrolling. Put the controls in a footer bar. Don't put buttons in pop-ups when the footer already has them.
- **Format:** one HTML5 file with a canvas and plain JavaScript. Load libraries from cdnjs at a pinned version, for example Matter.js 0.19.0 for physics. Support light and dark themes through CSS variables. Keep the screen layout stable: nothing should appear or disappear in a way that resizes the play area.
- **Delivery:** publish it as a claude.ai artifact and give me the link. Republish to the same link for updates. Work on a branch, and commit and push after every change. No pull requests unless I ask.
- **Testing:** test every change headlessly before publishing. Playwright and Chromium are preinstalled; use `/opt/node22/lib/node_modules/playwright`. For physics games, use a fixed timestep so replays are exact. After any physics change, re-run the tests on every level. Look at screenshots of new content before publishing.
- **Levels:** name every level after what's in it, never a generic name like "Final Exam". Keep names short enough not to be cut off on a phone. Every level must be winnable with the top rating. When I ask for many levels at once, generate them with a script, check them automatically, playtest all of them, then publish.
- **Scoring:** I set the star thresholds and level budgets and may tune them after playing, so keep those values as plain numbers per level. A top-rated win should say "Great job!" rather than suggest improvements.
- **Saving progress:** use localStorage for best scores and saved replays, wrapped in try/catch. Features I liked: replaying the last attempt, and a button that replays my best run on the current level.
- **Updates:** keep replies short and say what you tested. When I report a bug, find the root cause and check whether the same bug affects other levels or parts of the game.

Do Task 1 first and confirm it. Then ask me anything about the new game that's genuinely unclear, build a playable first version with a few levels, publish it, and give me the link.
