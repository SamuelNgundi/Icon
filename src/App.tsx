import { useEffect, useState } from 'react';
import {
  ArrowLeft, ChevronRight, Download, Expand, Gamepad2, Grid3X3, LayoutGrid,
  Maximize, RotateCcw, Shield, Sparkles, Trophy, Users, X, Zap,
} from 'lucide-react';
import { ICONS, type IconPlayer, type Position } from './data/icons';

type Screen = 'home' | 'setup' | 'reveal' | 'dashboard' | 'database' | 'history';
type Formation = 'wide' | 'double-striker';
type Squad = { playerName: string; players: IconPlayer[]; revealed: boolean };
type Assignment = { id: string; tournamentId: string; participantName: string; player: IconPlayer; assignedPosition: Position; timestamp: number; round: number };
type Tournament = { id: string; participants: string[]; squads: Squad[]; formations: Formation[]; createdAt: number };
type TournamentRecord = { id: string; createdAt: number; participants: string[]; assignments: Assignment[]; status: 'active' | 'completed' | 'reset' };
type Confirmation = { type: 'reset' } | { type: 'redraw'; index: number } | { type: 'delete'; player: IconPlayer };

const STORAGE_KEY = 'fc26-icon-draft-tournament';
const ICON_DATABASE_KEY = 'fc26-icon-draft-icons';
const HISTORY_KEY = 'fc26-icon-draft-history';

const POSITION_PLANS: Record<Formation, Position[]> = {
  wide: ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CAM', 'LW', 'RW', 'ST'],
  'double-striker': ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CAM', 'LW', 'ST', 'ST'],
};
const positionLabel: Record<Position, string> = { GK: 'Goalkeeper', CB: 'Centre Back', LB: 'Left Back', RB: 'Right Back', CDM: 'Defensive Mid', CM: 'Centre Mid', CAM: 'Attacking Mid', LW: 'Left Wing', RW: 'Right Wing', ST: 'Striker' };

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function getPositionPlan(formation: Formation): Position[] {
  if (formation === 'double-striker') {
    const wing: Position = Math.random() < 0.5 ? 'LW' : 'RW';
    return ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CAM', wing, 'ST', 'ST'];
  }
  return POSITION_PLANS[formation];
}

function buildSquad(playerName: string, unavailable: Set<string>, formation: Formation, icons: IconPlayer[]): { squad: Squad; used: string[] } {
  const picked: IconPlayer[] = [];
  const localIds = new Set<string>();
  const used: string[] = [];
  for (const position of getPositionPlan(formation)) {
    const candidates = shuffle(icons.filter((player) =>
      !localIds.has(player.id) && !unavailable.has(player.id) &&
      (player.position === position || player.secondary?.includes(position)),
    ));
    const choice = candidates[0];
    if (!choice) throw new Error(`Not enough available ICONs for ${position} while building ${playerName}'s squad.`);
    picked.push({ ...choice, position }); localIds.add(choice.id); used.push(choice.id);
  }
  return { squad: { playerName, players: picked, revealed: false }, used };
}

