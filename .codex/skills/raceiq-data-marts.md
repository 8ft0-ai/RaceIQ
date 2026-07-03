# Skill: RaceIQ Data Mart Changes

## Use when

Use this skill when adding or changing JSON data files under `data/` or validating analytics inputs.

## Goal

Keep RaceIQ analytics trustworthy by making every generated data mart explicit, explainable and validation-friendly.

## Steps

1. Define the data mart contract before changing the UI.
2. Include source provenance where possible.
3. Preserve both official/cumulative values and inferred/derived values as separate fields.
4. Add validation output for joins, row counts and known caveats.
5. Make confidence explicit with fields such as `data_confidence`, `match_method`, or `notes`.
6. Keep unknowns as `null` or clear flags; do not invent data.
7. Document any caveats in `docs/`.
8. Ensure JSON is valid and loads through browser `fetch()`.

## RaceIQ-specific cautions

- The first approximately 20 minutes of the race were not captured.
- True grid movement requires heat sheet start position data.
- First observed position is not the same as starting grid position.
- Known timing/transponder incidents should remain visible in downstream analytics.

## Done when

- The JSON file exists under `data/`.
- The row count matches the intended entity count.
- Validation notes are committed.
- The downstream UI can consume missing or low-confidence fields safely.
