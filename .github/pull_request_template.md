## Summary

- 

## Linked issue

Closes #

## Delivery tier

- [ ] Fast track
- [ ] Standard
- [ ] Strict

Reason:

- 

Required validation for this tier:

- 

## Scope check

- [ ] Matches the linked issue
- [ ] Branch follows `feature/<issue-number>-short-description`
- [ ] No unrelated files or broad rewrites included
- [ ] Non-goals from the issue are respected
- [ ] Final diff reviewed against issue scope

## Changed-files risk check

Changed files:

- 

- App/runtime files changed: yes/no
- Data files changed: yes/no
- Analytics/scoring/inference logic changed: yes/no
- CI/deployment/config changed: yes/no
- Documentation/template only: yes/no
- Delivery tier still correct: yes/no

Risk follow-up:

- [ ] Delivery tier reclassified if the final changed files are riskier than expected
- [ ] Work paused and re-planned if the final diff no longer matches the linked issue scope

## Validation

For each validation item, record the result. If a check was not run, include the reason.

- [ ] Static data validation run with `python tools/validate_static_data.py`
  - Result:
  - Reason if not run:
- [ ] Served locally with `python -m http.server 8000`
  - Result:
  - Reason if not run:
- [ ] Browser smoke completed where UI/runtime is affected
  - Result:
  - Reason if not run:
- [ ] Browser console checked where UI/runtime is affected
  - Result:
  - Reason if not run:
- [ ] Existing tabs still work where UI/runtime is affected
  - Result:
  - Reason if not run:
- [ ] New/changed JSON paths load correctly
  - Result:
  - Reason if not run:
- [ ] Missing values render gracefully where data/UI is affected
  - Result:
  - Reason if not run:
- [ ] Data caveats are visible where needed
  - Result:
  - Reason if not run:

Browser validation status: Completed / Pending local or Codex smoke / Not required

Pending browser validation note, if applicable:

- 

## Analytics truth check

- [ ] Official results remain separate from inferred analytics
- [ ] First Observed is not presented as true grid
- [ ] Known incidents are preserved as caveats
- [ ] Scores/grades are labelled as explanatory, not official
- [ ] Confidence/caveat fields are rendered or documented where relevant

## Ready-for-review gate

- [ ] Validation evidence is recorded above
- [ ] Validation reasons are recorded where a check was not run
- [ ] Known caveats are documented
- [ ] The PR is small enough to review confidently
- [ ] Draft status can be removed

## Pre-approval groundedness review

- [ ] Assistant/Codex has posted a pre-approval groundedness review comment
- [ ] The review checks issue alignment, scope control, validation evidence, analytics truth and risks/caveats
- [ ] The review includes one final recommendation: `Approve`, `Approve after minor fixes`, or `Do not approve yet`
- [ ] Any `Do not approve yet` or minor-fix items are resolved or explicitly accepted before approval

## Merge / deployment gate

Select and evidence exactly one human approval route (a technical groundedness `Approve` recommendation does not itself authorise merge):

- [ ] Eligible non-author GitHub reviewer has submitted formal `APPROVE` (review URL and head SHA):
- [ ] Solo-maintainer route under `docs/DELIVERY_GATES.md`: no eligible distinct reviewer; fresh independent groundedness review is positive for the exact head/base; explicit owner merge-authorisation comment records exact head SHA, dated decision, evidence, caveats and deployment consequence (comment URL):
- [ ] Current GitHub branch-protection/ruleset review requirements are satisfied. If they require an eligible formal review, HOLD until review or a separately authorised and effective settings change; documentation and owner comments cannot bypass rules.
- [ ] Required checks are passing for the current exact head SHA (run URLs):
- [ ] Analytics truth, caveats and local/browser evidence are complete and still applicable to this head; no unresolved material HOLD items
- [ ] No unresolved review comments remain
- [ ] Target branch is `main`; current base/head and final diff have been checked
- [ ] Owner has explicitly authorised merging this exact SHA; technical approval alone is insufficient
- [ ] Merge is understood as a GitHub Pages deployment trigger

Evidence: head SHA / frozen or current base SHA / independent groundedness comment / owner decision / live branch rules / CI runs / remaining caveats:

- 

## Post-merge follow-up

- [ ] Confirm GitHub Pages deployment
- [ ] Open deployed dashboard
- [ ] Spot-check changed feature
- [ ] Close linked issue if not auto-closed
- [ ] Create follow-up issues where needed
