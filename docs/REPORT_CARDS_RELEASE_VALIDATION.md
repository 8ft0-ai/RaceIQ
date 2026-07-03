# Report Cards Release Validation

This document records the release-readiness checks for issue #6.

## Scope

Issue #6 is the final polish and validation iteration for the Grid-to-Finish and Team Report Cards feature.

This iteration does not add new analytics, live collection, backend behaviour, scraping, Playwright, or collector runtime behaviour. RaceIQ remains a static GitHub Pages dashboard that consumes prepared JSON files from `data/`.

## Acceptance criteria mapping

| Acceptance criterion | Evidence |
| --- | --- |
| Report Cards feature is visually and functionally complete | Team selector, top-card highlights, selected-team detail panel and Grid-to-Finish section are present in the Report cards tab. |
| Data caveats are clear | The UI includes an interpretation note, selected-team caveats, anomaly status, known incident status and score interpretation language. |
| Scores and grades are visible but not overclaimed | The UI labels RaceIQ scores and grades as explanatory story signals rather than official race results. |
| First Observed is not presented as true grid | Grid movement and First Observed movement remain separate in labels, KPIs and table columns. |
| Known incidents remain visible | Selected-team caveats include `known_incident_status` when present, including the Ostrov Team transponder issue. |
| Missing values render gracefully | The UI renders missing numeric or text values as `—` or explicit caveat wording. |
| Static data validation succeeds | `tools/validate_static_data.py` validates required JSON files, grid movement equations, report-card score bounds, grade values and optional confidence values. |
| GitHub Pages deployment remains compatible | The app remains static HTML/CSS/JavaScript with relative JSON fetch paths and no build step. |

## Manual browser validation checklist

Before marking the PR ready for approval, serve locally:

```bash
python -m http.server 8000
```

Then check:

- Report cards tab loads without console errors.
- Team selector changes the selected-team detail panel.
- Highlight cards update the selected-team detail panel.
- Existing tabs still switch correctly.
- `data/grid_to_finish.json`, `data/grid_to_finish_validation.json` and `data/team_report_cards.json` load successfully.
- Caveats and interpretation notes are visible without scrolling past the selected team story.
- Responsive layout remains usable on a narrow viewport.

## Static validation checklist

Run:

```bash
python tools/validate_static_data.py
```

The validator checks:

- required JSON files exist and parse
- Grid-to-Finish movement equations are valid
- `grid_to_finish.json` includes one row per car number
- Team report cards include one row per final-standing team
- RaceIQ score is numeric and bounded between 0 and 100
- Report-card grade is one of `A+`, `A`, `B`, `C`, `D`, `E`
- Grid movement and First Observed movement remain separate
- confidence fields, where present, use known confidence values

## Release caveats

- RaceIQ scores and grades are explanatory, not official race results.
- Delay burden, anomaly status and battle summaries are inferred analytics and should be read with caveats.
- The race capture missed the opening period, so First Observed movement is not the same as true Grid-to-Finish movement.
- GitHub Pages deployment confirmation happens after merge to `main`.
