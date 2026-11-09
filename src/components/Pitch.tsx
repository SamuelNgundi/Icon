import type { IconPlayer, Position } from '../data/icons';
import type { Formation } from '../types';
import PlayerCard from './PlayerCard';

const positionLabel: Record<Position, string> = { GK: 'Goalkeeper', CB: 'Centre Back', LB: 'Left Back', RB: 'Right Back', CDM: 'Defensive Mid', CM: 'Centre Mid', CAM: 'Attacking Mid', LW: 'Left Wing', RW: 'Right Wing', ST: 'Striker' };

export default function Pitch({ players, formation, onSelect }: { players: IconPlayer[]; formation: Formation; onSelect: (player: IconPlayer) => void }) {
  const rows: { position: Position; column: number; centered?: boolean }[][] = formation === 'double-striker'
    ? [
      [{ position: 'ST', column: 2 }, { position: 'ST', column: 3 }],
      [{ position: 'LW', column: 1 }, { position: 'CAM', column: 2, centered: true }, { position: 'RW', column: 4 }],
      [{ position: 'CDM', column: 2, centered: true }],
      [{ position: 'LB', column: 1 }, { position: 'CB', column: 2 }, { position: 'CB', column: 3 }, { position: 'RB', column: 4 }],
      [{ position: 'GK', column: 2, centered: true }],
    ]
    : [
      [{ position: 'ST', column: 2, centered: true }],
      [{ position: 'LW', column: 1 }, { position: 'CAM', column: 2, centered: true }, { position: 'RW', column: 4 }],
      [{ position: 'CDM', column: 2, centered: true }],
      [{ position: 'LB', column: 1 }, { position: 'CB', column: 2 }, { position: 'CB', column: 3 }, { position: 'RB', column: 4 }],
      [{ position: 'GK', column: 2, centered: true }],
    ];
  const positionIndexes = new Map<Position, number>();
  return <div className="pitch"><div className="pitch-lines"><div className="center-circle" /><div className="halfway" /><div className="penalty top" /><div className="penalty bottom" /></div>{rows.map((row, rowIndex) => <div className={`pitch-row row-${rowIndex}`} key={row.map((slot) => slot.position).join('-')}>{row.map(({ position, column, centered }, positionIndex) => { const index = positionIndexes.get(position) ?? 0; positionIndexes.set(position, index + 1); const player = players.filter((item) => item.position === position)[index]; return player ? <div className={`pitch-player${centered ? ' pitch-player--centered' : ''}`} style={{ gridColumn: `${centered ? `${column} / span 2` : column}` }} key={`${position}-${positionIndex}`}><PlayerCard player={player} small onClick={() => onSelect(player)} /><span>{positionLabel[position]}</span></div> : <div key={`${position}-${positionIndex}`} style={{ gridColumn: `${centered ? `${column} / span 2` : column}` }} />; })}</div>)}</div>;
}
