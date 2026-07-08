# RaceIQ validation modes

RaceIQ uses lightweight validation modes so each issue and PR is explicit about what has been checked, what remains pending and what authority permits merge.

These modes do not replace the delivery gates in `docs/DELIVERY_GATES.md`. They make the validation gate easier to apply consistently.

## Principles

- Validation mode is chosen during issue intake and repeated in the implementation plan.
- PRs should record completed validation, skipped validation and pending validation separately.
- Browser-pending merge is an exception, not the default path for UI work.
- Browser-pending merge requires explicit user authority and visible caveats.
- Browser-pending merge must not be used when analytics truth, data correctness, scoring, caveat wording or generated data is uncertain.

## Modes

| Mode | Use when | Minimum evidence | Merge rule |
| --- | --- | --- | --- |
| `connector-only safe` | The change is small, text-based and reviewable through the GitHub connector. | Direct diff review and issue/PR evidence. | May merge after review if no runtime validation is relevant. |
| `GitHub Actions safe` | Static validators or CI checks are the meaningful mechanical gate. | Passing GitHub Actions or documented reason why no Actions run applies. | May merge after required checks pass and groundedness review supports merge. |
| `local/browser required before merge` | The work is UI-risky, visual, responsive, generated locally or depends on browser-only behaviour. | Local static server or deployed app smoke, console check and relevant viewport checks. | Do not merge until browser/local evidence is recorded. |
| `browser-pending merge allowed by explicit user authority` | The implementation is complete and reviewable, non-browser validation is clean, and the user explicitly accepts browser validation after merge. | PR records completed non-browser validation, exact browser checks still pending, and the explicit authority. | May merge only if analytics truth and data correctness are not uncertain. Leave follow-up validation visible. |

## Issue intake

During readiness review, classify the issue with one validation mode.

The readiness comment should state:

- selected validation mode
- why that mode is appropriate
- whether browser or local validation is required before merge
- whether any browser-pending merge exception could apply

If the issue requires browser validation and the current actor cannot perform it, do not pretend the issue is connector-completable. Record the blocker and next actor.

## Implementation plan

The implementation plan should repeat the validation mode and list the expected evidence.

For `browser-pending merge allowed by explicit user authority`, the plan must also state:

- who gave the authority
- which checks remain pending
- why the remaining checks do not affect analytics truth, data correctness, scoring or caveat wording

## PR validation section

Every PR should include:

```text
Validation mode:
Completed validation:
Pending validation:
Skipped validation and reason:
Browser-pending merge authority:
```

Use `Not applicable` rather than leaving fields blank.

## Groundedness review alignment

The pre-approval groundedness review final recommendation must align with the validation mode:

- Use `Approve` only when the required validation mode has passed, or when explicit browser-pending merge authority has been recorded and the remaining checks are genuinely post-merge smoke checks.
- Use `Approve after minor fixes` when the issue is aligned but small validation or documentation gaps remain.
- Use `Do not approve yet` when required validation is incomplete, available validation is failing, analytics caveats are hidden, scope has drifted, or merge would be misleading.

Do not recommend approval just because the implementation appears complete. Validation state and merge authority are part of the recommendation.

## Final issue tidy-up

Final issue comments should record:

- branch and PR
- validation mode
- completed validation
- pending validation, if any
- whether browser-pending merge authority was used
- next actor for pending validation
- analytics truth check status

If browser validation remains pending, the issue should not be labelled `state:verified` unless that pending validation is represented by a separate open validation issue.

## Analytics truth guardrail

Browser-pending merge is never acceptable when any of these are uncertain:

- official results versus inferred analytics separation
- Grid-to-Finish versus First Observed wording
- RaceIQ score or grade interpretation
- generated JSON correctness
- anomaly, delay or incident caveat wording
- data confidence wording

When in doubt, hold the PR before merge and record the blocker.