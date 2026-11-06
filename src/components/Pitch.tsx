import type { IconPlayer, Position } from '../data/icons';
import type { Formation } from '../types';
import PlayerCard from './PlayerCard';

const positionLabel: Record<Position, string> = { GK: 'Goalkeeper', CB: 'Centre Back', LB: 'Left Back', RB: 'Right Back', CDM: 'Defensive Mid', CM: 'Centre Mid', CAM: 'Attacking Mid', LW: 'Left Wing', RW: 'Right Wing', ST: 'Striker' };

export default function Pitch({ players, formation, onSelect }: { players: IconPlayer[]; formation: Formation; onSelect: (player: IconPlayer) => void }) {
  const rows: Position[][] = formation === 'double-striker'
    ? [['ST', 'ST'], ['LW', 'CAM', 'RW'], ['CDM'], ['LB', 'CB', 'CB', 'RB'], ['GK']]
    : [['ST'], ['LW', 'CAM', 'RW'], ['CDM'], ['LB', 'CB', 'CB', 'RB'], ['GK']];
  const positionIndexes = new Map<Position, number>();
  return <div className="pitch"><div className="pitch-lines"><div className="center-circle" /><div className="halfway" /><div className="penalty top" /><div className="penalty bottom" /></div>{rows.map((row, rowIndex) => <div className={`pitch-row row-${rowIndex}`} key={row.join('-')}>{row.map((position, positionIndex) => { const index = positionIndexes.get(position) ?? 0; positionIndexes.set(position, index + 1); const player = players.filter((item) => item.position === position)[index]; return player ? <div className="pitch-player" key={`${position}-${positionIndex}`}><PlayerCard player={player} small onClick={() => onSelect(player)} /><span>{positionLabel[position]}</span></div> : <div key={`${position}-${positionIndex}`} />; })}</div>)}</div>;
}
