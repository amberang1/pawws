import React, { useState } from 'react';
import { ArrowUpRight, Fish, Bug, Moon, Box, Target, Smartphone, Volume2, Lasso, Cone, Radio, ArrowRight } from 'lucide-react';
import { GameType } from '../types';
import { EverydayWorld, type World } from '../games/EverydayWorlds';
import { worlds } from './RemoteControl';

const classics: { id: GameType; title: string; icon: React.ReactNode }[] = [
  { id: 'shadows', title: 'Peek-a-Boo Shadows', icon: <Moon/> },
  { id: 'gravity', title: 'Gravity Chaos', icon: <Box/> },
  { id: 'hunt', title: 'Hunt Cycle', icon: <Target/> },
  { id: 'coplay', title: 'Co-Play Mode', icon: <Smartphone/> },
  { id: 'sound', title: 'Sound Reactor', icon: <Volume2/> },
  { id: 'string', title: 'Floppy Stickman', icon: <Lasso/> },
  { id: 'cone', title: 'Rolling Cone', icon: <Cone/> }
];
export function MainMenu({ onSelectGame, onTogether }: { onSelectGame: (game: GameType) => void; onTogether: (game: World) => void }) {
  const [instructions, setInstructions] = useState(false);
  return <main className="home-page">
    <header className="home-header"><span className="wordmark">pawws<span>.</span></span><button className="text-button" onClick={() => setInstructions(!instructions)}>How to play</button></header>
    <div className="app-intro"><h1>Pick a game</h1><p>Play together with your cat, or let them explore.</p></div>
    {instructions && <section className="how-panel"><div><strong>1. Pick a little world</strong><p>Open it on a tablet or phone, placed securely on a flat surface.</p></div><div><strong>2. Let curiosity happen</strong><p>Watching counts. Your cat can also hold, tap and swipe the scene.</p></div><div><strong>3. Play together</strong><p>Open a remote link on your phone to trigger a sweep, rustle or gust. Hold the small controls button to return.</p></div></section>}
    <section className="worlds-section">
      <div className="section-heading"><h2>Games</h2><span>{worlds.length} games</span></div>
      <div className="world-grid">{worlds.map((g, i) => <article className="world-card" key={g.id}>
        <button className="card-scene" onClick={() => onSelectGame(g.id)} aria-label={'Play ' + g.title}><EverydayWorld world={g.id} preview/><span className="scene-number">0{i+1}</span><span className="scene-play"><ArrowUpRight size={20}/></span></button>
        <div className="card-content"><h3>{g.title}</h3><p>{g.description}</p><div className="card-actions"><button onClick={() => onSelectGame(g.id)}>Let’s play <ArrowRight size={15}/></button><button className="together-button" onClick={() => onTogether(g.id)}><Radio size={14}/> Play together</button></div></div>
      </article>)}</div>
    </section>
    <details className="classic-section"><summary>The original toy box <span>7 more games</span></summary><div className="classic-grid">{classics.map(g => <button key={g.id} onClick={() => onSelectGame(g.id)}>{g.icon}<span>{g.title}</span><ArrowUpRight size={15}/></button>)}</div></details>
  </main>;
}


