# Team Report Card generation

This document describes how to regenerate the RaceIQ Team Report Card static data.

The generator is an offline maintainer tool. It is not used by the deployed GitHub Pages app, does not collect live data, and does not depend on a Python runtime in the browser. The dashboard continues to consume prepared JSON files from `data/`.

## Outputs

The generation process writes:

- `data/team_report_cards.json`
- `data/team_report_cards_validation.json`

It can also write an optional scoring transparency artefact:

- `data/team_report_card_scoring_debug.json`

The debug artefact is for maintainer review only. It is not currently loaded by the dashboard.

## Source files

The generator reads prepared RaceIQ JSON source files from `data/`:

| Source file | Role |
| --- | --- |
| `standings.json` | Official final position, car number, team name and final laps. |
| `grid_to_finish.json` | Heat-sheet start position, first observed position, Grid-to-Finish movement and grid data confidence. |
| `grid_to_finish_validation.json` | Deterministic validation timestamp and grid matching context. |
| `team_profiles.json` | Captured-segment pace, consistency and team profile fields. |
| `team_phase_summary.json` | Phase-level pace used to identify the best captured phase. |
| `pit_delay_team_summary.json` | Inferred delay burden and estimated laps lost. |
| `head_to_head_battle_cards.json` | Candidate key battle labels. |
| `anomaly_review_board.json` | Open anomaly counts and review caveats. |
| `known_incidents.json` | Known incident status and interpretation caveats. |

The generator does not read LiveRC directly and does not require the collector at runtime.

## Command

From the repository root:

```bash
python tools/generate_team_report_cards.py
python tools/validate_static_data.py
python tools/validate_static_app.py
```

To preview the output summary without writing files:

```bash
python tools/generate_team_report_cards.py --dry-run
```

To also write the optional scoring debug artefact:

```bash
python tools/generate_team_report_cards.py --write-debug
```

To force a specific deterministic validation timestamp:

```bash
python tools/generate_team_report_cards.py --generated-at 2026-07-03T12:30:00Z
```

By default, `generated_at_utc` is derived from `grid_to_finish_validation.json`. That keeps generation deterministic for the same prepared input files.

## Output shape

Each row in `data/team_report_cards.json` contains:

- `team_name`
- `car_no`
- `headline`
- `final_position`
- `start_position`
- `first_observed_position`
- `places_gained`
- `places_gained_from_first_observed`
- `final_laps`
- `pace_label`
- `median_clean_lph`
- `consistency_score`
- `delay_profile`
- `estimated_laps_lost`
- `best_phase`
- `key_battle`
- `anomaly_status`
- `known_incident_status`
- `data_confidence`
- `confidence_reasons`
- `interpretation_caveats`
- `report_card_score`
- `report_card_grade`
- `summary_bullets`

`places_gained` is Grid-to-Finish movement and remains separate from `places_gained_from_first_observed`.

`data_confidence` uses the controlled vocabulary already recognised by the validator:

- `high`
- `medium`
- `usable_with_context`
- `low`

Confidence describes interpretation quality. It is not a performance score.

## Scoring formula

RaceIQ scores are explanatory storytelling aids, not official race rankings.

The generator calculates a bounded 0–100 score from deterministic components:

| Component | Weight | Meaning |
| --- | ---: | --- |
| Finish | 32 | Higher official finishing position contributes more. |
| Grid movement | 18 | Grid-to-Finish movement, normalised and bounded. |
| First Observed movement | 8 | First observed to finish movement, shown separately because capture started after the race began. |
| Pace | 14 | Median clean laps per hour, normalised across teams. |
| Consistency | 10 | Captured-segment consistency score. |
| Delay | 10 | Lower estimated laps lost contributes more. |
| Battle | 4 | Presence of a key battle signal. |
| Caveat penalty | -8 | Open anomalies and known incidents reduce confidence in the story signal. |

The score is clamped to the range 0–100 and rounded to one decimal place.

## Grade thresholds

| Grade | Score range |
| --- | --- |
| `A+` | 90–100 |
| `A` | 80–89.9 |
| `B` | 70–79.9 |
| `C` | 55–69.9 |
| `D` | 40–54.9 |
| `E` | 0–39.9 |

Grades are explanatory and must not be presented as official results.

## Confidence and caveat logic

The generator starts from Grid-to-Finish data confidence and then adjusts the report-card confidence based on interpretation constraints.

A row can remain `high` when source matching is strong and only routine caveats apply.

A row becomes `medium` when open anomaly counts or critical delay burden mean the story needs extra context.

A row becomes `usable_with_context` when any of these apply:

- known incident status is present
- anomaly count is high
- pace or delay classification is candidate-level
- inferred delay burden materially affects interpretation

`low` is reserved for weak or incomplete source signals. Current prepared source data is expected to avoid `low` unless future input quality changes.

Each row must include `confidence_reasons` and `interpretation_caveats`. Caveats must preserve:

- RaceIQ score and grade are explanatory, not official
- First Observed movement is not true grid position
- open anomaly status where present
- known incident status where present

## Known incident handling

Known incidents are preserved as interpretation caveats. They do not change official standings, final laps, final position or official source-state records.

For example, the Ostrov Team transponder issue remains visible as a known incident caveat and should not be hidden inside the score.

## Anomaly handling

Open anomaly rows are summarised as human-readable `anomaly_status` values such as:

```text
3 open review items
```

Anomalies are review items, not official penalties or confirmed wrongdoing. They must remain visible where they affect interpretation.

## Validation summary

`data/team_report_cards_validation.json` includes:

- row counts
- final-standing team count
- required fields
- missing required fields by team
- missing confidence fields by team
- score bounds status
- grade distribution
- confidence distribution
- teams by confidence bucket
- confidence field coverage
- known incident caveat coverage
- anomaly caveat coverage
- top explanatory report cards
- data source list
- validation status

The static validator checks the generated report cards and validation summary remain aligned.

## Review checklist

Before approving a regeneration PR:

1. Run the generator.
2. Run `python tools/validate_static_data.py`.
3. Run `python tools/validate_static_app.py`.
4. Serve locally with `python -m http.server 8000` if UI compatibility is affected.
5. Spot-check:
   - race winner
   - highest RaceIQ score
   - a caveat-heavy team
   - a known incident team such as Ostrov Team
6. Confirm official positions and lap totals did not change unexpectedly.
7. Confirm RaceIQ scores, grades and confidence are described as explanatory.
