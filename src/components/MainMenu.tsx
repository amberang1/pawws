import React, { useState } from 'react';
import { ArrowUpRight, Fish, Bug, Moon, Box, Target, Smartphone, Volume2, Lasso, Cone, Radio, ArrowRight } from 'lucide-react';
import { GameType } from '../types';
import { EverydayWorld, type World } from '../games/EverydayWorlds';
import { worlds } from './RemoteControl';

const classics: { id: GameType; title: string; icon: React.ReactNode }[] = [
  { id: 'koi', title: 'Koi Ripple Pond', icon: <Fish/> },
  { id: 'bug', title: 'Bug Under Glass', icon: <Bug/> },
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
    <header className="home-header"><a className="wordmark" href="#" aria-label="PawHunt home">PawHunt<span>.</span></a><button className="text-button" onClick={() => setInstructions(!instructions)}>How to play <ArrowUpRight size={15}/></button></header>
    <section className="intro">
      <div className="intro-copy"><span className="eyebrow"><span className="little-dot"/> FOR THE VERY CURIOUS</span><h1>Small things.<br /><em>Big fascination.</em></h1><p>A string that slips away. A mouse that knows when to hide.<br />Move the toy from your phone. Watch your cat make their move.</p></div>
      <div className="intro-note"><span className="note-doodle">↝</span><p>Inspired by the things<br />they won’t stop staring at.</p></div>
    </section>
    {instructions && <section className="how-panel"><div><strong>1. Pick a little world</strong><p>Open it on a tablet or phone, placed securely on a flat surface.</p></div><div><strong>2. Let curiosity happen</strong><p>Watching counts. Your cat can also hold, tap and swipe the scene.</p></div><div><strong>3. Play together</strong><p>Open a remote link on your phone to trigger a sweep, rustle or gust. Hold the small controls button to return.</p></div></section>}
    <section className="worlds-section">
      <div className="section-heading"><h2>Today’s little obsessions</h2><span>05 worlds to explore</span></div>
      <div className="world-grid">{worlds.map((g, i) => <article className="world-card" key={g.id}>
        <button className="card-scene" onClick={() => onSelectGame(g.id)} aria-label={'Play ' + g.title}><EverydayWorld world={g.id} preview/><span className="scene-number">0{i+1}</span><span className="scene-play"><ArrowUpRight size={20}/></span></button>
        <div className="card-content"><span className="card-eyebrow">{g.eyebrow}</span><h3>{g.title}</h3><p>{g.description}</p><div className="card-actions"><button onClick={() => onSelectGame(g.id)}>Let’s play <ArrowRight size={15}/></button><button className="together-button" onClick={() => onTogether(g.id)}><Radio size={14}/> Play together</button></div></div>
      </article>)}</div>
    </section>
    <section className="together-strip"><div className="remote-symbol"><Smartphone size={26}/><span>↝</span></div><div><h2>The cat gets the screen.<br />You get to be the mystery.</h2><p>Drag a finger on your phone to guide the string or mouse. Hide, twitch, or hold still while your cat gets closer.</p></div><button className="outline-button" onClick={() => onTogether('ribbon')}>Try a little tease <ArrowUpRight size={16}/></button></section>
    <details className="classic-section"><summary>The original toy box <span>9 more games</span></summary><div className="classic-grid">{classics.map(g => <button key={g.id} onClick={() => onSelectGame(g.id)}>{g.icon}<span>{g.title}</span><ArrowUpRight size={15}/></button>)}</div></details>
    <footer className="home-footer"><span className="wordmark small">PawHunt<span>.</span></span><p>Some cats chase. Some cats just watch. Both belong here.</p><span>Made for curious company.</span></footer>
  </main>;
}
