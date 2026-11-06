import type { IconPlayer } from '../data/icons';
import PlayerCard, { Flag } from './PlayerCard';

export default function PlayerModal({ player, onClose }: { player: IconPlayer; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="player-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close player details"><span aria-hidden="true">×</span></button><PlayerCard player={player} /><div className="modal-details"><span className="eyebrow">ICON PROFILE / {player.position}</span><h2>{player.name}</h2><p>{player.nation} <Flag code={player.nationCode} /></p><div className="detail-meta"><span>PRIMARY POSITION <b>{player.position}</b></span><span>CARD TYPE <b>ICON</b></span></div></div></div></div>;
}
