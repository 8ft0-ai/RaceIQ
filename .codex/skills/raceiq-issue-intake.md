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

## Step 4 — Create the branch

Create the feature branch only after both comments exist.

Use:

```text
feature/<issue-number>-short-description
```

## Done when

The issue has either been held for clarification or has both a readiness comment and an implementation plan comment before branch creation.
