# Orb Corporation website

Minimal, responsive, multi-page static website.

## Pages
- `/` Home
- `/about/` About
- `/products/` Product catalogue
- `/products/orb-lang/` Orb! overview
- `/products/orb-lang/downloads/` Orb! downloads
- `/products/tash/` TASH overview
- `/open-source/` Open-source projects
- `/contact/` Contact

## Local preview
Run `python -m http.server 8000` from this directory and open http://localhost:8000.

## Render deployment
Create a **Static Site** from this repository. Set Publish Directory to `.` and leave Build Command empty. This site expects to be hosted at the domain root.

## Logo
The header currently uses a temporary text-and-circle mark. Replace the `.brand-symbol` element in `assets/js/site.js` with your own logo image and add its CSS sizing rules in `assets/css/site.css`.

## Notes
Orb! download links are intentionally absent until verified release assets exist. The Orb! page describes WebAssembly/browser support as exploratory, not released. Update project statuses and repository details as needed.