function generateTournament(participants: string[], formations: Formation[], icons: IconPlayer[]): Tournament {
  const squads: Squad[] = [];
  const used = new Set<string>();
  const order = shuffle(participants.map((playerName, index) => ({ playerName, index })));
  order.forEach(({ playerName, index }) => {
    const result = buildSquad(playerName, used, formations[index], icons);
    result.used.forEach((id) => used.add(id));
    squads[index] = result.squad;
  });
  return { id: `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, participants, squads, formations, createdAt: Date.now() };
}

function Flag({ code }: { code: string }) {
  const normalizedCode = code.trim().toUpperCase();
  const flag = /^[A-Z]{2}$/.test(normalizedCode)
    ? String.fromCodePoint(...[...normalizedCode].map((letter) => 127397 + letter.charCodeAt(0)))
    : '🌐';
  return <span className="flag" title={normalizedCode}>{flag}</span>;
}

function PlayerCard({ player, onClick, small = false }: { player: IconPlayer; onClick?: () => void; small?: boolean }) {
  return (
    <button className={`player-card ${small ? 'player-card--small' : ''}`} onClick={onClick} style={{ ['--delay' as string]: `${Math.random() * 0.35}s` }}>
      <img className="card-frame" src="/icon-card-frame.png" alt="" />
      <div className="card-glow" />
      <div className="card-top"><span className="card-pos">{player.position}</span></div>
      <div className="player-art"><div className="silhouette"><span className="player-name">{player.name}</span></div><span className="card-nation"><Flag code={player.nationCode} /></span></div>
      <div className="card-info"><span>ICON <i>◆</i></span><small>{player.nation}</small></div>
    </button>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participantCount, setParticipantCount] = useState(4);
  const [formations, setFormations] = useState<Formation[]>(['wide', 'wide', 'wide', 'wide']);
  const [names, setNames] = useState<string[]>(['', '', '', '']);
  const [activeParticipant, setActiveParticipant] = useState(0);
  const [revealIndex, setRevealIndex] = useState(0);
  const [collectionView, setCollectionView] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<IconPlayer | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [icons, setIcons] = useState<IconPlayer[]>(ICONS);
  const [editingIcon, setEditingIcon] = useState<IconPlayer | null>(null);
  const [iconEditorOpen, setIconEditorOpen] = useState(false);
  const [iconForm, setIconForm] = useState<IconPlayer>({ id: '', name: '', rating: 0, position: 'GK', nation: '', nationCode: '', secondary: [] });
  const [history, setHistory] = useState<TournamentRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPosition, setHistoryPosition] = useState<Position | 'ALL'>('ALL');
  const [allocationError, setAllocationError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedIcons = localStorage.getItem(ICON_DATABASE_KEY);
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedIcons) {
      try { setIcons(JSON.parse(savedIcons) as IconPlayer[]); } catch { localStorage.removeItem(ICON_DATABASE_KEY); }
    }
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory) as TournamentRecord[]); } catch { localStorage.removeItem(HISTORY_KEY); }
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Tournament & { formation?: Formation };
        if (parsed.squads?.length) {
          const savedFormations = parsed.formations ?? parsed.squads.map(() => parsed.formation ?? 'wide');
          setTournament({ ...parsed, id: parsed.id ?? `legacy-${parsed.createdAt}`, formations: savedFormations });
          setScreen('dashboard');
        }
      } catch { localStorage.removeItem(STORAGE_KEY); }
    }
  }, []);
  useEffect(() => { if (tournament) localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament)); }, [tournament]);
  useEffect(() => { localStorage.setItem(ICON_DATABASE_KEY, JSON.stringify(icons)); }, [icons]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }, [history]);

  const activeSquad = tournament?.squads[activeParticipant];
  function startSetup() { setNames(Array.from({ length: participantCount }, () => '')); setFormations(Array.from({ length: participantCount }, () => 'wide')); setScreen('setup'); }
  function updateCount(count: number) { setParticipantCount(count); setNames((current) => Array.from({ length: count }, (_, index) => current[index] ?? '')); setFormations((current) => Array.from({ length: count }, (_, index) => current[index] ?? 'wide')); }
  function generate() {
    if (names.some((name) => !name.trim())) return;
    try {
      const next = generateTournament(names.map((name) => name.trim()), formations, icons);
      const assignments = next.squads.flatMap((squad) => squad.players.map((player, index) => ({ id: `${next.id}-${squad.playerName}-${index}`, tournamentId: next.id, participantName: squad.playerName, player: { ...player }, assignedPosition: player.position, timestamp: Date.now() + index, round: 1 })));
      setHistory((current) => [{ id: next.id, createdAt: next.createdAt, participants: next.participants, assignments, status: 'active' }, ...current]);
      setTournament(next); setAllocationError(''); setActiveParticipant(0); setRevealIndex(0); setScreen('reveal');
    } catch (error) {
      setAllocationError(error instanceof Error ? error.message : 'Unable to allocate a unique squad. Add more eligible ICONs and try again.');
    }
  }
  function resetTournament() {
    if (tournament) setHistory((current) => current.map((record) => record.id === tournament.id ? { ...record, status: 'reset' } : record));
    localStorage.removeItem(STORAGE_KEY); setTournament(null); setScreen('home'); setActiveParticipant(0);
  }
  function redrawSquad(index: number) {
    if (!tournament) return;
    const unavailable = new Set(tournament.squads.flatMap((squad, squadIndex) => squadIndex === index ? [] : squad.players.map((player) => player.id)));
    try {
      const next = buildSquad(tournament.participants[index], unavailable, tournament.formations[index], icons).squad;
      const timestamp = Date.now();
      const assignments = next.players.map((player, playerIndex) => ({ id: `${tournament.id}-${tournament.participants[index]}-${timestamp}-${playerIndex}`, tournamentId: tournament.id, participantName: tournament.participants[index], player: { ...player }, assignedPosition: player.position, timestamp: timestamp + playerIndex, round: (history.find((record) => record.id === tournament.id)?.assignments.filter((assignment) => assignment.participantName === tournament.participants[index]).length ?? 0) / 10 + 1 }));
      setHistory((current) => current.map((record) => record.id === tournament.id ? { ...record, assignments: [...record.assignments, ...assignments] } : record));
      setTournament({ ...tournament, squads: tournament.squads.map((squad, squadIndex) => squadIndex === index ? next : squad) });
      setAllocationError('');
    } catch (error) {
      setAllocationError(error instanceof Error ? error.message : 'Unable to redraw without creating a duplicate.');
    }
  }
  function confirmAction() {
    if (!confirmation) return;
    if (confirmation.type === 'reset') resetTournament();
    else if (confirmation.type === 'redraw') redrawSquad(confirmation.index);
    else {
      setIcons((current) => current.filter((player) => player.id !== confirmation.player.id));
      setEditingIcon(null);
      setIconEditorOpen(false);
    }
    setConfirmation(null);
  }
  function openIconEditor(player?: IconPlayer) {
    const next = player ?? { id: '', name: '', rating: 0, position: 'GK' as Position, nation: '', nationCode: '', secondary: [] };
    setEditingIcon(player ?? null);
    setIconEditorOpen(true);
    setIconForm({ ...next, secondary: next.secondary ?? [] });
  }
  function saveIcon(event: React.FormEvent) {
    event.preventDefault();
    const normalized = { ...iconForm, id: iconForm.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'), name: iconForm.name.trim(), nation: iconForm.nation.trim(), nationCode: iconForm.nationCode.trim().toUpperCase(), secondary: iconForm.secondary?.filter((position) => position !== iconForm.position) ?? [] };
    if (!normalized.id || !normalized.name || !normalized.nation || !normalized.nationCode) return;
    setIcons((current) => editingIcon ? current.map((player) => player.id === editingIcon.id ? normalized : player) : [...current, normalized]);
    setEditingIcon(null);
    setIconEditorOpen(false);
  }
  function deleteIcon() {
    if (!editingIcon) return;
    setConfirmation({ type: 'delete', player: editingIcon });
  }
  function revealNext() {
    if (!tournament) return;
    if (revealIndex < 10) { setRevealIndex((index) => index + 1); return; }
    if (activeParticipant < tournament.squads.length - 1) { setActiveParticipant((index) => index + 1); setRevealIndex(0); return; }
    setScreen('dashboard');
  }
  function revealAll() {
    setRevealIndex(10);
  }
  function exportSquad(squad: Squad) {
    const text = `${squad.playerName}'s ICON DRAFT\n\n${squad.players.map((p) => `${p.position}  ${p.name}`).join('\n')}`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); link.download = `${squad.playerName.replace(/\s+/g, '-').toLowerCase()}-icon-squad.txt`; link.click(); URL.revokeObjectURL(link.href);
  }
  function exportIconDatabase() {
    const groups = (Object.keys(positionLabel) as Position[]).filter((position) => position !== 'CM').map((position) => `  ${position}: [\n${icons.filter((player) => player.position === position).map((player) => `    ${JSON.stringify(player)},`).join('\n')}\n  ],`).join('\n');
    const text = `export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';\n\nexport type IconPlayer = { id: string; name: string; rating: number; position: Position; nation: string; nationCode: string; secondary?: Position[] };\n\nexport const ICONS_BY_POSITION = {\n${groups}\n};\n\nexport const ICONS: IconPlayer[] = Object.values(ICONS_BY_POSITION).flat();\n`;
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); link.download = 'icons.ts'; link.click(); URL.revokeObjectURL(link.href);
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.();
    setIsFullscreen(!isFullscreen);
  }

  if (screen === 'home') return (
    <main className="app-shell home-screen">
      <div className="noise" /><nav className="top-nav"><Logo /><div className="nav-actions"><button className="text-button" onClick={() => setScreen('database')}><Shield size={16} /> ICON DATABASE</button><button className="text-button" onClick={() => setScreen('history')}><RotateCcw size={16} /> DRAFT HISTORY</button><span className="nav-status"><span className="status-dot" /> OFFLINE MODE</span></div></nav>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow"><Zap size={14} /> THE ULTIMATE OFFLINE DRAFT EXPERIENCE</p><h1>FC 26<br /><em>ICON DRAFT</em></h1><p className="hero-subtitle">Build Your Legends.<br /><strong>Rule Your Tournament.</strong></p><p className="hero-description">The only draft companion you need for your FC 26 tournament. Assemble your dream squad from football's greatest legends.</p><button className="primary-button" onClick={startSetup}>START NEW TOURNAMENT <ChevronRight size={20} /></button></div>
        <div className="hero-visual"><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><div className="hero-ball">⚽</div><div className="hero-badge"><Trophy size={18} /><span>LEGENDS<br /><b>ONLY</b></span></div></div>
      </section>
      <section className="how-section"><div className="section-heading"><span className="eyebrow">THE PLAYBOOK</span><h2>HOW TO PLAY</h2></div><div className="steps"><Step number="01" icon={<Users />} title="Gather your squad" text="Choose 4–8 players and enter their names." /><Step number="02" icon={<Sparkles />} title="Start the draft" text="Every player gets 10 unique football ICONS." /><Step number="03" icon={<Trophy />} title="Build your legacy" text="Reveal, compare and crown your champion." /></div></section>
      <footer><span>FC 26 ICON DRAFT</span><span>BUILT FOR THE BEAUTIFUL GAME</span><span>v1.0 / OFFLINE READY</span></footer>
    </main>
  );

  if (screen === 'setup') return (
    <main className="app-shell setup-screen"><div className="noise" /><nav className="top-nav"><button className="back-button" onClick={() => setScreen('home')}><ArrowLeft size={17} /> BACK</button><Logo /><span className="nav-status">SETUP PHASE / 01</span></nav>
      <section className="setup-content"><div className="section-heading"><span className="eyebrow"><Gamepad2 size={14} /> TOURNAMENT CONFIGURATION</span><h2>SET THE STAGE</h2><p>Choose your players. The Icons are waiting.</p></div>
        <div className="setup-panel">{allocationError && <div className="allocation-error" role="alert">{allocationError}</div>}<div className="panel-label">NUMBER OF PARTICIPANTS <span>REQUIRED</span></div><div className="count-options">{[4, 5, 6, 7, 8].map((count) => <button key={count} className={participantCount === count ? 'selected' : ''} onClick={() => updateCount(count)}><strong>{count}</strong><span>PLAYERS</span></button>)}</div><div className="divider" /><div className="panel-label">PLAYER ROSTER <span>{names.filter(Boolean).length}/{participantCount} READY</span></div><div className="name-grid">{names.map((name, index) => <label key={index}><span><i>{String(index + 1).padStart(2, '0')}</i> PLAYER {index + 1}</span><input value={name} onChange={(event) => setNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="Enter player name" maxLength={24} /><div className="player-formation"><small>FORMATION</small><button type="button" className={formations[index] === 'wide' ? 'selected' : ''} onClick={() => setFormations((current) => current.map((item, itemIndex) => itemIndex === index ? 'wide' : item))}>4-1-3-1</button><button type="button" className={formations[index] === 'double-striker' ? 'selected' : ''} onClick={() => setFormations((current) => current.map((item, itemIndex) => itemIndex === index ? 'double-striker' : item))}>4-1-2-2</button></div></label>)}</div><button className="primary-button generate-button" disabled={names.some((name) => !name.trim())} onClick={generate}>GENERATE DRAFT <Sparkles size={18} /></button></div>
      </section>
    </main>
  );

  if (screen === 'database') return (
    <main className="app-shell database-screen"><div className="noise" /><nav className="top-nav"><button className="back-button" onClick={() => setScreen('home')}><ArrowLeft size={17} /> BACK</button><Logo /><span className="nav-status">ICON DATABASE / ADMIN</span></nav>
      <section className="database-content"><header className="database-heading"><div><span className="eyebrow"><Shield size={14} /> ICON DATABASE</span><h2>THE <em>LEGENDS</em> ARCHIVE</h2><p>{icons.length} available ICONs. <span className="database-save-status"><span className="status-dot" /> AUTO-SAVED LOCALLY</span></p></div><div className="database-actions"><button className="secondary-button" onClick={exportIconDatabase}><Download size={16} /> EXPORT icons.ts</button><button className="primary-button" onClick={() => openIconEditor()}><Sparkles size={16} /> ADD NEW ICON</button></div></header>
        <div className="icon-groups">{(Object.keys(positionLabel) as Position[]).filter((position) => position !== 'CM').map((position) => <section className="icon-group" key={position}><div className="icon-group-heading"><h3>{position} <span>{positionLabel[position]}</span></h3><small>{icons.filter((player) => player.position === position).length} ICONS</small></div><div className="icon-admin-grid">{icons.filter((player) => player.position === position).map((player) => <article className="icon-admin-card" key={player.id}><div><strong>{player.name}</strong><span>{player.nation} <Flag code={player.nationCode} /></span><small>SECONDARY: {player.secondary?.join(', ') || 'NONE'}</small></div><div className="icon-admin-actions"><button onClick={() => openIconEditor(player)} title={`Edit ${player.name}`}><LayoutGrid size={15} /> EDIT</button><button className="delete-icon-button" onClick={() => setConfirmation({ type: 'delete', player })} title={`Delete ${player.name}`}><X size={15} /> DELETE</button></div></article>)}</div></section>)}</div>
      </section>{iconEditorOpen ? <IconEditorModal icon={iconForm} isEditing={Boolean(editingIcon)} onChange={setIconForm} onSave={saveIcon} onDelete={deleteIcon} onClose={() => { setIconEditorOpen(false); setEditingIcon(null); }} /> : null}{confirmation && <ConfirmationModal confirmation={confirmation} participantName={confirmation.type === 'redraw' ? tournament?.participants[confirmation.index] : undefined} onConfirm={confirmAction} onClose={() => setConfirmation(null)} />}
    </main>
  );

  if (screen === 'history') {
    const search = historySearch.trim().toLowerCase();
    const records = history.map((record) => {
      const participantGroups = record.participants.map((participant) => {
        const participantMatches = participant.toLowerCase().includes(search);
        const playerAssignments = record.assignments
          .filter((assignment) => assignment.participantName === participant)
          .filter((assignment) => historyPosition === 'ALL' || assignment.assignedPosition === historyPosition)
          .filter((assignment) => !search || participantMatches || assignment.player.name.toLowerCase().includes(search))
          .sort((a, b) => a.round - b.round || a.timestamp - b.timestamp);
        return { participant, assignments: playerAssignments };
      }).filter((group) => group.assignments.length > 0);
      return { record, participantGroups };
    }).filter(({ participantGroups }) => participantGroups.length > 0);
    return <main className="app-shell history-screen"><div className="noise" /><nav className="top-nav"><button className="back-button" onClick={() => setScreen(tournament ? 'dashboard' : 'home')}><ArrowLeft size={17} /> BACK</button><Logo /><span className="nav-status">DRAFT HISTORY</span></nav><section className="history-content"><header className="database-heading"><div><span className="eyebrow"><RotateCcw size={14} /> ASSIGNMENT ARCHIVE</span><h2>DRAFT <em>HISTORY</em></h2><p>{history.length} tournaments / {history.reduce((total, record) => total + record.assignments.length, 0)} recorded assignments</p></div></header><div className="history-filters"><input placeholder="Search participant or ICON..." value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} /><select value={historyPosition} onChange={(event) => setHistoryPosition(event.target.value as Position | 'ALL')}><option value="ALL">ALL POSITIONS</option>{(Object.keys(positionLabel) as Position[]).filter((position) => position !== 'CM').map((position) => <option key={position} value={position}>{position}</option>)}</select></div><div className="history-records">{records.map(({ record, participantGroups }) => <article className="history-record" key={record.id}><div className="history-record-heading"><div><span className="eyebrow">TOURNAMENT {record.id.slice(-6).toUpperCase()}</span><h3>{new Date(record.createdAt).toLocaleDateString()}</h3></div><span>{record.participants.length} PLAYERS / {record.assignments.length} ASSIGNMENTS / {record.status.toUpperCase()}</span></div><div className="history-participants">{participantGroups.map(({ participant, assignments: participantAssignments }) => <section className="history-participant" key={`${record.id}-${participant}`}><div className="history-participant-heading"><h4>{participant}</h4><span>{participantAssignments.length} PLAYER{participantAssignments.length === 1 ? '' : 'S'}</span></div><div className="history-player-grid">{participantAssignments.map((assignment, index) => <div className="history-event" key={assignment.id}><PlayerCard player={assignment.player} small onClick={() => setSelectedPlayer(assignment.player)} /><div><strong>{assignment.player.name}</strong><span>{assignment.assignedPosition} / {assignment.player.nation} <Flag code={assignment.player.nationCode} /></span><small>PICK {String(index + 1).padStart(2, '0')} / ROUND {assignment.round}</small></div></div>)}</div></section>)}</div></article>)}</div>{selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}</section></main>;
  }

  if (screen === 'reveal' && tournament && activeSquad) return (
    <main className="app-shell reveal-screen"><div className="noise" /><nav className="top-nav"><Logo /><span className="nav-status">DRAFT IN PROGRESS / {activeParticipant + 1} OF {tournament.squads.length}</span><button className="icon-button" onClick={toggleFullscreen} title="Fullscreen"><Maximize size={18} /></button></nav>
      <section className="reveal-content"><div className="reveal-header"><span className="eyebrow"><span className="live-dot" /> LIVE DRAFT REVEAL</span><div className="reveal-progress"><span>{String(revealIndex).padStart(2, '0')}</span><div><i style={{ width: `${revealIndex * 10}%` }} /></div><span>10</span></div><h2>{activeSquad.playerName.toUpperCase()}'S <em>ICONS</em></h2><p>{revealIndex < 10 ? 'Your next ICON is ready to enter the pitch.' : 'The squad is complete. Ready for the next captain?'}</p></div><div className="reveal-cards">{activeSquad.players.slice(0, revealIndex).map((player) => <PlayerCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />)}{revealIndex < 10 && <div className="mystery-card"><div><Sparkles size={30} /><span>?</span><small>ICON<br />INCOMING</small></div></div>}</div><div className="reveal-actions"><button className="primary-button reveal-button" onClick={revealNext}>{revealIndex < 10 ? <>REVEAL NEXT ICON <ChevronRight size={20} /></> : activeParticipant < tournament.squads.length - 1 ? <>NEXT PLAYER <ChevronRight size={20} /></> : <>VIEW TOURNAMENT <Trophy size={18} /></>}</button>{revealIndex < 10 && <button className="secondary-button" onClick={revealAll}><Sparkles size={17} /> REVEAL ALL ICONS</button>}</div></section>
      {selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </main>
  );

  if (!tournament || !activeSquad) return null;
  return (
    <main className={`app-shell dashboard-screen ${collectionView ? 'collection-mode' : ''} ${isFullscreen ? 'presentation-mode' : ''}`}><div className="noise" /><nav className="top-nav"><Logo /><span className="nav-status"><span className="status-dot" /> TOURNAMENT HUB</span><div className="nav-actions"><button className="text-button" onClick={() => setScreen('history')}><RotateCcw size={16} /> HISTORY</button><button className="text-button" onClick={toggleFullscreen}><Expand size={16} /> {isFullscreen ? 'EXIT' : 'PRESENT'}</button><button className="text-button danger" onClick={() => setConfirmation({ type: 'reset' })}><RotateCcw size={16} /> RESET</button></div></nav>
      <section className="dashboard-content"><header className="dashboard-heading"><div><span className="eyebrow"><Trophy size={14} /> TOURNAMENT OVERVIEW</span><h2>THE <em>LEGENDS</em> LEAGUE</h2><p>{tournament.participants.length} captains. {tournament.squads.length * 10} ICONS drafted. One legacy.</p></div></header>
        <div className="participant-tabs">{tournament.squads.map((squad, index) => <button key={squad.playerName} className={activeParticipant === index ? 'active' : ''} onClick={() => { setActiveParticipant(index); setCollectionView(false); }}><span className="tab-number">0{index + 1}</span><span>{squad.playerName}</span></button>)}</div>
        <div className="squad-toolbar"><div><h3>{activeSquad.playerName}'S SQUAD</h3><span><span className="status-dot" /> 10 ICONS SELECTED</span></div><div className="toolbar-actions"><button className={collectionView ? 'view-button' : 'view-button active'} onClick={() => setCollectionView(false)}><LayoutGrid size={17} /> PITCH</button><button className={collectionView ? 'view-button active' : 'view-button'} onClick={() => setCollectionView(true)}><Grid3X3 size={17} /> COLLECTION</button><button className="view-button" onClick={() => exportSquad(activeSquad)}><Download size={17} /> EXPORT</button><button className="view-button" onClick={() => setConfirmation({ type: 'redraw', index: activeParticipant })}><RotateCcw size={17} /> REDRAW</button></div></div>
        {collectionView ? <div className="collection-grid">{activeSquad.players.map((player) => <PlayerCard key={`${player.id}-${player.position}`} player={player} onClick={() => setSelectedPlayer(player)} />)}</div> : <Pitch players={activeSquad.players} formation={tournament.formations[activeParticipant]} onSelect={setSelectedPlayer} />}
        <div className="comparison-strip"><div><Shield size={18} /><span>ALL SQUADS SAVED LOCALLY<br /><small>Progress persists after refresh</small></span></div><div className="comparison-ratings">{tournament.squads.map((squad) => <span key={squad.playerName}>{squad.playerName} / 10 ICONS</span>)}</div></div>
      </section>{selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}{confirmation && <ConfirmationModal confirmation={confirmation} participantName={confirmation.type === 'redraw' ? tournament.participants[confirmation.index] : undefined} onConfirm={confirmAction} onClose={() => setConfirmation(null)} />}
    </main>
  );
}

