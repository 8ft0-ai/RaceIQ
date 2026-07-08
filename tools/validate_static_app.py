#!/usr/bin/env python3
"""Validate RaceIQ static dashboard wiring.

This script intentionally has no third-party dependencies. It performs smoke
checks against the static GitHub Pages app shell so broken tabs, script tags or
JSON file references are caught before merge.
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

EXPECTED_TABS = [
    "overview",
    "replay",
    "teams",
    "reportCards",
    "delays",
    "battles",
    "anomalies",
    "method",
]

EXPECTED_SCRIPTS = [
    "app.js",
    "report-cards.js",
]

REQUIRED_ENHANCEMENT_SCRIPTS = [
    "race-replay-confidence-labels.js",
]

DATA_PATH_RE = re.compile(r"[\"'](data/[A-Za-z0-9_./-]+\.json)[\"']")
LOCAL_REF_ATTRS = {
    "script": ["src"],
    "link": ["href"],
    "img": ["src"],
    "source": ["src", "srcset"],
}


class DashboardHtmlParser(HTMLParser):
    """Collect the small subset of static HTML wiring we need to validate."""

    def __init__(self) -> None:
        super().__init__()
        self.tab_buttons: list[str] = []
        self.tab_panels: list[str] = []
        self.scripts: list[str] = []
        self.local_refs: list[tuple[str, str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {name: value or "" for name, value in attrs}
        classes = set(attr.get("class", "").split())

        if tag == "button" and "tab" in classes and attr.get("data-tab"):
            self.tab_buttons.append(attr["data-tab"])

        if tag == "section" and "tab-panel" in classes and attr.get("id"):
            self.tab_panels.append(attr["id"])

        if tag == "script" and attr.get("src"):
            self.scripts.append(attr["src"])

        for name in LOCAL_REF_ATTRS.get(tag, []):
            value = attr.get(name)
            if value:
                self.local_refs.append((tag, name, value))


def normalise_local_path(ref: str) -> str | None:
    """Return a repository-relative path for a local ref, or None to ignore."""
    ref = ref.strip()
    if not ref:
        return None

    if ref.startswith(("http://", "https://", "//", "mailto:", "tel:", "data:", "#")):
        return None

    # srcset can contain multiple comma-separated entries with descriptors.
    if "," in ref:
        return None

    path = urlsplit(ref).path
    if not path or path.startswith("#"):
        return None

    return path.lstrip("/")


def read_text(path: Path, errors: list[str]) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        errors.append(f"Missing required file: {path.relative_to(ROOT)}")
    except UnicodeDecodeError as exc:
        errors.append(f"Could not read {path.relative_to(ROOT)} as UTF-8: {exc}")
    return ""


def require_expected_values(label: str, expected: list[str], observed: list[str], errors: list[str]) -> None:
    missing = [value for value in expected if value not in observed]
    if missing:
        errors.append(f"Missing expected {label}: {', '.join(missing)}")


def validate_index(parser: DashboardHtmlParser, errors: list[str]) -> None:
    require_expected_values("tab buttons", EXPECTED_TABS, parser.tab_buttons, errors)
    require_expected_values("tab panels", EXPECTED_TABS, parser.tab_panels, errors)
    require_expected_values("script references", EXPECTED_SCRIPTS, parser.scripts, errors)
    require_expected_values("enhancement script references", REQUIRED_ENHANCEMENT_SCRIPTS, parser.scripts, errors)

    for tab in parser.tab_buttons:
        if tab not in parser.tab_panels:
            errors.append(f"Tab button data-tab={tab!r} has no matching tab panel id")

    for panel in parser.tab_panels:
        if panel not in parser.tab_buttons:
            errors.append(f"Tab panel id={panel!r} has no matching tab button")


def validate_local_refs(parser: DashboardHtmlParser, errors: list[str]) -> None:
    for tag, attr, ref in parser.local_refs:
        local_path = normalise_local_path(ref)
        if not local_path:
            continue
        if ".." in Path(local_path).parts:
            errors.append(f"Suspicious relative path in <{tag} {attr}={ref!r}>")
            continue
        if not (ROOT / local_path).exists():
            errors.append(f"Missing local static reference from <{tag}>: {ref}")


def validate_data_paths(script_refs: list[str], errors: list[str]) -> None:
    data_paths: set[str] = set()

    for script_ref in script_refs:
        script_path = normalise_local_path(script_ref)
        if not script_path or not script_path.endswith(".js"):
            continue

        script_text = read_text(ROOT / script_path, errors)
        for match in DATA_PATH_RE.findall(script_text):
            data_paths.add(match)

    if not data_paths:
        errors.append("No static data/*.json paths were found in dashboard scripts")
        return

    for data_path in sorted(data_paths):
        path = Path(data_path)
        if ".." in path.parts or path.parts[0] != "data":
            errors.append(f"Invalid dashboard data path: {data_path}")
            continue
        if not (ROOT / data_path).exists():
            errors.append(f"Dashboard data path does not exist: {data_path}")


def main() -> int:
    errors: list[str] = []
    html = read_text(INDEX, errors)

    parser = DashboardHtmlParser()
    if html:
        try:
            parser.feed(html)
        except Exception as exc:  # pragma: no cover - defensive parser guard
            errors.append(f"Could not parse index.html well enough for static checks: {exc}")

    validate_index(parser, errors)
    validate_local_refs(parser, errors)
    validate_data_paths(parser.scripts, errors)

    if errors:
        print("RaceIQ static app validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("RaceIQ static app validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())