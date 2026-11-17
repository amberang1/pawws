import { GameRemote } from './GameRemote';
import React, { useEffect, useState } from 'react';
import { Hand, ArrowLeft, ArrowUpRight, Eye, MoveRight, Pause, Play, Radio } from 'lucide-react';
import { Touchpad } from './Touchpad';
import { useRemote } from '../lib/remote';
import { EverydayWorld, type World } from '../games/EverydayWorlds';

export const worlds: { id: World; title: string; eyebrow: string; description: string; move: string; peek: string }[] = [
  { id: 'door', title: 'Under the Door', eyebrow: 'Something is peeking out', description: 'A feather slips under the door, twitches, and disappears.', move: 'Move the feather', peek: 'Peek under the door' },
  { id: 'ribbon', title: 'Shoelace & Seek', eyebrow: 'You pull the strings', description: 'A braided shoelace curls across the floor. Pin it and watch the loose end.', move: 'Pull slowly', peek: 'Feed out the lace' },
  { id: 'mouse', title: 'Mouse Behind the Skirting', eyebrow: 'Wait. Was that a whisker?', description: 'Tiny feet, twitching whiskers, and three very suspicious holes.', move: 'Go to the crumb', peek: 'Peek from a hole' },
  { id: 'koi', title: 'Shallow Pond', eyebrow: 'Just below the surface', description: 'Two koi drift over pebbles. A paw sends ripples; the fish dart for cover.', move: 'Swim into the open', peek: 'Drop some food' },
  { id: 'bug', title: 'Kitchen Beetle', eyebrow: 'Antennae first', description: 'A tiny visitor explores a crumb, then slips beneath a cork coaster.', move: 'Go to a crumb', peek: 'Show antennae' },
  { id: 'rain', title: 'Rainy Ride', eyebrow: 'A little mesmerising', description: 'Watch the blades sweep the rain away. A rhythm, a pause, then another pass.', move: 'Steady sweep', peek: 'Quick double sweep' },
  { id: 'bag', title: 'Paper Bag Mystery', eyebrow: 'Something’s in there', description: 'A rustle, a twitch, a tail. Wait for it…', move: 'Move inside', peek: 'Show the tail' },
  { id: 'receipt', title: 'The Escaping Receipt', eyebrow: 'Made for little paws', description: 'Catch a corner. Hold it still. Let it flutter away.', move: 'Reverse the breeze', peek: 'Lift a corner' }
];
export function RemoteControl({ id, onClose }: { id: string; onClose: () => void }) {
  const { room, error, pending, ended, send, sendControl } = useRemote(id, 'remote');
  const [sent, setSent] = useState('');
  useEffect(()=>setSent(''),[room?.game]);
  const selected = worlds.find(g => g.id === room?.game);
  const hostOnline = !!room && Date.now() - room.hostSeen < 26000;
  async function command(action: 'move' | 'peek' | 'pause' | 'resume' | 'catch' | 'release') {
    const success=await send(action); if(!success)return; setSent(action === 'catch' ? 'Caught! Tap Let go when you’re ready.' : action === 'release' ? 'Off it goes…' : action === 'move' ? 'Movement sent' : action === 'peek' ? 'A little surprise sent' : action === 'pause' ? 'Paused' : 'Playing again');
  }
  return <main className="remote-page">
    <header className="remote-header"><button className="text-button" onClick={onClose}><ArrowLeft size={17} /> Back to games</button><span className="wordmark small">pawws<span>.</span></span></header>
    <div className="remote-body">
      <h1>Play together</h1>
      <p className="muted">Keep the game open on your cat’s screen.</p>
      <div className={'connection ' + (hostOnline && !error ? 'online' : '')}><Radio size={14} />{ended ? 'Session ended' : error ? 'Connection interrupted' : !room ? 'Connecting to the cat’s screen…' : hostOnline ? 'Connected to the cat’s screen' : 'Waiting for the cat’s screen…'}</div>
      {error && <div className="notice" role="alert">{error}</div>}
      {room && !ended && <>
        <div className="game-switcher"><label className="field-label" htmlFor="remote-world">Choose a game for your cat</label><select id="remote-world" value={room.game} disabled={pending > 0 || !hostOnline || !!error} onChange={e => send('game', e.target.value as World)}>{worlds.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select><p>Switch games anytime — your phone stays connected.</p></div>
        <details className="remote-preview"><summary>See an illustrated preview</summary><div className="remote-mini"><EverydayWorld world={room.game} preview tease={room}/></div><p className="remote-caption">Watch your cat’s screen for the actual position.</p></details>
        {room.game==='door'||room.game==='bug' ? <Touchpad world={room.game} control={room.control} disabled={ended || !hostOnline || !!error || !!room.caught} onControl={sendControl}/> : <GameRemote world={room.game} control={room.control} disabled={ended || !hostOnline || !!error || !!room.caught} onControl={sendControl}/>}
        {room.game!=='rain' && <button className={'catch-button '+(room.caught?'is-caught':'')} disabled={pending>0 || !hostOnline || !!error} onClick={()=>command(room.caught?'release':'catch')}><Hand size={23}/><strong>{room.caught?'Let go →':'Caught it!'}</strong><span>{room.caught?'Send the toy off again':'Tap when their paw lands on the toy'}</span></button>}
        {(room.game==='door'||room.game==='bug') && <div className="remote-actions">
          <button className="remote-primary" disabled={pending > 0 || !hostOnline || !!error} onClick={() => command('move')}><MoveRight size={28}/><strong>{selected?.move}</strong></button>
          <button className="remote-secondary" disabled={pending > 0 || !hostOnline || !!error} onClick={() => command('peek')}><Eye size={28}/><strong>{selected?.peek}</strong></button>
        </div>}
        <button className="pause-button" disabled={pending > 0} onClick={() => command(room.paused ? 'resume' : 'pause')}>{room.paused ? <Play size={18}/> : <Pause size={18}/>} {room.paused ? 'Let it play' : 'Pause & build suspense'}</button>
        <p className="sent-message" role="status">{pending ? 'Sending…' : sent || 'Give them a moment to watch between moves.'}</p>

      </>}
      {ended && <button className="primary-button" onClick={onClose}>Back to games <ArrowUpRight size={16}/></button>}
      <p className="remote-footnote">No need to tap constantly. The waiting is part of the game.</p>
    </div>
  </main>;
}


