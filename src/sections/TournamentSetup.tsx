import { ArrowLeft, Gamepad2, Sparkles } from 'lucide-react';
import type { Formation } from '../types';

export default function TournamentSetup({ participantCount, names, formations, allocationError, persistenceError, onBack, onCountChange, onNameChange, onFormationChange, onGenerate }: {
  participantCount: number;
  names: string[];
  formations: Formation[];
  allocationError: string;
  persistenceError: string;
  onCountChange: (count: number) => void;
  onBack: () => void;
  onNameChange: (index: number, value: string) => void;
  onFormationChange: (index: number, formation: Formation) => void;
  onGenerate: () => void;
}) {
  return <main className="app-shell setup-screen"><div className="noise" /><nav className="top-nav"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> BACK</button><div className="logo"><span>FC</span><strong>26</strong></div><span className="nav-status">SETUP PHASE / 01</span></nav>
    <section className="setup-content">{(persistenceError || allocationError) && <div className="allocation-error" role="alert">{persistenceError || allocationError}</div>}<div className="section-heading"><span className="eyebrow"><Gamepad2 size={14} /> TOURNAMENT CONFIGURATION</span><h2>SET THE STAGE</h2><p>Choose your players. The Icons are waiting.</p></div>
      <div className="setup-panel"><div className="panel-label">NUMBER OF PARTICIPANTS <span>REQUIRED</span></div><div className="count-options">{[4, 5, 6].map((count) => <button key={count} className={participantCount === count ? 'selected' : ''} onClick={() => onCountChange(count)}><strong>{count}</strong><span>PLAYERS</span></button>)}</div><div className="divider" /><div className="panel-label">PLAYER ROSTER <span>{names.filter(Boolean).length}/{participantCount} READY</span></div><div className="name-grid">{names.map((name, index) => <label key={index}><span><i>{String(index + 1).padStart(2, '0')}</i> PLAYER {index + 1}</span><input value={name} onChange={(event) => onNameChange(index, event.target.value)} placeholder="Enter player name" maxLength={24} /><div className="player-formation"><small>FORMATION</small><button type="button" className={formations[index] === 'wide' ? 'selected' : ''} onClick={() => onFormationChange(index, 'wide')}>4-1-3-1</button><button type="button" className={formations[index] === 'double-striker' ? 'selected' : ''} onClick={() => onFormationChange(index, 'double-striker')}>4-1-2-2</button></div></label>)}</div><button className="primary-button generate-button" disabled={names.some((name) => !name.trim())} onClick={onGenerate}>GENERATE DRAFT <Sparkles size={18} /></button></div>
    </section>
  </main>;
}
