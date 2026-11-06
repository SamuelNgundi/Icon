import type { IconPlayer } from '../data/icons';

function Flag({ code }: { code: string }) {
  const normalizedCode = code.trim().toUpperCase();
  const flag = /^[A-Z]{2}$/.test(normalizedCode)
    ? String.fromCodePoint(...[...normalizedCode].map((letter) => 127397 + letter.charCodeAt(0)))
    : '🌐';
  return <span className="flag" title={normalizedCode}>{flag}</span>;
}

export default function PlayerCard({ player, onClick, small = false }: { player: IconPlayer; onClick?: () => void; small?: boolean }) {
  return (
    <button className={`player-card ${small ? 'player-card--small' : ''}`} onClick={onClick} style={{ ['--delay' as string]: `${(player.id.length % 8) * 0.04}s` }}>
      <img className="card-frame" src="/icon-card-frame.png" alt="" />
      <div className="card-glow" />
      <div className="card-top"><span className="card-pos">{player.position}</span></div>
      <div className="player-art"><div className="silhouette"><span className="player-name">{player.name}</span></div><span className="card-nation"><Flag code={player.nationCode} /></span></div>
      <div className="card-info"><span>ICON <i>◆</i></span><small>{player.nation}</small></div>
    </button>
  );
}

export { Flag };
