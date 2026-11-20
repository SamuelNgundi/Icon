import { ChevronRight, Database, RotateCcw, Shield, Sparkles, Trophy, Users, Zap } from 'lucide-react';

const markerIds = Array.from({ length: 10 }, (_, index) => index);

function Logo() {
  return (
    <div className="home-brand">
      <span className="home-brand-mark"><span>FC</span><strong>26</strong></span>
      <span className="home-brand-name">ICON DRAFT</span>
    </div>
  );
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="home-step">
      <span className="home-step-number">{number}</span>
      <div className="home-step-copy">
        <span className="home-step-title">{icon}{title}</span>
        <span className="home-step-description">{text}</span>
      </div>
    </li>
  );
}

export default function Home({ onStart, onOpenDatabase, onOpenHistory }: { onStart: () => void; onOpenDatabase: () => void; onOpenHistory: () => void }) {
  return (
    <main className="app-shell home-screen home-redesign">
      <img className="home-background" src="/home.jpg" alt="" />
      <div className="home-background-shade" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <div className="home-player-markers" aria-hidden="true">
        {markerIds.map((id) => <span className="home-player-marker" key={id}><Shield size={15} /><i>✦</i></span>)}
      </div>

      <header className="home-nav">
        <Logo />
        <nav className="home-utilities" aria-label="Homepage tools">
          <span className="home-offline"><i /> OFFLINE MODE</span>
          <button type="button" className="home-utility" onClick={onOpenDatabase} aria-label="Open ICON database" title="ICON Database">
            <Database size={16} /><span>ICON DATABASE</span>
          </button>
          <button type="button" className="home-utility" onClick={onOpenHistory} aria-label="Open draft history" title="Draft History">
            <RotateCcw size={16} /><span>DRAFT HISTORY</span>
          </button>
        </nav>
      </header>

      <section className="home-stage">
        <div className="home-glass-panel">
          <p className="home-kicker"><Zap size={14} /> THE ULTIMATE OFFLINE DRAFT EXPERIENCE</p>
          <h1><span>FC 26</span><em>ICON DRAFT</em></h1>
          <p className="home-tagline">Build Your Legends.<br /><strong>Rule Your Tournament.</strong></p>
          <p className="home-description">The only draft companion you need for your FC 26 tournament. Assemble your dream squad from football's greatest legends.</p>

          <div className="home-playbook-heading"><span>THE PLAYBOOK</span><i /> <span>THREE STEPS TO GLORY</span></div>
          {/* <ol className="home-playbook">
            <Step number="01" icon={<Users size={14} />} title="Gather your squad" text="Choose 4–6 players and enter their names." />
            <Step number="02" icon={<Sparkles size={14} />} title="Start the draft" text="Every player gets 10 unique football ICONS." />
            <Step number="03" icon={<Trophy size={14} />} title="Build your legacy" text="Reveal, compare and crown your champion." />
          </ol> */}
        </div>
      </section>

      <aside className="home-bottom-panel">
        <div className="home-bottom-info">
          <div className="home-info-brand">
            <span className="home-info-emblem"><Shield size={22} /><i>✦</i></span>
            <span className="home-info-copy"><strong>FC 26 ICON DRAFT</strong><small>Built for the beautiful game</small></span>
          </div>
          <div className="home-info-facts">
            <span className="home-info-stat"><strong>10</strong><small>ICONS / SQUAD</small></span>
          </div>
        </div>
        <button type="button" className="home-start-button" onClick={onStart}>
          <span>START NEW TOURNAMENT</span><ChevronRight size={20} />
        </button>
      </aside>
    </main>
  );
}
