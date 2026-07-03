#!/usr/bin/env python3
"""Generate RaceIQ Team Report Card static data.

This is an offline maintainer tool. It reads prepared JSON files from data/ and
writes the static report-card mart consumed by the GitHub Pages dashboard. It
does not collect live data and is not used by the deployed app at runtime.
"""
from __future__ import annotations

import argparse
import json
import math
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

SOURCE_FILES = {
    "standings": "standings.json",
    "grid_to_finish": "grid_to_finish.json",
    "grid_to_finish_validation": "grid_to_finish_validation.json",
    "team_profiles": "team_profiles.json",
    "team_phase_summary": "team_phase_summary.json",
    "pit_delay_team_summary": "pit_delay_team_summary.json",
    "head_to_head_battle_cards": "head_to_head_battle_cards.json",
    "anomaly_review_board": "anomaly_review_board.json",
    "known_incidents": "known_incidents.json",
}

REPORT_CARD_REQUIRED_FIELDS = [
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

ALLOWED_CONFIDENCE_VALUES = ("high", "medium", "usable_with_context", "low")
GRADE_THRESHOLDS = (
    (90, "A+"),
    (80, "A"),
    (70, "B"),
    (55, "C"),
    (40, "D"),
    (0, "E"),
)

SCORING_WEIGHTS = {
    "finish": 32,
    "grid_movement": 18,
    "observed_movement": 8,
    "pace": 14,
    "consistency": 10,
    "delay": 10,
    "battle": 4,
    "caveat": -8,
}

SOURCE_FILE_LIST = [
    "standings.json",
    "grid_to_finish.json",
    "team_profiles.json",
    "team_phase_summary.json",
    "pit_delay_team_summary.json",
    "head_to_head_battle_cards.json",
    "anomaly_review_board.json",
    "known_incidents.json",
]


def load_json(path: Path) -> Any:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        raise SystemExit(f"Missing required input: {path.relative_to(ROOT)}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc


def write_json(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def as_number(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if not math.isfinite(number):
        return default
    return number


def as_int(value: Any, default: int = 0) -> int:
    return int(round(as_number(value, float(default))))


def by_car(rows: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    result: dict[int, dict[str, Any]] = {}
    for row in rows:
        car_no = row.get("car_no")
        if car_no is not None:
            result[int(car_no)] = row
    return result


def rows_by_car(rows: list[dict[str, Any]]) -> dict[int, list[dict[str, Any]]]:
    result: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        car_no = row.get("car_no")
        if car_no is not None:
            result[int(car_no)].append(row)
    return dict(result)


def ordinal(position: Any) -> str:
    n = as_int(position)
    suffix = "th"
    if n % 100 not in {11, 12, 13}:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def signed(value: Any) -> str:
    n = as_int(value)
    return f"+{n}" if n > 0 else str(n)


def normalise_label(value: Any, fallback: str = "not classified") -> str:
    if value is None:
        return fallback
    label = str(value).strip()
    if not label:
        return fallback
    return label.replace("_", " ")


def phase_label(value: Any) -> str:
    return normalise_label(value, "not available")


def grade_for_score(score: float) -> str:
    for threshold, grade in GRADE_THRESHOLDS:
        if score >= threshold:
            return grade
    return "E"


def scale(value: float, low: float, high: float) -> float:
    if high <= low:
        return 0.0
    return max(0.0, min(1.0, (value - low) / (high - low)))


def score_report_card(
    *,
    final_position: int,
    team_count: int,
    places_gained: int,
    observed_places_gained: int,
    median_clean_lph: float,
    min_pace: float,
    max_pace: float,
    consistency_score: float,
    estimated_laps_lost: float,
    max_laps_lost: float,
    key_battle: str | None,
    anomaly_count: int,
    has_known_incident: bool,
) -> float:
    finish_component = (team_count - final_position + 1) / max(team_count, 1)
    movement_component = max(-1.0, min(1.0, places_gained / 20.0))
    observed_component = max(-1.0, min(1.0, observed_places_gained / 20.0))
    pace_component = scale(median_clean_lph, min_pace, max_pace)
    consistency_component = max(0.0, min(1.0, consistency_score / 100.0))
    delay_component = 1.0 - scale(estimated_laps_lost, 0.0, max_laps_lost)
    battle_component = 1.0 if key_battle else 0.0
    caveat_component = min(1.0, (anomaly_count / 25.0) + (0.35 if has_known_incident else 0.0))

    raw_score = (
        SCORING_WEIGHTS["finish"] * finish_component
        + SCORING_WEIGHTS["grid_movement"] * ((movement_component + 1) / 2)
        + SCORING_WEIGHTS["observed_movement"] * ((observed_component + 1) / 2)
        + SCORING_WEIGHTS["pace"] * pace_component
        + SCORING_WEIGHTS["consistency"] * consistency_component
        + SCORING_WEIGHTS["delay"] * delay_component
        + SCORING_WEIGHTS["battle"] * battle_component
        + SCORING_WEIGHTS["caveat"] * caveat_component
    )
    return round(max(0.0, min(100.0, raw_score)), 1)


def choose_best_phase(phase_rows: list[dict[str, Any]]) -> str:
    valid_rows = [
        row for row in phase_rows
        if row.get("median_lap_rate_lph") is not None or row.get("mean_lap_rate_lph") is not None
    ]
    if not valid_rows:
        return "not available"
    best = max(
        valid_rows,
        key=lambda row: as_number(row.get("median_lap_rate_lph"), as_number(row.get("mean_lap_rate_lph"))),
    )
    return phase_label(best.get("phase"))


def choose_key_battle(team_name: str, battle_cards: list[dict[str, Any]]) -> str | None:
    candidates: list[tuple[float, str]] = []
    for row in battle_cards:
        left = row.get("team_name_a") or row.get("team_a") or row.get("team_name")
        right = row.get("team_name_b") or row.get("team_b") or row.get("opponent_team_name")
        if not left or not right:
            continue
        if team_name not in {str(left), str(right)}:
            continue
        label = f"{left} v {right}"
        candidates.append((as_number(row.get("battle_score")), label))
    if not candidates:
        return None
    return max(candidates, key=lambda item: item[0])[1]


def anomaly_summary(anomaly_rows: list[dict[str, Any]]) -> tuple[str, int]:
    open_rows = [
        row for row in anomaly_rows
        if str(row.get("effective_review_status", "open")).lower() == "open"
    ]
    count = len(open_rows)
    if count == 0:
        return "none", 0
    suffix = "item" if count == 1 else "items"
    return f"{count} open review {suffix}", count


def known_incident_status(incident_rows: list[dict[str, Any]]) -> str:
    if not incident_rows:
        return "none"
    incident = incident_rows[0]
    incident_type = incident.get("incident_type") or "known_incident"
    incident_status = incident.get("incident_status") or "status_unknown"
    return f"{incident_type} ({incident_status})"


def headline_for(
    *,
    final_position: int,
    start_position: int,
    pace_label_value: str,
    places_gained: int,
    delay_profile: str,
) -> str:
    if final_position == 1:
        return f"Race winner from P{start_position}, with {pace_label_value} and gained {places_gained} places from grid."
    if final_position <= 3:
        return f"Podium finisher with {pace_label_value} and gained {places_gained} places from grid."
    if places_gained >= 10:
        return f"Major mover: gained {places_gained} places from grid to finish {ordinal(final_position)}."
    if "critical" in delay_profile or "high" in delay_profile:
        if final_position >= 21:
            return f"High delay-burden race despite finishing {ordinal(final_position)}."
    return f"Finished {ordinal(final_position)} with {pace_label_value}."


def confidence_for(
    *,
    grid_confidence: str,
    anomaly_count: int,
    known_incident: str,
    delay_profile: str,
    pace_label_value: str,
) -> tuple[str, list[str], list[str]]:
    reasons = [f"Grid-to-Finish source match confidence is {grid_confidence}."]
    caveats = [
        "RaceIQ scores and grades are explanatory story signals, not official race results.",
        "First Observed movement is a captured baseline and is not true grid position.",
        "Confidence describes data interpretation quality, not team performance quality.",
    ]

    has_known_incident = known_incident != "none"
    has_anomalies = anomaly_count > 0

    if has_anomalies:
        reasons.append(f"{anomaly_count} open anomaly review item(s) are linked to this team.")
        caveats.append("Open anomaly status should be reviewed before making strong pace or reliability claims.")
    if has_known_incident:
        reasons.append(f"Known incident preserved: {known_incident}.")
        caveats.append(f"Known incident caveat applies: {known_incident}.")
    if "candidate" in pace_label_value or "candidate" in delay_profile:
        reasons.append("Pace or delay classification is candidate-level and should be interpreted with context.")
    if "critical" in delay_profile:
        reasons.append("Critical delay burden affects interpretation of pace and race story.")

    if grid_confidence == "low":
        confidence = "low"
    elif has_known_incident or anomaly_count >= 10 or "candidate" in pace_label_value or "candidate" in delay_profile:
        confidence = "usable_with_context"
    elif anomaly_count > 2 or "critical" in delay_profile:
        confidence = "medium"
    else:
        confidence = "high"

    return confidence, reasons, caveats


def validate_output_shape(rows: list[dict[str, Any]]) -> dict[str, list[str]]:
    missing_by_team: dict[str, list[str]] = {}
    for row in rows:
        missing = [field for field in REPORT_CARD_REQUIRED_FIELDS if field not in row]
        if missing:
            missing_by_team[str(row.get("team_name", row.get("car_no", "unknown")))] = missing
    return missing_by_team


def build_validation(rows: list[dict[str, Any]], standings: list[dict[str, Any]], generated_at: str) -> dict[str, Any]:
    missing_required = validate_output_shape(rows)
    confidence_distribution = Counter(row.get("data_confidence") for row in rows)
    grade_distribution = Counter(row.get("report_card_grade") for row in rows)

    teams_by_confidence = {
        value: [
            row["team_name"]
            for row in rows
            if row.get("data_confidence") == value
        ]
        for value in ALLOWED_CONFIDENCE_VALUES
    }
    missing_confidence: dict[str, list[str]] = {}
    for row in rows:
        missing = [
            field for field in ("data_confidence", "confidence_reasons", "interpretation_caveats")
            if field not in row
        ]
        if missing:
            missing_confidence[row["team_name"]] = missing

    known_incident_rows = [row for row in rows if row.get("known_incident_status") != "none"]
    anomaly_rows = [row for row in rows if row.get("anomaly_status") != "none"]

    return {
        "generated_at_utc": generated_at,
        "row_count": len(rows),
        "final_standing_team_count": len(standings),
        "one_card_per_final_team": len(rows) == len(standings),
        "required_fields": REPORT_CARD_REQUIRED_FIELDS,
        "missing_required_fields_by_team": missing_required,
        "missing_confidence_fields_by_team": missing_confidence,
        "score_bounds_ok": all(
            isinstance(row.get("report_card_score"), (int, float))
            and 0 <= row["report_card_score"] <= 100
            for row in rows
        ),
        "grade_distribution": {grade: grade_distribution.get(grade, 0) for _, grade in GRADE_THRESHOLDS},
        "confidence_distribution": {value: confidence_distribution.get(value, 0) for value in ALLOWED_CONFIDENCE_VALUES},
        "teams_by_confidence": teams_by_confidence,
        "confidence_field_coverage": {
            "teams_with_data_confidence": sum("data_confidence" in row for row in rows),
            "teams_with_confidence_reasons": sum("confidence_reasons" in row for row in rows),
            "teams_with_interpretation_caveats": sum("interpretation_caveats" in row for row in rows),
        },
        "teams_with_caveats": sum(
            bool(row.get("interpretation_caveats"))
            or row.get("anomaly_status") != "none"
            or row.get("known_incident_status") != "none"
            for row in rows
        ),
        "teams_with_known_incidents": len(known_incident_rows),
        "teams_with_open_anomalies": len(anomaly_rows),
        "known_incident_confidence_caveat_coverage": {
            "teams_with_known_incidents": len(known_incident_rows),
            "known_incident_teams_with_interpretation_caveats": sum(
                "known incident" in " ".join(row.get("interpretation_caveats", [])).lower()
                for row in known_incident_rows
            ),
        },
        "anomaly_confidence_caveat_coverage": {
            "teams_with_open_anomalies": len(anomaly_rows),
            "anomaly_teams_with_interpretation_caveats": sum(
                "anomaly" in " ".join(row.get("interpretation_caveats", [])).lower()
                for row in anomaly_rows
            ),
        },
        "top_report_cards": [
            {
                "team_name": row["team_name"],
                "score": row["report_card_score"],
                "grade": row["report_card_grade"],
                "final_position": row["final_position"],
            }
            for row in sorted(rows, key=lambda row: row["report_card_score"], reverse=True)[:5]
        ],
        "data_sources": SOURCE_FILE_LIST,
        "validation_status": "pass" if not missing_required and not missing_confidence else "fail",
    }


def source_timestamp(sources: dict[str, Any]) -> str:
    grid_validation = sources.get("grid_to_finish_validation")
    if isinstance(grid_validation, dict) and grid_validation.get("generated_at_utc"):
        return str(grid_validation["generated_at_utc"])
    return "unknown"


def generate(data_dir: Path, generated_at: str | None = None) -> tuple[list[dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    sources = {name: load_json(data_dir / filename) for name, filename in SOURCE_FILES.items()}

    standings = sorted(sources["standings"], key=lambda row: as_number(row.get("final_position")))
    grid_by_car = by_car(sources["grid_to_finish"])
    profile_by_car = by_car(sources["team_profiles"])
    delay_by_car = by_car(sources["pit_delay_team_summary"])
    phases_by_car = rows_by_car(sources["team_phase_summary"])
    anomalies_by_car = rows_by_car(sources["anomaly_review_board"])
    incidents_by_car = rows_by_car(sources["known_incidents"])

    paces = [
        as_number((profile_by_car.get(int(row["car_no"]), {}) or {}).get("median_clean_lph"))
        for row in standings
    ]
    paces = [pace for pace in paces if pace > 0]
    min_pace = min(paces) if paces else 0
    max_pace = max(paces) if paces else 1

    delay_values = [
        as_number((delay_by_car.get(int(row["car_no"]), {}) or {}).get("estimated_laps_lost"))
        for row in standings
    ]
    max_laps_lost = max(delay_values) if delay_values else 1

    rows: list[dict[str, Any]] = []
    debug_rows: list[dict[str, Any]] = []
    team_count = len(standings)

    for standing in standings:
        car_no = int(standing["car_no"])
        grid = grid_by_car.get(car_no, {})
        profile = profile_by_car.get(car_no, {})
        delay = delay_by_car.get(car_no, {})

        final_position = as_int(standing.get("final_position"))
        final_laps = as_int(standing.get("final_laps"))
        team_name = str(standing.get("team_name") or grid.get("team_name") or profile.get("team_name"))
        start_position = as_int(grid.get("start_position"))
        first_observed_position = as_int(grid.get("first_observed_position") or profile.get("first_observed_position"))

        places_gained = as_int(grid.get("places_gained_from_grid"), start_position - final_position)
        observed_places_gained = as_int(
            grid.get("places_gained_from_first_observed"),
            first_observed_position - final_position,
        )
        pace_label_value = normalise_label(
            profile.get("pace_profile_type") or profile.get("pace_label"),
            "not classified",
        )
        median_clean_lph = round(
            as_number(profile.get("median_clean_lph") or profile.get("median_lap_rate_lph")),
            1,
        )
        consistency_score = round(
            as_number(profile.get("pace_consistency_score") or profile.get("consistency_score")),
            1,
        )
        delay_profile = normalise_label(
            delay.get("delay_profile_label")
            or delay.get("delay_profile")
            or profile.get("delay_profile")
            or profile.get("delay_profile_label"),
            "not classified",
        )
        estimated_laps_lost = round(
            as_number(delay.get("estimated_laps_lost") or delay.get("total_estimated_laps_lost")),
            1,
        )
        best_phase = choose_best_phase(phases_by_car.get(car_no, []))
        key_battle = choose_key_battle(team_name, sources["head_to_head_battle_cards"])
        anomaly_status, anomaly_count = anomaly_summary(anomalies_by_car.get(car_no, []))
        incident_status = known_incident_status(incidents_by_car.get(car_no, []))
        data_confidence, confidence_reasons, interpretation_caveats = confidence_for(
            grid_confidence=str(grid.get("data_confidence") or "medium"),
            anomaly_count=anomaly_count,
            known_incident=incident_status,
            delay_profile=delay_profile.lower(),
            pace_label_value=pace_label_value.lower(),
        )

        report_card_score = score_report_card(
            final_position=final_position,
            team_count=team_count,
            places_gained=places_gained,
            observed_places_gained=observed_places_gained,
            median_clean_lph=median_clean_lph,
            min_pace=min_pace,
            max_pace=max_pace,
            consistency_score=consistency_score,
            estimated_laps_lost=estimated_laps_lost,
            max_laps_lost=max_laps_lost,
            key_battle=key_battle,
            anomaly_count=anomaly_count,
            has_known_incident=incident_status != "none",
        )
        report_card_grade = grade_for_score(report_card_score)

        row = {
            "team_name": team_name,
            "car_no": car_no,
            "headline": headline_for(
                final_position=final_position,
                start_position=start_position,
                pace_label_value=pace_label_value,
                places_gained=places_gained,
                delay_profile=delay_profile.lower(),
            ),
            "final_position": final_position,
            "start_position": start_position,
            "first_observed_position": first_observed_position,
            "places_gained": places_gained,
            "places_gained_from_first_observed": observed_places_gained,
            "final_laps": final_laps,
            "pace_label": pace_label_value,
            "median_clean_lph": median_clean_lph,
            "consistency_score": consistency_score,
            "delay_profile": delay_profile,
            "estimated_laps_lost": estimated_laps_lost,
            "best_phase": best_phase,
            "key_battle": key_battle,
            "anomaly_status": anomaly_status,
            "known_incident_status": incident_status,
            "data_confidence": data_confidence,
            "confidence_reasons": confidence_reasons,
            "interpretation_caveats": interpretation_caveats,
            "report_card_score": report_card_score,
            "report_card_grade": report_card_grade,
            "summary_bullets": [
                f"P{final_position} / {final_laps} laps",
                f"Grid {start_position}→{final_position} ({signed(places_gained)})",
                f"Observed {first_observed_position}→{final_position} ({signed(observed_places_gained)})",
            ],
        }
        rows.append(row)
        debug_rows.append({
            "team_name": team_name,
            "car_no": car_no,
            "score": report_card_score,
            "grade": report_card_grade,
            "components": {
                "final_position": final_position,
                "places_gained": places_gained,
                "places_gained_from_first_observed": observed_places_gained,
                "median_clean_lph": median_clean_lph,
                "consistency_score": consistency_score,
                "estimated_laps_lost": estimated_laps_lost,
                "anomaly_count": anomaly_count,
                "known_incident_status": incident_status,
                "key_battle_present": key_battle is not None,
            },
            "weights": SCORING_WEIGHTS,
        })

    effective_generated_at = generated_at or source_timestamp(sources)
    validation = build_validation(rows, standings, effective_generated_at)
    return rows, validation, debug_rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate RaceIQ Team Report Card JSON files.")
    parser.add_argument("--data-dir", type=Path, default=DATA, help="Directory containing prepared RaceIQ JSON source files.")
    parser.add_argument("--generated-at", help="Optional deterministic generated_at_utc value for validation output.")
    parser.add_argument("--write-debug", action="store_true", help="Also write data/team_report_card_scoring_debug.json.")
    parser.add_argument("--dry-run", action="store_true", help="Generate and print a summary without writing files.")
    args = parser.parse_args()

    rows, validation, debug_rows = generate(args.data_dir, args.generated_at)

    if args.dry_run:
        print(f"Generated {len(rows)} team report cards")
        print(f"Confidence distribution: {validation['confidence_distribution']}")
        print(f"Grade distribution: {validation['grade_distribution']}")
        return 0

    write_json(args.data_dir / "team_report_cards.json", rows)
    write_json(args.data_dir / "team_report_cards_validation.json", validation)
    if args.write_debug:
        write_json(args.data_dir / "team_report_card_scoring_debug.json", debug_rows)

    print(f"Wrote {args.data_dir / 'team_report_cards.json'}")
    print(f"Wrote {args.data_dir / 'team_report_cards_validation.json'}")
    if args.write_debug:
        print(f"Wrote {args.data_dir / 'team_report_card_scoring_debug.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
