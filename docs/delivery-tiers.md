# RaceIQ delivery tiers

RaceIQ uses a gated delivery workflow to protect the static GitHub Pages app, the separation between official race results and inferred analytics, and the visibility of caveats. Not every issue carries the same risk, so classify each issue before implementation and apply the right level of process.

This is a routing layer on top of the existing workflow. It does not replace the core rules: one feature branch per issue, small reviewable changes, no direct commits to `main` unless explicitly approved as a hotfix, and visible validation evidence before merge.

## Tier summary

| Tier | Use for | Process weight |
| --- | --- | --- |
| Fast track | Trivial, isolated, low-risk changes | Lightweight |
| Standard | Normal dashboard, UI, documentation or process changes | Existing gated flow |
| Strict | Analytics, data, scoring or truth-sensitive changes | Full gated flow |

## Fast track

Use Fast track for very small, low-risk changes where the impact is obvious and isolated.

Examples:

- typo fixes
- small documentation wording corrections
- comment-only changes
- metadata-only updates
- minor CSS polish with no layout or rendering risk
- release-note wording that does not affect product behaviour

Fast track process:

1. Read the issue and classify it as Fast track.
2. State briefly why Fast track is safe.
3. Create a feature branch.
4. Make the smallest possible change.
5. Run validation appropriate to the change.
6. Check the final changed files before opening or marking the PR ready.
7. Open a PR with the tier, reason and validation evidence.
8. Merge after lightweight approval.

Fast track evidence should show:

- scope is trivial and isolated
- no analytics, data, scoring or official-result handling changed
- no runtime behaviour changed
- validation appropriate to the change was run or explicitly marked not required with a reason
- the final changed files still support the Fast track classification

### Fast track exclusions

Do not use Fast track if the issue touches any of the following:

- `data/` files
- scoring logic or RaceIQ grades
- Grid-to-Finish movement calculations
- First Observed logic or wording that could imply true grid position
- delay burden inference
- anomaly or known-incident handling
- official result presentation
- app lifecycle or tab rendering behaviour
- new, removed or reordered script files
- JSON loading paths
- GitHub Pages, CI or deployment configuration

Route those issues to Standard or Strict.

## Standard

Use Standard for normal RaceIQ dashboard, UI, documentation and process changes that require the existing gated workflow but do not change analytics logic or prepared data.

Examples:

- Method tab updates
- Report Card presentation copy
- small UI layout changes
- tab content changes
- non-analytics JavaScript rendering changes
- release notes
- data dictionary wording
- process documentation such as this document
- PR template updates

Standard process:

1. Read the issue and confirm it is ready.
2. Post a readiness comment including the delivery tier and validation required.
3. Post an implementation plan comment.
4. Create `feature/<issue-number>-short-description` from `main`.
5. Open a draft PR while work or validation is incomplete.
6. Implement the smallest scoped change.
7. Run validation appropriate to the affected files.
8. Complete the changed-files risk check against the final diff.
9. Post a pre-approval groundedness review.
10. Mark ready for review after validation is complete.
11. Merge after approval and merge-gate checks.

Standard validation should include:

- final diff matches issue scope
- Markdown review for documentation-only changes
- `node --check` for changed JavaScript where applicable
- `python tools/validate_static_data.py` when data compatibility is relevant
- browser smoke for UI changes
- cache-busted local URL when changed static JavaScript may be cached
- a clear reason for any validation step that is not run

For UI or JavaScript changes, use a fresh URL such as:

```text
http://localhost:8000/?verify=issue-[number]-[timestamp]
```

Confirm the changed screen renders expected content, the browser console is clean, and nearby tabs still switch and render.

## Strict

Use Strict for any change that could affect analytics truth, prepared data, official/inferred separation, or user interpretation of race results.

Examples:

- scoring logic or RaceIQ grades
- Grid-to-Finish calculations
- First Observed logic
- delay burden inference
- anomaly detection or anomaly review output
- known incident treatment
- prepared JSON data
- validation artefacts
- official result display
- any wording change that could blur official results and inferred analytics

Strict process:

1. Read the issue and confirm it is ready.
2. Post a detailed readiness comment including the Strict classification.
3. Post a detailed implementation plan before branching.
4. Create `feature/<issue-number>-short-description` from `main`.
5. Open a draft PR and keep it draft until all validation is complete.
6. Implement with narrow scope and traceability to the issue.
7. Run data and UI validation.
8. Complete the changed-files risk check against the final diff.
9. Complete an analytics truth review.
10. Confirm risks and caveats remain visible.
11. Post a pre-approval groundedness review.
12. Merge only after approval and merge-gate checks.
13. Perform a post-merge live dashboard spot-check.

