# Skill: RaceIQ PR Review

## Use when

Use this skill when preparing, reviewing, summarising, or providing a final recommendation for a RaceIQ pull request.

## Review focus

RaceIQ PRs should be reviewed for both software correctness and analytics trustworthiness.

## Checklist

### Static app behaviour

- Does the app still load with `python -m http.server 8000`?
- Do all tabs switch correctly?
- Are new JSON files fetched using relative paths?
- Are missing data fields rendered safely?
- Are data strings escaped before insertion into HTML?

### Analytics interpretation

- Are official results kept separate from inferred analytics?
- Are capture gaps and confidence caveats visible?
- Does the PR avoid overclaiming inferred events as official facts?
- Are known incidents included in notes or caveats where relevant?

### Scope control

- Does the PR match the linked issue?
- Does it avoid unnecessary rewrites?
- Does it avoid adding dependencies, build tools, live collection or backend behaviour?
- Are docs updated when data contracts or interpretation rules change?

### Codex memory hygiene

- If the PR changes durable workflow or project context, should `docs/CODEX_MEMORIES.md` be updated?
- Does the PR avoid putting secrets, transient PR status, branch heads or commit SHAs into memory guidance?
- Does mandatory guidance remain in `AGENTS.md` or checked-in docs rather than only in memory wording?

## PR summary format

Use this structure in PR descriptions:

```markdown
## Summary

- ...

## Validation

- ...

## Caveats

- ...

Closes #<issue-number>
```

## Final recommendation comment

Before approval, add a top-level PR comment that covers:

- issue alignment
- scope control
- validation evidence
- analytics truth check
- risks and caveats
- final recommendation

Recommendation options are `Approve`, `Approve after minor fixes`, and `Hold approval`.

## Done when

The PR is understandable without reading the whole diff and the reviewer can see exactly what was changed, how it was validated, what caveats remain, and whether approval is recommended.
