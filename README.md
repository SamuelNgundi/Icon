# FC 26 ICON DRAFT

An offline tournament companion for drafting legendary football ICONs and building custom squads.

## Features

- Supports 4–6 tournament participants
- Randomly generates 10 position-aware ICONs per participant
- Independent formation selection for every participant:
  - **4-1-3-1**: two wingers and one striker
  - **4-1-2-2**: one winger and two strikers
- One-by-one or reveal-all draft experience
- Tactical pitch view and card collection view
- Player detail modal with nationality and position
- Squad redraw and tournament reset controls
- Themed confirmation dialogs
- LocalStorage persistence across browser refreshes
- Versioned JSON backup export/import for tournament progress and draft history
- Squad export as a text file
- Temporary ICON database edits with source export
- Fullscreen presentation mode
- Responsive desktop and mobile layouts

## Requirements

- Node.js 18 or newer
- npm

## Getting started

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Available scripts

```bash
npm run dev       # Start the development server
npm run build     # Type-check and create a production build
npm run preview   # Preview the production build locally
```

## Maintaining the ICON database

The bundled starter player data is stored in:

[`src/data/icons.ts`](./src/data/icons.ts)

Add players to the appropriate `ICONS_BY_POSITION` group for the starter database. Each player includes:

- `id`
- `name`
- `rating`
- `position`
- `nation`
- `nationCode`
- Optional `secondary` eligible positions

The bundled `src/data/icons.ts` file is the source of truth. In-app additions, edits, and deletions are temporary for the current page session. Use **EXPORT icons.ts** in the ICON Database screen, then update the bundled file to keep those changes after reload. The numeric `rating` field is used by draft fairness and elite-card effects.

## Tournament backups

Open **Draft History** and choose **EXPORT BACKUP** to download a versioned JSON backup containing the current tournament and full draft history. To restore it on this or another browser, choose **IMPORT BACKUP** and select the JSON file. The app validates the backup before writing anything and asks for confirmation because importing replaces the currently saved tournament and history. Existing unversioned LocalStorage records are validated and migrated the next time they are read.

## Card assets

Player card images are stored in `public/player_cards/` and are loaded using
their matching ICON database ID, for example `pele.webp` for the `pele` ID.
When adding an ICON, add a matching WebP asset or the card will use its fallback.

The favicon is stored at:

[`public/favicon.svg`](./public/favicon.svg)

## Data and privacy

The app is frontend-only and does not require accounts, authentication, or a backend. Tournament progress and draft history are stored locally in versioned LocalStorage records. They remain available after refresh on the same browser/device, but are not shared across devices or browser profiles unless you manually export and import a backup.
