# Skill: RaceIQ PR Review

## Use when

Use this skill when preparing, reviewing, or summarising a RaceIQ pull request.

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

## Done when

The PR is understandable without reading the whole diff and the reviewer can see exactly what was changed, how it was validated, and what caveats remain.
