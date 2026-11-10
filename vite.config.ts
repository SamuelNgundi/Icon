import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const playerCardsDirectory = resolve(process.cwd(), 'public/player_cards');
const playerCardAssetsModuleId = 'virtual:player-card-assets';
const resolvedPlayerCardAssetsModuleId = `\0${playerCardAssetsModuleId}`;

function playerCardAssets() {
  return {
    name: 'player-card-assets',
    resolveId(id: string) {
      return id === playerCardAssetsModuleId ? resolvedPlayerCardAssetsModuleId : undefined;
    },
    load(id: string) {
      if (id !== resolvedPlayerCardAssetsModuleId) return undefined;
      const assets = readdirSync(playerCardsDirectory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /\.webp$/i.test(entry.name))
        .map((entry) => `/player_cards/${entry.name}`)
        .sort();
      return `export const PLAYER_CARD_ASSET_URLS = ${JSON.stringify(assets)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), playerCardAssets()],
});
