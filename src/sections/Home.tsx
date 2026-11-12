import { ChevronRight, RotateCcw, Shield, Sparkles, Trophy, Users, Zap } from 'lucide-react';

function Logo() {
  return <div className="logo"><span>FC</span><strong>26</strong><i>ICON DRAFT</i></div>;
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <div className="step"><span className="step-number">{number}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>;
}

export default function Home({ onStart, onOpenDatabase, onOpenHistory }: { onStart: () => void; onOpenDatabase: () => void; onOpenHistory: () => void }) {
  return <main className="app-shell home-screen">
    <div className="noise" /><nav className="top-nav"><Logo /><div className="nav-actions"><button className="text-button" onClick={onOpenDatabase}><Shield size={16} /> ICON DATABASE</button><button className="text-button" onClick={onOpenHistory}><RotateCcw size={16} /> DRAFT HISTORY</button><span className="nav-status"><span className="status-dot" /> OFFLINE MODE</span></div></nav>
    <section className="hero"><div className="hero-copy"><p className="eyebrow"><Zap size={14} /> THE ULTIMATE OFFLINE DRAFT EXPERIENCE</p><h1>FC 26<br /><em>ICON DRAFT</em></h1><p className="hero-subtitle">Build Your Legends.<br /><strong>Rule Your Tournament.</strong></p><p className="hero-description">The only draft companion you need for your FC 26 tournament. Assemble your dream squad from football's greatest legends.</p><button className="primary-button" onClick={onStart}>START NEW TOURNAMENT</button></div><div className="hero-visual"><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><div className="hero-ball">⚽</div><div className="hero-badge"><Trophy size={18} /><span>LEGENDS<br /><b>ONLY</b></span></div></div></section>
    <section className="how-section"><div className="section-heading"><span className="eyebrow">THE PLAYBOOK</span><h2>HOW TO PLAY</h2></div><div className="steps"><Step number="01" icon={<Users />} title="Gather your squad" text="Choose 4–6 players and enter their names." /><Step number="02" icon={<Sparkles />} title="Start the draft" text="Every player gets 10 unique football ICONS." /><Step number="03" icon={<Trophy />} title="Build your legacy" text="Reveal, compare and crown your champion." /></div></section>
    <footer><span>FC 26 ICON DRAFT</span><span>BUILT FOR THE BEAUTIFUL GAME</span><span>v1.0 / OFFLINE READY</span></footer>
  </main>;
}
