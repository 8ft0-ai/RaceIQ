#!/usr/bin/env python3
"""Validate RaceIQ static JSON data contracts.

This script intentionally has no third-party dependencies. It is designed to be
run from the repository root before opening or marking a PR ready for review.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

REQUIRED_JSON_FILES = [
    "standings.json",
    "grid_to_finish.json",
    "grid_to_finish_validation.json",
]

OPTIONAL_JSON_FILES = [
    "team_report_cards.json",
    "team_report_cards_validation.json",
    "team_report_card_scoring_debug.json",
]

TEAM_REPORT_CARD_REQUIRED_FIELDS = [
    "team_name",
    "car_no",
    "headline",
    "final_position",
    "start_position",
    "first_observed_position",
    "places_gained",
    "places_gained_from_first_observed",
    "final_laps",
    "pace_label",
    "median_clean_lph",
    "consistency_score",
    "delay_profile",
    "estimated_laps_lost",
    "best_phase",
    "key_battle",
    "anomaly_status",
    "known_incident_status",
    "data_confidence",
    "confidence_reasons",
    "interpretation_caveats",
    "report_card_score",
    "report_card_grade",
    "summary_bullets",
]

TEAM_REPORT_CARD_VALIDATION_REQUIRED_FIELDS = [
    "generated_at_utc",
    "row_count",
    "final_standing_team_count",
    "one_card_per_final_team",
    "required_fields",
    "missing_required_fields_by_team",
    "missing_confidence_fields_by_team",
    "score_bounds_ok",
    "grade_distribution",
    "confidence_distribution",
    "teams_by_confidence",
    "confidence_field_coverage",
    "teams_with_caveats",
    "teams_with_known_incidents",
    "teams_with_open_anomalies",
    "known_incident_confidence_caveat_coverage",
    "anomaly_confidence_caveat_coverage",
    "top_report_cards",
    "data_sources",
    "validation_status",
]

ALLOWED_CONFIDENCE_VALUES = {"high", "medium", "usable_with_context", "low"}

GRID_REQUIRED_FIELDS = [
    "team_name",
    "car_no",
    "start_position",
    "first_observed_position",
    "final_position",
    "places_gained_from_grid",
    "places_gained_from_first_observed",
    "data_confidence",
]


def load_json(path: Path) -> Any:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        raise AssertionError(f"Missing required file: {path}")
    except json.JSONDecodeError as exc:
        raise AssertionError(f"Invalid JSON in {path}: {exc}") from exc


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def require_non_empty_string_list(value: Any, field: str, team_name: str) -> None:
    require(isinstance(value, list), f"{field} must be a list for {team_name}")
    require(len(value) > 0, f"{field} must not be empty for {team_name}")
    for index, item in enumerate(value):
        require(
            isinstance(item, str) and item.strip(),
            f"{field}[{index}] must be a non-empty string for {team_name}",
        )


def has_status(value: Any) -> bool:
    return bool(value and value != "none")


def validate_required_files() -> None:
    for name in REQUIRED_JSON_FILES:
        load_json(DATA / name)
    for name in OPTIONAL_JSON_FILES:
        path = DATA / name
        if path.exists():
            load_json(path)


def validate_grid_to_finish() -> None:
    rows = load_json(DATA / "grid_to_finish.json")
    require(isinstance(rows, list), "grid_to_finish.json must be a list")
    require(len(rows) > 0, "grid_to_finish.json must not be empty")

    car_numbers = [row.get("car_no") for row in rows]
    require(len(car_numbers) == len(set(car_numbers)), "grid_to_finish.json must have one row per car_no")

    for row in rows:
        missing = [field for field in GRID_REQUIRED_FIELDS if field not in row]
        require(not missing, f"grid_to_finish row for {row.get('team_name')} missing fields: {missing}")
        require(
            row.get("places_gained_from_grid") == row.get("start_position") - row.get("final_position"),
            f"Grid movement mismatch for {row.get('team_name')}",
        )
        require(
            row.get("places_gained_from_first_observed") == row.get("first_observed_position") - row.get("final_position"),
            f"First-observed movement mismatch for {row.get('team_name')}",
        )
        require(
            row.get("data_confidence") in ALLOWED_CONFIDENCE_VALUES,
            f"Invalid grid data_confidence for {row.get('team_name')}: {row.get('data_confidence')}",
        )


def validate_team_report_card_validation_summary(rows: list[dict[str, Any]]) -> None:
    path = DATA / "team_report_cards_validation.json"
    if not path.exists():
        return

    summary = load_json(path)
    require(isinstance(summary, dict), "team_report_cards_validation.json must be an object")

    missing = [field for field in TEAM_REPORT_CARD_VALIDATION_REQUIRED_FIELDS if field not in summary]
    require(not missing, f"team_report_cards_validation.json missing fields: {missing}")

    require(summary.get("row_count") == len(rows), "team_report_cards_validation row_count does not match team_report_cards.json")
    require(
        summary.get("final_standing_team_count") == len(load_json(DATA / "standings.json")),
        "team_report_cards_validation final_standing_team_count does not match standings.json",
    )
    require(summary.get("one_card_per_final_team") is True, "team_report_cards_validation must confirm one card per final team")
    if summary.get("validation_status") == "pass_with_blocked_analytics":
        require(summary.get("blocked_score_count") == len(rows), "All dependent scores must be blocked")
        require(summary.get("score_bounds_ok") is None, "Blocked scoring cannot claim numeric score bounds")
        require(not summary.get("top_report_cards"), "Blocked scoring must not publish top scorers")
    else:
        require(summary.get("score_bounds_ok") is True, "team_report_cards_validation must confirm score bounds")
        require(summary.get("validation_status") == "pass", "team_report_cards_validation validation_status must be pass")

    required_fields = summary.get("required_fields")
    require(isinstance(required_fields, list), "team_report_cards_validation required_fields must be a list")
    for field in TEAM_REPORT_CARD_REQUIRED_FIELDS:
        require(field in required_fields, f"team_report_cards_validation required_fields missing {field}")

    confidence_distribution = summary.get("confidence_distribution")
    require(isinstance(confidence_distribution, dict), "confidence_distribution must be an object")
    observed_distribution = Counter(row.get("data_confidence") for row in rows)
    for value in ALLOWED_CONFIDENCE_VALUES:
        require(
            confidence_distribution.get(value, 0) == observed_distribution.get(value, 0),
            f"confidence_distribution mismatch for {value}",
        )

    missing_confidence = summary.get("missing_confidence_fields_by_team")
    require(isinstance(missing_confidence, dict), "missing_confidence_fields_by_team must be an object")
    require(not missing_confidence, "missing_confidence_fields_by_team must be empty when validation_status is pass")

    coverage = summary.get("confidence_field_coverage")
    require(isinstance(coverage, dict), "confidence_field_coverage must be an object")
    require(
        coverage.get("teams_with_data_confidence") == len(rows),
        "confidence_field_coverage must count data_confidence for every team",
    )
    require(
        coverage.get("teams_with_confidence_reasons") == len(rows),
        "confidence_field_coverage must count confidence_reasons for every team",
    )
    require(
        coverage.get("teams_with_interpretation_caveats") == len(rows),
        "confidence_field_coverage must count interpretation_caveats for every team",
    )


def validate_team_report_cards() -> None:
    path = DATA / "team_report_cards.json"
    if not path.exists():
        print("team_report_cards.json not present; skipping report card checks")
        return

    rows = load_json(path)
    standings = load_json(DATA / "standings.json")
    require(isinstance(rows, list), "team_report_cards.json must be a list")
    require(len(rows) == len(standings), "team_report_cards.json must have one row per final-standing team")

    car_numbers = [row.get("car_no") for row in rows]
    require(len(car_numbers) == len(set(car_numbers)), "team_report_cards.json must have one row per car_no")

    for row in rows:
        team_name = row.get("team_name")
        missing = [field for field in TEAM_REPORT_CARD_REQUIRED_FIELDS if field not in row]
        require(not missing, f"team_report_card row for {team_name} missing fields: {missing}")

        score = row.get("report_card_score")
        if row.get("metric_status") == "blocked_shared_scoring_denominator":
            require(score is None and row.get("report_card_grade") is None,
                    f"Blocked score and grade must both be null for {team_name}")
            require(isinstance(row.get("blocked_reason"), str) and row["blocked_reason"],
                    f"Missing blocked reason for {team_name}")
        else:
            require(isinstance(score, (int, float)) and not isinstance(score, bool),
                    f"report_card_score must be numeric for {team_name}")
            require(0 <= score <= 100, f"report_card_score out of bounds for {team_name}: {score}")
            require(row.get("report_card_grade") in {"A+", "A", "B", "C", "D", "E"},
                    f"Invalid grade for {team_name}")
        require(isinstance(row.get("summary_bullets"), list), f"summary_bullets must be a list for {team_name}")
        require("places_gained" in row and "places_gained_from_first_observed" in row, "Grid and first-observed movement must remain separate")

        confidence = row.get("data_confidence")
        require(
            confidence in ALLOWED_CONFIDENCE_VALUES,
            f"Invalid report-card data_confidence for {team_name}: {confidence}",
        )
        require_non_empty_string_list(row.get("confidence_reasons"), "confidence_reasons", str(team_name))
        require_non_empty_string_list(row.get("interpretation_caveats"), "interpretation_caveats", str(team_name))

        caveat_text = " ".join(row.get("interpretation_caveats", [])).lower()
        require(
            "score" in caveat_text and "official" in caveat_text,
            f"interpretation_caveats must preserve RaceIQ score caveat for {team_name}",
        )
        require(
            "first observed" in caveat_text and "grid" in caveat_text,
            f"interpretation_caveats must preserve First Observed caveat for {team_name}",
        )

        if has_status(row.get("anomaly_status")):
            require(
                "anomaly" in caveat_text,
                f"interpretation_caveats must mention anomaly status for {team_name}",
            )
        if has_status(row.get("known_incident_status")):
            require(
                "known incident" in caveat_text,
                f"interpretation_caveats must mention known incident status for {team_name}",
            )

    validate_team_report_card_validation_summary(rows)


def validate_frozen_main_preservation() -> None:
    """Require the exact approved blocked transform of immutable frozen inputs.

    An already-blocked candidate is never its own source authority: its preserved
    result, provenance and narrative fields must reproduce from frozen main.
    This also protects fields not individually named by metric validators.
    """
    import subprocess
    from block_timing_anomaly import BASELINE, TRANSFORMED_SOURCES, generate

    try:
        frozen = {
            name: json.loads(subprocess.check_output(
                ["git", "show", f"{BASELINE}:data/{name}.json"],
                cwd=ROOT, stderr=subprocess.PIPE
            ))
            for name in TRANSFORMED_SOURCES
        }
        expected = generate(frozen)
    except (subprocess.CalledProcessError, OSError, ValueError, KeyError) as exc:
        raise AssertionError("Frozen-main preservation oracle unavailable: " + str(exc)) from exc
    for name, approved in expected.items():
        # Canonical serialisation compares JSON types as well as values:
        # Python equality alone would wrongly equate 8, 8.0 and sometimes True.
        actual_json = json.dumps(load_json(DATA / (name + ".json")),
                                 sort_keys=True, ensure_ascii=False, allow_nan=False)
        approved_json = json.dumps(approved, sort_keys=True,
                                  ensure_ascii=False, allow_nan=False)
        require(actual_json == approved_json,
                f"Frozen-main preservation mismatch: {name}")


def validate_timing_integrity() -> None:
    meta = load_json(DATA / "timing_anomaly_integrity.json")
    require(meta.get("contract") == "timing-anomaly-blocked-output/v2", "Missing canonical blocked-output contract")
    require(meta.get("source_main") == "7addbd39774f2ab5a59be7bd42c9e6d9cdcf65ab",
            "Unexpected frozen source authority")
    require(meta.get("collector_archive_sha256") == "e1a0c0717b8df1548375f96afabc507040156a783005c944d73b2136dd3ac253",
            "Unexpected collector archive identity")
    require(meta.get("canonical_observation_count") == 27550 and
            meta.get("canonical_snapshot_observations_sha256") ==
            "82e6afd8e7828f51bf7d637d30a132e0813921f249453e33cf00f5a1f094c02c",
            "Unexpected snapshot source fingerprint")
    boundaries = {r["snapshot"]: (r["lap"], r["position"], r["role"])
                  for r in meta.get("boundary_states", [])}
    require(boundaries.get(112) == (142, 7, "fresh_baseline_no_pass") and
            boundaries.get(893) == (736, 7, "correction_ineligible") and
            boundaries.get(894) == (737, 7, "fresh_baseline_no_pass") and
            boundaries.get(895) == (737, 7, "candidate_subsequent_comparison"),
            "Incorrect invalid/rebaseline boundary semantics")
    pairs = load_json(DATA / "head_to_head_pairs.json")
    passes = load_json(DATA / "head_to_head_pass_events.json")
    cards = load_json(DATA / "head_to_head_battle_cards.json")
    stories = load_json(DATA / "race_story_events.json")
    reports = load_json(DATA / "team_report_cards.json")
    profiles = load_json(DATA / "team_profiles.json")
    phases = load_json(DATA / "team_phase_summary.json")
    overview = load_json(DATA / "race_overview.json")
    delay_summary = load_json(DATA / "pit_delay_team_summary.json")
    delay_rows = [d for d in delay_summary if d.get("car_no") == 73]
    require(len(delay_rows)==1,"Missing car-73 delay summary")
    delay = delay_rows[0]
    require(delay.get("event_count_total")==13 and
            delay.get("delay_burden_event_count")==8 and
            delay.get("estimated_laps_lost_total")==31.6 and
            delay.get("total_excess_delay_display")=="13:30",
            "Verified car-73 delay values changed")
    require(delay.get("median_clean_lph") is None and
            delay.get("pace_profile_type") is None and
            delay.get("pace_status")=="blocked_timing_anomaly_lineage",
            "Unverified pace leaked through delay summary")
    suspect = {152,153,155,156,157,158,159,160,161,335,336}
    require(len(pairs) == 300, "Expected 300 battle pairs")
    affected_keys = sorted(p["battle_pair_key"] for p in pairs
                           if 73 in (p["car_no_a"], p["car_no_b"]))
    require(len(affected_keys) == 24 and
            affected_keys == meta.get("affected_pair_keys"), "Expected exact 24-pair inventory")
    require(meta.get("suspect_pass_event_ids") == sorted(suspect), "Expected exact 11-event inventory")
    require(all(p.get("battle_rank") is None and p.get("rank_status") == "blocked_global_battle_rank_denominator" for p in pairs),
            "Global battle rank must remain blocked")
    require(all(p.get("battle_score") is None and p.get("battle_class") is None
                and p.get("score_status") == "blocked_shared_battle_score_denominator" for p in pairs),
            "Global battle score or class leaked")
    require([p["battle_pair_key"] for p in pairs] ==
            sorted(p["battle_pair_key"] for p in pairs), "Battle pair order leaks legacy ranking")
    for p in pairs:
        if 73 in (p["car_no_a"],p["car_no_b"]):
            require(p.get("metric_status") == "blocked_timing_anomaly_lineage", "Affected pair missing blocked disposition")
            for f in ("observed_battle_display", "a_ahead_pct", "b_ahead_pct",
                      "close_3_lap_seconds", "close_3_lap_pct", "lead_switches",
                      "winner_trailed_pct", "max_lap_deficit_overcome_by_winner",
                      "comeback_flag", "decisive_pass_race_clock",
                      "decisive_pass_team_name", "battle_score", "battle_class",
                      "battle_shape", "battle_summary"):
                require(p.get(f) is None, f"Affected pair leaks {f}: {p['battle_pair_key']}")
            side = "a" if p["car_no_a"] == 73 else "b"
            require(p.get("median_clean_lph_" + side) is None,
                    "Affected pair leaks car-73 clean pace")
    require(len([p for p in passes if p["pass_event_id"] in suspect]) == 11, "Missing suspect passes")
    for p in passes:
        car73 = "73" in p["battle_pair_key"].split("_vs_")
        timing_boundary = car73 and (83 <= p["snapshot_id"] <= 112 or
                                     p["snapshot_id"] in (893, 894))
        if p["pass_event_id"] in suspect or timing_boundary:
            require(p.get("competitive_status") == "blocked_timing_anomaly_lineage",
                    f"Timing-affected pass not blocked: {p['pass_event_id']}")
    require(all(c.get("battle_rank") is None and c.get("battle_score") is None and
                c.get("battle_class") is None for c in cards), "Battle cards leak global score or rank")
    require([c["battle_pair_key"] for c in cards] ==
            sorted(c["battle_pair_key"] for c in cards), "Battle card order leaks legacy ranking")
    for c in cards:
        if 73 in (c["car_no_a"],c["car_no_b"]):
            require(c.get("metric_status") == "blocked_timing_anomaly_lineage",
                    "Affected card missing blocked disposition")
            for f in ("battle_score", "battle_class", "battle_shape", "lead_switches",
                      "close_3_lap_seconds", "close_3_lap_pct", "winner_trailed_pct",
                      "max_lap_deficit_overcome_by_winner",
                      "decisive_pass_race_clock", "why_it_matters"):
                require(c.get(f) is None, f"Affected battle card leaks {f}")
            require("blocked" in c.get("battle_card_narrative", "").lower(),
                    "Affected card narrative fails to disclose blocked competitive claim")
    require(not overview.get("top_battles"), "Overview leaks historical top battles")
    require(not overview.get("top_pace"), "Overview leaks uncertified top-pace selection")
    require(overview.get("top_pace_status") == "blocked_shared_pace_rank_denominator",
            "Overview pace-rank status is not blocked")
    require(overview.get("top_battles_status") == "blocked_global_battle_rank_denominator", "Missing overview blocked status")
    require(len(reports) == 25 and all(r.get("report_card_score") is None and r.get("report_card_grade") is None and
            r.get("metric_status") == "blocked_shared_scoring_denominator" for r in reports),
            "Report-card shared denominator leaks score or grade")
    require(all("Ostrov Team" not in (r.get("key_battle") or "") for r in reports),
            "Affected reciprocal report-card key battle leaked")
    affected_profiles = [p for p in profiles if p["car_no"] == 73]
    require(len(affected_profiles) == 1 and affected_profiles[0].get("median_clean_lph") is None,
            "Car-73 pace not blocked")
    require(all(all(p.get(f) is None for f in ("rank_median_clean_pace", "rank_consistency",
                    "rank_final_hour_pace", "rank_strongest_finish")) and
                "Ranked " not in (p.get("profile_narrative") or "") for p in profiles),
            "Pace global rank or narrative leaked")
    car73_phases = [p for p in phases if p["car_no"] == 73]
    require(len(car73_phases) == 4, "Car-73 phase count changed")
    for p in car73_phases:
        for f in ("window_count", "lap_gain_sum", "median_lap_rate_lph",
                  "mean_lap_rate_lph", "p25_lap_rate_lph", "p75_lap_rate_lph",
                  "best_lap_rate_lph", "worst_lap_rate_lph"):
            require(p.get(f) is None, f"Car-73 phase leaks {f}")
    car73 = affected_profiles[0]
    require(car73.get("position_changes")==40 and car73.get("worst_position")==25 and
            car73.get("position_changes_status")=="raw_observed_only_not_verified_competitive",
            "Raw observed position volatility changed or falsely certified")
    for field in ("median_clean_lph", "mean_clean_lph", "best_5min_clean_lph",
                  "worst_5min_clean_lph", "pace_consistency_score", "race_reliability_score",
                  "delay_adjusted_pace_index", "opening_median_lph", "middle_median_lph",
                  "closing_median_lph", "final_hour_median_lph", "final_hour_vs_overall_lph",
                  "clean_window_count", "delay_or_no_progress_window_count",
                  "pace_profile_type", "total_delay_display", "delay_event_count",
                  "max_delay_display", "delay_minutes_per_capture_hour",
                  "rank_median_clean_pace", "rank_consistency",
                  "rank_final_hour_pace", "rank_strongest_finish"):
        require(car73.get(field) is None, f"Car-73 profile leaks {field}")
    car73_reports = [r for r in reports if r.get("car_no") == 73]
    require(len(car73_reports) == 1, "Car-73 report count changed")
    for field in ("median_clean_lph", "consistency_score", "pace_label", "best_phase",
                  "key_battle", "delay_profile", "estimated_laps_lost"):
        require(car73_reports[0].get(field) is None, f"Car-73 report leaks {field}")
    bad_stories = [e for e in stories if e.get("snapshot_id")==893 and e.get("car_no")==73 and
                   e.get("event_type")=="position_gained"]
    require(not bad_stories, "Snapshot-893 story leaks unsupported competitive gain")
    correction_stories = [e for e in stories if e.get("event_id") == 237 and
                          e.get("snapshot_id") == 893 and e.get("car_no") == 73 and
                          e.get("event_type") == "timing_correction_observed"]
    require(len(correction_stories) == 1 and
            "not a verified competitive gain" in correction_stories[0].get("details",""),
            "Snapshot-893 timing correction narrative missing or false")
    validate_frozen_main_preservation()


def main() -> int:
    try:
        validate_required_files()
        validate_grid_to_finish()
        validate_team_report_cards()
        validate_timing_integrity()
    except AssertionError as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        return 1

    print("RaceIQ static data validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
