# RaceIQ issue labels and state tracking

RaceIQ uses issue labels for lightweight routing and handoff. Labels should make the current execution state visible without turning the repository into a heavyweight project-management system.

This convention supports the existing delivery gates. It does not replace issue readiness comments, implementation plan comments, pull request validation, the pre-approval groundedness review, or the merge and deployment gates.

## Label purposes

Use labels for two separate purposes:

1. **Classification labels** describe what kind of work the issue contains. These should usually remain stable for the life of the issue.
2. **Workflow state labels** describe where the work is right now. These should change as the issue moves through intake, implementation, review, merge, deployment and verification.

A RaceIQ issue does not need every label. Apply the smallest set that helps the next actor understand what the issue is, how it should be executed and what remains to be done.

## Classification labels

### Area labels

Use `area:*` labels for the dashboard or repository area affected by the issue.

| Label | Use when |
| --- | --- |
| `area:report-cards` | The issue affects Team Report Cards, report-card UI, report-card data, report-card caveats or report-card documentation. |
| `area:grid-to-finish` | The issue affects heat sheet / start position to final position movement, or related Grid-to-Finish presentation. |
| `area:methodology` | The issue affects method wording, interpretation guidance, analytics caveats or explanatory documentation. |
| `area:release` | The issue affects release notes, deployment verification or release readiness records. |
| `area:mobile` | The issue affects responsive layout, narrow-screen behaviour or mobile usability. |

### Type labels

Use `type:*` labels for the nature of the change.

| Label | Use when |
| --- | --- |
| `type:data` | Prepared JSON data, generated artefacts, data contracts or data validation outputs change. |
| `type:ui` | Dashboard HTML, CSS or JavaScript rendering changes. |
| `type:docs` | Markdown, release notes, data dictionaries or repository documentation change. |
| `type:validation` | Validation tools, CI checks, validation evidence or smoke-test guidance change. |
| `type:workflow` | Delivery gates, issue templates, PR templates, agent guidance or repository process change. |

### Execution labels

Use `exec:*` labels to show whether the issue is suitable for connector-only work or needs a local runtime.

| Label | Use when |
| --- | --- |
| `exec:connector-ok` | The issue can be implemented safely through the GitHub connector because the diff is small, text-based, reviewable and does not require local generated outputs or browser-only validation to complete the implementation. |
| `exec:local-required` | The issue needs local execution, local files, generated artefacts, local browser validation or tooling that should not be attempted entirely through the GitHub connector. |

Use `exec:local-required` for issues involving any of the following:

- large JSON creation, replacement or reshaping
- generated data that should be produced by a script rather than manually edited through the connector
- generator changes where committed outputs must be reproduced locally
- binary or visual assets that are awkward or risky to edit through the connector
- UI changes that are visually risky and require local browser smoke before a credible PR can be opened
- narrow-screen or responsive changes where real viewport checks are required
- work that is likely to hit connector-size or patch-size limits
- changes where local validation is part of the implementation, not just a final review step

Use `exec:connector-ok` for small documentation, template or isolated source changes where the final diff can be reviewed directly and any skipped local validation has a clear reason.

### Risk labels

Use `risk:*` labels to flag review and routing risks before implementation starts.

| Label | Use when |
| --- | --- |
| `risk:large-json` | The issue may create or modify large JSON files. Usually pair with `exec:local-required`. |
| `risk:generated-data` | The issue changes generated outputs, generator logic or reproducibility expectations. Usually pair with `exec:local-required`. |
| `risk:analytics-truth` | The issue could affect official-vs-inferred separation, Grid-to-Finish meaning, First Observed wording, scores, grades, known incidents or anomaly interpretation. |
| `risk:visual-regression` | The issue could affect dashboard layout, responsive behaviour or visual interpretation and needs browser smoke. |

### Gate labels

Use `gate:*` labels to show validation gates that are expected for the issue.

| Label | Use when |
| --- | --- |
| `gate:data-validator` | `python tools/validate_static_data.py` should run or have a clear skipped-validation reason. |
| `gate:static-app-smoke` | `python tools/validate_static_app.py` should run or have a clear skipped-validation reason. |
| `gate:browser-smoke` | A browser smoke test, console check or viewport check is expected before ready-for-review or before merge. |
| `gate:pages-deploy-check` | A post-merge GitHub Pages deployment check is expected. |

