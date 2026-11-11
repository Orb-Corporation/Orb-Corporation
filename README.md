# Orb Corporation website

Minimal, responsive, multi-page static website for Orb Corporation.

## Pages

- `/` Home
- `/about/` About
- `/products/` Product catalogue
- `/products/orb-lang/` Orb! overview and browser learning preview
- `/products/orb-lang/downloads/` Orb! source archive and build notes
- `/products/tash/` TASH overview
- `/products/easy-file-transportation/` Easy File Transportation project overview
- `/products/filerora/` Filerora project overview
- `/products/universal-file-viewer/` Universal File Viewer prototype overview
- `/open-source/` Public repositories
- `/docs/` Documentation hub
- `/roadmap/` Project focus areas
- `/updates/` Website and project announcements
- `/contribute/` Contribution guide
- `/legal/` Privacy and general notice
- `/contact/` Contact channels

## Local preview

Run `python -m http.server 8000` from this directory and open http://localhost:8000.

Run the dependency-free site checks with `python scripts/check_site.py`. GitHub Actions runs the same checks on pushes and pull requests to `main`.

## Render deployment

Create a **Static Site** from this repository. Set Publish Directory to `.` and leave Build Command empty. This site expects to be hosted at the domain root. A custom domain is not hard-coded in the source.

## Structure

- `assets/css/site.css` — styles and responsive layout
- `assets/js/site.js` — shared navigation and footer
- `assets/favicon.svg` — site icon
- `scripts/check_site.py` — dependency-free local website checks
- `.github/workflows/validate-site.yml` — automatic checks on pushes and pull requests
- `Orb Corporation Orbital Logo-3.png` — shared brand image

The logo is served locally from this repository. The website uses system font stacks and does not need Google Fonts.

The Orb! page includes a small browser-side learning preview for a limited subset of the language. It is not the native Orb! compiler; the native compiler and complete language implementation remain in the Orb! repository.

## Search indexing

The site publishes canonical URLs, an XML sitemap and a sitemap reference in `robots.txt`. The current canonical origin is the temporary Render address: `https://orb-corporation.onrender.com`.

When a custom domain is configured, update the canonical and `og:url` values in every public HTML page, the `SITE_ORIGIN` constant in `scripts/check_site.py`, `sitemap.xml` and the sitemap URL in `robots.txt` in the same change. Do not leave both the Render hostname and the custom domain indexed as separate canonical versions.

## Content maintenance

Project pages describe capabilities from their public repositories. Update them when the repositories change. Do not advertise experimental work as production-ready or list unverified binaries as releases.

## Notes

Orb! currently targets Linux x86-64. The downloads page distinguishes the repository ZIP archive from a native installer. TASH is experimental LAN software and is not described as an internet-facing service.
