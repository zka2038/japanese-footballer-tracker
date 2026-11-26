# Kaigai 海外組

A fan-made tracker for every Japanese footballer in Europe: appearances, goals, assists, FotMob match ratings, season trends and official highlight videos. Built with Next.js 16, Tailwind CSS 4 and Motion, with a design language inspired by Apple's product pages.

**Coverage:** Premier League, LaLiga, Bundesliga, Serie A, Ligue 1, Eredivisie, Belgian Pro League, Scottish Premiership and Liga Portugal, plus the Champions League, Europa League, Conference League, domestic cups and Japan national-team matches.

## Pages

| Route | What's there |
|---|---|
| `/` | Season totals, standout performances from the last 7 days, season leaders, latest highlights, upcoming fixtures, league breakdown |
| `/players` | Every player, with league, position, search and sort filters (shareable via URL) |
| `/players/[slug]` | Profile, season stats by competition, rating trend chart, full match log, percentile profile, goal/assist highlights |
| `/matches` | Results feed grouped by day with every Japanese player's rating and contributions, plus upcoming fixtures |
| `/leaderboards` | Goals, assists, G+A, rating, G+A/90, xG, xA, minutes, appearances, POTM, filtered by competition |
| `/highlights` | Official highlight videos from every match where a Japanese player scored or assisted |

## How the data works

```
GitHub Actions (every 3h) → npm run sync → FotMob → data/snapshot.json → commit → redeploy
```

- **The site never calls a data provider at request time.** Every page is prerendered from `data/snapshot.json`, so it's fast, free to host, and a provider outage never breaks the UI.
- **Discovery** (`npm run discover`) scans every squad in the tracked leagues for Japanese nationals and writes `data/roster.json`. It runs automatically every Monday.
- **Match details** are cached in `data/matches/` once a match finishes, so each sync only fetches new games. Highlights often appear a few hours late, so recent matches without a video are rechecked for up to 5 days.
- **Highlights** come from FotMob's match pages first. FotMob doesn't link every game (UEFA competitions especially), so when a tracked player scored or assisted and there's no video, the sync searches YouTube (`lib/highlights/`). A strict title matcher requires both teams, a "highlights" phrase and the right scoreline, and rejects reactions, video-game simulations, youth and women's games. It also needs a public, embeddable video of highlight length. This needs a free `YOUTUBE_API_KEY`; results are cached in `data/highlight-search.json`, and each run makes at most 12 searches so it stays inside the free quota.
- **Validation:** a snapshot is only written if it passes integrity checks (`lib/snapshot-validate.ts`). A bad or partial fetch never replaces good data.
- **Japanese names** come from Wikidata (`npm run ja-names` → `config/ja-names.json`), accepting only entities that are Japanese association football players. `config/players.ts` holds a hand-written fallback.

### Providers

The data layer is provider-agnostic (`lib/providers/types.ts`):

- **FotMob** (default, `lib/providers/fotmob`) uses FotMob's *undocumented* public JSON API. It's rich (ratings, xG, lineups, highlight links) but unofficial, and it can change without notice. That's fine for a personal project; check FotMob's terms before using it for anything commercial.
- **API-Football** (fallback, `lib/providers/api-football`) is the official, documented API. Set `API_FOOTBALL_KEY` and it takes over automatically if FotMob fails, or set `DATA_PROVIDER=api-football` to make it primary. It's incremental and budget-aware (`API_FOOTBALL_BUDGET`, default 95 requests/run), so it fits the free tier's 100 requests/day, though a first backfill may take a few days.

### YouTube key (optional, recommended)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project, enable **YouTube Data API v3**, and create an **API key** (restrict it to that API).
2. Add it as a GitHub repository secret named `YOUTUBE_API_KEY` (Settings → Secrets and variables → Actions).
3. For local runs, put `YOUTUBE_API_KEY=...` in `.env.local` (git-ignored) and run `npm run sync`.

If FotMob's response shape changes, the normalizers in `lib/providers/fotmob/normalize.ts` are the only code to update. The tests in `tests/` use trimmed real responses, so they catch shape changes.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 (a snapshot is committed, so no sync is needed)
npm run sync         # refresh stats for the current roster
npm run discover     # rescan leagues for players, then sync
npm run ja-names     # look up native names for new players
npm test             # normalizer, stats and validation tests
npm run build        # static production build
```

### Customizing

- **Add a league:** add its FotMob id to `TRACKED_LEAGUES` in `config/competitions.ts` (e.g. `48` Championship, `146` 2. Bundesliga), then run `npm run discover`.
- **Add or hide a player:** use `EXTRA_PLAYERS` / `EXCLUDED_PLAYERS` in `config/players.ts`.
- **New season:** update `CURRENT_SEASON` and `SEASON_START` in `config/competitions.ts`.

## Deploying

1. Push to GitHub and import the repo on [Vercel](https://vercel.com) (no settings or env vars needed).
2. The `Sync data` workflow (`.github/workflows/sync.yml`) commits fresh data every 3 hours, which triggers a redeploy. To use the fallback, add `API_FOOTBALL_KEY` as a repository secret.
3. `CI` runs lint, types, tests and a build on every PR.

## Project layout

```
app/                 routes (all statically prerendered)
components/          UI: nav, cards, charts, segmented control, video lightbox…
config/              tracked leagues, roster overrides, Japanese names
data/                snapshot.json, roster.json, matches/ cache (generated)
lib/
  data.ts            server-only queries over the snapshot → view models
  stats.ts           aggregation, scopes, rating bands (shared with client)
  providers/         fotmob/, api-football/, http helpers, provider interface
scripts/             sync, ja-names
tests/               vitest + trimmed FotMob fixtures
```

## Credits

Statistics and ratings © FotMob / their data partners. Highlight videos are embedded from official league and broadcaster YouTube channels (privacy-enhanced mode). Player and club images are served by FotMob's CDN. This is an independent, non-commercial fan project, not affiliated with any club, league, federation or data provider.
