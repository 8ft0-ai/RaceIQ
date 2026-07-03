# RaceIQ analytics data dictionary

This document describes the static JSON data contracts consumed by the RaceIQ dashboard. It is intended to make future dashboard and analytics changes traceable without requiring maintainers to infer field meaning from the UI code alone.

RaceIQ is a post-race analytics dashboard. The deployed GitHub Pages application remains a static HTML, CSS and JavaScript application that reads prepared JSON files from `data/`.

## Interpretation rules

### Data categories

| Category | Meaning |
| --- | --- |
| Official source data | Values copied or normalised from LiveRC race output or event source files, such as final position, final laps, car number and fastest lap fields. |
| Derived data | Deterministic calculations from official or prepared source rows, such as movement deltas, aggregate counts, phase summaries and duration displays. |
| Inferred analytics | Analytical interpretation from captured timing data, such as delay burden, battle scores, anomaly review status, pace profiles and narrative summaries. These are not official race records. |
| Validation metadata | Files or fields that describe completeness, matching quality, confidence, missing fields or validation status. |

### Movement definitions

| Term | Definition | Important caveat |
| --- | --- | --- |
| Grid-to-Finish movement | `start_position - final_position`, where `start_position` comes from the heat sheet or start-grid data. Positive values mean the team finished higher than its start position. | This is the true grid movement measure where grid data is available. |
| First Observed movement | `first_observed_position - final_position`, where `first_observed_position` comes from the first captured leaderboard snapshot. | This is not true grid position. It exists because the opening part of the race was not captured. |
| `places_gained` in Team Report Cards | The report-card shorthand for Grid-to-Finish movement. | Must remain separate from `places_gained_from_first_observed`. |

The first observed position must never be presented as true grid position. It is a capture baseline only.

### Confidence vocabulary

The validation script recognises these confidence values:

| Value | Meaning |
| --- | --- |
| `high` | Suitable for normal dashboard interpretation, subject to visible caveats. |
| `medium` | Usable, but interpretation should preserve supporting context. |
| `usable_with_context` | Valid for storytelling when caveats, known incidents or coverage limits are shown. |
| `low` | Weak signal. Use cautiously and keep caveats visible. |

### RaceIQ score and grade semantics

RaceIQ scores and grades are explanatory storytelling aids. They are not official race rankings, penalties, adjudications or event results.

Scores combine finish result, movement, pace, consistency, inferred delay burden, battle signals, anomalies and known incidents into a post-race profile. They should help explain a race story, not replace the official standings.

### Known incidents and anomalies

Known incidents are race-context items that have been explicitly identified, such as a confirmed timing or transponder issue. They should be preserved as caveats and used to avoid misleading performance inference.

Anomalies are open review items detected from timing data, such as implausible lap jumps or suspicious fastest-lap values. They are not automatically wrongdoing, penalties or official corrections.

## Files consumed by the dashboard

The main dashboard loader in `app.js` consumes these files:

- `data/app_manifest.json`
- `data/race_overview.json`
- `data/standings.json`
- `data/race_replay_snapshot_summary.json`
- `data/race_story_events.json`
- `data/team_profiles.json`
- `data/team_phase_summary.json`
- `data/pit_delay_events.json`
- `data/pit_delay_team_summary.json`
- `data/head_to_head_battle_cards.json`
- `data/head_to_head_pairs.json`
- `data/head_to_head_pass_events.json`
- `data/anomaly_review_board.json`
- `data/known_incidents.json`
- `data/replay_traces_top12.json`

The Report Cards module in `report-cards.js` additionally consumes:

- `data/grid_to_finish.json`
- `data/grid_to_finish_validation.json`
- `data/team_report_cards.json`

The static data validator also recognises:

- `data/team_report_cards_validation.json`
- `data/team_report_card_scoring_debug.json` if present

## Common field groups

