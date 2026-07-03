# LiveRC Race Intelligence App

This is a portable static dashboard generated from the analytics-ready LiveRC race pack.

## Run locally

From this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Most browsers block `fetch()` from local `file://` pages, so serving the folder locally is the most reliable way to open the app.

## Contents

```text
index.html
app.js
styles.css
data/*.json
```

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

## Hosting

This same folder can be hosted on Cloudflare Pages, Netlify, GitHub Pages, Azure Static Web Apps, AWS S3 + CloudFront or any ordinary static web server.
