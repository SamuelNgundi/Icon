export function getPlayerCardImageUrl(playerId: string): string {
  return `/player_cards/${playerId}.webp`;
}

export const HIGH_PRIORITY_IMAGE_URLS = ['/favicon.svg'];