| Field group | Common fields | Meaning |
| --- | --- | --- |
| Team identity | `car_no`, `team_key`, `team_name`, `transponder`, `entry_no` | Identifies cars, teams and source-entry rows. |
| Final result | `final_position`, `final_laps`, `gap_display`, `fastest_lap_seconds`, `fastest_lap_no` | Official or official-derived finish information. |
| Capture baseline | `capture_start_position`, `capture_start_lap`, `first_observed_position`, `first_observed_laps` | First captured leaderboard state, not the race start. |
| Time | `timestamp_utc`, `fetched_at_utc`, `race_clock_seconds`, `race_clock_display`, `capture_clock_display` | Capture and race-time co-ordinates. |
| Movement | `start_position`, `places_gained_from_grid`, `places_gained_from_first_observed`, `movement_class`, `first_observed_movement_class` | Grid and observed movement calculations. |
| Pace | `median_clean_lph`, `mean_clean_lph`, `best_5min_clean_lph`, `pace_profile_type`, `pace_confidence` | Captured-segment pace analytics. Values are laps per hour unless noted. |
| Delay | `event_type`, `duration_seconds`, `excess_delay_seconds`, `estimated_laps_lost`, `delay_profile_label`, `include_for_delay_burden` | Inferred delay and pit/repair signals. |
| Battle | `battle_pair_key`, `battle_score`, `battle_class`, `lead_switches`, `close_3_lap_seconds`, `final_pair_winner` | Head-to-head comparison analytics. |
| Caveat | `known_incident_id`, `known_incident_status`, `anomaly_status`, `review_status`, `recommended_action` | Interpretation limits and review state. |
| Validation | `validation_status`, `required_fields`, `missing_required_fields_by_team`, `data_confidence`, `source_files` | Contract and quality metadata. |

## File dictionary

### `data/app_manifest.json`

**Purpose:** Dashboard manifest used by the Method tab and local run instructions.

**Category:** Validation and app metadata.

**Producer/source:** Prepared dashboard mart metadata.

**Required fields:**

- `app_name`: Display name for the static app.
- `version`: Data pack or app-data version.
- `generated_at_utc`: UTC generation timestamp.
- `data_files`: Manifest list of dashboard mart files available at generation time.
- `recommended_command`: Local static-server command.
- `open_url`: Local URL for the static dashboard.
- `source`: Human-readable source label.
- `coverage_note`: High-level capture caveat.

**Known limitations:** The manifest may not include newer optional files consumed by specialised modules unless the producer has been updated. The code-level loaders remain the source of truth for dashboard-consumed paths.

### `data/race_overview.json`

**Purpose:** Overview tab summary, hero status, top stories, coverage notes and Method tab content.

**Category:** Mixed derived data, inferred analytics and validation context.

**Producer/source:** Dashboard overview mart assembled from final standings, captured snapshots, delay, battle, anomaly and known-incident marts.

**Required top-level fields:**

- `generated_at_utc`: Generation timestamp.
- `race_name`: Display race name.
- `subtitle`: Dashboard subtitle.
- `summary_counts`: Aggregate counts used by overview KPIs.
- `podium`: Top-three final standings summary.
- `coverage`: Capture coverage metrics and notes.
- `top_battles`: Ranked battle summaries for overview cards.
- `top_delay_burden`: Teams with the largest inferred delay burden.
- `top_pace`: Pace-profile leaders.
- `known_incidents`: Known incident rows surfaced in overview context.
- `notes`: Method-tab interpretation notes.

**Confidence/caveat semantics:** `coverage` and `notes` must preserve that the opening race segment was not captured and that pace, delay and battle analytics are captured-segment analytics.

**Known limitations:** Overview rankings are summary views of inferred marts. They should not be treated as official rankings.

### `data/standings.json`

**Purpose:** Final standings and high-level team result data.

**Category:** Official source data plus capture-derived summary fields.

**Producer/source:** Final cumulative LiveRC results enriched with captured-segment summary fields.

**Required fields:**

