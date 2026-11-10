import type { IconPlayer } from '../data/icons';
import { useState } from 'react';
import { getPlayerCardImageUrl } from '../utils/imageAssets';

function Flag({ code }: { code: string }) {
  const normalizedCode = code.trim().toUpperCase();
  const flag = /^[A-Z]{2}$/.test(normalizedCode)
    ? String.fromCodePoint(...[...normalizedCode].map((letter) => 127397 + letter.charCodeAt(0)))
    : '🌐';
  return <span className="flag" title={normalizedCode}>{flag}</span>;
}

export default function PlayerCard({ player, onClick, small = false }: { player: IconPlayer; onClick?: () => void; small?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const eliteCard = player.rating >= 93;

  return (
    <button className={`player-card ${small ? 'player-card--small' : ''} ${eliteCard ? 'player-card--elite' : ''}`} onClick={onClick} aria-label={`View ${player.name} ICON card`} style={{ ['--delay' as string]: `${(player.id.length % 8) * 0.04}s` }}>
      {!imageFailed ? <img className="player-card-image" src={getPlayerCardImageUrl(player.id)} alt={`${player.name} ICON card`} onError={() => setImageFailed(true)} /> : <span className="player-card-fallback">ICON<br />CARD</span>}
    </button>
  );
}

export { Flag };
