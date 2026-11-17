import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Eye, MoveRight, Pause, Play, Radio } from 'lucide-react';
import { Touchpad } from './Touchpad';
import { useRemote } from '../lib/remote';
import { EverydayWorld, type World } from '../games/EverydayWorlds';

export const worlds: { id: World; title: string; eyebrow: string; description: string; move: string; peek: string }[] = [
  { id: 'ribbon', title: 'String & Seek', eyebrow: 'You pull the strings', description: 'A twitch, a curl, a disappearing end. You decide what happens next.', move: 'Pull the string', peek: 'Peek around the curtain' },
  { id: 'mouse', title: 'Mouse Behind the Skirting', eyebrow: 'Wait. Was that a whisker?', description: 'Tiny feet, twitching whiskers, and three very suspicious holes.', move: 'Scurry across the floor', peek: 'Peek from a hole' },
  { id: 'rain', title: 'Rainy Ride', eyebrow: 'A little mesmerising', description: 'Raindrops race. Wipers sweep. The world can wait.', move: 'Sweep the wipers', peek: 'Drop a leaf' },
  { id: 'bag', title: 'Paper Bag Mystery', eyebrow: 'Something’s in there', description: 'A rustle, a twitch, a tail. Wait for it…', move: 'Rustle the bag', peek: 'Peek the tail' },
  { id: 'receipt', title: 'The Escaping Receipt', eyebrow: 'Made for little paws', description: 'Catch a corner. Hold it still. Let it flutter away.', move: 'Send a gust', peek: 'Flutter a corner' }
];
export function RemoteControl({ id, onClose }: { id: string; onClose: () => void }) {
  const { room, error, pending, ended, send, sendControl } = useRemote(id, 'remote');
  const [sent, setSent] = useState('');
  useEffect(()=>setSent(''),[room?.game]);
  const selected = worlds.find(g => g.id === room?.game);
  const hostOnline = !!room && Date.now() - room.hostSeen < 26000;
  async function command(action: 'move' | 'peek' | 'pause' | 'resume') {
    const success=await send(action); if(!success)return; setSent(action === 'move' ? 'Movement sent' : action === 'peek' ? 'A little surprise sent' : action === 'pause' ? 'Paused' : 'Playing again');
  }
  return <main className="remote-page">
    <header className="remote-header"><button className="text-button" onClick={onClose}><ArrowLeft size={17} /> Back to games</button><span className="wordmark small">PawHunt<span>.</span></span></header>
    <div className="remote-body">
      <span className="eyebrow">YOU’RE THE TOY OPERATOR</span>
      <h1>You’re the mystery.<br /><em>They’re the hunter.</em></h1>
      <p className="muted">Keep the game open on your cat’s screen.<br />You’re in charge of what happens next.</p>
      <div className={'connection ' + (hostOnline && !error ? 'online' : '')}><Radio size={14} />{ended ? 'Session ended' : error ? 'Connection interrupted' : !room ? 'Connecting to the cat’s screen…' : hostOnline ? 'Connected to the cat’s screen' : 'Waiting for the cat’s screen…'}</div>
      {error && <div className="notice" role="alert">{error}</div>}
      {room && !ended && <>
        <div className="remote-mini"><EverydayWorld world={room.game} preview tease={room} /><span>{selected?.title}</span></div>
        <p className="remote-caption">Illustrated preview · your cat’s view moves independently</p>
        <Touchpad world={room.game} control={room.control} disabled={ended || !hostOnline || !!error} onControl={sendControl}/>
        <div className="remote-actions">
          <button className="remote-primary" disabled={pending > 0 || !hostOnline} onClick={() => command('move')}><MoveRight size={28}/><strong>Move</strong><span>{selected?.move}</span></button>
          <button className="remote-secondary" disabled={pending > 0 || !hostOnline} onClick={() => command('peek')}><Eye size={28}/><strong>Peek</strong><span>{selected?.peek}</span></button>
        </div>
        <button className="pause-button" disabled={pending > 0} onClick={() => command(room.paused ? 'resume' : 'pause')}>{room.paused ? <Play size={18}/> : <Pause size={18}/>} {room.paused ? 'Let it play' : 'Pause & build suspense'}</button>
        <p className="sent-message" role="status">{pending ? 'Sending…' : sent || 'Give them a moment to watch between moves.'}</p>
        <label className="field-label" htmlFor="remote-world">Something different?</label>
        <select id="remote-world" value={room.game} disabled={pending > 0} onChange={e => send('game', e.target.value as World)}>{worlds.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select>
      </>}
      {ended && <button className="primary-button" onClick={onClose}>Back to games <ArrowUpRight size={16}/></button>}
      <p className="remote-footnote">No need to tap constantly. The waiting is part of the game.</p>
    </div>
  </main>;
}