- `final_position`: Official finishing position.
- `car_no`: Car number.
- `team_name`: Team display name.
- `final_laps`: Official or source cumulative final lap count.
- `gap_display`: Source-style gap to the previous row or leader.
- `fastest_lap_seconds`: Source fastest lap in seconds where available.
- `fastest_lap_no`: Lap number for the fastest lap where available.
- `capture_start_position`: Position at the first captured snapshot.
- `capture_start_lap`: Lap count at the first captured snapshot.
- `best_position`: Best observed position during capture.
- `worst_position`: Worst observed position during capture.
- `position_changes`: Count of observed position changes during capture.
- `time_in_lead_seconds`: Observed time in lead during capture.

**Known limitations:** Capture-derived fields do not include unobserved opening activity. Final standing fields remain separate from inferred analytics.

### `data/race_replay_snapshot_summary.json`

**Purpose:** Replay tab timeline and slider state.

**Category:** Derived data from captured leaderboard snapshots.

**Producer/source:** Captured LiveRC snapshot summaries.

**Required fields:**

- `snapshot_id`: Ordered captured snapshot identifier.
- `fetched_at_utc`: Capture timestamp.
- `race_clock_seconds`, `race_clock_display`: Race-clock estimate/display for the snapshot.
- `capture_clock_display`: Elapsed time since first captured snapshot.
- `leader_car_no`, `leader_team_name`, `leader_lap`: Snapshot leader state.
- `p2_team_name`, `p2_lap`, `p3_team_name`: Top-three context.
- `lead_gap_to_p2_laps`: Leader-to-P2 lap gap.
- `top3_order`, `top5_order`: Display strings.
- `leader_changed`, `top3_order_changed`: Change flags since previous snapshot.
- `active_delay_count`, `active_high_or_critical_delay_count`: Active inferred delay counts.
- `open_lap_review_items_at_snapshot`: Open timing/anomaly count at that snapshot.
- `race_story_confidence`: Snapshot-level story confidence label.

**Known limitations:** The first row is the first captured state, not the race start.

### `data/race_story_events.json`

**Purpose:** Curated event stream for replay storytelling.

**Category:** Inferred analytics and coverage annotations.

**Producer/source:** Captured snapshot changes, delay events, position changes, anomaly review items and coverage markers.

**Required fields:**

- `event_id`: Event identifier.
- `snapshot_id`: Source snapshot where applicable.
- `timestamp_utc`, `event_end_utc`: Event time bounds where available.
- `race_clock_seconds`, `race_clock_display`: Race-clock position.
- `event_type`: Event type such as `pre_capture_gap`, `capture_baseline`, `lead_change`, `podium_order_change`, `position_gained`, `position_lost`, `likely_delay_start` or `open_timing_review`.
- `severity`: Display severity.
- `narrative_weight`: Ranking weight for story ordering.
- `car_no`, `team_name`, `related_team_name`: Team context where relevant.
- `title`, `details`: User-facing event text.
- `source_table`: Source mart or table label.

**Confidence/caveat semantics:** `pre_capture_gap` and `capture_baseline` events are required to keep the unobserved opening segment visible.

### `data/team_profiles.json`

**Purpose:** Team Profiles tab data: pace, reliability, delay, position range and captured-segment narrative.

**Category:** Derived data and inferred analytics.

**Producer/source:** Final standings, captured snapshots, phase pace marts, delay marts and anomaly counts.

**Required fields used by the UI:**

- Identity/result: `car_no`, `team_key`, `team_name`, `final_position`, `final_laps`, `start_pos`.
- Narrative: `profile_headline`, `profile_narrative`, `pace_profile_interpretation_note`.
- Pace: `pace_profile_type`, `pace_confidence`, `median_clean_lph`, `mean_clean_lph`, `best_5min_clean_lph`, `worst_5min_clean_lph`.
- Scores: `pace_consistency_score`, `race_reliability_score`, `delay_adjusted_pace_index`.
- Phase pace: `opening_median_lph`, `middle_median_lph`, `closing_median_lph`, `final_hour_median_lph`, `final_hour_vs_overall_lph`.
- Delay: `clean_window_count`, `delay_or_no_progress_window_count`, `delay_event_count`, `total_delay_display`, `max_delay_display`, `delay_minutes_per_capture_hour`.
- Position/capture: `best_position`, `worst_position`, `position_range`, `position_changes`, `average_position`, `time_in_lead_display`, `first_observed_position`, `first_observed_laps`, `captured_laps_gained_official`, `share_of_laps_before_capture`, `coverage_classification`.
- Ranking helpers: `rank_median_clean_pace`, `rank_consistency`, `rank_final_hour_pace`, `rank_strongest_finish`.

