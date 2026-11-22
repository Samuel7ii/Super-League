# Super League — Fantasy Draft Manager

A browser football-manager sim: draft real players (each from a random season of their career, 1996–2026) and real coaches into a 30-club European Super League, then manage the club for 10 seasons.

**Play:** open `index.html` in any browser, or visit the GitHub Pages link once it's enabled.

## Features
- 15-round snake draft of players *and* coaches, plus a draft every off-season (worst teams pick first) and draft-pick trading
- Two 15-team conferences, 15-game season, two-legged playoffs
- Live match centre: minute-by-minute commentary, subs, tactic changes, momentum graph
- Tactics, player instructions, set-piece takers, chemistry, football IQ, work rate
- Transfers with negotiation, untouchable players, trades, transfer requests and morale
- Fan feed, random club scenarios, derbies, blockbuster transfer news
- Team of the Week, Player of the Month, Ballon d'Or, and a 10-season GOAT legacy recap
- Save export/import codes

## Project layout
- `index.html` — the whole game, self-contained (this is what gets hosted)
- `src/` — source files; run `python3 src/build.py` from `src/` to rebuild `index.html`

## Hosting on GitHub Pages
Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
The game will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Note
Player, club and coach names are used for a private fan project. Ratings are estimates.
