heck yes — boltonisms.org is a perfect name. here’s a tight, “hand-to-another-agent” spec that gets you from a shared Google Sheet → a sweet dictionary-style site fed by a static JSON snapshot.

# Overview

**Project name:** Boltonisms
**Goal:** A dead-simple, sleek dictionary of insider ski/trail terms used by “The Old Goats” / “Friends of Bolton,” rendered from a Google Sheet into a static JSON artifact, then displayed by a lightweight JS frontend with a Merriam-Webster-inspired layout.

**Non-goals:** Full wiki, user auth, complex CMS.
**Primary users:** Crew members adding/editing terms in Google Sheets; everyone else reads on the site.
**Editing flow:** Editors update a shared Google Sheet → a Node script periodically pulls and normalizes into `dist/boltonisms.json` → frontend reads that file.

**Key requirements**

* Zero-database: content lives in Google Sheets; site reads a static JSON snapshot.
* Safe & simple deploy: deploy as static assets (Netlify/Vercel/GitHub Pages) or minimal Node static server.
* Clean dictionary look (numbered senses along a left “timeline” rail).
* Fast findability: search-as-you-type; A–Z browsing; random term.
* Shareable deep links per term (slugged URLs).
* Light images support (optional URL per entry).

---

# Architecture

## Data flow

1. **Google Sheets (source of truth)**

   * Shared to a GCP service account (JSON key file provided).
   * One sheet tab with a fixed header row (see schema below).

2. **Ingest & build (Node.js)**

   * A Node CLI (`tools/pull-sheet.mjs`) authenticates via service account and calls Sheets API v4.
   * Rows → normalized objects → validation → `dist/boltonisms.json` (and `dist/index.json` with index/search data).
   * Optional: generate per-term static HTML pages (SSG mode) or just ship a SPA that reads JSON.

3. **Frontend (Static JS)**

   * `/index.html` renders:

     * search bar, A–Z filter, latest/featured/random term
     * list/grid of terms with part of speech/type
   * `/t/:slug` renders a dictionary-style detail page:

     * headword, syllabification (optional), type
     * numbered definitions with left “timeline” rail
     * other forms, history, see also, examples, image, attribution

4. **Hosting**

   * Static hosting (Netlify/Vercel/GitHub Pages).
   * If cron polling is needed server-side, deploy the puller on GitHub Actions or a tiny cron on fly.io/Render to rebuild `dist/`.

## Environments & config

* `SHEET_ID` — Google Sheet ID.
* `GOOGLE_APPLICATION_CREDENTIALS` — path to the service account JSON (CI: use secret).
* `OUTPUT_DIR` — default `dist/`.
* `PUBLIC_BASE_URL` — for building canonical links/OG tags.
* `BUILD_STRATEGY` — `poll` (cron/Actions) or `manual` (run on demand).
* `ALLOW_PUBLISHED_TO_WEB` (optional): if set, can fetch CSV via published link instead of API.

## Security

* Never commit the service account JSON; use CI secrets.
* Service account gets **Viewer** access to the sheet only.
* Rate limit and exponential backoff on API pulls.

---

# Core Components

## 1) Re-loading mechanism (Pull & Static Render)

### Responsibilities

* Authenticate to Sheets API using the service account JSON.
* Read rows, map to a normalized schema.
* Validate & coerce types; log/fail fast on schema errors (missing `Term`, etc.).
* Generate:

  * `dist/boltonisms.json` — full dataset.
  * `dist/index.json` — lightweight index for search (term, slug, type, first line of defs, tags).
  * Optional: `dist/t/<slug>/index.html` if doing SSG per term.

### Data schema (normalized JSON)

Source columns:

```
Term | Type | Definition 1 | Definition 2 | Definition 3 | Other forms | History | See also: | Example usage | Image | Attributed to:
```

Normalized JSON object (per row):

```json
{
  "id": "auto-uuid-or-hash",
  "term": "feline",
  "slug": "feline",
  "type": "adjective",                  // from "Type"
  "definitions": [
    "of, relating to, or affecting cats or the cat family",
    "resembling a cat: such as",
    "sleekly graceful; sly, treacherous; stealthy"
  ],
  "otherForms": ["feline", "felinely", "felinity"],
  "history": "Cats have always provoked...",
  "seeAlso": ["cat", "mouse", "FG2"],   // split on comma
  "examples": [
    "They move with feline agility.",
    "the thief was eerily feline as he moved stealthily through the darkened rooms"
  ],
  "image": {
    "url": "",                          // optional
    "alt": ""
  },
  "attribution": "Mother Nature",       // or "Bill's Professor", etc.
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "sourceRow": 12                       // original row number for debugging
}
```

