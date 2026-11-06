import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import type { IconPlayer, Position } from '../data/icons';
import type { TournamentRecord } from '../types';
import PlayerCard, { Flag } from '../components/PlayerCard';
import PlayerModal from '../components/PlayerModal';

const positionLabel: Record<Position, string> = { GK: 'Goalkeeper', CB: 'Centre Back', LB: 'Left Back', RB: 'Right Back', CDM: 'Defensive Mid', CM: 'Centre Mid', CAM: 'Attacking Mid', LW: 'Left Wing', RW: 'Right Wing', ST: 'Striker' };

export default function TournamentHistory({ history, searchValue, position, selectedPlayer, onSearchChange, onPositionChange, onSelectPlayer, onClosePlayer, onBack }: {
  history: TournamentRecord[];
  searchValue: string;
  position: Position | 'ALL';
  selectedPlayer: IconPlayer | null;
  onSearchChange: (value: string) => void;
  onPositionChange: (value: Position | 'ALL') => void;
  onSelectPlayer: (player: IconPlayer) => void;
  onClosePlayer: () => void;
  onBack: () => void;
}) {
  const search = searchValue.trim().toLowerCase();
  const records = useMemo(() => history.map((record) => {
    const participantGroups = record.participants.map((participant) => {
      const participantMatches = participant.toLowerCase().includes(search);
      const assignments = record.assignments.filter((assignment) => assignment.participantName === participant).filter((assignment) => position === 'ALL' || assignment.assignedPosition === position).filter((assignment) => !search || participantMatches || assignment.player.name.toLowerCase().includes(search)).sort((a, b) => a.round - b.round || a.timestamp - b.timestamp);
      return { participant, assignments };
    }).filter((group) => group.assignments.length > 0);
    return { record, participantGroups };
  }).filter(({ participantGroups }) => participantGroups.length > 0), [history, position, search]);

  return <main className="app-shell history-screen"><div className="noise" /><nav className="top-nav"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> BACK</button><div className="logo"><span>FC</span><strong>26</strong></div><span className="nav-status">DRAFT HISTORY</span></nav><section className="history-content"><header className="database-heading"><div><span className="eyebrow"><RotateCcw size={14} /> ASSIGNMENT ARCHIVE</span><h2>DRAFT <em>HISTORY</em></h2><p>{history.length} tournaments / {history.reduce((total, record) => total + record.assignments.length, 0)} recorded assignments</p></div></header><div className="history-filters"><input placeholder="Search participant or ICON..." value={searchValue} onChange={(event) => onSearchChange(event.target.value)} /><select value={position} onChange={(event) => onPositionChange(event.target.value as Position | 'ALL')}><option value="ALL">ALL POSITIONS</option>{(Object.keys(positionLabel) as Position[]).filter((item) => item !== 'CM').map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="history-records">{records.map(({ record, participantGroups }) => <article className="history-record" key={record.id}><div className="history-record-heading"><div><span className="eyebrow">TOURNAMENT {record.id.slice(-6).toUpperCase()}</span><h3>{new Date(record.createdAt).toLocaleDateString()}</h3></div><span>{record.participants.length} PLAYERS / {record.assignments.length} ASSIGNMENTS / {record.status.toUpperCase()}</span></div><div className="history-participants">{participantGroups.map(({ participant, assignments }) => <section className="history-participant" key={`${record.id}-${participant}`}><div className="history-participant-heading"><h4>{participant}</h4><span>{assignments.length} PLAYER{assignments.length === 1 ? '' : 'S'}</span></div><div className="history-player-grid">{assignments.map((assignment, index) => <div className="history-event" key={assignment.id}><PlayerCard player={assignment.player} small onClick={() => onSelectPlayer(assignment.player)} /><div><strong>{assignment.player.name}</strong><span>{assignment.assignedPosition} / {assignment.player.nation} <Flag code={assignment.player.nationCode} /></span><small>PICK {String(index + 1).padStart(2, '0')} / ROUND {assignment.round}</small></div></div>)}</div></section>)}</div></article>)}</div>{selectedPlayer && <PlayerModal player={selectedPlayer} onClose={onClosePlayer} />}</section></main>;
}
