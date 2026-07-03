# RaceIQ Delivery Gates

This document describes the lightweight delivery gates for the RaceIQ issue-to-PR workflow.

The ideas behind these gates are recorded in #11. The first implementation is tracked in #12. The pre-approval groundedness review gate is tracked in #15.

## Principles

RaceIQ is a static GitHub Pages dashboard that turns prepared JSON race analytics into post-race insight. The delivery process should protect three things:

1. the deployed `main` branch
2. the trustworthiness of the analytics
3. the ability to review small, scoped iterations confidently

The gates are intentionally lightweight. They are delivery rails, not heavyweight governance.

## Management model

```text
Issue readiness = issue template + labels
Branch control = naming convention
Work visibility = draft PR
Mechanical validation = GitHub Actions
Review quality = PR checklist
Pre-approval confidence = groundedness review comment
Deployment safety = protected main branch
Post-merge confidence = release check comment
```

## Gate 1 — Issue readiness

Before implementation starts, the issue should explain:

- goal
- scope
- non-goals
- inputs / data files
- expected outputs
- acceptance criteria
- validation required
- analytics caveats

The issue template `.github/ISSUE_TEMPLATE/feature_iteration.md` is the main mechanism for this gate.

For RaceIQ, non-goals are important. Unless explicitly agreed, feature work must not add live polling, scraping, Playwright, backend storage, authentication or Python runtime behaviour to the deployed GitHub Pages app.

## Gate 2 — Data contract

For data-mart work, the issue or PR must define the expected JSON contract before UI work depends on it.

The contract should state:

- output file path
- required fields
- row-count expectation
- confidence and caveat fields
- validation expectations

UI work should not treat a data mart as stable until this gate is satisfied.

## Gate 3 — Branch

Feature work should happen on a traceable branch:

```text
feature/<issue-number>-short-description
```

Examples:

```text
feature/12-delivery-gates
feature/13-team-report-card-ui
```

Do not commit directly to `main` unless explicitly asked for a hotfix.

## Gate 4 — Draft PR

Open a draft PR after the first meaningful commit. The draft PR should make the work visible while it is still in progress.

A good draft PR states:

- what changed
- what deliberately did not change
- how it will be validated
- known caveats
- linked issue

Draft means visible, not ready to merge.

## Gate 5 — Validation

Before a PR is marked ready for review, run the relevant validation.

For data changes:

```bash
python tools/validate_static_data.py
```

For UI changes:

```bash
python -m http.server 8000
```

Then check:

- JSON paths resolve
- existing tabs still work
- changed UI works
- browser console is clean
- data caveats are visible

The workflow `.github/workflows/validate-static-data.yml` runs the static data validator on pull requests into `main`.

## Gate 6 — Analytics truth

RaceIQ analytics should not overclaim. Before approval, check:

- official results remain separate from inferred analytics
- First Observed is not presented as true grid
- known incidents remain visible as caveats
- scores and grades are explanatory, not official
- confidence and caveat fields are visible or documented

This is mostly a human review gate. Automation can check shapes and bounds, but reviewers must check interpretation.

## Gate 7 — Ready for review

A PR should only be marked ready for review when:

- scope matches the linked issue
- validation evidence is recorded
- known caveats are documented
- unrelated changes are excluded
- the PR is small enough to review confidently

## Gate 7.5 — Pre-approval groundedness review

Before the user approves a PR, Assistant/Codex should post a top-level PR comment that answers two questions:

1. Did we do what was needed?
2. Did we only do what was asked?

This gate is different from validation. Validation checks whether the implementation works. The groundedness review checks whether the PR is grounded in the issue, stays within scope and has a clear recommendation.

Use this structure:

```markdown
## Pre-approval groundedness review

### 1. Issue alignment

Linked issue: #...

The issue asked for:

- ...

This PR delivers:

- ...

### 2. Scope check

In scope:

- ...

Out of scope / deliberately not included:

- ...

Unrequested changes found:

- None / list items

### 3. Validation evidence

Completed:

- ...

Still not completed:

- ...

### 4. Analytics truth check

- Official results remain separate from inferred analytics: Yes/No
- First Observed is not presented as true grid: Yes/No
- Known incidents remain visible as caveats: Yes/No
- Scores/grades are labelled as explanatory, not official: Yes/No

### 5. Risks / caveats

- ...

### 6. Final recommendation

Recommendation: Approve / Approve after minor fixes / Do not approve yet

Reason:

- ...
```

The final recommendation must use one of:

```text
Approve
Approve after minor fixes
Do not approve yet
```

The user should not approve the PR until this groundedness review comment is present and any `Do not approve yet` items have been resolved or explicitly accepted.

## Gate 8 — Merge

Before merge:

- PR approval is recorded
- required checks pass
- unresolved review comments are addressed
- target branch is still `main`
- merge is understood as a GitHub Pages deployment trigger

Branch protection for `main` is recommended so this gate cannot be bypassed accidentally. Repository settings may need to be configured manually.

## Gate 9 — Post-merge

After merge:

- confirm GitHub Pages deployment
- open the deployed dashboard
- spot-check the changed feature
- close the linked issue if not auto-closed
- create follow-up issues where needed

## Roles

```text
Assistant / Codex: prepares issue, branch, PR, validation evidence and groundedness review
GitHub Actions: enforces mechanical checks
Reviewer / user: approves judgement gates and merge
GitHub branch protection: prevents bypassing the process
```

## Labels

Suggested labels for gate state:

```text
gate:needs-shaping
gate:ready-for-branch
gate:data-contract-approved
gate:in-progress
gate:ready-for-pr
gate:ready-for-review
gate:groundedness-reviewed
gate:approved
gate:merged
```

These labels are optional. The core controls are the issue template, branch naming convention, draft PRs, validation workflow, PR checklist and pre-approval groundedness review comment.
