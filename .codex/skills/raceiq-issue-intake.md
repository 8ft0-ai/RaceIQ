# Skill: RaceIQ Issue Intake

## Use when

Use this skill before starting work on any RaceIQ GitHub issue.

The purpose is to check issue readiness and add an implementation plan before feature branch creation.

## Step 1 — Read the issue

Check that the issue includes:

- goal
- scope
- non-goals
- inputs or data files
- expected outputs
- acceptance criteria
- validation required
- analytics caveats where relevant

For RaceIQ-specific work, also check:

- the static GitHub Pages boundary is clear
- live collection is not being introduced unless explicitly requested
- the data contract is clear for data-mart or UI-over-data work
- known caveats and incidents remain visible

## Step 2 — Post issue readiness comment

If the issue needs clarification, post a comment titled `Issue readiness check` with status `Needs clarification`. Include the missing or unclear items, clarifying questions, and a recommendation to clarify the issue before implementation starts.

If the issue is ready, post a comment titled `Issue readiness check` with status `Ready to plan`. Include the confirmed goal, scope, non-goals, inputs, outputs, acceptance criteria, validation expectations and relevant RaceIQ caveats.

## Step 3 — Post implementation plan

Before creating a branch, post a second issue comment titled `Implementation plan`.

The plan should include:

- linked issue
- summary
- files expected to change
- implementation steps
- data contract, UI contract or process contract
- validation plan
- scope controls
- risks and caveats
- proposed branch name

When validation includes local browser checks, distinguish implementation blockers from validation blockers. A missing local browser smoke capability does not have to block a draft PR if the scoped implementation is complete, available non-browser validation is clean, and pending browser checks are recorded clearly.

## Step 4 — Create the branch

Create the feature branch only after both comments exist.

Use:

```text
feature/<issue-number>-short-description
```

## Step 5 — Draft PR fallback for unavailable browser validation

If local browser validation is required but unavailable, a draft PR may still be opened when:

- the branch is complete
- files were committed cleanly
- available validation is not failing
- the diff is small and reviewable
- analytics truth, data correctness, scoring and caveat wording are not uncertain

The draft PR must leave browser-dependent validation unchecked, state the browser smoke still needed, and remain in draft until Codex or a local reviewer completes that validation.

Do not open a PR if implementation is incomplete, validation is known to fail, the change is visually risky, generated data needs local scripting, or the PR would be misleading without the missing validation.

## Done when

The issue has either been held for clarification or has both a readiness comment and an implementation plan comment before branch creation. If a draft PR is opened with browser validation pending, the PR clearly records the pending local smoke check and remains draft.
