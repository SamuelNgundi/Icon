const CARD_IMAGE_ALIASES: Record<string, string> = {
  bekenbauer: 'beckenbauer',
  dalglish: 'dalgish',
  eto: 'etoo',
  makalele: 'makelele',
};

export function getPlayerCardImageUrl(playerId: string): string {
  const imageId = CARD_IMAGE_ALIASES[playerId] ?? playerId;
  return `/player_cards/${imageId}.webp`;
}

export const HIGH_PRIORITY_IMAGE_URLS = ['/favicon.svg'];
