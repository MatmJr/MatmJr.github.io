# matmjr.github.io

Personal portfolio site for **Marco Mialaret Júnior** — Senior Data Architect & Professor, PhD in Computer Science (UFPE).

**Live:** [matmjr.github.io](https://matmjr.github.io/)

## About

A single-page site covering background, professional experience, education, publications and a selection of projects pulled from [github.com/MatmJr](https://github.com/MatmJr). Content is sourced from an up-to-date CV and kept in sync with it.

## Stack

Plain HTML, CSS and JavaScript — no build step, no framework, no dependencies. Fonts are loaded from Google Fonts (Fraunces, Inter, IBM Plex Mono); icons are hand-written inline SVG.

```
index.html        home page (English)
pt.html           home page (Portuguese)
assets/
  css/style.css   design tokens, layout, light/dark theme
  js/script.js    theme toggle, language switch, mobile nav, scroll-spy, reveal-on-scroll
  images/         favicon, portrait and study previews
studies/          study guides, linked from the Studies section
  index.html      sandpile guide (Portuguese)
  en.html         sandpile guide (English)
  estilo.css      guide-only styles, layered on top of assets/css/style.css
  fonte/          templates and generator (gerar.py) for the guide pages
```

Features:
- English and Portuguese versions, with an EN | PT switch in the top bar on every page
- Light/dark theme, following the OS preference by default and toggleable (persisted in `localStorage`)
- Responsive layout with a mobile nav
- Scroll-spy navigation and scroll-reveal animations
- No backend — the Contact section links directly to email/social instead of a fake form

## Running locally

Static files only — serve the directory with anything, e.g.:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

Served directly by GitHub Pages from the `main` branch of this repo.
