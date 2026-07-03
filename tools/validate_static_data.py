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
        raise AssertionError(f"Missing required file: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as exc:
        raise AssertionError(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc


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
        require(isinstance(score, (int, float)), f"report_card_score must be numeric for {team_name}")
        require(0 <= score <= 100, f"report_card_score out of bounds for {team_name}: {score}")
        require(row.get("report_card_grade") in {"A+", "A", "B", "C", "D", "E"}, f"Invalid grade for {team_name}")
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


def main() -> int:
    try:
        validate_required_files()
        validate_grid_to_finish()
        validate_team_report_cards()
    except AssertionError as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        return 1

    print("RaceIQ static data validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
