# FC 26 ICON DRAFT

An offline tournament companion for drafting legendary football ICONs and building custom squads.

## Features

- Supports 4–8 tournament participants
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

Player data is stored in:

[`src/data/icons.ts`](./src/data/icons.ts)

Add players to the appropriate `ICONS_BY_POSITION` group. Each player includes:

- `id`
- `name`
- `rating`
- `position`
- `nation`
- `nationCode`
- Optional `secondary` eligible positions

The numeric `rating` field remains available in the data model for future use, but ratings are not displayed in the current card interface.

## Card assets

The supplied card frame is stored at:

[`public/icon-card-frame.png`](./public/icon-card-frame.png)

The favicon is stored at:

[`public/favicon.svg`](./public/favicon.svg)

## Data and privacy

The app is frontend-only and does not require accounts, authentication, or a backend. Tournament progress is stored locally in the browser using LocalStorage.

