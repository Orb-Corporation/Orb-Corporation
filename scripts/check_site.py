#!/usr/bin/env python3
"""Dependency-free checks for Orb Corporation's static website."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE_ORIGIN = "https://orb-corporation.onrender.com"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.links: list[tuple[str, str]] = []
        self.duplicate_ids: set[str] = set()
        self.missing_alt: list[str] = []
        self.title_count = 0
        self.h1_count = 0
        self.lang = ""
        self.description = False
        self.canonical = ""
        self.noindex = False
        self.in_title = False
        self.title_text = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang") or ""
        if tag == "title":
            self.title_count += 1
            self.in_title = True
        if tag == "h1":
            self.h1_count += 1
        if tag == "meta":
            if a.get("name", "").lower() == "description" and (a.get("content") or "").strip():
                self.description = True
            if a.get("name", "").lower() == "robots" and "noindex" in (a.get("content") or "").lower():
                self.noindex = True
        if tag == "link" and a.get("rel", "").lower() == "canonical":
            self.canonical = a.get("href") or ""
        if tag in {"a", "area", "link", "script", "img", "source", "video", "audio"}:
            for key in ("href", "src"):
                value = a.get(key)
                if value:
                    self.links.append((tag, value))
        if tag == "img" and "alt" not in a:
            self.missing_alt.append(a.get("src") or "(image without src)")
        element_id = a.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicate_ids.add(element_id)
            self.ids.add(element_id)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_text += data


def html_files() -> list[Path]:
    return sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)


def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def resolve_local(target_page: Path, raw_url: str) -> tuple[Path, str] | None:
    parsed = urlsplit(raw_url)
    if parsed.scheme or parsed.netloc or raw_url.startswith("//"):
        return None
    raw_path = unquote(parsed.path)
    if not raw_path:
        target = target_page
    elif raw_path.startswith("/"):
        target = ROOT / raw_path.lstrip("/")
    else:
        target = target_page.parent / raw_path

    if raw_path.endswith("/") or (not target.suffix and target.is_dir()):
        target = target / "index.html"
    elif not target.suffix and not target.exists():
        target = target / "index.html"
    return target.resolve(), unquote(parsed.fragment)


def main() -> int:
    pages = html_files()
    errors: list[str] = []
    warnings: list[str] = []
    parsers = {p: parse_page(p) for p in pages}

    for page, parser in parsers.items():
        rel = page.relative_to(ROOT).as_posix()
        if not parser.lang:
            errors.append(f"{rel}: missing html lang attribute")
        if parser.title_count != 1 or not parser.title_text.strip():
            errors.append(f"{rel}: expected exactly one non-empty title")
        if parser.h1_count != 1:
            errors.append(f"{rel}: expected exactly one h1, found {parser.h1_count}")
        if not parser.description:
            errors.append(f"{rel}: missing meta description")
        if not parser.noindex:
            expected_path = "/" if rel == "index.html" else "/" + rel.removesuffix("index.html")
            expected = SITE_ORIGIN + expected_path
            if parser.canonical != expected:
                errors.append(f"{rel}: canonical must be {expected}")
        if parser.duplicate_ids:
            errors.append(f"{rel}: duplicate id(s): {', '.join(sorted(parser.duplicate_ids))}")
        if parser.missing_alt:
            errors.append(f"{rel}: image(s) missing alt: {', '.join(parser.missing_alt)}")

        for tag, value in parser.links:
            local = resolve_local(page, value)
            if local is None:
                continue
            target, fragment = local
            if not target.exists() or not target.is_file():
                errors.append(f"{rel}: broken local {tag} target: {value}")
                continue
            if fragment and target.suffix.lower() in {".html", ".htm"}:
                target_parser = parsers.get(target)
                if target_parser is None:
                    target_parser = parse_page(target)
                if fragment not in target_parser.ids:
                    errors.append(f"{rel}: missing fragment #{fragment} in {target.relative_to(ROOT)}")

    sitemap = ROOT / "sitemap.xml"
    if not sitemap.exists():
        errors.append("sitemap.xml is missing")
    else:
        try:
            root = ET.parse(sitemap).getroot()
            locs = {
                (node.text or "").strip()
                for node in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
            }
            expected_locs = {
                SITE_ORIGIN + ("/" if p.relative_to(ROOT).as_posix() == "index.html"
                               else "/" + p.relative_to(ROOT).as_posix().removesuffix("index.html"))
                for p, parser in parsers.items() if not parser.noindex
            }
            for missing in sorted(expected_locs - locs):
                errors.append(f"sitemap.xml: missing page {missing}")
            for extra in sorted(locs - expected_locs):
                warnings.append(f"sitemap.xml: contains non-page or stale URL {extra}")
        except ET.ParseError as exc:
            errors.append(f"sitemap.xml: invalid XML: {exc}")

    robots = ROOT / "robots.txt"
    if not robots.exists() or "Sitemap:" not in robots.read_text(encoding="utf-8"):
        errors.append("robots.txt must declare the sitemap URL")

    print(f"Checked {len(pages)} HTML pages.")
    if warnings:
        print("\nWarnings:")
        print("\n".join(f"- {item}" for item in warnings))
    if errors:
        print("\nErrors:")
        print("\n".join(f"- {item}" for item in errors))
        return 1
    print("All local-link, anchor, metadata, canonical and sitemap checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