function Logo() { return <div className="logo"><span>FC</span><strong>26</strong><i>ICON DRAFT</i></div>; }
function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) { return <div className="step"><span className="step-number">{number}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>; }
function Pitch({ players, formation, onSelect }: { players: IconPlayer[]; formation: Formation; onSelect: (player: IconPlayer) => void }) {
  const rows: Position[][] = formation === 'double-striker'
    ? [['ST', 'ST'], ['LW', 'CAM', 'RW'], ['CDM'], ['LB', 'CB', 'CB', 'RB'], ['GK']]
    : [['ST'], ['LW', 'CAM', 'RW'], ['CDM'], ['LB', 'CB', 'CB', 'RB'], ['GK']];
  const positionIndexes = new Map<Position, number>();
  return <div className="pitch"><div className="pitch-lines"><div className="center-circle" /><div className="halfway" /><div className="penalty top" /><div className="penalty bottom" /></div>{rows.map((row, rowIndex) => <div className={`pitch-row row-${rowIndex}`} key={row.join('-')}>{row.map((position, positionIndex) => { const index = positionIndexes.get(position) ?? 0; positionIndexes.set(position, index + 1); const player = players.filter((item) => item.position === position)[index]; return player ? <div className="pitch-player" key={`${position}-${positionIndex}`}><PlayerCard player={player} small onClick={() => onSelect(player)} /><span>{positionLabel[position]}</span></div> : <div key={`${position}-${positionIndex}`} />; })}</div>)}</div>;
}
function PlayerModal({ player, onClose }: { player: IconPlayer; onClose: () => void }) { return <div className="modal-backdrop" onClick={onClose}><div className="player-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><PlayerCard player={player} /><div className="modal-details"><span className="eyebrow">ICON PROFILE / {player.position}</span><h2>{player.name}</h2><p>{player.nation} <Flag code={player.nationCode} /></p><div className="detail-meta"><span>PRIMARY POSITION <b>{player.position}</b></span><span>CARD TYPE <b>ICON</b></span></div></div></div></div>; }
function IconEditorModal({ icon, isEditing, onChange, onSave, onDelete, onClose }: { icon: IconPlayer; isEditing: boolean; onChange: (icon: IconPlayer) => void; onSave: (event: React.FormEvent) => void; onDelete: () => void; onClose: () => void }) {
  const positions = (Object.keys(positionLabel) as Position[]).filter((position) => position !== 'CM');
  return <div className="modal-backdrop" onClick={onClose}><form className="icon-editor-modal" onSubmit={onSave} onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={onClose}><X size={18} /></button><span className="eyebrow"><Shield size={14} /> {isEditing ? 'EDIT ICON' : 'ADD ICON'}</span><h2>{isEditing ? 'UPDATE' : 'NEW'} <em>LEGEND</em></h2><div className="icon-form-grid"><label>PLAYER NAME<input required value={icon.name} onChange={(event) => onChange({ ...icon, name: event.target.value })} /></label><label>DATABASE ID<input required disabled={isEditing} value={icon.id} onChange={(event) => onChange({ ...icon, id: event.target.value })} /></label><label>POSITION<select value={icon.position} onChange={(event) => onChange({ ...icon, position: event.target.value as Position })}>{positions.map((position) => <option key={position} value={position}>{position} — {positionLabel[position]}</option>)}</select></label><label>RATING<input type="number" min="0" max="99" value={icon.rating} onChange={(event) => onChange({ ...icon, rating: Number(event.target.value) })} /></label><label>NATION<input required value={icon.nation} onChange={(event) => onChange({ ...icon, nation: event.target.value })} /></label><label>FLAG CODE<input required maxLength={2} value={icon.nationCode} onChange={(event) => onChange({ ...icon, nationCode: event.target.value.toUpperCase() })} /></label></div><label className="secondary-position-field">SECONDARY POSITIONS<select multiple value={icon.secondary ?? []} onChange={(event) => onChange({ ...icon, secondary: Array.from(event.target.selectedOptions, (option) => option.value as Position) })}>{positions.filter((position) => position !== icon.position).map((position) => <option key={position} value={position}>{position}</option>)}</select><small>Hold Ctrl/Cmd to select multiple positions.</small></label><div className="confirmation-actions"><button type="button" className="modal-cancel" onClick={onClose}>CANCEL</button>{isEditing && <button type="button" className="modal-cancel delete-icon-button" onClick={onDelete}>DELETE</button>}<button type="submit" className="modal-confirm">SAVE ICON</button></div></form></div>;
}
function ConfirmationModal({ confirmation, participantName, onConfirm, onClose }: { confirmation: Confirmation; participantName?: string; onConfirm: () => void; onClose: () => void }) {
  const isReset = confirmation.type === 'reset';
  const isDelete = confirmation.type === 'delete';
  return <div className="modal-backdrop confirmation-backdrop" onClick={onClose}><div className={`confirmation-modal ${isReset || isDelete ? 'confirmation-modal--danger' : ''}`} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="confirmation-icon">{isReset || isDelete ? <RotateCcw size={27} /> : <Sparkles size={27} />}</div><span className="eyebrow">{isReset ? 'TOURNAMENT CONTROL' : isDelete ? 'DATABASE CONTROL' : 'SQUAD CONTROL'}</span><h2>{isReset ? 'RESET TOURNAMENT?' : isDelete ? 'DELETE ICON?' : 'REDRAW SQUAD?'}</h2><p>{isReset ? 'This will erase every participant squad and return you to the home screen.' : isDelete ? `Remove ${confirmation.player.name} from the ICON database?` : `Draw a fresh set of ICONS for ${participantName ?? 'this participant'}? Their current squad will be replaced.`}</p><div className="confirmation-actions"><button className="modal-cancel" onClick={onClose}>CANCEL</button><button className="modal-confirm" onClick={onConfirm}>{isReset ? 'RESET EVERYTHING' : isDelete ? 'DELETE ICON' : 'REDRAW SQUAD'}</button></div></div></div>;
}

export default App;
