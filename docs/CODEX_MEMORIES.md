# Codex Memories for RaceIQ

This document captures the recommended memory seed for future Codex work on RaceIQ.

Codex memories are a local recall layer. They are useful for stable preferences, recurring workflows, tech stacks, project conventions and known pitfalls. They should not replace required project rules. Required guidance belongs in `AGENTS.md` or checked-in documentation.

## Recommended memory seed

Use these as the stable RaceIQ memories that are worth carrying across future Codex sessions.

### Project identity

```text
RaceIQ is a static post-race analytics dashboard for LiveRC race data. It is hosted on GitHub Pages and should remain a static HTML/CSS/JavaScript app that consumes prepared JSON files from data/.
```

### Strong non-goal

```text
Do not add live collection, polling, scraping, Playwright, browser automation, WebSocket discovery, backend storage, authentication, or Python runtime behaviour to the deployed RaceIQ GitHub Pages app.
```

### Workflow

```text
For RaceIQ, main is the stable deployed GitHub Pages branch. Feature work should use feature/<issue-number>-short-description branches, draft PRs, review/validation, then merge to main as the deployment trigger. Avoid direct commits to main unless explicitly asked for a hotfix.
```

### Iteration style

```text
RaceIQ work should be split into small iterations: data mart first, validation second, UI third, polish last. Avoid implementing data joins, scoring, UI and deployment all in one change.
```

### Validation habit

```text
Before a RaceIQ PR is ready, run static validation where applicable with python tools/validate_static_data.py and serve locally with python -m http.server 8000. Check JSON paths, existing tabs, browser console and visible caveats.
```

### Analytics truth boundary

```text
RaceIQ must keep official/cumulative race results separate from inferred analytics. Do not present inferred pit events, delays, anomalies, scores or report-card grades as official results.
```

### Capture caveat

```text
The race capture missed roughly the first 20 minutes. RaceIQ must distinguish true Grid → Finish movement from First Observed → Finish movement. Never present first-observed position as true start position.
```

### Known incident handling

```text
Known timing/transponder incidents, especially the Ostrov Team transponder issue, should remain visible as caveats. They should not be hidden or treated as confirmed performance failure.
```

### Report-card interpretation

```text
RaceIQ report-card scores and grades are storytelling aids, not official rankings. Scores should remain explainable from final result, pace, consistency, delay management, grid movement, battle performance and data confidence.
```

### User/project preference

```text
The user prefers practical, concise engineering delivery: plan first, use small gated iterations, preserve caveats, avoid over-engineering, and keep the dashboard static unless explicitly deciding otherwise.
```

## Do not store in memory

Do not put these into memory:

- secrets, tokens, credentials or private keys
- temporary PR numbers as permanent facts
- transient branch heads or commit SHAs
- current review status that can be checked from GitHub
- generated artefacts that are better read from the repository
- anything that conflicts with `AGENTS.md`

## What stays in AGENTS.md

Mandatory project rules should stay in `AGENTS.md`, including:

- static GitHub Pages architecture
- no live collection in the deployed app
- feature-branch and PR workflow
- validation checklist
- analytics caveats and truth boundaries

Memories help Codex remember those patterns across sessions, but `AGENTS.md` is the source of project rules.

## Enabling memories locally

Codex memories are off by default. Enable them in Codex settings, or add the feature flag to your Codex config:

```toml
[features]
memories = true
```

Memory files are generated local state under the Codex home directory, normally `~/.codex/memories/`. Treat those generated files as local state. Review them before sharing your Codex home directory or memory artefacts.

## External context setting

This RaceIQ work often uses GitHub tools, web search and other external context. If you want those tool-assisted sessions to be eligible for memory generation, check the value of:

```toml
memories.disable_on_external_context
```

When set to `true`, Codex skips memory generation for sessions that used external context such as MCP tool calls, web search or tool search. That may be desirable for privacy, but it also means tool-heavy RaceIQ sessions may not produce memories automatically.

## Practical recommendation

Use this document as the seed list. Do not manually edit generated memory files as the primary control mechanism. Keep hard rules in the repo, and let Codex memories remember stable working preferences and recurring context.
