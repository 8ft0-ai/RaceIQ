#!/usr/bin/env python3
"""Offline fail-closed quarantine of unsupported RaceIQ timing analytics.

Does not recalculate historical battle, pace or score formulas.
Run only on the pinned pre-remediation source; verify before publication.
"""
import argparse
import copy
import json
import re
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
BASELINE = "7addbd39774f2ab5a59be7bd42c9e6d9cdcf65ab"
ARCHIVE_SHA256 = "e1a0c0717b8df1548375f96afabc507040156a783005c944d73b2136dd3ac253"
SUSPECT_IDS = {152, 153, 155, 156, 157, 158, 159, 160, 161, 335, 336}
PAIR_FIELDS = {
    "observed_battle_display", "a_ahead_pct", "b_ahead_pct",
    "close_3_lap_seconds", "close_3_lap_pct", "lead_switches",
    "winner_trailed_pct", "max_lap_deficit_overcome_by_winner",
    "comeback_flag", "decisive_pass_race_clock", "decisive_pass_team_name",
    "battle_score", "battle_class", "battle_shape", "battle_summary",
}
CARD_FIELDS = {
    "battle_score", "battle_class", "battle_shape", "lead_switches",
    "close_3_lap_seconds", "close_3_lap_pct", "winner_trailed_pct",
    "max_lap_deficit_overcome_by_winner", "decisive_pass_race_clock",
    "why_it_matters", "battle_card_narrative",
}
PACE_FIELDS = {
    "median_clean_lph", "mean_clean_lph", "best_5min_clean_lph",
    "worst_5min_clean_lph", "pace_consistency_score", "race_reliability_score",
    "delay_adjusted_pace_index", "opening_median_lph", "middle_median_lph",
    "closing_median_lph", "final_hour_median_lph", "final_hour_vs_overall_lph",
    "clean_window_count", "delay_or_no_progress_window_count",
    "pace_profile_type", "rank_median_clean_pace", "rank_consistency",
    "rank_final_hour_pace", "rank_strongest_finish",
}
PHASE_FIELDS = {
    "window_count", "lap_gain_sum", "median_lap_rate_lph",
    "mean_lap_rate_lph", "p25_lap_rate_lph", "p75_lap_rate_lph",
    "best_lap_rate_lph", "worst_lap_rate_lph",
}
REPORT_FIELDS = {
    "report_card_score", "report_card_grade",
}
BLOCK = "blocked_timing_anomaly_lineage"
SHARED = "blocked_shared_scoring_denominator"
RANK = "blocked_global_battle_rank_denominator"

def must(condition, message):
    if not condition:
        raise ValueError(message)

def block(row, fields, status):
    for key in fields:
        if key in row:
            row[key] = None
    row["metric_status"] = status
    row["blocked_reason"] = "Car 73 timing corrections invalidate competitive analytics; original formula lineage is unavailable."

def collect():
    sources = {}
    for name in (
        "head_to_head_pass_events", "head_to_head_pairs",
        "head_to_head_battle_cards", "race_story_events", "team_profiles",
        "team_phase_summary", "team_report_cards",
        "team_report_cards_validation", "race_overview", "pit_delay_team_summary"
    ):
        sources[name] = json.loads((DATA / (name + ".json")).read_text(encoding="utf-8"))
    return sources