Gate labels do not replace the PR validation checklist. They help route the issue before work starts and make expected validation visible during handoff.

## Workflow state labels

Use exactly one active `state:*` label on open work whenever possible.

| Label | Meaning |
| --- | --- |
| `state:ready` | The issue appears ready for intake, but implementation has not started. |
| `state:planned` | Readiness and implementation plan comments have been posted, but branch work has not started yet. |
| `state:in-progress` | Branch work, metadata changes, implementation or validation is actively underway. |
| `state:blocked` | Work cannot continue cleanly until a blocker is resolved. Must be paired with at least one `blocked:*` label. |
| `state:pr-open` | A PR exists and the issue is waiting on PR validation, review, approval, merge or follow-up. |
| `state:merged` | The PR has merged to `main`, but deployment or deployed verification is not complete yet. |
| `state:deployed` | The GitHub Pages deployment is believed to have completed, but deployed verification is not complete yet. |
| `state:verified` | The deployed result, or the final non-deployed workflow result, has been verified and the issue can be closed or is already complete. |

Closed historical issues do not need to be relabelled unless the label helps a current handoff. Avoid noisy backfills.

## Blocker labels

Use `blocked:*` labels only with `state:blocked`.

| Label | Use when |
| --- | --- |
| `blocked:auth` | Repository, connector, GitHub Pages or other access is missing. |
| `blocked:connector-limit` | The connector cannot safely handle the required file size, generated artefact, patch size or metadata action. |
| `blocked:validation-failing` | Required validation is failing and implementation should not proceed to approval. |
| `blocked:needs-data-decision` | The issue needs a decision about source data, data contract, generated output, confidence semantics or caveat treatment. |
| `blocked:needs-review` | The next step is human review or approval before more implementation should occur. |

`state:blocked` is incomplete unless it is paired with at least one `blocked:*` label and a comment explaining:

- what is blocked
- why it is blocked
- what has already passed
- what decision or action is needed next
- who the next actor is, if known

## State-tracking comment

Each non-trivial issue should have one state-tracking comment or checklist that can be updated before handoff.

```md
## State

Current: ready

## Execution

- Branch:
- PR:
- Owner / current actor:
- Next actor:

## Checklist

- [ ] Readiness confirmed
- [ ] Implementation plan posted
- [ ] Branch created
- [ ] Data changes committed
- [ ] UI changes committed
- [ ] Validator updated
- [ ] `python tools/validate_static_data.py`
- [ ] `python tools/validate_static_app.py`
- [ ] Local browser smoke
- [ ] Draft PR opened
- [ ] PR approved
- [ ] PR merged
- [ ] GitHub Pages deployed
- [ ] Deployed dashboard spot-checked

## Handoff

- Current status:
- What passed:
- What is missing:
- Next action:
```

For documentation-only or template-only changes, mark non-applicable items as not required with a reason rather than leaving the handoff ambiguous.

## Handoff completeness rule

A handoff is incomplete unless the issue or PR states all of the following:

- branch name, if a branch exists
- PR number or link, if a PR exists
- current workflow state
- validation status, including checks completed and checks not run with reasons
- missing work, if any
- next action
- next actor, if known

This rule is especially important when work moves between ChatGPT, Codex, local validation and human review.

## Applying labels to the current queue

For the current open RaceIQ queue, apply this convention prospectively:

- add stable classification labels that describe the issue
- add one active `state:*` label
- add `exec:*`, `risk:*` and `gate:*` labels only where they materially help routing or validation
- update the state label when the issue moves to planning, implementation, PR, merge, deployment or verification
- when blocked, pair `state:blocked` with a `blocked:*` reason and an explanatory handoff comment

Do not backfill every closed issue. The value is in making active and future work easier to route, execute, review and hand off.

## Current queue application for issue #32

At implementation time, the current open issue queue contained #32. The intended labels for #32 are:

- `type:workflow`
- `type:docs`
- `exec:connector-ok`
- `state:in-progress` while branch work is underway
- `state:pr-open` once the pull request is opened

No dashboard runtime, prepared data, scoring, analytics or GitHub Pages deployment labels are required for #32.