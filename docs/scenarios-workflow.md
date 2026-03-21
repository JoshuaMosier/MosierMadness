# Scenario Workflow

Yearly workflow for refreshing the `/scenarios` page from the admin export and the standalone exact engine.

## Repos

- Site repo: `C:\Users\joshr\Documents\Projects\Programming\MosierMadness`
- Standalone engine: `C:\Users\joshr\Documents\Projects\Programming\bracket-scenarios`

The site consumes a generated artifact at `static/generated/scenarios/current.json`.
The standalone repo owns the exact counting and writes analysis outputs into `data/output/`.

## Normal live-tournament workflow

### 1. Export from the admin page

1. Open the Mosier Madness admin page.
2. Use the `Scenario Export` action.
3. This creates a frozen `scenario-input-*.json` export for the current tournament state.

What to expect:

- The browser downloads the JSON file.
- The admin export also tries to write a copy into the sibling standalone repo at:
  - `C:\Users\joshr\Documents\Projects\Programming\bracket-scenarios\data\input\`

If the file does not appear in `data/input/`, manually move the downloaded `scenario-input-*.json` there.

### 2. Run the standalone exact generation

Open PowerShell in:

```powershell
C:\Users\joshr\Documents\Projects\Programming\bracket-scenarios
```

For the usual live round-one workflow, run:

```powershell
.\run-latest-export.bat
```

That batch file:

- finds the newest `scenario-input-*.json` in `data/input/`
- runs the exact Rust engine
- uses `--assume-higher-seed-through-round 1`
- writes fresh outputs into `data/output/`

Important outputs:

- `*-exact-higher-seed-through-round-1.json`
- `*-exact-higher-seed-through-round-1.csv`
- `*-exact-higher-seed-through-round-1.tsv`
- `*-exact-higher-seed-through-round-1-report.html`

Notes:

- The HTML report is still useful as a standalone artifact, but the site no longer links to it directly.
- The first run on a machine can take longer because Rust may need to compile in release mode.

### 3. Import the latest generated artifact back into the site

Preferred path:

1. Open the Mosier Madness admin page.
2. Use `Import Latest Scenario Results`.

That import action:

- finds the latest exact JSON in `..\bracket-scenarios\data\output\`
- converts it into the site artifact shape
- writes:
  - `static/generated/scenarios/current.json`

CLI fallback:

Open PowerShell in:

```powershell
C:\Users\joshr\Documents\Projects\Programming\MosierMadness
```

Run:

```powershell
npm run scenarios:import
```

### 4. Refresh the site

If the dev server is already running, refresh the page.

If you want to verify production build health, run:

```powershell
npm run build
```

## What the site now supports

Generated snapshot mode supports:

- exact `Win Chances`
- exact `Full Standings`
- generated rooting guide
- single-game preview for currently known games

Sweet 16 and later still fall back to the browser-exact mode for full multi-game filtering.

## Common commands

### Standard exact run

```powershell
.\run-latest-export.bat
```

### Exact run with Monte Carlo validation

```powershell
.\run-latest-export.bat --monte-carlo-samples 5000000
```

### Manual exact run with a different assumption

```powershell
cargo run --release -- data/input/scenario-input-2026-20260320T171611Z.json --assume-higher-seed-through-round 2
```

### Re-import into the site from the terminal

```powershell
npm run scenarios:import
```

## Troubleshooting

### Export succeeded in the browser but the standalone repo did not get a copy

- Move the downloaded `scenario-input-*.json` into:
  - `C:\Users\joshr\Documents\Projects\Programming\bracket-scenarios\data\input\`

### `run-latest-export.bat` uses the wrong file

- Delete or move older exports from `data/input/`, or run the Rust command manually against the exact file you want.

### Admin import or `npm run scenarios:import` does not find a generated output

- Confirm the standalone exact run produced a fresh `*-exact*.json` in:
  - `C:\Users\joshr\Documents\Projects\Programming\bracket-scenarios\data\output\`

### The scenarios page looks stale

- Re-run `npm run scenarios:import`
- Refresh the browser
- If needed, restart the dev server

## Files involved

- Admin export builder:
  - `src/lib/server/admin/scenarioExport.ts`
- Admin import builder:
  - `src/lib/server/admin/scenarioImport.ts`
- Admin import endpoint:
  - `src/routes/api/admin/scenario-import/+server.ts`
- Site importer:
  - `scripts/import_latest_scenario_artifact.mjs`
- Imported site artifact:
  - `static/generated/scenarios/current.json`
- Generated snapshot page:
  - `src/lib/components/scenarios/GeneratedScenariosPage.svelte`
- Generated rooting guide:
  - `src/lib/components/scenarios/GeneratedRootingGuideTab.svelte`
