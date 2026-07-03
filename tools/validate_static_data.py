#!/usr/bin/env python3
"""Validate RaceIQ static JSON data contracts.

This script intentionally has no third-party dependencies. It is designed to be
run from the repository root before opening or marking a PR ready for review.
"""
from __future__ import annotations

import json
import sys
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
    "report_card_score",
    "report_card_grade",
    "summary_bullets",
]

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
        missing = [field for field in TEAM_REPORT_CARD_REQUIRED_FIELDS if field not in row]
        require(not missing, f"team_report_card row for {row.get('team_name')} missing fields: {missing}")
        score = row.get("report_card_score")
        require(isinstance(score, (int, float)), f"report_card_score must be numeric for {row.get('team_name')}")
        require(0 <= score <= 100, f"report_card_score out of bounds for {row.get('team_name')}: {score}")
        require(row.get("report_card_grade") in {"A+", "A", "B", "C", "D", "E"}, f"Invalid grade for {row.get('team_name')}")
        require(isinstance(row.get("summary_bullets"), list), f"summary_bullets must be a list for {row.get('team_name')}")
        require("places_gained" in row and "places_gained_from_first_observed" in row, "Grid and first-observed movement must remain separate")


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