**Notes**

* `definitions` are compiled from Definition 1/2/3; blank cells ignored.
* If a definition includes nested bullets (e.g., “such as: a) b) c)”), keep as a single definition string; the UI will render sub-bullets if it detects `a :` / `b :` patterns.
* `seeAlso` split on commas, trimmed, de-duplicated.
* `examples` split by double newline or sentence boundary; trim quotes.
* `slug` = `term` lowercased, spaces → `-`, remove unsafe chars. Ensure uniqueness (append `-2`, `-3` if needed).
* `type` maps to a small set: `noun | verb | adjective | adverb | exclamation | place | phrase | slang | other`. For unknowns, use sheet value raw, but also fill `typeNorm` if it matches known set.

### File outputs

* `dist/boltonisms.json` (pretty-printed, ~ for debugging)
* `dist/index.json` (minified; fields: `term`, `slug`, `type`, `firstDef`, `seeAlso[]`)
* `dist/meta.json` (build timestamp, sheet etag/rev)

### Tooling

* `tools/pull-sheet.mjs` — pulls and writes JSON artifacts.
* `tools/validate.mjs` — schema validation (Ajv).
* `tools/build.mjs` — orchestrates pull → validate → write dist.
* `tools/dev-serve.mjs` — static file server for local dev (ESM, no framework).
* NPM scripts:

  * `npm run pull` → pull-sheet
  * `npm run build` → build artifacts + copy static assets
  * `npm run dev` → dev server with watch
  * `npm run validate` → schema check

### Scheduling options

* **GitHub Actions cron**: nightly/hourly build, push to `gh-pages` (static hosting), or upload `dist/` to Netlify/Vercel.
* **Netlify/Vercel build hook**: optional Google Apps Script that pings a webhook on sheet edits.
* **Tiny server cron**: run `node tools/build.mjs` every N minutes.

---

## 2) Front-end (Read & Render Static Data)

### Responsibilities

* Fetch `dist/boltonisms.json` (and `index.json`) at load.
* Provide global search (debounced, fuzzy on `term`, `firstDef`, `seeAlso`).
* Provide A–Z browsing, type filters, “Random term” button.
* Render a dictionary-style term page with:

  * Headword (big), type, pronunciation placeholder (optional later)
  * Sleek “timeline” rail on the left with numbered senses (1, 2, 3…)
  * Sections: “Other forms,” “Did you know?” (history), “See also,” “Examples,” “Attributed to”
  * Optional image with caption/alt.
* Good keyboard nav and accessibility.

### Pages & routing

* `/` — Home: search + featured/random + A–Z list.
* `/t/:slug` — Term detail.
* `/browse/:letter` — Filtered listing (optional, can be client-side only).
* Hash-based routing is fine for pure-static: `/#/t/fg2`. (Or use clean URLs if host supports SPA fallback.)

### UI/UX specifics (dictionary vibe)

* **Headword section**

  * `term` (display case = as entered). Subtle grey `type` on same line.
  * Optional syllable dots later (leave a placeholder hook).
* **Definitions**

  * Left vertical rail with markers for definition numbers (like a timeline).
  * Each definition is a block with number label (1, 2, 3).
  * If definition includes `a :`, `b:`, `c:`, render as sub-bulleted list.
* **Other forms**

  * Comma-separated pills (small rounded badges).
* **History = “Did you know?”**

  * Boxed callout style.
* **Examples**

  * Indented quotes list.
* **See also**

  * Linked pills to other terms (if slug exists), otherwise plain text.
* **Attribution**

  * Small footer line: `Attributed to: <name>`.

### Styling guidelines

* Vanilla CSS or Tailwind (your call). Keep it lightweight.
* Typography:

  * Headword: big, bold.
  * Type: small caps or muted grey.
  * Body: readable line-length (~65–75 chars).
* Layout:

  * Content column ~700–800px max-width, centered.
  * Left rail with absolute/relative positioned numbered markers aligned to definitions.
* Mobile:

  * Rail collapses into inline numbered bullets.

### Search specifics

