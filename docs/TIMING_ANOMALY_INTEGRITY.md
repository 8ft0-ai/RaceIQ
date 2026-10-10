# Timing-Anomaly Analytics Integrity V2

Issue: https://github.com/8ft0-ai/RaceIQ/issues/89
Parent evidence issue: https://github.com/8ft0-ai/RaceIQ/issues/88

## Authority and source identity

This is a conservative blocking-only contract, not a recalculation of race analytics.

- Frozen source main: 7addbd39774f2ab5a59be7bd42c9e6d9cdcf65ab.
- Historical archive: liverc_collector.tgz SHA-256 e1a0c0717b8df1548375f96afabc507040156a783005c944d73b2136dd3ac253.
- Source observation digest: SHA-256 82e6afd8e7828f51bf7d637d30a132e0813921f249453e33cf00f5a1f094c02c.
- The digest covers 27,550 observations from 1,102 snapshots and 25 cars. It normalises the timestamp to UTC ISO seconds, then car number, lap count and position, delimited by vertical bars with a newline, ordered by snapshot and car.
- The digest was independently matched between the original archive's live_snapshot rows and the local analytics SQLite fact_live_snapshot rows. Local SQLite is a validation input, not a deployed application dependency.
- The canonical disposition file is data/timing_anomaly_integrity.json.

## Source-state and re-baselining

Snapshot 75–82 evidence remains eligible; do not blanket-exclude early observations.

Car 73:
- 82: 98 laps, P16, last pre-incident observation.
- 83: 0 laps, P25, transponder-incident entry.
- 110: 154 laps, P5, incident and implausible recovery.
- 111: 141 laps, P7, still invalid predecessor.
- 112: 142 laps, P7, first candidate re-baseline; no verified pass at this boundary.
- 892: 685 laps, P9, last state before late correction.
- 893: 736 laps, P7, +51-lap timing correction, not competitive progress.
- 894: 737 laps, P7, fresh candidate re-baseline, not an incoming pass.
- 895: 737 laps, P7, subsequent candidate comparison.

The 24 pairs involving car 73 are blocked for competitive aggregations rather than guessed from an incomplete generator. The nine suspect passes at snapshot 112 (IDs 152, 153, 155–161) and two at 893 (335–336) remain present as timing-boundary observations, not verified lead switches. Legitimate unrelated pair-specific observed comparisons remain, but cannot be ranked against affected pairs without reproducing unavailable shared scoring authority.

## Metric truth and consumer boundary

- Globally blocked: all 300 pair battle ranks, battle scores/classes/shapes and ranked top-battle selections. Historical array ordering is replaced by alphabetical pair-key order.
- Car-73 pairs: additionally block lead switches, closeness and ahead-time shares, comeback and decisive-pass claims, and competitive narratives. Preserve pair identities, final order and final-result lap gaps.
- Car-73 clean pace/phase and inferred consistency/reliability are blocked, including the clean-pace field inside the dedicated pit-delay summary. Other team clean-pace observations remain, but global pace ranks, ranked top-pace selection and textual rank claims are blocked.
- All 25 RaceIQ report-card scores and grades are blocked because their shared scoring denominator includes affected pace. This is deliberately conservative and does not generate replacement scores. The two reciprocal key-battle references involving car 73 are blocked.
- Snapshot-893 P9-to-P7 position change remains visible as a timing-correction observation, not a competitive gain.
- Car-73 40 raw observed position changes, best P5 and worst P25 are retained as raw observations, not certified competitive movement.
- Standings, final lap totals, raw replay summaries, known incidents, anomaly board, grid/First Observed distinctions and the 13-event dedicated delay inventory remain as they were.
- Car-73 verified dedicated delay summary retains 8 of 13 burden events, 31.6 estimated laps lost and 13:30 excess delay. The incompatible profile candidate totals are blocked, not silently reconciled.

## Offline execution and fail-closed publication

The deployed GitHub Pages application remains static HTML, CSS and JavaScript; no live collection, backend, Python runtime or network polling has been added.

To regenerate an already verified candidate:
1. On the existing feature branch, run python3 tools/block_timing_anomaly.py --check to verify deterministic current output.
2. For exact frozen inputs or a fully validated blocked-state candidate, run python3 tools/block_timing_anomaly.py --apply. Input authority is checked before transformation, and all outputs are staged and validated before an all-files directory rename. An ordinary rename failure restores the prior data directory; abrupt machine loss between directory renames requires recovery from the preserved backup. Git commit remains the deployment transaction.
3. Run python3 tools/validate_static_data.py and python3 tools/validate_static_app.py.
4. Run python3 tools/test_timing_anomaly_integrity.py, supplying RACEIQ_SOURCE_SQLITE as the path to the local prepared analytics SQLite. This source must represent the pinned 27,550 original observations; the digest check is mandatory.
5. Serve locally with python3 -m http.server 8000 and perform genuine manual browser/tab/console/missing-value validation. Static HTTP retrieval tests do not close this browser gate.

The old report-card score generator intentionally refuses to regenerate a blocked candidate. Failure of any source authority, consumer, schema or quantitative gate is a STOP, not permission to supply replacement numbers. Git commit is the publication transaction; never commit partially generated JSON.

## Explicit non-goals and approval status

No original battle, clean-pace or scoring generator has been recovered or reconstructed. No corrected performance metrics are asserted. No original collector or official final-result data has been edited. No workflows, merge or deployment are permitted by this candidate.

The V01 source SQLite SHA-256 proof runs only when the local prepared SQLite is supplied; the PR workflow performs committed-JSON contract checks but does not independently inspect that SQLite or its archive. Do not report PR CI as independent source-digest certification.

V01–V16 scripted tests demonstrate the bounded source and static integrity assumptions. They do not constitute browser inspection or independent groundedness approval. This candidate remains in review until the UI/browser gate and genuinely fresh review are completed.
