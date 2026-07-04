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

## Validation

- [ ] Static data validation run with `python tools/validate_static_data.py`
- [ ] Served locally with `python -m http.server 8000`
- [ ] Browser console checked where UI is affected
- [ ] Existing tabs still work where UI is affected
- [ ] New/changed JSON paths load correctly
- [ ] Data caveats are visible where needed

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
- [ ] Known caveats are documented
- [ ] The PR is small enough to review confidently
- [ ] Draft status can be removed

## Pre-approval groundedness review

- [ ] Assistant/Codex has posted a pre-approval groundedness review comment
- [ ] The review checks issue alignment, scope control, validation evidence, analytics truth and risks/caveats
- [ ] The review includes one final recommendation: `Approve`, `Approve after minor fixes`, or `Do not approve yet`
- [ ] Any `Do not approve yet` or minor-fix items are resolved or explicitly accepted before approval

## Merge / deployment gate

- [ ] PR has been approved
- [ ] Required checks are passing
- [ ] No unresolved review comments remain
- [ ] Target branch is `main`
- [ ] Merge is understood as a GitHub Pages deployment trigger

## Post-merge follow-up

- [ ] Confirm GitHub Pages deployment
- [ ] Open deployed dashboard
- [ ] Spot-check changed feature
- [ ] Close linked issue if not auto-closed
- [ ] Create follow-up issues where needed