**Known limitations:** Pace metrics describe the captured segment. They do not reconstruct the unobserved opening period.

### `data/team_phase_summary.json`

**Purpose:** Per-team phase pace summary used as supporting data for team profiles and report cards.

**Category:** Derived captured-segment analytics.

**Producer/source:** Captured lap-rate windows grouped by team and race phase.

**Required fields:**

- `car_no`, `team_key`, `team_name`: Team identity.
- `phase`: Phase label such as `opening_capture`, `middle_capture`, `closing_capture` or `final_hour`.
- `window_count`: Number of clean windows in the phase.
- `lap_gain_sum`: Laps gained across windows.
- `median_lap_rate_lph`, `mean_lap_rate_lph`: Phase pace in laps/hour.
- `p25_lap_rate_lph`, `p75_lap_rate_lph`: Distribution quartiles.
- `best_lap_rate_lph`, `worst_lap_rate_lph`: Phase extremes.

**Known limitations:** Empty phases may contain `null` rate values and must render gracefully.

### `data/pit_delay_events.json`

**Purpose:** Event-level inferred pit, repair, stoppage and delay review table.

**Category:** Inferred analytics.

**Producer/source:** Captured progress gaps, long-lap candidates, team pace baselines and known-incident exclusions.

**Required fields:**

- Identity: `pit_delay_event_id`, `car_no`, `team_name`.
- Classification: `event_family`, `event_type`, `severity`, `confidence`, `review_status`.
- Time bounds: `timestamp_start_utc`, `timestamp_end_utc`, `duration_seconds`, `duration_display`, `start_snapshot_id`, `end_snapshot_id`, `start_capture_clock_display`, `end_capture_clock_display`, `start_race_clock_display`, `end_race_clock_display`.
- Delay burden: `excess_delay_seconds`, `excess_delay_display`, `estimated_laps_lost`, `include_for_delay_burden`.
- Race state: `lap_start`, `lap_end`, `position_start`, `position_end`, `position_loss`, `leader_laps_gained`, `laps_lost_to_leader`, `recovered_within_5min`.
- Caveats: `known_incident_id`, `classification_reason`, `recommended_review_action`.

**Confidence/caveat semantics:** Events are inferred and should not be labelled official pit records unless confirmed elsewhere.

### `data/pit_delay_team_summary.json`

**Purpose:** Team-level inferred delay burden summary.

**Category:** Inferred analytics and derived aggregation.

**Producer/source:** Aggregation of `pit_delay_events.json` joined to standings and pace profiles.

**Required fields:**

- Team/result: `car_no`, `team_name`, `final_position`, `final_laps`, `pace_profile_type`, `median_clean_lph`.
- Counts: `event_count_total`, `delay_burden_event_count`, `short_delay_count`, `probable_pit_or_repair_count`, `major_repair_or_stoppage_count`, `race_ending_stop_count`, `sustained_slow_running_count`, `telemetry_artifact_count`, `open_review_event_count`.
- Burden: `total_excess_delay_display`, `estimated_laps_lost_total`, `delay_minutes_per_capture_hour`, `laps_lost_per_capture_hour`.
- Biggest event: `biggest_event_type`, `biggest_event_severity`, `biggest_event_race_clock`, `biggest_event_excess_delay_display`, `biggest_event_estimated_laps_lost`.
- Range/rank: `first_delay_race_clock`, `last_delay_race_clock`, `rank_estimated_laps_lost`, `rank_delay_minutes_per_hour`, `delay_profile_label`.

**Known limitations:** Laps lost are estimated from observed timing behaviour and team pace baselines, not official lap deductions.

### `data/head_to_head_battle_cards.json`

**Purpose:** Top battle cards for the Head-to-head tab and overview highlights.

