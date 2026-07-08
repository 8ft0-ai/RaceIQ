# RaceIQ Agent Guide

## Project purpose

RaceIQ is a static post-race analytics dashboard for LiveRC race data. It is hosted on GitHub Pages and should remain a static HTML/CSS/JavaScript application that reads prepared JSON files from `data/`.

The project is for post-race analysis only. Do not add live polling, scraping, Playwright, browser automation, WebSocket discovery, backend storage, authentication, or Python runtime behaviour to the deployed GitHub Pages app.

## Branch and deployment workflow

- `main` is the stable deployed GitHub Pages branch.
- Work in `feature/*` branches.
- Use one branch per GitHub issue or iteration.
- Open a PR into `main` for review.
- Treat merge to `main` as a deployment trigger.
- Do not commit directly to `main` unless explicitly asked for a hotfix.

## Pre-branch issue intake

Before starting work on an issue, inspect the issue for enough implementation detail.

A ready issue should include goal, scope, non-goals, inputs, expected outputs, acceptance criteria, validation expectations and analytics caveats where relevant.

If the issue is unclear, hold implementation. Do not create a branch or make changes. Post an issue comment explaining what is missing and what clarification is needed.

If the issue is ready, post an implementation plan comment before creating the feature branch. The plan should list the files expected to change, implementation steps, data or UI contract, validation plan, scope controls, risks and proposed branch name.

## Issue labels and workflow state

Use `docs/ISSUE_LABELS_AND_STATE.md` as the repository convention for issue labels, workflow state labels, blocker labels and handoff comments.

Apply labels prospectively to active work rather than noisy closed-issue backfills. Use classification labels such as `type:*`, `area:*`, `exec:*`, `risk:*` and `gate:*` to describe what the issue is and how it should be routed. Use one active `state:*` label where possible to show the current workflow state.

If an issue is labelled `state:blocked`, it must also have at least one `blocked:*` reason label and a handoff comment explaining what is blocked, what has already passed, what is missing and the next action.

A handoff is incomplete unless the issue or PR states the branch or PR where relevant, validation status, missing work and next action.

## Current iteration context

The Report Cards feature is split across linked issues:

- #2 — Grid-to-Finish data mart
- #3 — Grid-to-Finish dashboard UI
- #4 — Team Report Card data mart
- #5 — Team Report Card dashboard UI
- #6 — Polish, validate and deploy

Iteration 2 is intentionally UI-only over the existing `data/grid_to_finish.json` and `data/grid_to_finish_validation.json` files.

## Static app constraints

The app loads JSON using browser `fetch()`. It must work when served from GitHub Pages or a local static server:

```bash
python -m http.server 8000
```

Avoid dependencies, build steps and package managers unless a future issue explicitly introduces them.

## Data conventions

- Keep final standings and official lap totals separate from inferred analytics.
- Preserve the first-capture caveat: the first approximately 20 minutes were not captured.
- Distinguish true `Grid → Finish` movement from `First Observed → Finish` movement.
- Never present first-observed position as true start position.
- Known timing incidents must be surfaced as caveats, not hidden or treated as confirmed performance failures.

## Coding style

- Prefer plain JavaScript modules/scripts over framework code.
- Use small, readable helper functions.
- Escape user/data-provided text before inserting into HTML.
- Keep visual language consistent with the existing dashboard.
- Avoid large rewrites when a small additive change will do.

## Codex memories

Use `docs/CODEX_MEMORIES.md` as the curated memory seed for this project.

Memories are a helpful recall layer for stable preferences, workflow habits and known pitfalls, but they are not the source of mandatory project rules. Required rules stay in `AGENTS.md` and checked-in documentation.

Do not store secrets, transient PR status, temporary branch heads or commit SHAs in memory.

## Pre-approval groundedness review

Before the user approves a PR, provide a top-level PR comment titled `Pre-approval groundedness review`.

The review must check:

- issue alignment: did the PR deliver what the linked issue asked for?
- scope control: did the PR avoid unrelated or unrequested changes?
- validation evidence: what has been completed and what is still missing?
- analytics truth: are official results, inferred analytics, caveats and scores represented honestly?
- risks and caveats: what should the reviewer know before approval?
- final recommendation: `Approve`, `Approve after minor fixes`, or `Do not approve yet`

Do not recommend approval if validation is incomplete, scope has drifted, or analytics caveats are hidden or overstated.

## Validation checklist

Before opening or updating a PR, check:

- the app loads locally from a static server
- the browser console has no errors
- all JSON file paths resolve
- tabs still switch correctly
- missing/unknown fields render as `—` or with an explicit caveat
- GitHub Pages deployment remains compatible