def generate(source):
    out = copy.deepcopy(source)
    passes = out["head_to_head_pass_events"]
    must(len(passes) == 363, "Unexpected pass population")
    suspect = [p for p in passes if p["pass_event_id"] in SUSPECT_IDS]
    must(len(suspect) == 11 and {p["pass_event_id"] for p in suspect} == SUSPECT_IDS, "Missing suspect pass ID")
    must({p["snapshot_id"] for p in suspect} == {112,893}, "Unexpected suspect snapshots")
    for p in passes:
        if p["pass_event_id"] in SUSPECT_IDS or (("73" in p["battle_pair_key"].split("_vs_")) and (83 <= p["snapshot_id"] <= 112 or p["snapshot_id"] in (893, 894))):
            p["competitive_status"] = BLOCK
            p["pass_context"] = "Timing-boundary observation; not a verified competitive pass"
    pairs = out["head_to_head_pairs"]
    affected = [p for p in pairs if 73 in (p["car_no_a"], p["car_no_b"])]
    must(len(pairs) == 300 and len(affected) == 24, "Incorrect 300-pair / 24 affected-pair universe")
    for p in pairs:
        p["battle_rank"] = None
        p["rank_status"] = RANK
        for field in ("battle_score", "battle_class", "battle_shape"):
            p[field] = None
        p["score_status"] = "blocked_shared_battle_score_denominator"
        if p in affected:
            block(p, PAIR_FIELDS, BLOCK)
            if p["car_no_a"] == 73:
                p["median_clean_lph_a"] = None
            if p["car_no_b"] == 73:
                p["median_clean_lph_b"] = None
    cards = out["head_to_head_battle_cards"]
    must(len(cards) == 25, "Unexpected battle card count")
    for c in cards:
        c["battle_rank"] = None
        c["rank_status"] = RANK
        for field in ("battle_score", "battle_class", "battle_shape"):
            c[field] = None
        c["score_status"] = "blocked_shared_battle_score_denominator"
        if 73 in (c["car_no_a"], c["car_no_b"]):
            block(c, CARD_FIELDS, BLOCK)
            c["battle_card_narrative"] = "Competitive battle interpretation blocked by car-73 timing corrections. Final result remains source-derived."
    stories = out["race_story_events"]
    events = [e for e in stories if e.get("snapshot_id") == 893 and e.get("car_no") == 73 and e["event_type"] in ("position_gained", "timing_correction_observed")]
    must(len(events) == 1, "Missing 893 position story")
    e = events[0]
    e.update(event_type="timing_correction_observed", severity="review",
             title="Car 73 position changed during timing correction",
             details="Observed P9 to P7 during +51-lap correction; not a verified competitive gain.",
             competitive_status=BLOCK)
    profiles = out["team_profiles"]
    must(len(profiles) == 25, "Incorrect team population")
    for profile in profiles:
        for field in ("rank_median_clean_pace", "rank_consistency", "rank_final_hour_pace", "rank_strongest_finish"):
            if field in profile:
                profile[field] = None
        profile["rank_status"] = "blocked_shared_pace_rank_denominator"
        profile["profile_narrative"] = re.sub(
            r"^Ranked [0-9]+ for sustained clean five-minute pace; ",
            "Global clean-pace rank withheld; ",
            profile.get("profile_narrative") or "",
        )
        if profile["car_no"] == 73:
            block(profile, PACE_FIELDS | {"delay_event_count", "total_delay_display",
                 "max_delay_display", "delay_minutes_per_capture_hour"}, BLOCK)
            profile["pace_confidence"] = "blocked"
            profile["pace_profile_interpretation_note"] = "Clean pace and phase rates not certified: timing anomaly"
            profile["position_changes_status"] = "raw_observed_only_not_verified_competitive"
            profile["position_extremes_status"] = "raw_observed_only_not_verified_competitive"
            profile["profile_headline"] = "P8; competitive pace and consistency not verified due to timing anomaly"
            profile["profile_narrative"] = "Original timing records remain visible; clean pace, phase statistics and competitive position movements are not certified."
    phases = out["team_phase_summary"]
    must(len([p for p in phases if p["car_no"] == 73]) == 4, "Missing 4 car-73 phases")
    for phase in phases:
        if phase["car_no"] == 73:
            block(phase, PHASE_FIELDS, BLOCK)
    reports = out["team_report_cards"]
    must(len(reports) == 25 and len([r for r in reports if r["car_no"] == 73]) == 1, "Invalid report card universe")
    for r in reports:
        block(r, REPORT_FIELDS, SHARED)
        if "Ostrov Team" in (r.get("key_battle") or ""):
            r["key_battle"] = None
            r.setdefault("interpretation_caveats", []).append(
                "Key battle not verified: car-73 timing correction affected this pairing.")
        reason = "RaceIQ score and grade blocked: shared scoring denominator depends on unverified car-73 pace."
        if reason not in r.setdefault("interpretation_caveats", []):
            r["interpretation_caveats"].append(reason)
        if r["car_no"] == 73:
            for f in ("median_clean_lph", "consistency_score", "pace_label", "best_phase", "key_battle"):
                if f in r: r[f] = None
            r["headline"] = "Finished P8; timing-affected competitive analytics not verified."
            reason = "Competitive pace and battle analytics blocked by timing correction."
            if reason not in r["confidence_reasons"]:
                r["confidence_reasons"].append(reason)
            for f in ("delay_profile", "estimated_laps_lost"):
                r[f] = None
    summary = out["team_report_cards_validation"]
    summary["score_bounds_ok"] = None
    summary["grade_distribution"] = {}
    summary["top_report_cards"] = []
    summary["validation_status"] = "pass_with_blocked_analytics"
    summary["blocked_score_count"] = 25
    summary["blocked_metric_reason"] = SHARED
    # Original array order was itself a historical score ranking.
    pairs.sort(key=lambda row: row["battle_pair_key"])
    cards.sort(key=lambda row: row["battle_pair_key"])
    overview = out["race_overview"]
    overview["top_battles"] = []
    overview["top_pace"] = []
    overview["top_battles_status"] = RANK
    overview["top_pace_status"] = "blocked_shared_pace_rank_denominator"
    delay_rows = out["pit_delay_team_summary"]
    delay = [d for d in delay_rows if d.get("car_no") == 73]
    must(len(delay) == 1, "Missing dedicated car-73 delay summary")
    delay = delay[0]
    must(delay["event_count_total"] == 13 and delay["delay_burden_event_count"] == 8
         and delay["estimated_laps_lost_total"] == 31.6
         and delay["total_excess_delay_display"] == "13:30",
         "Verified car-73 delay summary no longer matches source")
    delay["median_clean_lph"] = None
    delay["pace_profile_type"] = None
    delay["pace_status"] = BLOCK
    out["timing_anomaly_integrity"] = {
        "contract": "timing-anomaly-blocked-output/v2",
        "source_main": BASELINE,
        "collector_archive_sha256": ARCHIVE_SHA256,
        "canonical_snapshot_observations_sha256": "82e6afd8e7828f51bf7d637d30a132e0813921f249453e33cf00f5a1f094c02c",
        "canonical_observation_count": 27550,
        "source_digest_fields": ["fetched_at_utc", "car_no", "lap", "position"],
        "source_digest_normalisation": "UTC ISO seconds|car number|laps|position followed by newline; ordered by snapshot then car",
        "boundary_states": [
            {"snapshot":82,"lap":98,"position":16,"role":"last_pre_incident"},
            {"snapshot":83,"lap":0,"position":25,"role":"incident_start_ineligible"},
            {"snapshot":110,"lap":154,"position":5,"role":"incident_ineligible"},
            {"snapshot":111,"lap":141,"position":7,"role":"incident_ineligible"},
            {"snapshot":112,"lap":142,"position":7,"role":"fresh_baseline_no_pass"},
            {"snapshot":892,"lap":685,"position":9,"role":"last_pre_correction"},
            {"snapshot":893,"lap":736,"position":7,"role":"correction_ineligible"},
            {"snapshot":894,"lap":737,"position":7,"role":"fresh_baseline_no_pass"},
            {"snapshot":895,"lap":737,"position":7,"role":"candidate_subsequent_comparison"}
        ],
        "affected_pair_keys": sorted(p["battle_pair_key"] for p in affected),
        "suspect_pass_event_ids": sorted(SUSPECT_IDS),
        "pair_metric_disposition": BLOCK,
        "global_battle_rank_disposition": RANK,
        "shared_score_disposition": SHARED,
        "shared_battle_score_disposition": "blocked_shared_battle_score_denominator",
        "clean_pace_disposition": BLOCK,
        "verified_delay_summary": {"car_no":73,"events_total":13,"included_events":8,
            "estimated_laps_lost":31.6,"total_excess_delay_display":"13:30"},
        "scope": "Blocking-only; no reconstructed competitive metrics",
        "unmodified_source_families": ["standings.json", "grid_to_finish.json",
               "pit_delay_events.json",
               "known_incidents.json", "anomaly_review_board.json",
               "race_replay_snapshot_summary.json", "replay_traces_top12.json"]
    }
    return out

