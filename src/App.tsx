import { useEffect, useState } from 'react';
import {
  ArrowLeft, ChevronRight, Download, Expand, Gamepad2, Grid3X3, LayoutGrid,
  Maximize, RotateCcw, Shield, Sparkles, Trophy, Users, X, Zap,
} from 'lucide-react';
import { ICONS, type IconPlayer, type Position } from './data/icons';
import type { Assignment, Confirmation, Formation, Squad, Tournament, TournamentRecord } from './types';
import { buildSquad, generateTournament } from './utils/playerAllocation';
import { readStored, writeStored } from './utils/storage';
import PlayerCard, { Flag } from './components/PlayerCard';
import Pitch from './components/Pitch';
import PlayerModal from './components/PlayerModal';
import Home from './sections/Home';
import TournamentSetup from './sections/TournamentSetup';
import TournamentHistory from './sections/TournamentHistory';
import { useImagePreloader } from './hooks/useImagePreloader';

type Screen = 'home' | 'setup' | 'reveal' | 'dashboard' | 'database' | 'history';
type AppHistoryState = { screen: Screen; collectionView: boolean };
const APP_HISTORY_KEY = 'fc26Draft';
const APP_SCREENS: Screen[] = ['home', 'setup', 'reveal', 'dashboard', 'database', 'history'];

function readAppHistoryState(state: unknown): AppHistoryState | undefined {
  if (!state || typeof state !== 'object') return undefined;
  const appState = (state as Record<string, unknown>)[APP_HISTORY_KEY];
  if (!appState || typeof appState !== 'object') return undefined;
  const { screen, collectionView } = appState as Record<string, unknown>;
  if (typeof screen !== 'string' || !APP_SCREENS.includes(screen as Screen) || typeof collectionView !== 'boolean') return undefined;
  return { screen: screen as Screen, collectionView };
}

const STORAGE_KEY = 'fc26-icon-draft-tournament';
const ICON_DATABASE_KEY = 'fc26-icon-draft-icons';
const HISTORY_KEY = 'fc26-icon-draft-history';

const positionLabel: Record<Position, string> = { GK: 'Goalkeeper', CB: 'Centre Back', LB: 'Left Back', RB: 'Right Back', CDM: 'Defensive Mid', CM: 'Centre Mid', CAM: 'Attacking Mid', LW: 'Left Wing', RW: 'Right Wing', ST: 'Striker' };

