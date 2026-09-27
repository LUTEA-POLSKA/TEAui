# Deployment

The Showcase and the documentation build to **one static directory** that works
on any host — a domain root, GitHub Pages, Vercel, or a file share. There is no
server component, no rewrite rules and no `404.html` fallback.

```bash
npm run site:build   # domain root  -> dist-site/
npm run site:serve   # serve dist-site at http://localhost:4175
```

For a project subpath:

```bash
BASE_PATH=/TEAui/ npm run site:build
BASE_PATH=/TEAui/  npm run site:serve
```

## Why no server config is needed

Two decisions, taken earlier rather than retrofitted, are what make the site
host-agnostic:

- **Hash routing.** Every route lives in the URL fragment, so a host only ever
  serves files. A path-based router would need rewrite rules; this needs none.
- **A configurable `base`.** Asset URLs are emitted relative to `BASE_PATH`, so
  the same source builds for `/` and for `/TEAui/`.

The build also writes `.nojekyll`, because GitHub Pages runs Jekyll by default
and Jekyll silently drops any path starting with `_` — which is exactly where
Vite puts shared chunks. Without it, a deploy 404s on precisely the files the
bundler decided to share.

## Layout of the artefact

```text
dist-site/
  index.html        the Showcase
  assets/…
  .nojekyll
  docs/
    index.html      the documentation
    assets/…
```

## GitHub Pages — read this first

**GitHub Pages is not available for a private repository.** On free and Team
plans, Pages requires the source repository to be public; private-repository
Pages exists only on GitHub Enterprise Cloud. TEA UI is private by design, so
there are three real options.

### Option A — Vercel, private repo, no code exposure (recommended)

The Showcase and the docs are ordinary static builds, so Vercel needs no adapter
and no rewrite table.

1. Import the repository in Vercel (private repositories are fine).
2. Framework preset: **Vite**. Build command `npm run site:build`. Output `dist-site`.
3. Leave `BASE_PATH` unset — Vercel serves from the domain root.

Every push gets a preview deployment; `main` gets production. The repository
stays private.

### Option B — GitHub Pages on a public mirror

If Pages specifically is wanted, publish a **separate, public, build-output-only**
repository.

1. Build here: `BASE_PATH=/TEAui/ npm run site:build`.
2. Push `dist-site/` to the public repo, from a `gh-pages` branch or with
   Pages configured for that branch.
3. Set `Settings → Pages → Source: Deploy from a branch → gh-pages / (root)`.

The TEA UI source stays private; only the compiled bundle becomes public, which
is a normal arrangement for a design-system demo. The trade is that the bundle
is readable — someone can inspect the compiled components, though not the source,
the audit or the history.

### Option C — make this repository public

Then it is one click:

1. `Settings → Pages → Build and deployment → Source: GitHub Actions`.
2. Optionally add a repository variable `SITE_BASE_PATH=/TEAui/`
   (the workflow defaults to that already).

This publishes the source, the audit documents and the history. Only worth it if
the design system is meant to be open.

### What the workflow does before deploying

The `Deploy static site` workflow does not just build — it **serves the artefact
from a subpath and requests every route** before uploading. A deploy that only
breaks in production is a deploy that breaks every time, so a broken `base`
fails the job rather than the visitor.

## Continuous integration

`ci.yml` runs the gate on every push and pull request: package boundaries,
typecheck, lint, tests, the stylesheet build, the library build, the public
export contract and the measured tree-shaking. Each of those is a separate step
with its own name, so a red build says which rule broke rather than just "CI
failed".

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_PATH` | `/` | Asset base path. `/TEAui/` for a Pages project. |
| `SITE_DIR` | `dist-site` | What `site:serve` serves. |
| `PORT` | `4175` | Port for `site:serve`. |
| `SITE_BASE_PATH` | `/TEAui/` | Repository variable read by the Pages workflow. |

## Private npm distribution

The packages are published to npm with `--access restricted`, which means a
GitHub organisation or team must be on the package's access list. For a package
to be installed from a private registry, the machine also needs a `.npmrc` with an
auth token; the CI workflow receives it as `NPM_TOKEN`.

Consumers on `main` are a bad idea: a moving target is not a version. The
release job versions from a changeset, so a version always corresponds to a
merged change and a changelog entry.
