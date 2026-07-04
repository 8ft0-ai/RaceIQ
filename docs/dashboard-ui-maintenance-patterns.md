# Dashboard UI maintenance patterns

RaceIQ is a static post-race dashboard on GitHub Pages. UI work should be small, deterministic and validated in the rendered browser.

## Core patterns

- Keep the deployed app as static HTML, CSS and JavaScript using prepared JSON from `data/`.
- Update the owning renderer directly for existing tabs unless the issue explicitly asks for modularisation.
- Prefer small helper functions over broad rewrites.
- Avoid separate late-loaded files that replace existing render or lifecycle functions.
- Escape data-provided text before adding it to generated HTML.
- Do not introduce dependencies, package managers or build tooling unless the issue explicitly asks for them.
- Preserve official race results separately from inferred analytics.
- Keep First Observed caveats visible where relevant.

## Renderer ownership

For an existing tab, find the function that already renders that tab and change it directly. Keep lifecycle calls, tab switching and data-loading order intact. Do not duplicate the renderer in another file or depend on script ordering to patch the screen after initial load.

## Static validation

Static checks are useful but not sufficient for UI changes. A change can pass syntax checks while failing at runtime because the browser uses a cached file, a tab is rendered before data is ready, or a nearby tab depends on the same renderer state.

When changing static JavaScript or CSS, serve locally and use a cache-busted URL:

```text
http://localhost:8000/?verify=issue-[number]-[timestamp]
```

Confirm the changed tab renders expected content, the browser console is clean, and nearby tabs still switch and render.

## Data and copy safety

When rendering data-provided values such as team names, notes, labels or caveat text, escape the value before inserting it into generated HTML. Use existing escaping utilities where available and follow the local pattern in the renderer.

UI copy must preserve RaceIQ interpretation boundaries: official results are official, inferred analytics are explanatory, scores and grades are storytelling aids, and First Observed is not true grid position.

## Delivery tier cross-reference

Use `docs/delivery-tiers.md` before implementation and again before review. Normal UI rendering changes are usually Standard. UI changes that affect analytics interpretation, official results, First Observed wording, scoring, prepared data or caveat visibility should be treated as Strict.

## UI review checklist

Before review, confirm:

- the owning renderer was updated directly, or modularisation is explicitly justified
- no lifecycle override pattern was introduced for existing render functions
- no new dependency or build step was added
- data-provided text is escaped before HTML insertion
- cache-busted browser smoke was completed for changed JavaScript or CSS, or the skipped-validation reason is clear
- the changed tab renders expected content
- the browser console is clean
- nearby tabs still switch and render
- official/inferred analytics wording remains accurate
- First Observed caveats remain visible where relevant
