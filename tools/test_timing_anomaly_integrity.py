#!/usr/bin/env python3
"""Hostile, offline Contract V2 acceptance proof V01–V16.

Requires the prepared local SQLite for source-boundary assertions.
No collector, network scraping, browser automation or external services.
"""
from __future__ import annotations

import contextlib
import datetime as dt
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
import threading
import unittest
from unittest import mock
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SHA = "7addbd39774f2ab5a59be7bd42c9e6d9cdcf65ab"
SOURCE_DIGEST = "82e6afd8e7828f51bf7d637d30a132e0813921f249453e33cf00f5a1f094c02c"
SUSPECT_EARLY = {152, 153, 155, 156, 157, 158, 159, 160, 161}
SUSPECT_LATE = {335, 336}
BLOCK = "blocked_timing_anomaly_lineage"
SOURCE_SQLITE = Path(os.environ.get(
    "RACEIQ_SOURCE_SQLITE", "~/Downloads/liverc_analytics_ready_pack/liverc_analytics_ready.sqlite"
)).expanduser()

def load(name):
    return json.loads((DATA / (name + ".json")).read_text(encoding="utf-8"))

def baseline(name):
    raw = subprocess.check_output(
        ["git", "show", SHA + ":data/" + name + ".json"], cwd=ROOT)
    return json.loads(raw)

def source_rows(snapshot_ids, car_no=73):
    with contextlib.closing(sqlite3.connect(str(SOURCE_SQLITE))) as conn:
        return conn.execute(
            "SELECT snapshot_id,car_no,lap,position FROM fact_live_snapshot "
            "WHERE car_no=? AND snapshot_id IN (" + ",".join("?" for _ in snapshot_ids) +
            ") ORDER BY snapshot_id", (car_no, *snapshot_ids)).fetchall()