**Category:** Inferred analytics.

**Producer/source:** Pairwise captured-segment comparison of teams.

**Required fields:**

- Pair identity: `battle_rank`, `battle_pair_key`, `car_no_a`, `team_name_a`, `car_no_b`, `team_name_b`.
- Score/classification: `battle_score`, `battle_class`, `battle_shape`.
- Result context: `final_pair_winner`, `final_pair_loser`, `final_lap_gap_a_minus_b`.
- Battle signals: `lead_switches`, `close_3_lap_seconds`, `close_3_lap_pct`, `winner_trailed_pct`, `max_lap_deficit_overcome_by_winner`, `decisive_pass_race_clock`.
- Narrative: `why_it_matters`, `battle_card_narrative`.

**Known limitations:** Battle score is an explanatory ranking of observed pair dynamics, not an official race score.

### `data/head_to_head_pairs.json`

**Purpose:** Full pair-ranking table for head-to-head analysis.

**Category:** Inferred analytics and derived pair metrics.

**Producer/source:** Pairwise aggregation of captured snapshots, standings, pace and delay summaries.

**Required fields:**

- Pair identity: `battle_rank`, `battle_pair_key`.
- Team A/B fields: `car_no_a`, `team_name_a`, `final_position_a`, `final_laps_a`, `median_clean_lph_a`, `delay_laps_lost_a`, and equivalent `_b` fields.
- Observed comparison: `observed_battle_display`, `a_ahead_pct`, `b_ahead_pct`, `close_3_lap_seconds`, `close_3_lap_pct`, `lead_switches`.
- Gap and result: `first_observed_lap_gap_a_minus_b`, `last_observed_lap_gap_a_minus_b`, `final_lap_gap_a_minus_b`, `final_pair_winner`, `final_pair_loser`.
- Comeback: `winner_trailed_pct`, `max_lap_deficit_overcome_by_winner`, `comeback_flag`, `decisive_pass_race_clock`, `decisive_pass_team_name`.
- Summary: `battle_score`, `battle_class`, `battle_shape`, `battle_summary`.

**Known limitations:** Pairwise position is based on observed capture data; unobserved opening pair changes are not reconstructed.

### `data/head_to_head_pass_events.json`

**Purpose:** Event table of pair lead switches used by the Head-to-head tab.

**Category:** Derived captured-segment events.

**Producer/source:** Pairwise state transitions in captured snapshots.

**Required fields:**

- `pass_event_id`: Event identifier.
- `battle_pair_key`: Pair key.
- `snapshot_id`, `fetched_at_utc`, `race_clock_seconds`, `race_clock_display`: Event timing.
- `team_name_a`, `team_name_b`: Pair members.
- `passing_team_name`, `passed_team_name`: Lead-switch direction.
- `lap_gap_a_minus_b_after`: Pair lap gap after the event.
- `position_gap_a_minus_b_after`: Pair position gap after the event.
- `pass_context`: Context such as `pair lead switch`.

**Known limitations:** These are pair lead switches in the observed data, not necessarily on-track overtakes.

### `data/anomaly_review_board.json`

**Purpose:** Anomaly Review tab data.

**Category:** Validation and review metadata for inferred analytics.

**Producer/source:** Timing and lap-inference review rules.

**Required fields:**

- `review_id`: Review item identifier.
- `anomaly_type`: Type such as `implausible_lap_jump`, `suspicious_fastest_lap` or `extreme_long_lap`.
- `severity`: Review severity.
- `timestamp_utc`, `last_seen_utc`: Observation time range.
- `observation_count`: Number of observations represented by the item.
- `snapshot_id`: Source snapshot where applicable.
- `car_no`, `team_name`: Team context.
- `lap`, `position`: Race state where applicable.
- `metric_value`, `metric_name`: Triggering metric.
- `details`: Human-readable anomaly details.
- `source_table`: Source mart/table label.
- `recommended_action`: Suggested review action.
- `known_incident_status`: Known incident relationship.
- `effective_review_status`: Open/closed/effective status.

**Known limitations:** Anomalies are review items. They must not be interpreted as official penalties or confirmed wrongdoing.