* Client-side fuzzy search (mini library or simple includes).
* Fields: `term` (high weight), `firstDef` (medium), `seeAlso` (low).
* Debounce 150ms; highlight matches (optional).
* Keyboard: `/` focuses search; arrow keys navigate results; Enter opens.

### Accessibility

* Semantic HTML (lists for definitions, headings for term).
* Sufficient contrast; focus states visible.
* `aria-current` on active nav filters.
* Images require `alt` text; if missing, hide image from AT.

### Performance

* Ship `index.json` small enough for instant search (<100KB ideal).
* Lazy-load `boltonisms.json` on first term click if needed.
* Set caching headers on static host; versioned by hash or meta timestamp.

### Analytics (optional)

* Count page views per term (privacy-friendly; Plausible/GoatCounter).

---

## File/Folder layout

```
/
├─ dist/                         # build outputs (ignored in git except for gh-pages)
│  ├─ boltonisms.json
│  ├─ index.json
│  ├─ meta.json
│  └─ t/<slug>/index.html        # (optional SSG)
├─ public/
│  ├─ index.html                 # shell
│  ├─ favicon.ico
│  └─ styles.css                 # or Tailwind build output
├─ src/
│  ├─ app.js                     # bootstrap, router, data fetch
│  ├─ router.js                  # hash router
│  ├─ store.js                   # holds dataset & search index
│  ├─ views/
│  │  ├─ HomeView.js
│  │  ├─ TermView.js
│  │  └─ NotFoundView.js
│  ├─ components/
│  │  ├─ SearchBox.js
│  │  ├─ TermCard.js
│  │  ├─ DefinitionRail.js
│  │  └─ Pills.js
│  └─ utils/
│     ├─ slugify.js
│     ├─ fuzzy.js
│     └─ formatters.js
├─ tools/
│  ├─ pull-sheet.mjs             # Sheets API → JSON
│  ├─ validate.mjs               # Ajv schema checks
│  ├─ build.mjs                  # orchestrates pull→validate→dist
│  └─ dev-serve.mjs              # local static server
├─ schema/
│  └─ entry.schema.json
├─ .github/workflows/
│  └─ build.yml                  # cron build→deploy
├─ package.json
└─ README.md
```

---

## Google Sheets specifics

* **Header row must match exactly** (case insensitive OK, but consistent is better):
  `Term | Type | Definition 1 | Definition 2 | Definition 3 | Other forms | History | See also: | Example usage | Image | Attributed to:`

* **Validation suggestions**

  * `Term` required; `Type` recommended.
  * Definitions: at least one non-empty.
  * “See also:” comma-separated terms (no links).
  * “Image” is a URL; optional.
  * “Example usage” can contain multiple examples separated by blank lines.

* **Protected ranges** (optional): lock headers & type column.

---

## Acceptance criteria

* ✅ Running `npm run build`:

  * pulls the sheet via service account,
  * writes `dist/boltonisms.json`, `dist/index.json`, and `dist/meta.json`,
  * validates against `schema/entry.schema.json`,
  * exits non-zero on schema/required field errors.

* ✅ `npm run dev` serves `public/` + `dist/` locally;
  loading `/` shows search + list; clicking a term opens `/t/:slug`.

* ✅ Term page mimics dictionary style:

  * numbered definitions with a left rail,
  * sections for other forms, history (“Did you know?”), examples, see also, attribution,
  * handles multi-line examples & sub-bullets in definitions.

* ✅ Search finds terms by name and first definition; debounce; keyboard nav.

* ✅ Deep links: visiting `/t/fg2` loads FG2 even on hard refresh.

* ✅ CI job (GitHub Actions) on a schedule updates `dist/` and deploys.

---

## Stretch goals (nice-to-haves, later)

* Offline support via Service Worker caching of `index.json` & term pages.
* “Contribute a correction” button that opens a prefilled Google Form row.
* Auto-link “See also” if target term exists; show as plain text if not.
* Small “About” page explaining Old Goats / Friends of Bolton.
* Per-term Open Graph tags for prettier link unfurls (if SSG).


## Credentials

You will be using google sheets.

There is a .json authentication file available here in the project root: /goat-jargon-file-b455b2682342.json

The spreadsheet is available at: https://docs.google.com/spreadsheets/d/1x5WcMlprvYs3IHSbhI2rzt9xEZxAgi6w97Pu7UdHISI/edit?gid=0#gid=0



