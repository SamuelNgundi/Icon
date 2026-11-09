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
- Squad export as a text file
- ICON database edits automatically saved in browser LocalStorage
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

The in-app ICON Database editor is the recommended way to maintain the active database. Additions, edits, and deletions are automatically saved to browser LocalStorage and are used by future drafts. The numeric `rating` field remains available in the data model for future use, but ratings are not displayed in the current card interface.

## Card assets

The supplied card frame is stored at:

[`public/icon-card-frame.png`](./public/icon-card-frame.png)

The favicon is stored at:

[`public/favicon.svg`](./public/favicon.svg)

## Data and privacy

The app is frontend-only and does not require accounts, authentication, or a backend. Tournament progress and ICON database edits are stored locally in the browser using LocalStorage. They remain available after refresh on the same browser/device, but are not shared across devices or browser profiles.