Strict validation should include:

- `python tools/validate_static_data.py` for data changes or compatibility-sensitive changes
- local static server with `python -m http.server 8000`
- JSON paths resolve
- existing tabs still work
- browser console is clean
- missing values render gracefully
- official results remain separate from inferred analytics
- First Observed is not presented as true grid
- known incidents, timing issues, anomalies and confidence caveats remain visible
- RaceIQ scores and grades remain explanatory aids, not official rankings
- a clear reason for any validation step that is not run

## Choosing a tier

Use this decision table before implementation:

| Question | Route |
| --- | --- |
| Does it change analytics, data, scoring or inference? | Strict |
| Does it affect official vs inferred interpretation? | Strict |
| Does it change dashboard JavaScript, layout or tab rendering? | Standard |
| Does it add, remove or reorder scripts or data paths? | Standard or Strict |
| Is it documentation or copy only with no runtime impact? | Fast track or Standard |
| Is it a typo or formatting-only change? | Fast track |

When in doubt, choose the higher tier. The tier can be adjusted during implementation if the risk changes.

## Changed-files risk check

Before a PR is marked ready for review, review the final diff against `main`. Ground the readiness decision in the files that actually changed, not the implementation path, branch history or earlier assumptions.

Record the changed-files risk check in the PR:

```text
Changed-files risk check:
- App/runtime files changed: yes/no
- Data files changed: yes/no
- Analytics/scoring/inference logic changed: yes/no
- CI/deployment/config changed: yes/no
- Documentation/template only: yes/no
- Delivery tier still correct: yes/no
```

Use the check to confirm that:

- the final changed files match the linked issue scope
- the final diff does not contain unrelated files, broad rewrites or connector churn
- the selected delivery tier still fits the actual risk of the final diff
- validation evidence covers every higher-risk file category that changed

If the final changed files are riskier than expected, reclassify the delivery tier before asking for review and add the validation required by the higher tier. For example, a documentation issue that changes dashboard JavaScript should move out of documentation-only handling, and a UI issue that changes prepared data or scoring should be treated as Strict.

If the final diff no longer matches the linked issue scope, pause the PR and re-plan. Remove or revert unrelated changes before review, or split them into a separate issue and branch. Do not mark the PR ready until the final diff is once again traceable to the issue.

Fast track PRs can use a short changed-files note when the diff is trivial. Standard and Strict PRs should complete the full changed-files risk check before the pre-approval groundedness review.

## Skipped validation reasons

Validation should be proportional to the delivery tier and the final changed files. A PR does not need to run every possible validation step, but every validation step that is not run must include a clear reason explaining why it is safe to omit for that diff.

A good validation note is specific to the changed files:

```text
Browser smoke: Not required because no app runtime, UI, JavaScript, CSS or data files changed.
```

An incomplete validation note is not enough:

```text
Browser smoke: Not required.
```

Apply this rule to validation decisions such as:

- static data validation
- local static server smoke
- browser smoke
- browser console checks
- existing tab checks
- JSON path checks
- missing-value rendering checks
- deployed-page checks

Examples:

- Documentation/template-only change: browser smoke and static data validation can be marked not required when the final diff contains only Markdown or PR-template files, with the reason recorded against each skipped check.
- UI/runtime change: browser smoke, console checks and affected-tab checks should normally run; static data validation can be marked not required only when no prepared data, schema, JSON path or analytics compatibility surface changed.
- Analytics/data change: static data validation, local static serving, JSON path checks, missing-value rendering checks and analytics truth review should normally run; any omitted check needs a concrete reason tied to the final diff.

Fast track remains lightweight, but lightweight does not mean silent. A Fast track PR can use a short validation note, but it must still explain why heavier checks were unnecessary. Standard and Strict PRs should make skipped-validation reasoning detailed enough for a reviewer to audit the decision.

## Required PR record

Every PR should record:

- delivery tier
- reason for the tier
- validation required by the tier
- validation actually completed
- reasons for validation steps that were not run
- final changed-files risk check
- any caveats or follow-up checks

For Fast track PRs, keep the explanation short. For Standard and Strict PRs, use the full template and complete the changed-files, validation-reasoning, groundedness and merge-gate sections.

## Retros

Retros are optional and should be selective. Record a retro when the work exposes a reusable delivery lesson, validation gap, tooling issue or analytics-truth risk. Routine Fast track changes usually do not need a retro.
