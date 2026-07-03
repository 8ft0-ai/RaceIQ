# Team Report Card Data Validation

Iteration 3 for RaceIQ issue #4. This is a data-only delivery; no Team Report Card UI is included.

## Result

- Validation status: **pass**
- Team report cards: 25
- Final-standing teams: 25
- One card per final-standing team: true
- Score bounds valid: true
- Teams with caveats: 25
- Teams with known incidents: 1
- Teams with open anomalies: 25

## Grade distribution

- A+: 1
- A: 3
- B: 4
- C: 3
- D: 4
- E: 10

## Top report cards by score

- ISŠA Brno: 93.8 (A+), final P1
- Team Bulgaria: 87.9 (A), final P2
- Oakwood Blue: 85.9 (A), final P3
- laborky.cz: 83.1 (A), final P4
- EGE-Hydrofoxes II: 79.6 (B), final P6

## Caveats

The score is a RaceIQ storytelling aid, not an official race result. It combines final result, clean pace, consistency, inferred delay management, grid movement, battle performance and data confidence. Known timing incidents are surfaced as caveats rather than hidden or treated as confirmed performance failures.

All teams currently have at least one open anomaly review item because the anomaly board is intentionally broad. Report-card consumers should treat these as review caveats, not automatic performance faults.

## Output files

- `data/team_report_cards.json`
- `data/team_report_cards_validation.json`
