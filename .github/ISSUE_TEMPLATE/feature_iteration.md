---
name: Feature iteration
description: Plan a scoped RaceIQ delivery iteration
title: "Iteration: "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Use this template to pass the Issue Readiness Gate before creating a feature branch.

        Apply issue labels using `docs/ISSUE_LABELS_AND_STATE.md`. Classification labels describe the kind of work; one active `state:*` label should describe the current workflow state where useful.
  - type: textarea
    id: routing-labels
    attributes:
      label: Suggested routing labels
      description: Which `area:*`, `type:*`, `exec:*`, `risk:*`, `gate:*` and initial `state:*` labels should be applied?
      placeholder: type:ui, area:report-cards, exec:local-required, risk:visual-regression, gate:browser-smoke, state:ready
    validations:
      required: false
  - type: textarea
    id: goal
    attributes:
      label: Goal
      description: What outcome should this iteration achieve?
      placeholder: Add the Team Report Card UI using the existing team_report_cards.json data mart.
    validations:
      required: true
  - type: textarea
    id: scope
    attributes:
      label: Scope
      description: What is included?
      placeholder: Files, tabs, data files, docs, validation scripts or workflow changes in scope.
    validations:
      required: true
  - type: textarea
    id: non-goals
    attributes:
      label: Non-goals
      description: What must not be changed?
      placeholder: No live polling, no backend, no scraping, no Playwright, no unrelated UI rewrites.
    validations:
      required: true
  - type: textarea
    id: inputs
    attributes:
      label: Inputs / data files
      description: What files or existing artefacts does this depend on?
      placeholder: data/team_report_cards.json, data/grid_to_finish.json, AGENTS.md
    validations:
      required: true
  - type: textarea
    id: outputs
    attributes:
      label: Expected outputs
      description: What files, UI sections, data marts or docs should exist after the work?
      placeholder: report-cards.js update, Team Report Cards section, docs update.
    validations:
      required: true
  - type: textarea
    id: data-contract
    attributes:
      label: Data contract
      description: Required for data-mart or UI-over-data changes. State JSON shape, required fields and row expectations.
      placeholder: One row per final-standing team. Required fields include team_name, final_position, report_card_score and report_card_grade.
    validations:
      required: false
  - type: textarea
    id: acceptance
    attributes:
      label: Acceptance criteria
      description: How will we know this iteration is done?
      placeholder: The Report Cards tab can answer which team has the best RaceIQ score and explain caveats.
    validations:
      required: true
  - type: textarea
    id: validation
    attributes:
      label: Validation required
      description: What should be run or checked before the PR is ready for review?
      placeholder: python tools/validate_static_data.py, python -m http.server 8000, browser console check.
    validations:
      required: true
  - type: textarea
    id: analytics-caveats
    attributes:
      label: Analytics caveats
      description: What interpretation risks need to stay visible?
      placeholder: First Observed is not true grid. Scores are explanatory, not official. Known incidents remain visible.
    validations:
      required: true
  - type: textarea
    id: implementation-plan
    attributes:
      label: Implementation plan expectations
      description: What should the pre-branch implementation plan comment cover?
      placeholder: Expected files, implementation steps, validation plan, scope controls, risks and proposed branch.
    validations:
      required: false
  - type: checkboxes
    id: pre-branch-readiness
    attributes:
      label: Pre-branch readiness
      options:
        - label: Issue has enough detail for implementation
          required: true
        - label: Classification and workflow state labels have been considered
          required: true
        - label: Data or UI contract is clear where relevant
          required: true
        - label: Validation expectations are clear
          required: true
        - label: Assistant/Codex should post an issue readiness comment before branch creation
          required: true
        - label: Assistant/Codex should post an implementation plan comment before branch creation
          required: true
  - type: checkboxes
    id: readiness
    attributes:
      label: Issue readiness gate
      options:
        - label: Goal, scope and non-goals are clear
          required: true
        - label: Inputs and expected outputs are identified
          required: true
        - label: Validation expectations are listed
          required: true
        - label: Analytics caveats are listed where relevant
          required: true
        - label: Branch should use feature/<issue-number>-short-description
          required: true
---