function App() {
  const [screen, setScreenState] = useState<Screen>('home');
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
  const [databaseError, setDatabaseError] = useState('');
  const [history, setHistory] = useState<TournamentRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPosition, setHistoryPosition] = useState<Position | 'ALL'>('ALL');
  const [allocationError, setAllocationError] = useState('');
  const [persistenceError, setPersistenceError] = useState('');
  useImagePreloader(icons);

  function navigateToScreen(nextScreen: Screen, replace = false) {
    const appState: AppHistoryState = { screen: nextScreen, collectionView: false };
    const currentAppState = readAppHistoryState(window.history.state);
    if (!replace && currentAppState?.screen === nextScreen && !currentAppState.collectionView) {
      setScreenState(nextScreen);
      setCollectionView(false);
      return;
    }
    const nextHistoryState = { ...window.history.state, [APP_HISTORY_KEY]: appState };
    if (replace) window.history.replaceState(nextHistoryState, '', window.location.href);
    else window.history.pushState(nextHistoryState, '', window.location.href);
    setScreenState(nextScreen);
    setCollectionView(false);
  }

  function navigateDashboardView(nextCollectionView: boolean, replace = false) {
    if (collectionView === nextCollectionView) return;
    const appState: AppHistoryState = { screen: 'dashboard', collectionView: nextCollectionView };
    const nextHistoryState = { ...window.history.state, [APP_HISTORY_KEY]: appState };
    if (replace) window.history.replaceState(nextHistoryState, '', window.location.href);
    else window.history.pushState(nextHistoryState, '', window.location.href);
    setCollectionView(nextCollectionView);
  }

  useEffect(() => {
    const existingAppState = readAppHistoryState(window.history.state);
    if (!existingAppState) {
      window.history.replaceState(
        { ...window.history.state, [APP_HISTORY_KEY]: { screen: 'home', collectionView: false } satisfies AppHistoryState },
        '',
        window.location.href,
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const appState = readAppHistoryState(event.state);
      if (!appState) {
        setScreenState('home');
        setCollectionView(false);
        return;
      }
      if (appState.screen === 'dashboard' && !tournament) {
        setScreenState('home');
        setCollectionView(false);
        return;
      }
      setScreenState(appState.screen);
      setCollectionView(appState.screen === 'dashboard' && appState.collectionView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tournament]);

  useEffect(() => {
    try {
      const savedIcons = readStored<IconPlayer[]>(ICON_DATABASE_KEY);
      const savedHistory = readStored<TournamentRecord[]>(HISTORY_KEY);
      const saved = readStored<(Tournament & { formation?: Formation })>(STORAGE_KEY);
      if (savedIcons) setIcons(savedIcons);
      if (savedHistory) setHistory(savedHistory);
      if (saved?.squads?.length) {
        const savedFormations = saved.formations ?? saved.squads.map(() => saved.formation ?? 'wide');
        setTournament({ ...saved, id: saved.id ?? `legacy-${saved.createdAt}`, formations: savedFormations });
        navigateToScreen('dashboard');
      }
    } catch {
      setPersistenceError('Saved application data could not be loaded. Start with a new tournament or restore a valid backup.');
    }
  }, []);
  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);
  useEffect(() => {
    if (!tournament) return;
    try { writeStored(STORAGE_KEY, tournament); setPersistenceError(''); }
    catch { setPersistenceError('Tournament progress could not be saved in this browser.'); }
  }, [tournament]);
  useEffect(() => {
    try { writeStored(ICON_DATABASE_KEY, icons); setPersistenceError(''); }
    catch { setPersistenceError('ICON database changes could not be saved in this browser.'); }
  }, [icons]);
  useEffect(() => {
    try { writeStored(HISTORY_KEY, history); setPersistenceError(''); }
    catch { setPersistenceError('Draft history could not be saved in this browser.'); }
  }, [history]);

  const activeSquad = tournament?.squads[activeParticipant];
  function startSetup() { setNames(Array.from({ length: participantCount }, () => '')); setFormations(Array.from({ length: participantCount }, () => 'wide')); navigateToScreen('setup'); }
  function updateCount(count: number) { setParticipantCount(count); setNames((current) => Array.from({ length: count }, (_, index) => current[index] ?? '')); setFormations((current) => Array.from({ length: count }, (_, index) => current[index] ?? 'wide')); }
  function generate() {
    if (names.some((name) => !name.trim())) return;
    try {
      const next = generateTournament(names.map((name) => name.trim()), formations, icons);
      const assignments = next.squads.flatMap((squad) => squad.players.map((player, index) => ({ id: `${next.id}-${squad.playerName}-${index}`, tournamentId: next.id, participantName: squad.playerName, player: { ...player }, assignedPosition: player.position, timestamp: Date.now() + index, round: 1 })));
      setHistory((current) => [{ id: next.id, createdAt: next.createdAt, participants: next.participants, assignments, status: 'active' }, ...current]);
      setTournament(next); setAllocationError(''); setActiveParticipant(0); setRevealIndex(0); navigateToScreen('reveal');
    } catch (error) {
      setAllocationError(error instanceof Error ? error.message : 'Unable to allocate a unique squad. Add more eligible ICONs and try again.');
    }
  }
  function resetTournament() {
    if (tournament) setHistory((current) => current.map((record) => record.id === tournament.id ? { ...record, status: 'reset' } : record));
    localStorage.removeItem(STORAGE_KEY); setTournament(null); navigateToScreen('home', true); setActiveParticipant(0);
  }
  function redrawSquad(index: number) {
    if (!tournament) return;
    const unavailable = new Set(tournament.squads.flatMap((squad, squadIndex) => squadIndex === index ? [] : squad.players.map((player) => player.id)));
    const ratingTotals = tournament.squads.map((squad, squadIndex) => squadIndex === index
      ? 0
      : squad.players.reduce((total, player) => total + player.rating, 0));
    try {
      const next = buildSquad(tournament.participants[index], unavailable, tournament.formations[index], icons, ratingTotals, index).squad;
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
    if (icons.some((player) => player.id === normalized.id && player.id !== editingIcon?.id)) {
      setDatabaseError(`An ICON with the ID "${normalized.id}" already exists.`);
      return;
    }
    setDatabaseError('');
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
    navigateToScreen('dashboard');
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
  }

  if (screen === 'home') return <Home onStart={startSetup} onOpenDatabase={() => navigateToScreen('database')} onOpenHistory={() => navigateToScreen('history')} />;

  if (screen === 'setup') return <TournamentSetup participantCount={participantCount} names={names} formations={formations} allocationError={allocationError} persistenceError={persistenceError} onBack={() => navigateToScreen('home')} onCountChange={updateCount} onNameChange={(index, value) => setNames((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))} onFormationChange={(index, formation) => setFormations((current) => current.map((item, itemIndex) => itemIndex === index ? formation : item))} onGenerate={generate} />;

  if (screen === 'database') return (
    <main className="app-shell database-screen"><div className="noise" /><nav className="top-nav"><button className="back-button" onClick={() => navigateToScreen('home')}><ArrowLeft size={17} /> BACK</button><Logo /><span className="nav-status">ICON DATABASE / ADMIN</span></nav>
      <section className="database-content">{databaseError && <div className="allocation-error" role="alert">{databaseError}</div>}<header className="database-heading"><div><span className="eyebrow"><Shield size={14} /> ICON DATABASE</span><h2>THE <em>LEGENDS</em> ARCHIVE</h2><p>{icons.length} available ICONs. <span className="database-save-status"><span className="status-dot" /> AUTO-SAVED LOCALLY</span></p></div><div className="database-actions"><button className="secondary-button" onClick={exportIconDatabase}><Download size={16} /> EXPORT icons.ts</button><button className="primary-button" onClick={() => { setDatabaseError(''); openIconEditor(); }}><Sparkles size={16} /> ADD NEW ICON</button></div></header>
        <div className="icon-groups">{(Object.keys(positionLabel) as Position[]).filter((position) => position !== 'CM').map((position) => <section className="icon-group" key={position}><div className="icon-group-heading"><h3>{position} <span>{positionLabel[position]}</span></h3><small>{icons.filter((player) => player.position === position).length} ICONS</small></div><div className="icon-admin-grid">{icons.filter((player) => player.position === position).map((player) => <article className="icon-admin-card" key={player.id}><div><strong>{player.name}</strong><span>{player.nation} <Flag code={player.nationCode} /></span><small>SECONDARY: {player.secondary?.join(', ') || 'NONE'}</small></div><div className="icon-admin-actions"><button onClick={() => openIconEditor(player)} title={`Edit ${player.name}`}><LayoutGrid size={15} /> EDIT</button><button className="delete-icon-button" onClick={() => setConfirmation({ type: 'delete', player })} title={`Delete ${player.name}`}><X size={15} /> DELETE</button></div></article>)}</div></section>)}</div>
      </section>{iconEditorOpen ? <IconEditorModal icon={iconForm} isEditing={Boolean(editingIcon)} onChange={setIconForm} onSave={saveIcon} onDelete={deleteIcon} onClose={() => { setIconEditorOpen(false); setEditingIcon(null); }} /> : null}{confirmation && <ConfirmationModal confirmation={confirmation} participantName={confirmation.type === 'redraw' ? tournament?.participants[confirmation.index] : undefined} onConfirm={confirmAction} onClose={() => setConfirmation(null)} />}
    </main>
  );

  if (screen === 'history') return <TournamentHistory history={history} searchValue={historySearch} position={historyPosition} selectedPlayer={selectedPlayer} onSearchChange={setHistorySearch} onPositionChange={setHistoryPosition} onSelectPlayer={setSelectedPlayer} onClosePlayer={() => setSelectedPlayer(null)} onBack={() => navigateToScreen(tournament ? 'dashboard' : 'home')} />;

  if (screen === 'reveal' && tournament && activeSquad) return (
    <main className="app-shell reveal-screen"><div className="noise" /><nav className="top-nav"><Logo /><span className="nav-status">DRAFT IN PROGRESS / {activeParticipant + 1} OF {tournament.squads.length}</span><button className="icon-button" onClick={toggleFullscreen} title="Fullscreen"><Maximize size={18} /></button></nav>
      <section className="reveal-content"><div className="reveal-header"><span className="eyebrow"><span className="live-dot" /> LIVE DRAFT REVEAL</span><div className="reveal-progress"><span>{String(revealIndex).padStart(2, '0')}</span><div><i style={{ width: `${revealIndex * 10}%` }} /></div><span>10</span></div><h2>{activeSquad.playerName.toUpperCase()}'S <em>ICONS</em></h2><p>{revealIndex < 10 ? 'Your next ICON is ready to enter the pitch.' : 'The squad is complete. Ready for the next captain?'}</p></div><div className="reveal-cards">{activeSquad.players.slice(0, revealIndex).map((player) => <PlayerCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />)}{revealIndex < 10 && <div className="mystery-card"><div><Sparkles size={30} /><span>?</span><small>ICON<br />INCOMING</small></div></div>}</div><div className="reveal-actions"><button className="primary-button reveal-button" onClick={revealNext}>{revealIndex < 10 ? <>REVEAL NEXT ICON <ChevronRight size={20} /></> : activeParticipant < tournament.squads.length - 1 ? <>NEXT PLAYER <ChevronRight size={20} /></> : <>VIEW TOURNAMENT <Trophy size={18} /></>}</button>{revealIndex < 10 && <button className="secondary-button" onClick={revealAll}><Sparkles size={17} /> REVEAL ALL ICONS</button>}</div></section>
      {selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </main>
  );

  if (!tournament || !activeSquad) return null;
  return (
    <main className={`app-shell dashboard-screen ${collectionView ? 'collection-mode' : ''} ${isFullscreen ? 'presentation-mode' : ''}`}><div className="noise" /><nav className="top-nav"><Logo /><span className="nav-status"><span className="status-dot" /> TOURNAMENT HUB</span><div className="nav-actions"><button className="text-button" onClick={() => navigateToScreen('history')}><RotateCcw size={16} /> HISTORY</button><button className="text-button" onClick={toggleFullscreen}><Expand size={16} /> {isFullscreen ? 'EXIT' : 'PRESENT'}</button><button className="text-button danger" onClick={() => setConfirmation({ type: 'reset' })}><RotateCcw size={16} /> RESET</button></div></nav>
      <section className="dashboard-content"><header className="dashboard-heading"><div><span className="eyebrow"><Trophy size={14} /> TOURNAMENT OVERVIEW</span><h2>THE <em>LEGENDS</em> LEAGUE</h2><p>{tournament.participants.length} captains. {tournament.squads.length * 10} ICONS drafted. One legacy.</p></div></header>
        <div className="participant-tabs">{tournament.squads.map((squad, index) => <button key={squad.playerName} className={activeParticipant === index ? 'active' : ''} onClick={() => { setActiveParticipant(index); navigateDashboardView(false, true); }}><span className="tab-number">0{index + 1}</span><span>{squad.playerName}</span></button>)}</div>
        <div className="squad-toolbar"><div><h3>{activeSquad.playerName}'S SQUAD</h3><span><span className="status-dot" /> 10 ICONS SELECTED</span></div><div className="toolbar-actions"><button className={collectionView ? 'view-button' : 'view-button active'} onClick={() => navigateDashboardView(false)}><LayoutGrid size={17} /> PITCH</button><button className={collectionView ? 'view-button active' : 'view-button'} onClick={() => navigateDashboardView(true)}><Grid3X3 size={17} /> COLLECTION</button><button className="view-button" onClick={() => exportSquad(activeSquad)}><Download size={17} /> EXPORT</button><button className="view-button" onClick={() => setConfirmation({ type: 'redraw', index: activeParticipant })}><RotateCcw size={17} /> REDRAW</button></div></div>
        {collectionView ? <div className="collection-grid">{activeSquad.players.map((player) => <PlayerCard key={`${player.id}-${player.position}`} player={player} onClick={() => setSelectedPlayer(player)} />)}</div> : <Pitch players={activeSquad.players} formation={tournament.formations[activeParticipant]} onSelect={setSelectedPlayer} />}
        <div className="comparison-strip"><div><Shield size={18} /><span>ALL SQUADS SAVED LOCALLY<br /><small>Progress persists after refresh</small></span></div><div className="comparison-ratings">{tournament.squads.map((squad) => <span key={squad.playerName}>{squad.playerName} / 10 ICONS</span>)}</div></div>
      </section>{selectedPlayer && <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}{confirmation && <ConfirmationModal confirmation={confirmation} participantName={confirmation.type === 'redraw' ? tournament.participants[confirmation.index] : undefined} onConfirm={confirmAction} onClose={() => setConfirmation(null)} />}
    </main>
  );
}

function Logo() { return <div className="logo"><span>FC</span><strong>26</strong><i>ICON DRAFT</i></div>; }
function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) { return <div className="step"><span className="step-number">{number}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>; }
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
