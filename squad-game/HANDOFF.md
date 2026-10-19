# Handoff: more Squad Surge levels

Start a session with `wawoodwa/wawoodwa` selected and paste the prompt below. Change the number of levels or add ideas where it says so.

---

Add **[10]** more levels to **Squad Surge**, my squad runner shooter. It lives in `squad-game/` in `wawoodwa/wawoodwa`, my GitHub profile repo. Don't touch the repo's `README.md`; it's my profile page.

Before you start, read `squad-game/CLAUDE.md`. It has the level format, the current 50 levels with their numbers, my rules for this game, a step-by-step for adding levels, and pitfalls from tuning the last batch. Also read the repo `CLAUDE.md`.

What I want from the new levels:
- **Continue from level 51.** Append them after Times Five Rush; don't insert or reorder.
- **Fast and full of gates,** like levels 6–20: about 140–180 scroll speed, with a gate pair every 150–180 units. Keep raising the pace a bit through the batch.
- **Variety:** mix the weapons (pistol, rifle, shotgun, minigun), the foe types (grunts, runners, brutes) and the gate choices (+, −, ×, ÷ and weapon gates). Make some gate pairs real trade-offs, not one obviously good side. **[Add any level ideas here.]**
- **Names** describe what's in each level, about 16 characters or fewer, and are never generic.
- **No caps** on soldiers, ever. Big crowds are drawn as an even formation of at most 300 figures; keep it that way.
- **Every level winnable with 3 stars.** Tune each boss until the playtester's bot wins, then set 2★ / 3★ at 50% / 80% of the bot's survivors, as plain numbers I can tune later.

How to deliver:
- Test with `node squad-game/tools/playtest.js <levels> --shots <dir>`, and use `node squad-game/tools/trace.js <level>` when a bot loses. Bot runs with thousands of soldiers take about 2 minutes, so use long timeouts. Re-run levels 1–50 as a regression check, and look at the screenshots of the new levels before publishing.
- Publish to the existing link, https://claude.ai/artifact/8ik6JLBA8QhFJZcgQFFbLe (read it first, then publish with that `url`).
- Work on a branch, and commit and push after each change. Update the levels table in `squad-game/CLAUDE.md`. Don't open a pull request unless I ask.
- Keep replies short. Tell me the new levels' names, speeds and star thresholds, and what you tested.
