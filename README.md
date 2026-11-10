# Orb Corporation website

Minimal, responsive, multi-page static website for Orb Corporation.

## Pages

- `/` Home
- `/about/` About
- `/products/` Product catalogue
- `/products/orb-lang/` Orb! overview and browser learning preview
- `/products/orb-lang/downloads/` Orb! source archive and build notes
- `/products/tash/` TASH overview
- `/open-source/` Public repositories
- `/docs/` Documentation hub
- `/roadmap/` Project focus areas
- `/updates/` Website and project announcements
- `/contribute/` Contribution guide
- `/legal/` Privacy and general notice
- `/contact/` Contact channels

## Local preview

Run `python -m http.server 8000` from this directory and open http://localhost:8000.

## Render deployment

Create a **Static Site** from this repository. Set Publish Directory to `.` and leave Build Command empty. This site expects to be hosted at the domain root. A custom domain is not hard-coded in the source.

## Structure

- `assets/css/site.css` — styles and responsive layout
- `assets/js/site.js` — shared navigation and footer
- `assets/favicon.svg` — site icon
- `Orb Corporation Orbital Logo-3.png` — shared brand image

The logo is served locally from this repository. The website uses system font stacks and does not need Google Fonts.

The Orb! page includes a small browser-side learning preview for a limited subset of the language. It is not the native Orb! compiler; the native compiler and complete language implementation remain in the Orb! repository.

## Search indexing

`robots.txt` allows public crawling. A `sitemap.xml` is intentionally not included until the production hostname is fixed; sitemap entries require absolute canonical URLs. Add it after the public domain is final.

## Content maintenance

Project pages describe capabilities from their public repositories. Update them when the repositories change. Do not advertise experimental work as production-ready or list unverified binaries as releases.

## Notes

Orb! currently targets Linux x86-64. The downloads page distinguishes the repository ZIP archive from a native installer. TASH is experimental LAN software and is not described as an internet-facing service.
