# RaceIQ

RaceIQ is a portable static race intelligence dashboard generated from captured LiveRC timing data.

This repository has been initialised for the RaceIQ app. The generated static app package should be unpacked into the repository root so that `index.html`, `app.js`, `styles.css` and the static data assets are all served from the same base path.

## Local run

Most browsers block `fetch()` from local `file://` pages, so run a tiny local server from the app folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Expected repository layout

```text
index.html
app.js
styles.css
data/*.json
```

or, for the GitHub Pages optimised bundle:

```text
index.html
app.js
styles.css
data/appdata.part*.txt
.nojekyll
```

## Deploy on GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

In GitHub Pages settings, select **Build and deployment → Source → GitHub Actions**.

Each push to `main` will publish the repository root to GitHub Pages.

## Deploy on Netlify

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
