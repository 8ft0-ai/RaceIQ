# RaceIQ

RaceIQ is a portable static race intelligence dashboard generated from captured LiveRC timing data.

It turns leaderboard snapshots into a coverage-aware race review covering final standings, replay timeline, team pace, pit and delay events, head-to-head battles, anomaly review and method notes.

## Run locally

Most browsers block `fetch()` from local `file://` pages, so run a tiny local server from this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Repository layout

```text
index.html
app.js
styles.css
data/*.json
```

## Deploy

This repo is ready for static hosting.

### GitHub Pages

Use repository root as the Pages source:

1. Go to **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Select branch `main`.
4. Select folder `/root`.
5. Save.

### Netlify

Use either drag-and-drop deployment or connect this GitHub repository.

For Git-based deployment:

- build command: leave blank
- publish directory: `.`

## Current scope

The V1 app includes:

- race overview
- final standings
- race replay timeline
- top-12 position traces
- team pace profiles
- pit / delay map
- head-to-head battle cards
- anomaly review board
- method and confidence notes

## Important interpretation notes

- The first ~20 minutes of the race were not captured.
- The first captured snapshot is treated as a baseline, not the race start.
- Final standings use cumulative LiveRC values.
- Pace, delay and battle analytics use validated captured-segment data.
- The early Ostrov Team transponder issue is treated as a known timing artefact and excluded from performance inference.
