# Skill: RaceIQ Static Dashboard Work

## Use when

Use this skill when modifying the RaceIQ browser dashboard, tabs, rendering logic, or CSS.

## Goal

Make safe, additive changes to the static GitHub Pages app without introducing a build system or backend dependency.

## Steps

1. Read `AGENTS.md` before changing files.
2. Identify the relevant issue and branch.
3. Keep `main` deployable; work on a `feature/*` branch.
4. Prefer small additive scripts or functions over broad rewrites.
5. Preserve existing tabs unless the issue explicitly changes navigation.
6. Escape data before inserting it into HTML.
7. Load only static JSON from `data/`.
8. Validate locally with `python -m http.server 8000`.
9. Check that no existing dashboard tab regresses.

## Do not

- Add live polling or scraping.
- Add Playwright, Python, node build steps, framework dependencies, or backend storage.
- Present inferred analytics as official race data.
- Hide caveats about missing opening capture or timing incidents.

## Done when

- The feature renders from static JSON.
- Missing fields degrade gracefully.
- The UI follows the existing RaceIQ visual language.
- A PR links back to the relevant issue.
