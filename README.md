# matmjr.github.io

Personal portfolio site for **Marco Mialaret Júnior** — Senior Data Architect & Professor, PhD in Computer Science (UFPE).

**Live:** [matmjr.github.io](https://matmjr.github.io/)

## About

A single-page site covering background, professional experience, education, publications and a selection of projects pulled from [github.com/MatmJr](https://github.com/MatmJr). Content is sourced from an up-to-date CV and kept in sync with it.

## Stack

A mixed site. The home pages and the study guides are hand-written HTML, CSS and JavaScript; the home pages carry an empty front-matter block only so Jekyll can fill in the Courses section with the disciplines of the latest semester. The course materials under `aulas/` are written in Markdown and built by Jekyll, which GitHub Pages runs on every push. Jekyll only processes files that start with a `---` front-matter block; everything else is published as-is. Fonts are loaded from Google Fonts (Fraunces, Inter, IBM Plex Mono); icons are hand-written inline SVG.

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
aulas/            course materials (Jekyll, Portuguese only)
  index.md        catalog, grouped by semester
  feed.xml        RSS feed of new lessons
  2027-1/
    engenharia-de-dados/
      index.md                 course page (layout: disciplina)
      aula-01-introducao.md    one lesson per file (layout: aula, the default under aulas/)
_layouts/         base, catalogo, disciplina and aula templates (same top bar and footer as the home page)
_config.yml       Jekyll settings; no theme (the default Primer theme would overwrite assets/css/style.css); excludes README, Gemfile and studies/fonte
assets/css/aulas.css  styles for the Jekyll pages (prose, code highlighting, lesson lists)
```

## Publishing a lesson

1. Create `aulas/<semester>/<course>/aula-NN-topic.md` (lowercase, no accents or spaces). Lessons are ordered by file name, so keep the number zero-padded.
2. Start it with front matter — only `title` is required:

   ```yaml
   ---
   title: Pipelines com PySpark
   date: 2027-03-15
   resumo: One-line summary shown in the lesson list and the RSS feed.
   slides: slides/aula-03.pdf          # file in the course folder, or an https:// link
   notebook: notebooks/aula-03.ipynb   # adds "Abrir no Colab" and "Baixar notebook" buttons
   materiais:
     - nome: Lista de exercícios
       url: listas/lista-03.pdf
   ---
   ```
3. Write the lesson in Markdown. Code blocks (```` ```python ````) are highlighted; formulas go between `$$` (inline or as their own paragraph) and are rendered with KaTeX; `{: .nota}` after a quote turns it into a highlighted note. If the text contains `{{` or `{%`, wrap it in `{% raw %}…{% endraw %}`.
4. Push. GitHub Pages rebuilds in about a minute; the lesson shows up in the course page, the catalog count and the feed.

A new course is a new folder with an `index.md` using `layout: disciplina` and the fields `title`, `semestre`, `instituicao` and `descricao`. A new semester is just a new folder.


Features:
- English and Portuguese versions, with an EN | PT switch in the top bar of the home pages and study guides (course materials are Portuguese only)
- Light/dark theme, following the OS preference by default and toggleable (persisted in `localStorage`)
- Responsive layout with a mobile nav
- Scroll-spy navigation and scroll-reveal animations
- No backend — the Contact section links directly to email/social instead of a fake form

## Running locally

The HTML pages work with any static server (`python -m http.server 8000`), but `aulas/` needs Jekyll. With Ruby installed:

```bash
bundle install
bundle exec jekyll serve
```

Or with Docker, no Ruby needed: in VS Code, run the task **Pré-visualizar site (Jekyll)** (`Ctrl+Shift+P` → *Tasks: Run Task*), defined in `.vscode/tasks.json`. It serves the site at `http://localhost:4000` and reloads the page whenever a file is saved; **Parar pré-visualização** stops it. Static previews such as VS Code's Live Preview only show the plain HTML pages, not `aulas/`.

The preview writes `_site/` and `Gemfile.lock`, which are git-ignored.

## Deployment

Served by GitHub Pages from the `main` branch of this repo (classic "deploy from a branch" mode, which runs Jekyll).