### `data/known_incidents.json`

**Purpose:** Known incident register used to preserve race-context caveats.

**Category:** Validation metadata and race-context caveat data.

**Producer/source:** User-provided or race-context-confirmed incident notes, mapped to teams and affected timing windows.

**Required fields:**

- `known_incident_id`: Stable incident identifier.
- `car_no`, `team_key`, `team_name`: Team identity.
- `incident_type`, `incident_status`: Incident classification and confirmation status.
- `reported_by`, `reported_note`: Source of the incident context.
- `evidence_window_start_snapshot`, `evidence_window_end_snapshot`, `evidence_window_start_utc`, `evidence_window_end_utc`: Evidence window.
- `related_context_start_snapshot`, `related_context_start_utc`: Related context boundary.
- `analytics_resolution`: How analytics should treat the incident.
- `downstream_rule`: Rule for downstream interpretation and exclusions.
- `created_utc`: Creation timestamp.

**Known limitations:** Known incidents explain how RaceIQ analytics should interpret data. They do not amend official race results.

### `data/replay_traces_top12.json`

**Purpose:** Top-12 trace chart in the Race Replay tab.

**Category:** Derived captured-segment data.

**Producer/source:** Captured snapshot position traces.

**Required fields:**

- `team_name`: Series label.
- `race_clock_seconds`: X-axis race-clock value.
- `position`: Y-axis observed position.

**Known limitations:** Trace lines begin at capture start. Opening trace movement is unavailable.

### `data/grid_to_finish.json`

**Purpose:** Grid-to-Finish movement table and visualisation.

**Category:** Derived data with validation metadata.

**Producer/source:** Final standings joined to heat sheet and entry list data.

**Required fields enforced by `tools/validate_static_data.py`:**

- `team_name`
- `car_no`
- `start_position`
- `first_observed_position`
- `final_position`
- `places_gained_from_grid`
- `places_gained_from_first_observed`
- `data_confidence`

**Additional fields used for traceability:**

- `transponder`: Source transponder value.
- `entry_no`: Entry-list sequence number.
- `heat_sheet_team_name`: Team name as represented in heat-sheet data.
- `entry_driver_raw`: Raw driver/team entry text.
- `final_laps`: Official final lap count.
- `movement_class`: Grid-to-Finish movement bucket.
- `first_observed_movement_class`: First Observed movement bucket.
- `podium`: Whether final position is podium.
- `grid_data_available`: Whether grid/start data was available.
- `match_method`: Matching approach used to join source rows.
- `normalised_team_name_match`: Whether normalised team names matched.
- `notes`: Row-level caveats.

**Required calculations:**

- `places_gained_from_grid` must equal `start_position - final_position`.
- `places_gained_from_first_observed` must equal `first_observed_position - final_position`.

**Known limitations:** Grid movement is valid only where grid data is available. First Observed movement is separate and must not be substituted for true grid movement.

### `data/grid_to_finish_validation.json`

**Purpose:** Validation summary for Grid-to-Finish data.

**Category:** Validation metadata.

**Producer/source:** Grid-to-Finish generation and validation process.

**Required fields:**

- `generated_at_utc`: Validation timestamp.
- `source_files`: Source files used.
- `race_context`: Event context and capture caveat.
- `row_count`, `final_standing_team_count`, `heat_sheet_row_count`, `entry_list_row_count`: Source and output counts.
- `grid_data_available`: Whether grid data was available.
- `matched_final_teams`: Count of matched final teams.
- `unmatched_final_car_numbers`, `unused_heat_sheet_car_numbers`, `duplicate_heat_sheet_car_numbers`, `duplicate_heat_sheet_transponders`: Matching issues.
- `rows_with_high_confidence`, `rows_with_medium_confidence`, `rows_with_low_confidence`: Confidence distribution.
- `movement_summary_from_grid`: Grid-to-Finish movement buckets.
- `movement_summary_from_first_observed`: First Observed movement buckets.
- `biggest_movers_from_grid`, `biggest_fallers_from_grid`: Highlight rows.
- `known_incident_car_numbers`: Incident-linked cars.
- `validation_status`: Overall status.

