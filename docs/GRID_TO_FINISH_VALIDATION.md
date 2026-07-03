# Grid-to-Finish Validation

Iteration 1 for RaceIQ issue #2. This is a data-only delivery; no UI changes are included.

## Result

- Validation status: **pass**
- Final-standing teams: 25
- Heat sheet rows: 25
- Entry list rows: 25
- Matched teams: 25
- Unmatched final car numbers: none
- Duplicate heat sheet car numbers: none
- Duplicate heat sheet transponders: none

## Caveat

The first approximately 20 minutes of the race were not captured. True Grid → Finish movement uses heat sheet start positions. First Observed → Finish movement is based on the first captured leaderboard snapshot and is reported separately.

## Movement summary from grid

- big_mover_up: 9
- gainer: 3
- held_position: 1
- faller: 1
- big_mover_down: 11
- unknown_grid: 0

## Biggest movers from grid

- ISŠA Brno: P22 → P1 (+21)
- laborky.cz: P21 → P4 (+17)
- Redback AU: P23 → P10 (+13)
- Indy 1: P24 → P11 (+13)
- EGE-Hydrofoxes II: P17 → P6 (+11)

## Biggest fallers from grid

- TechTeam Glide 2: P7 → P22 (-15)
- SAM-Racing: P5 → P19 (-14)
- TechTeam Glide 1: P11 → P25 (-14)
- Vista-H2GP: P2 → P15 (-13)
- Full Send Racing: P6 → P18 (-12)

## Output files

- `data/grid_to_finish.json`
- `data/grid_to_finish_validation.json`
