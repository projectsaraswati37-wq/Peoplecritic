import React, { useEffect, useRef, useState } from 'react';
import AIOrb from '../components/AIOrb';
import VoiceControls from '../components/VoiceControls';
import { speechService } from '../utils/speech';

interface HomeProps {
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  onStart: (demo?: boolean) => void;
  scanCount: number;
  onHistory: () => void;
}

// ── Floating particle ──────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

function randomParticles(n: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 3,
    duration: Math.random() * 3 + 2,
    opacity: Math.random() * 0.5 + 0.1,
  }));
}

const Home: React.FC<HomeProps> = ({ voiceEnabled, onVoiceToggle, onStart, scanCount, onHistory }) => {
  const [speaking, setSpeaking] = useState(false);
  const [particles] = useState(() => randomParticles(25));
  const [uptime, setUptime] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const startedRef = useRef(false);
  const homeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const home = homeRef.current;
    if (!home) return;

    let frame = 0;
    let nextX = 50;
    let nextY = 50;
    const updatePointer = () => {
      home.style.setProperty('--pointer-x', `${nextX}%`);
      home.style.setProperty('--pointer-y', `${nextY}%`);
      home.style.setProperty('--pointer-tilt-x', `${(nextX - 50) / 3}deg`);
      home.style.setProperty('--pointer-tilt-y', `${(50 - nextY) / 3}deg`);
      frame = 0;
    };
    const handlePointerMove = (event: PointerEvent) => {
      nextX = (event.clientX / window.innerWidth) * 100;
      nextY = (event.clientY / window.innerHeight) * 100;
      if (!frame) frame = requestAnimationFrame(updatePointer);
      home.classList.add('pointer-active');
    };
    const handlePointerLeave = () => home.classList.remove('pointer-active');

    home.addEventListener('pointermove', handlePointerMove);
    home.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      home.removeEventListener('pointermove', handlePointerMove);
      home.removeEventListener('pointerleave', handlePointerLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    speechService.setOnSpeakingChange(setSpeaking);

    const interval = setInterval(() => setUptime((u) => u + 1), 1000);

    // Guard: only speak the welcome message once per mount.
    if (!startedRef.current && voiceEnabled && speechService.isSupported()) {
      startedRef.current = true;
      setTimeout(() => {
        speechService.speak(
          'നമസ്കാരം. PeopleCritique AI-യിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ മുഖഭാവവും പോസും പരിശോധിക്കാൻ തയ്യാറാണോ?',
          { language: 'ml-IN', rate: 0.92, pitch: 1.05 }
        );
      }, 600);
    }

    return () => {
      clearInterval(interval);
      // Stop any in-progress welcome speech when navigating away.
      speechService.stop();
    };
  }, []); // run exactly once on mount

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <div ref={homeRef} className="home-shell interactive-playground scanlines">
      <div className="home-aurora home-aurora-left" />
      <div className="home-aurora home-aurora-right" />
      <div className="playground-cursor" aria-hidden="true" />
      <div className="playground-hud" aria-hidden="true">
        <span>POINTER FIELD</span><b>LIVE</b><i />
      </div>
      <div className="home-particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
              opacity: p.opacity, animation: `floatUp ${p.duration}s ease-in ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <header className="home-nav">
        <div className="brand-lockup">
          <span className="brand-mark"><AIOrb speaking={speaking} size="sm" /></span>
          <span>PEOPLECRITIQUE <b>AI</b></span>
        </div>
        <div className="nav-status">
          <button className="nav-link" onClick={onHistory}>HISTORY</button>
          <span className="online-dot" /> SYSTEM ONLINE
          <span className="nav-divider" />
          <span className="uptime-label">UPTIME {formatUptime(uptime)}</span>
          <VoiceControls
            voiceEnabled={voiceEnabled}
            speaking={speaking}
            onToggle={onVoiceToggle}
            onStop={() => speechService.stop()}
          />
        </div>
      </header>

      <main className="home-main">
        <section className="hero-copy">
          <div className="eyebrow"><span /> ADVANCED HUMAN ANALYSIS SYSTEM <span /></div>
          <h1>See the person<br /><em>behind the pose.</em></h1>
          <p className="hero-description">
            A playful intelligence engine for reading the signals, style, and strange little energies that make someone unmistakably them.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => onStart()}>
              <span className="action-icon">↗</span> START A LIVE SCAN
            </button>
            <button
              className="secondary-action"
              onClick={() => { const newDemo = !demoMode; setDemoMode(newDemo); onStart(newDemo); }}
            >
              {demoMode ? 'DEMO MODE ACTIVE' : 'TRY A DEMO SCAN'} <span>→</span>
            </button>
          </div>
          <p className="privacy-note"><span>✦</span> Camera analysis happens locally. Nothing is stored.</p>
        </section>

        <section className="orb-stage" aria-label="PeopleCritique AI status">
          <div className="orb-orbit orbit-one" />
          <div className="orb-orbit orbit-two" />
          <div className="orb-core"><AIOrb speaking={speaking} size="lg" /></div>
          <div className="signal-node node-a"><span>01</span><b>AURA</b><small>DETECT</small></div>
          <div className="signal-node node-b"><span>02</span><b>POSE</b><small>READ</small></div>
          <div className="signal-node node-c"><span>03</span><b>ENERGY</b><small>MAP</small></div>
          <div className="orbit-label label-top">SIGNAL / 04 <span>●</span></div>
          <div className="orbit-label label-bottom">ANALYSIS READY <span>↗</span></div>
          <div className="stage-caption">THE MOST UNNECESSARY<br />INTELLIGENCE IN THE ROOM</div>
        </section>
      </main>

      <section className="insight-strip">
        <div className="strip-intro"><span className="strip-index">01</span><span>WHAT WE NOTICE</span></div>
        {[
          ['01', 'AURA SIGNAL', 'The energy you bring into a room.'],
          ['02', 'MAIN CHARACTER', 'Your current narrative arc.'],
          ['03', 'FUTURE TRAJECTORY', 'Where this is all probably going.'],
        ].map(([index, title, text]) => (
          <div className="insight-item" key={index}>
            <span className="insight-number">{index}</span>
            <div><h2>{title}</h2><p>{text}</p></div>
            <span className="insight-arrow">↗</span>
          </div>
        ))}
      </section>

      <footer className="home-footer">
        <span>PEOPLECRITIQUE AI / HUMAN ANALYSIS DIVISION</span>
        <span>FOR ENTERTAINMENT ONLY · USELESS BY DESIGN</span>
        <span>{scanCount.toString().padStart(3, '0')} SCANS COMPLETED</span>
      </footer>
    </div>
  );
};

export default Home;