**Known limitations:** This file validates the data contract and matching quality. It is not a source of official results.

### `data/team_report_cards.json`

**Purpose:** Report Cards tab selected-team profiles and headline report-card grid.

**Category:** Inferred analytics built from official, derived and validation inputs.

**Producer/source:** Final standings, Grid-to-Finish, team profiles, phase summaries, delay summaries, battle cards, anomalies and known incidents.

**Required fields enforced by `tools/validate_static_data.py`:**

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
- `report_card_score`
- `report_card_grade`
- `summary_bullets`

**Optional or forward-compatible fields:**

- `data_confidence`: Controlled confidence value where present.
- `report_card_confidence`: Report-card-specific confidence value where present.

**Field semantics:**

- `places_gained`: Grid-to-Finish movement, equivalent to `start_position - final_position`.
- `places_gained_from_first_observed`: First Observed movement, based only on the first captured leaderboard snapshot.
- `report_card_score`: Numeric explanatory score from 0 to 100.
- `report_card_grade`: Explanatory grade in `A+`, `A`, `B`, `C`, `D` or `E`.
- `anomaly_status`: Human-readable open anomaly status.
- `known_incident_status`: Human-readable known incident status.
- `summary_bullets`: Short selected-team story bullets.

**Known limitations:** Report cards are explanatory and caveated. They do not change or rank official results.

### `data/team_report_cards_validation.json`

**Purpose:** Validation summary for Team Report Cards.

**Category:** Validation metadata.

**Producer/source:** Report-card generation and validation process.

**Required fields:**

- `generated_at_utc`: Validation timestamp.
- `row_count`: Number of report-card rows.
- `final_standing_team_count`: Number of final standing teams.
- `one_card_per_final_team`: Whether every final-standing team has one card.
- `required_fields`: Required field list used at validation time.
- `missing_required_fields_by_team`: Per-team missing-field map.
- `score_bounds_ok`: Whether scores are numeric and within bounds.
- `grade_distribution`: Count by grade.
- `teams_with_caveats`: Number of teams with caveats.
- `teams_with_known_incidents`: Number of teams with known incidents.
- `teams_with_open_anomalies`: Number of teams with open anomaly status.
- `top_report_cards`: Top explanatory report cards.
- `data_sources`: Source marts used to produce cards.
- `validation_status`: Overall status.

**Known limitations:** Validation status confirms contract consistency, not official correctness of inferred scores.

### `data/team_report_card_scoring_debug.json`

**Purpose:** Optional debug artefact for scoring transparency if generated.

**Category:** Validation/debug metadata.

**Producer/source:** Report-card generation process.

**Expected contents:** Per-team scoring inputs, components, weights or intermediate values used to explain `report_card_score` and `report_card_grade`.

**Known limitations:** This file is not currently loaded by the dashboard. If present, it should support auditability without becoming a user-facing official ranking.

## Validation references

- `tools/validate_static_data.py` is the contract gate for required JSON files, Grid-to-Finish movement calculations, report-card required fields, report-card score bounds, grade values and allowed confidence values.
- `docs/GRID_TO_FINISH_VALIDATION.md` records the current Grid-to-Finish validation result and repeats the key caveat that true Grid-to-Finish movement uses heat sheet start positions while First Observed movement is reported separately.

Before approving data-contract changes, run:

```bash
python tools/validate_static_data.py
```

For UI-affecting changes, also serve the app locally and check the affected tabs:

```bash
python -m http.server 8000
```

## Update checklist

When adding or changing a JSON file:

1. Confirm whether it is official source data, derived data, inferred analytics or validation metadata.
2. Add or update its section in this dictionary.
3. Keep Grid-to-Finish movement separate from First Observed movement.
4. Keep RaceIQ scores and grades labelled as explanatory, not official.
5. Preserve visible caveats for capture gaps, known incidents, anomalies and confidence limits.
6. Update `tools/validate_static_data.py` if the data contract changes.
7. Re-run static validation before requesting approval.
