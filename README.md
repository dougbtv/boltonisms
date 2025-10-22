# Boltonisms

![Boltonisms Header](public/header.png)

A dictionary of insider ski/trail terms from The Old Goats / Friends of Bolton.

You can view the live site @ [https://boltonisms.org/](https://boltonisms.org/)

## Features

- Dictionary-style layout with Merriam-Webster vibes
- Pulls data from Google Sheets
- Fast client-side search
- A-Z browsing and random term
- Clean, responsive design

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Enable Google Sheets API

The Google Sheets API needs to be enabled for this project:

1. Visit: https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=657765252963
2. Click "Enable API"
3. Wait a few minutes for changes to propagate

### 3. Build the site

Pull data from Google Sheets and build the static site:

```bash
npm run build
```

This will:
- Pull data from the Google Sheet
- Validate entries against the schema
- Generate `dist/boltonisms.json`, `dist/index.json`, and `dist/meta.json`
- Copy static assets to `dist/`

### 4. Run the dev server

```bash
npm run dev
```

Visit http://localhost:3000 to view the site.

## Available Commands

- `npm run pull` - Pull sheet data and generate JSON files
- `npm run validate` - Validate data against schema
- `npm run build` - Full build (pull → validate → copy assets)
- `npm run dev` - Start local dev server
- `npm run deploy` - Deploy to production server

## Project Structure

```
/
├─ dist/                         # Build output (ignored by git)
├─ public/                       # Static files (HTML, CSS)
├─ src/                         # Frontend JS modules
│  ├─ app.js                    # App bootstrap
│  ├─ router.js                 # Hash router
│  ├─ store.js                  # Data store
│  ├─ components/               # Reusable components
│  ├─ views/                    # Page views
│  └─ utils/                    # Utilities
├─ tools/                       # Build scripts
│  ├─ pull-sheet.mjs           # Google Sheets → JSON
│  ├─ validate.mjs             # Schema validation
│  ├─ build.mjs                # Orchestrates build
│  └─ dev-serve.mjs            # Dev server
├─ schema/                      # JSON schema
└─ package.json
```

## Google Sheets Format

The source sheet should have these columns:

| Term | Type | Definition 1 | Definition 2 | Definition 3 | Other forms | History | See also: | Example usage | Image | Attributed to: |
|------|------|--------------|--------------|--------------|-------------|---------|-----------|---------------|-------|----------------|

- **Term** (required): The headword
- **Type**: Part of speech (noun, verb, adjective, etc.)
- **Definition 1/2/3**: Up to 3 definitions
- **Other forms**: Comma-separated variations
- **History**: Etymology or backstory
- **See also**: Comma-separated related terms
- **Example usage**: Usage examples (separate with blank lines)
- **Image**: URL to an image
- **Attributed to**: Who coined/popularized the term

## Deployment

### Production Server (birdnetpi.local)

Deploy to production with a single command:

```bash
npm run deploy
```

This will:
1. Sync code to `doug@birdnetpi.local:/home/doug/boltonisms`
2. Copy credentials file securely
3. Install dependencies on remote
4. Run initial build
5. Set up systemd services:
   - `boltonisms.service` - Web server (runs on port 3000)
   - `boltonisms-build.timer` - Automatic hourly data updates

**Post-deployment:**
- Site runs at: http://birdnetpi.local:3000
- Data auto-updates every hour
- Service auto-restarts on reboot

**Useful commands:**
```bash
# Check service status
ssh doug@birdnetpi.local 'sudo systemctl status boltonisms'

# View logs
ssh doug@birdnetpi.local 'sudo journalctl -u boltonisms -f'

# Check build timer
ssh doug@birdnetpi.local 'sudo systemctl status boltonisms-build.timer'

# Manual rebuild
ssh doug@birdnetpi.local 'cd /home/doug/boltonisms && npm run build'

# Restart service
ssh doug@birdnetpi.local 'sudo systemctl restart boltonisms'
```

### Alternative Hosting

The `dist/` folder can also be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

## License

MIT