PROTECTED_SOURCES = (
    "standings", "grid_to_finish", "grid_to_finish_validation",
    "pit_delay_events", "known_incidents",
    "anomaly_review_board", "race_replay_snapshot_summary", "replay_traces_top12"
)
TRANSFORMED_SOURCES = (
    "head_to_head_pass_events", "head_to_head_pairs",
    "head_to_head_battle_cards", "race_story_events", "team_profiles",
    "team_phase_summary", "team_report_cards",
    "team_report_cards_validation", "race_overview", "pit_delay_team_summary"
)

def frozen_bytes(name):
    return subprocess.check_output(["git","show", BASELINE + ":data/" + name + ".json"], cwd=ROOT)

def verify_input_authority():
    for name in PROTECTED_SOURCES:
        must((DATA / (name + ".json")).read_bytes() == frozen_bytes(name),
             "Protected source diverges from frozen main: " + name)
    if (DATA / "timing_anomaly_integrity.json").exists():
        import validate_static_data
        validate_static_data.validate_timing_integrity()
    else:
        for name in TRANSFORMED_SOURCES:
            must((DATA / (name + ".json")).read_bytes() == frozen_bytes(name),
                 "Input is neither exact frozen data nor validated blocked output: " + name)

def checked_staging(outputs):
    # Validate a coherent publication candidate before changing any live data.
    with tempfile.TemporaryDirectory(prefix="raceiq-stage-", dir=ROOT) as directory:
        staged = Path(directory) / "data"
        shutil.copytree(DATA, staged)
        for name, obj in outputs.items():
            (staged / (name + ".json")).write_text(
                json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False),
                encoding="utf-8"
            )
        import validate_static_data
        old_data = validate_static_data.DATA
        try:
            validate_static_data.DATA = staged
            validate_static_data.validate_required_files()
            validate_static_data.validate_grid_to_finish()
            validate_static_data.validate_team_report_cards()
            validate_static_data.validate_timing_integrity()
        finally:
            validate_static_data.DATA = old_data
        # Publish the entire data directory as one renamed unit, not a
        # sequence of independently visible JSON replacements. On an ordinary
        # rename failure restore the previous directory before propagating.
        backup = Path(directory) / "data-before-publication"
        os.replace(DATA, backup)
        try:
            os.replace(staged, DATA)
        except BaseException:
            os.replace(backup, DATA)
            raise

def main():
    p = argparse.ArgumentParser()
    mode = p.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true",
                      help="Validate a full staged candidate before updating checked-out data")
    mode.add_argument("--check", action="store_true",
                      help="Assert that existing JSON equals a deterministic blocked-output generation")
    args = p.parse_args()
    verify_input_authority()
    source = collect()
    outputs = generate(source)
    for name, obj in outputs.items():
        json.dumps(obj, allow_nan=False)
    if args.check:
        for name, obj in outputs.items():
            path = DATA / (name + ".json")
            must(path.exists() and json.loads(path.read_text(encoding="utf-8")) == obj,
                 "Non-deterministic/stale blocked-output JSON: " + name)
    if args.apply:
        checked_staging(outputs)
    print("PASS: 300 pairs; 24 blocked; 11 suspect records; 25 shared scores blocked")
    print("MODE:", "APPLIED" if args.apply else "CHECK" if args.check else "DRY-RUN")
if __name__ == "__main__":
    main()
