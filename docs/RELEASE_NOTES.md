# Release notes: Grid-to-Finish and Team Report Cards

These release notes describe the Grid-to-Finish and Team Report Cards launch delivered under parent issue #1 and documented by issue #25.

RaceIQ remains a static post-race analytics dashboard for GitHub Pages. The deployed app is still plain HTML, CSS and JavaScript that consumes prepared JSON files from `data/`. This release does not add live collection, polling, scraping, Playwright, WebSocket discovery, backend storage, authentication or runtime Python behaviour to the deployed dashboard.

## User-facing changes

### Report Cards tab

The dashboard now includes a `Report cards` tab. The tab combines Team Report Cards with Grid-to-Finish movement analytics so users can inspect both the official finish context and the explanatory post-race story for each team.

### Grid-to-Finish analytics

The Grid-to-Finish section shows movement from heat sheet start position to final finishing position where grid data is available. It includes:

- matched-team and grid-data status summary cards
- biggest mover, biggest faller and observed-recovery highlights
- a movement bar visualisation
- a full Grid-to-Finish table with start position, first observed position, final position, Grid movement, Observed movement, final laps, movement class and confidence

Grid-to-Finish movement and First Observed movement are deliberately separated:

- `Grid → Finish` uses heat sheet / start position data.
- `First observed → Finish` uses the first captured leaderboard snapshot.

First Observed position must not be read as the true starting grid position because the opening part of the race was not captured.

### Team Report Cards

The Team Report Cards section provides a compact post-race profile for each final-standing team. It includes:

- a team selector
- headline story and summary bullets
- final position, final laps, grid start, first observed position, grid movement and observed movement
- RaceIQ score and grade
- pace, consistency, delay burden, best phase and key battle context
- confidence reasons and interpretation caveats
- anomaly and known-incident context where relevant

RaceIQ scores and grades are explanatory storytelling aids. They are not official race results, official rankings, penalties, adjudications or replacements for the final standings.

## Issue and PR trail

| Area | Issue | PR / delivery note | Status |
| --- | --- | --- | --- |
| Parent feature | #1 Add Grid-to-Finish analytics and Team Report Cards | Delivered through linked iterations | Complete |
| Grid-to-Finish data mart | #2 Iteration 1 | Completed directly in `main`; outputs documented in `docs/GRID_TO_FINISH_VALIDATION.md` | Complete |
| Grid-to-Finish dashboard UI | #3 Iteration 2 | #7 Iteration 2: Add Grid-to-Finish dashboard UI | Merged |
| Team Report Card data mart | #4 Iteration 3 | #8 Iteration 3: Generate Team Report Card data mart | Merged |
| Team Report Card dashboard UI | #5 Iteration 4 | #14 Iteration 4: Add Team Report Card dashboard UI | Merged |
| Polish, validation and release readiness | #6 Iteration 5 | #19 Iteration 5: Polish, validate and prepare Report Cards release | Merged |
| Data dictionary follow-up | #22 Document RaceIQ analytics data dictionary | #29 Draft: Document RaceIQ analytics data dictionary | Merged |
| Confidence fields follow-up | #23 Add explicit confidence fields to Team Report Cards | #30 Add explicit confidence fields to Team Report Cards | Merged |
| Reproducible generation follow-up | #24 Make Team Report Card data generation reproducible | #31 Draft: Make Team Report Card generation reproducible | Merged |
| Release notes | #25 Add release notes for Report Cards launch | This document | In progress |

## Data and documentation references

Primary static data files:

- `data/grid_to_finish.json`
- `data/grid_to_finish_validation.json`
- `data/team_report_cards.json`
- `data/team_report_cards_validation.json`

Validation and interpretation documents:

- `docs/GRID_TO_FINISH_VALIDATION.md`
- `docs/TEAM_REPORT_CARD_DATA_VALIDATION.md`
- `docs/REPORT_CARDS_RELEASE_VALIDATION.md`
- `docs/DATA_DICTIONARY.md`
- `docs/TEAM_REPORT_CARD_GENERATION.md`

Maintainer tools:

- `tools/validate_static_data.py`
- `tools/validate_static_app.py`
- `tools/generate_team_report_cards.py`

## Validation approach