class ContractV2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.meta = load("timing_anomaly_integrity")
        cls.pairs = load("head_to_head_pairs")
        cls.passes = load("head_to_head_pass_events")
        cls.cards = load("head_to_head_battle_cards")
        cls.profiles = load("team_profiles")
        cls.reports = load("team_report_cards")
        cls.phases = load("team_phase_summary")

    def test_v01_source_identity_and_provenance(self):
        self.assertTrue(SOURCE_SQLITE.is_file(), "Source SQLite required for V01 proof")
        self.assertEqual(self.meta["source_main"], SHA)
        self.assertEqual(self.meta["collector_archive_sha256"],
            "e1a0c0717b8df1548375f96afabc507040156a783005c944d73b2136dd3ac253")
        h = hashlib.sha256()
        with contextlib.closing(sqlite3.connect(str(SOURCE_SQLITE))) as conn:
            rows = conn.execute(
                "SELECT fetched_at_utc,car_no,lap,position "
                "FROM fact_live_snapshot ORDER BY snapshot_id,car_no")
            count = 0
            for timestamp, car, lap, position in rows:
                timestamp = dt.datetime.fromisoformat(timestamp).isoformat(timespec="seconds")
                h.update(f"{timestamp}|{car}|{lap}|{position}\n".encode("utf-8"))
                count += 1
        self.assertEqual(count, 27550)
        self.assertEqual(h.hexdigest(), SOURCE_DIGEST)
        self.assertEqual(self.meta["canonical_snapshot_observations_sha256"], SOURCE_DIGEST)

    def test_v02_75_82_valid_neighbours_preserved(self):
        rows = source_rows(list(range(75, 83)))
        self.assertEqual(len(rows), 8)
        self.assertTrue(all(rows[i][2] >= rows[i - 1][2] for i in range(1, 8)))
        originally = {p["pass_event_id"]:p for p in baseline("head_to_head_pass_events")}
        now = {p["pass_event_id"]:p for p in self.passes}
        for key, item in originally.items():
            if 75 <= item["snapshot_id"] <= 82:
                self.assertEqual(now[key]["pass_context"], item["pass_context"])

    def test_v03_incident_transitions_83_111_blocked(self):
        rows = source_rows([82, 83, 110, 111])
        self.assertEqual([(r[0], r[2]) for r in rows], [(82, 98), (83, 0), (110, 154), (111, 141)])
        for p in self.passes:
            if "73" in p["battle_pair_key"].split("_vs_") and 83 <= p["snapshot_id"] <= 111:
                self.assertEqual(p.get("competitive_status"), BLOCK)

    def test_v04_snapshot_112_rebaseline(self):
        rows = source_rows([111, 112])
        self.assertEqual([(r[2],r[3]) for r in rows], [(141,7),(142,7)])
        role = {r["snapshot"]:r["role"] for r in self.meta["boundary_states"]}
        self.assertEqual(role[112], "fresh_baseline_no_pass")

    def test_v05_all_nine_recovery_passes_adjudicated(self):
        matches = [p for p in self.passes if p["pass_event_id"] in SUSPECT_EARLY]
        self.assertEqual({p["pass_event_id"] for p in matches}, SUSPECT_EARLY)
        self.assertTrue(all(p["snapshot_id"] == 112 and p["competitive_status"] == BLOCK for p in matches))

    def test_v06_late_correction_and_two_events(self):
        rows = source_rows([892, 893])
        self.assertEqual([(r[2],r[3]) for r in rows], [(685,9),(736,7)])
        matches = [p for p in self.passes if p["pass_event_id"] in SUSPECT_LATE]
        self.assertEqual({p["pass_event_id"] for p in matches}, SUSPECT_LATE)
        self.assertTrue(all(p["snapshot_id"] == 893 and p["competitive_status"] == BLOCK for p in matches))

    def test_v07_894_895_no_unsupported_bridge(self):
        rows = source_rows([893, 894, 895])
        self.assertEqual([(r[2],r[3]) for r in rows], [(736,7),(737,7),(737,7)])
        roles = {r["snapshot"]:r["role"] for r in self.meta["boundary_states"]}
        self.assertEqual(roles[893], "correction_ineligible")
        self.assertEqual(roles[894], "fresh_baseline_no_pass")
        self.assertTrue(all(p.get("competitive_status") == BLOCK for p in self.passes
            if p["snapshot_id"] == 894 and "73" in p["battle_pair_key"].split("_vs_")))

    def test_v08_24_pair_exact_completeness(self):
        affected = [p for p in self.pairs if 73 in (p["car_no_a"],p["car_no_b"])]
        self.assertEqual(len(self.pairs), 300)
        self.assertEqual(len(affected), 24)
        self.assertEqual(sorted(p["battle_pair_key"] for p in affected), self.meta["affected_pair_keys"])
        self.assertTrue(all(p["metric_status"] == BLOCK for p in affected))

    def test_v09_unaffected_pair_fields_preserved(self):
        originals = {p["battle_pair_key"]:p for p in baseline("head_to_head_pairs")}
        for p in self.pairs:
            if 73 not in (p["car_no_a"],p["car_no_b"]):
                copy = dict(p)
                copy.pop("rank_status", None)
                copy.pop("score_status", None)
                original = originals[p["battle_pair_key"]]
                for field in ("battle_rank", "battle_score", "battle_class", "battle_shape"):
                    self.assertIsNone(copy[field], f"Blocked shared metric leaked: {field}")
                    copy[field] = original[field]
                self.assertEqual(copy, original)

    def test_v10_affected_battle_cards_blocked_but_results_preserved(self):
        originals = {c["battle_pair_key"]:c for c in baseline("head_to_head_battle_cards")}
        affected = [c for c in self.cards if 73 in (c["car_no_a"],c["car_no_b"])]
        self.assertEqual(len(affected), 2)
        for c in affected:
            for key in ("battle_score","lead_switches","decisive_pass_race_clock",
                        "close_3_lap_pct"):
                self.assertIsNone(c[key])
            self.assertEqual(c["final_pair_winner"], originals[c["battle_pair_key"]]["final_pair_winner"])
            self.assertIn("blocked", c["battle_card_narrative"])

    def test_v11_global_battle_denominator_blocked(self):
        self.assertTrue(all(p["battle_rank"] is None and p["battle_score"] is None
                            and p["battle_class"] is None for p in self.pairs))
        self.assertTrue(all(c["battle_rank"] is None and c["battle_score"] is None
                            and c["battle_class"] is None for c in self.cards))
        self.assertEqual([p["battle_pair_key"] for p in self.pairs],
                         sorted(p["battle_pair_key"] for p in self.pairs))
        overview = load("race_overview")
        self.assertEqual(overview["top_battles"], [])
        self.assertEqual(overview["top_battles_status"], "blocked_global_battle_rank_denominator")

    def test_v12_pace_phase_rank_blocked(self):
        p = next(x for x in self.profiles if x["car_no"] == 73)
        for key in ("median_clean_lph","pace_consistency_score","race_reliability_score",
                    "rank_median_clean_pace","total_delay_display"):
            self.assertIsNone(p[key])
        self.assertTrue(all(r["rank_median_clean_pace"] is None for r in self.profiles))
        phases = [x for x in self.phases if x["car_no"] == 73]
        self.assertEqual(len(phases),4)
        self.assertTrue(all(x["median_lap_rate_lph"] is None and x["window_count"] is None for x in phases))
        self.assertEqual(load("race_overview")["top_pace"], [])
        delay = next(d for d in load("pit_delay_team_summary") if d["car_no"]==73)
        self.assertIsNone(delay["median_clean_lph"])
        self.assertIsNone(delay["pace_profile_type"])
        self.assertEqual((delay["event_count_total"],delay["delay_burden_event_count"],
                          delay["estimated_laps_lost_total"],delay["total_excess_delay_display"]),
                         (13,8,31.6,"13:30"))

    def test_v13_shared_scoring_blocked_not_zero(self):
        self.assertEqual(len(self.reports),25)
        self.assertTrue(all(r["report_card_score"] is None and r["report_card_grade"] is None and
            r["metric_status"]=="blocked_shared_scoring_denominator" for r in self.reports))
        summary=load("team_report_cards_validation")
        self.assertEqual(summary["blocked_score_count"],25)
        self.assertEqual(summary["top_report_cards"],[])
        js=(ROOT/"report-cards.js").read_text()
        self.assertNotIn("Number(b.report_card_score || 0)",js)
        self.assertNotIn("(Number(t.report_card_score) || 0)",js)

    def test_v14_preservation_of_results_incidents_and_delays(self):
        for name in ("standings","grid_to_finish","grid_to_finish_validation",
                     "pit_delay_events",
                     "known_incidents","anomaly_review_board","race_replay_snapshot_summary",
                     "replay_traces_top12"):
            self.assertEqual(load(name),baseline(name), name)
        original_delays={r["car_no"]:r for r in baseline("pit_delay_team_summary")}
        for row in load("pit_delay_team_summary"):
            before=original_delays[row["car_no"]]
            if row["car_no"] == 73:
                copy=dict(row)
                self.assertIsNone(copy.pop("median_clean_lph"))
                self.assertIsNone(copy.pop("pace_profile_type"))
                self.assertEqual(copy.pop("pace_status"), BLOCK)
                copy["median_clean_lph"]=before["median_clean_lph"]
                copy["pace_profile_type"]=before["pace_profile_type"]
                self.assertEqual(copy,before)
            else:
                self.assertEqual(row,before)
        original_stories={e["event_id"]:e for e in baseline("race_story_events")}
        edited_stories={e["event_id"]:e for e in load("race_story_events")}
        self.assertEqual(original_stories.keys(),edited_stories.keys())
        for ident in original_stories:
            if ident != 237:
                self.assertEqual(original_stories[ident],edited_stories[ident])

    def test_v15_hostile_fail_closed_contract_and_generator(self):
        spec=importlib.util.spec_from_file_location("raceiq_validator",ROOT/"tools/validate_static_data.py")
        assert spec and spec.loader
        module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        names=("timing_anomaly_integrity","head_to_head_pairs","head_to_head_pass_events",
               "head_to_head_battle_cards","race_story_events","team_profiles",
               "team_phase_summary","team_report_cards","race_overview",
               "pit_delay_team_summary")
        with tempfile.TemporaryDirectory() as tmp:
            dst=Path(tmp)
            for name in names:shutil.copy2(DATA/(name+".json"),dst/(name+".json"))
            module.DATA=dst
            module.validate_timing_integrity()
            cases=[
                ("team_report_cards",lambda j:j[0].update(report_card_score=0)),
                ("head_to_head_pairs",lambda j:j[0].update(battle_rank=1)),
                ("head_to_head_pairs",lambda j:j[0].update(battle_score=54.42)),
                ("head_to_head_pairs",lambda j:next(x for x in j if 73 in (x["car_no_a"],x["car_no_b"])).update(lead_switches=12)),
                ("head_to_head_battle_cards",lambda j:next(x for x in j if 73 in (x["car_no_a"],x["car_no_b"])).update(close_3_lap_pct=5)),
                ("team_profiles",lambda j:next(x for x in j if x["car_no"]==73).update(best_5min_clean_lph=140)),
                ("team_phase_summary",lambda j:next(x for x in j if x["car_no"]==73).update(best_lap_rate_lph=142)),
                ("timing_anomaly_integrity",lambda j:j.update(affected_pair_keys=[])),
                ("timing_anomaly_integrity",lambda j:j.update(source_main="unrecognised")),
                ("pit_delay_team_summary",lambda j:next(x for x in j if x["car_no"]==73).update(
                    total_excess_delay_display="00:00")),
                ("head_to_head_pass_events",lambda j:next(x for x in j if x["pass_event_id"]==335).pop("competitive_status")),
                ("race_overview",lambda j:j.update(top_battles=[{"battle_score":1}]))
            ]
            for name,mutate in cases:
                path=dst/(name+".json")
                old=path.read_bytes()
                obj=json.loads(old)
                mutate(obj)
                path.write_text(json.dumps(obj),encoding="utf-8")
                try:
                    with self.assertRaises(AssertionError,msg="Hostile tampering passed: "+name):
                        module.validate_timing_integrity()
                finally:
                    path.write_bytes(old)
            # A corrupt JSON document is also fatal, never treated as an empty candidate.
            path=dst/"team_report_cards.json";old=path.read_bytes()
            path.write_text("{",encoding="utf-8")
            with self.assertRaises(AssertionError):module.validate_timing_integrity()
            path.write_bytes(old)
            missing=dst/"timing_anomaly_integrity.json"
            saved=missing.read_bytes()
            missing.unlink()
            try:
                with self.assertRaises(AssertionError):
                    module.validate_timing_integrity()
            finally:
                missing.write_bytes(saved)
        result=subprocess.run(["python3","tools/generate_team_report_cards.py","--dry-run"],
            cwd=ROOT,capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn("regeneration is prohibited",result.stderr+result.stdout)

    def test_publication_rename_failure_restores_exact_previous_data(self):
        spec = importlib.util.spec_from_file_location("blocking_preparer", ROOT / "tools/block_timing_anomaly.py")
        preparer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(preparer)
        with tempfile.TemporaryDirectory() as tmp:
            copied = Path(tmp) / "data"
            shutil.copytree(DATA, copied)
            before = {p.name: p.read_bytes() for p in copied.iterdir() if p.is_file()}
            preparer.DATA = copied
            outputs = preparer.generate(preparer.collect())
            genuine_replace = os.replace
            attempts = 0
            def fail_second_rename(src, dst):
                nonlocal attempts
                attempts += 1
                if attempts == 2:
                    raise OSError("injected publication rename failure")
                return genuine_replace(src, dst)
            with mock.patch.object(preparer.os, "replace", side_effect=fail_second_rename):
                with self.assertRaisesRegex(OSError, "injected publication"):
                    preparer.checked_staging(outputs)
            self.assertEqual(attempts, 3, "Expected backup, injected failure, rollback")
            self.assertEqual(before, {p.name: p.read_bytes() for p in copied.iterdir() if p.is_file()})

    def test_v16_static_wiring_paths_and_javascript_syntax(self):
        for script in (ROOT).glob("*.js"):
            subprocess.run(["node","--check",str(script)],check=True,capture_output=True)
        subprocess.run(["python3","tools/validate_static_data.py"],cwd=ROOT,check=True,capture_output=True)
        subprocess.run(["python3","tools/validate_static_app.py"],cwd=ROOT,check=True,capture_output=True)
        class QuietHandler(SimpleHTTPRequestHandler):
            def __init__(self,*args,**kwargs):
                super().__init__(*args,directory=str(ROOT),**kwargs)
            def log_message(self,*args):
                return
        server=ThreadingHTTPServer(("127.0.0.1",0),QuietHandler)
        thread=threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        try:
            urls=["/index.html","/app.js","/report-cards.js",
                  "/data/timing_anomaly_integrity.json"]
            urls.extend("/data/"+name for name in load("app_manifest")["data_files"])
            for url in urls:
                with urlopen(f"http://127.0.0.1:{server.server_port}{url}",timeout=4) as response:
                    self.assertEqual(response.status,200,url)
                    self.assertTrue(response.read(),url)
        finally:
            server.shutdown();server.server_close();thread.join(timeout=3)

if __name__ == "__main__":
    unittest.main(verbosity=2)