Release validation combines data-contract checks, UI wording checks and GitHub Pages compatibility checks.

The current Grid-to-Finish validation artefact records:

- validation status: `pass`
- 25 final-standing teams
- 25 heat sheet rows
- 25 entry-list rows
- 25 matched teams
- no unmatched final car numbers
- no duplicate heat sheet car numbers
- no duplicate heat sheet transponders
- true grid data available

The current Team Report Card validation artefact records:

- validation status: `pass`
- 25 report cards
- 25 final-standing teams
- one card per final-standing team
- no missing required fields by team
- no missing confidence fields by team
- scores bounded between 0 and 100
- confidence fields present for every team
- one known-incident team with interpretation caveats
- 25 teams with open anomaly caveats

The GitHub Actions workflow `Validate static data` parses the core JSON files, runs the Team Report Card generator, validates generated static data, runs the static app smoke validator, and checks that generated report-card outputs reproduce the committed files.

For this documentation-only release-notes change, no dashboard code, JSON data, scoring logic or generated artefacts are changed. Code validators are optional for issue #25; the required validation is a documentation cross-check against the merged issues, merged PRs, dashboard wording and existing validation documents.

## Official vs derived vs inferred analytics

RaceIQ must preserve the distinction between official race results and explanatory analytics.

| Category | Examples | Interpretation |
| --- | --- | --- |
| Official or source result context | final position, final laps, final standings fields copied or normalised from LiveRC/event source data | These remain the result anchor for the dashboard. |
| Derived analytics | Grid-to-Finish movement, First Observed movement, movement classes, aggregate validation counts | These are deterministic calculations from prepared source data. |
| Inferred analytics | RaceIQ score, grade, delay burden, battle summaries, anomaly status, narrative report-card summaries | These explain the race story and must not be treated as official results. |
| Validation metadata | confidence values, validation status, missing-field summaries, generator reproduction checks | These describe data quality, completeness and interpretation confidence. |

## Known caveats and limitations

- The first approximately 20 minutes of the race were not captured.
- True Grid-to-Finish movement uses heat sheet start positions where available.
- First Observed movement is based on the first captured leaderboard snapshot and is reported separately.
- First Observed position is not true grid position.
- RaceIQ scores and grades are explanatory story signals, not official race rankings.
- Delay burden, battle summaries, anomaly status and narrative report-card summaries are inferred analytics and should be read with visible caveats.
- All teams currently have at least one open anomaly review item because the anomaly board is intentionally broad; these are review caveats, not automatic performance faults.
- Ostrov Team has a known transponder incident. RaceIQ keeps the official source-state records but treats the affected early timing behaviour as a confirmed timing/transponder artefact rather than pace, pit or suspicious driving behaviour.
- GitHub Pages deployment confirmation happens after merge to `main` and should be checked on the deployed site.

## GitHub Pages deployment note

This release is compatible with GitHub Pages because it only uses static files and relative JSON fetch paths. Merging to `main` should trigger the normal GitHub Pages deployment path for the repository.

After merge, verify the deployed dashboard by opening the GitHub Pages site and spot-checking:

- the `Report cards` tab loads
- `data/grid_to_finish.json`, `data/grid_to_finish_validation.json` and `data/team_report_cards.json` load successfully
- the team selector updates the selected-team detail panel
- Grid movement and Observed movement remain separately labelled
- RaceIQ score and grade wording remains explanatory, not official
- caveats and confidence reasons remain visible, including the known Ostrov Team incident case

Parent issue #1 is supported by this release record once deployment has been verified. If deployment is not verified, do not rely on this document alone as evidence that the deployed site is current.

## Follow-up backlog items

Completed launch follow-ups:

- #22 documented the RaceIQ analytics data dictionary.
- #23 added explicit confidence and caveat fields to Team Report Cards.
- #24 made Team Report Card generation reproducible and documented.

Remaining operational follow-ups:

- confirm GitHub Pages deployment after the release-notes PR merges
- spot-check the deployed Report Cards tab and known caveat examples
- keep `docs/DATA_DICTIONARY.md`, `docs/TEAM_REPORT_CARD_GENERATION.md` and this release note aligned with any future data contract changes
- create a new issue before changing scoring semantics, caveat semantics, generated data, dashboard behaviour or deployment assumptions
