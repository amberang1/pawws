import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Maximize, MoreHorizontal, Pause, Play, Radio, Share2, X } from 'lucide-react';
import { MainMenu } from './components/MainMenu';
import { RemoteControl, worlds } from './components/RemoteControl';
import { EverydayWorld, quiet, type World, type Tease } from './games/EverydayWorlds';
import { createRoom, endRoom, remoteURL, useRemote } from './lib/remote';
import { GameType, PlayStats } from './types';
import { KoiRipplePond } from './games/KoiRipplePond';
import { BugUnderGlass } from './games/BugUnderGlass';
import { PeekABooShadows } from './games/PeekABooShadows';
import { GravityChaos } from './games/GravityChaos';
import { HuntCycle } from './games/HuntCycle';
import { CoPlayMode } from './games/CoPlayMode';
import { SoundReactor } from './games/SoundReactor';
import { DanglingString } from './games/DanglingString';
import { RollingCone } from './games/RollingCone';

const oldGames = { koi: KoiRipplePond, bug: BugUnderGlass, shadows: PeekABooShadows, gravity: GravityChaos, hunt: HuntCycle, coplay: CoPlayMode, sound: SoundReactor, string: DanglingString, cone: RollingCone };
const isWorld = (g: string): g is World => ['rain', 'bag', 'receipt', 'ribbon', 'mouse', 'door', 'koi', 'bug'].includes(g);
function storedHost() { try { const data = JSON.parse(sessionStorage.getItem('pawhunt-host') || 'null'); return data && /^[a-f0-9]{32}$/.test(data.id) && isWorld(data.game) ? data : null; } catch { return null; } }
function remoteFromHash() { return window.location.hash.match(/^#remote=([a-f0-9]{32})$/)?.[1] || null; }
function gameFromHash(): GameType | null {
  const g=window.location.hash.match(/^#game=([a-z]+)$/)?.[1];
  return g && (isWorld(g)||Object.hasOwn(oldGames,g)) ? g as GameType : null;
}
export default function App() {
  const [remoteId, setRemoteId] = useState(remoteFromHash);
  const [active, setActive] = useState<GameType | null>(() => remoteFromHash() ? null : gameFromHash() || storedHost()?.game || null);
  const [panel, setPanel] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(() => remoteFromHash() ? null : storedHost()?.id || null);
  const [local, setLocal] = useState<Tease>(quiet);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<PlayStats | null>(null);
  const [holding, setHolding] = useState(false);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stats = useRef<PlayStats | null>(null);
  const startTime = useRef(0);
  const creation = useRef(false);
  const generation = useRef(0);
  const { room, error, ended, send } = useRemote(roomId, 'host');
  const tease = room && !ended ? room : local;
  const world = worlds.find(g => g.id === active);
  useEffect(() => {
    const change=()=>{
      generation.current++;
      if(roomId)endRoom(roomId).catch(()=>{});
      setRoomId(null);setRemoteId(remoteFromHash());setActive(gameFromHash());
      setPanel(false);setReport(null);setLocal({...quiet});stats.current=null;
    };
    window.addEventListener('hashchange',change);window.addEventListener('popstate',change);
    return ()=>{window.removeEventListener('hashchange',change);window.removeEventListener('popstate',change);};
  },[roomId]);
  useEffect(()=>{
    if(!window.location.hash && storedHost()?.game)history.pushState(null,'','#game='+storedHost().game);
  },[]);
  const onAction = useCallback((action: 'tap' | 'catch') => { if(stats.current) stats.current[action === 'tap' ? 'taps' : 'catches']++; }, []);
  function begin(game: GameType) {
    if(window.location.hash !== '#game='+game)history.pushState(null,'','#game='+game);
    generation.current++;
    setActive(game); setLocal({ ...quiet }); setReport(null); setMessage(''); setCopied(false);
    stats.current = { game, timeSpent: 0, taps: 0, catches: 0, preyType: worlds.find(g => g.id === game)?.title || game };
    startTime.current = Date.now();
  }
  useEffect(() => { if(remoteId)return; try { if(roomId && active && isWorld(active)) sessionStorage.setItem('pawhunt-host',JSON.stringify({id:roomId,game:active})); else sessionStorage.removeItem('pawhunt-host'); } catch {} },[roomId,active,remoteId]);
  useEffect(() => {
    if(room && !ended && room.game !== active && roomId) begin(room.game);
  }, [room?.game, roomId, ended]);
  useEffect(() => {
    if(ended) { setMessage('The remote session ended. You can keep playing here or connect again.'); setRoomId(null); setLocal({ ...quiet }); }
  }, [ended]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if(e.key === 'Escape' && active) setPanel(p=>!p); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if(hold.current)clearTimeout(hold.current); };
  }, [active]);
  useEffect(() => {
    let lock: any = null, cancelled = false;
    async function wake() { try { if(active && !document.hidden && 'wakeLock' in navigator) { const acquired = await (navigator as any).wakeLock.request('screen'); if(cancelled) acquired.release(); else lock = acquired; } } catch {} }
    wake();document.addEventListener('visibilitychange',wake);
    return () => {cancelled=true;lock?.release();document.removeEventListener('visibilitychange',wake);};
  }, [active]);
  useEffect(() => {
    if(!panel && !report)return;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const previous = document.activeElement as HTMLElement | null;
    dialog?.querySelector<HTMLElement>('button')?.focus();
    const trap = (event: KeyboardEvent) => {
      if(event.key !== 'Tab' || !dialog)return;
      const items = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select')];
      const first = items[0], last = items[items.length-1];
      if(event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',trap);
    return ()=>{document.removeEventListener('keydown',trap);previous?.focus();};
  },[panel,!!report]);
  async function connect(game: World) {
    if(creation.current) return;
    creation.current = true;setBusy(true);setMessage('');
    const epoch = generation.current;
    try { const next = await createRoom(game); if(epoch !== generation.current) { endRoom(next.id).catch(()=>{}); return; } setRoomId(next.id); }
    catch(e: any){setMessage(e.message);}
    finally {setBusy(false);creation.current=false;}
  }
  function together(game: World) { begin(game);setPanel(true);connect(game); }
  async function disconnect() {
    if(!roomId)return;
    setBusy(true);
    try { await endRoom(roomId);setRoomId(null);setLocal({ ...quiet });setMessage('Remote disconnected. This screen can keep playing.'); }
    catch(e: any){setMessage(e.message);}finally{setBusy(false);}
  }
  function leave() {
    history.pushState(null,'',window.location.pathname+window.location.search);
    generation.current++;
    if(roomId) endRoom(roomId).catch(() => {});
    setRoomId(null);
    if(stats.current)setReport({ ...stats.current,timeSpent:Math.floor((Date.now()-startTime.current)/1000) });
    setActive(null);setPanel(false);stats.current=null;
    if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  }
  function cancelHold(){if(hold.current)clearTimeout(hold.current);setHolding(false);}
  function startHold(e:React.PointerEvent<HTMLButtonElement>){e.currentTarget.setPointerCapture(e.pointerId);cancelHold();setHolding(true);hold.current=setTimeout(()=>{setPanel(true);setHolding(false);},900);}
  async function copyLink(){if(!roomId)return;try{await navigator.clipboard.writeText(remoteURL(roomId));setCopied(true);}catch{setMessage('Select and copy the remote link below.');}}
  async function shareLink(){if(!roomId)return;try{if(navigator.share)await navigator.share({title:'Pawws remote',text:'Open this on your phone to tease your cat.',url:remoteURL(roomId)});else await copyLink();}catch(e:any){if(e.name!=='AbortError')setMessage('Use Copy link to share the remote.');}}
  function localCommand(kind:'move'|'peek'|'pause'|'resume'){if(roomId)send(kind);else setLocal(p=>({...p,paused:kind==='pause',...(kind==='move'||kind==='peek'?{[kind]:p[kind]+1}:{})}));}
  if(remoteId)return <RemoteControl id={remoteId} onClose={()=>{window.location.hash='';setRemoteId(null);}}/>;
  const OldGame = active && !isWorld(active) ? oldGames[active] : null;
  return <>
    {!active && <MainMenu onSelectGame={begin} onTogether={together}/>}
    {active && <main className="play-screen">
      {isWorld(active) ? <EverydayWorld key={active} world={active} tease={tease} onAction={onAction}/> : OldGame && <OldGame onAction={onAction}/>}
      <button className={'game-menu '+(holding?'holding':'')} aria-label="Hold for controls" title="Hold for controls, or press Escape" onPointerDown={startHold} onPointerUp={cancelHold} onPointerCancel={cancelHold} onLostPointerCapture={cancelHold} onClick={e=>{if(e.detail===0)setPanel(true);}}><MoreHorizontal size={20}/><span>Hold for controls</span></button>
      {tease.paused && isWorld(active) && !panel && <span className="paused-indicator">Paused by you</span>}
    </main>}
    {panel && active && <div className="panel-backdrop" onClick={()=>setPanel(false)}><section className="controls-panel" role="dialog" aria-modal="true" aria-labelledby="controls-title" onClick={e=>e.stopPropagation()}>
      <div className="panel-top"><span className="eyebrow">A MOMENT FOR THE HUMAN</span><button className="icon-button" aria-label="Close controls" onClick={()=>setPanel(false)}><X size={20}/></button></div>
      <h2 id="controls-title">{world?.title || 'The toy box'}</h2>
      {world && <>
        <div className="inline-controls"><button onClick={()=>localCommand('move')}>{world.move}</button><button onClick={()=>localCommand('peek')}>{world.peek}</button><button onClick={()=>localCommand(tease.paused?'resume':'pause')}>{tease.paused?<Play size={16}/>:<Pause size={16}/>} {tease.paused?'Resume':'Pause'}</button></div>
        <div className="remote-setup"><Radio size={21}/><h3>Be the mystery.</h3><p>Leave this screen with your cat. Open the remote on your phone to move, pause and peek.</p>
        {!roomId ? <button className="primary-button" disabled={busy} onClick={()=>connect(world.id)}>{busy?'Making your remote…':'Connect a phone'} <ArrowLeft size={16} className="flip"/></button> : <>
          <div className={'connection '+(room && Date.now()-room.remoteSeen<26000?'online':'')}><span className="little-dot"/>{room && Date.now()-room.remoteSeen<26000?'Phone connected':'Waiting for your phone'}</div>
          <label className="field-label" htmlFor="remote-link">Open this link on your other device</label><input id="remote-link" value={remoteURL(roomId)} readOnly onClick={e=>e.currentTarget.select()}/>
          <div className="share-actions"><button className="primary-button" onClick={copyLink}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy link'}</button><button className="outline-button" onClick={shareLink}><Share2 size={16}/> Share</button></div>
          <a className="test-remote" href={remoteURL(roomId)} target="_blank" rel="noreferrer">Try the remote in another tab ↗</a>
          <p className="setup-note">Open this link on your phone while the game stays open on your cat’s device. The link lasts two hours.</p>
          <button className="text-button" disabled={busy} onClick={disconnect}>Disconnect phone</button>
        </>}</div>
      </>}
      {(message||error)&&<p className="notice" role="status">{message||error}</p>}
      <div className="panel-bottom"><button className="text-button" onClick={leave}><ArrowLeft size={16}/> Back to games</button><button className="text-button" onClick={()=>{if(document.fullscreenEnabled)document.documentElement.requestFullscreen().catch(()=>setMessage('Fullscreen is not available here. You can keep playing in the browser.'));else setMessage('Use your browser’s full-screen or Add to Home Screen option.');}}><Maximize size={16}/> Full screen</button></div>
      <button className="resume-button" onClick={()=>setPanel(false)}>Back to your cat <Play size={15}/></button>
    </section></div>}
    {report && <div className="panel-backdrop"><section className="report-panel" role="dialog" aria-modal="true" aria-labelledby="report-title"><span className="eyebrow">THAT WAS A LITTLE ADVENTURE</span><h2 id="report-title">Curiosity, satisfied?</h2><p>Watching is part of playing, too.</p><div className="report-stats"><div><strong>{Math.floor(report.timeSpent/60)}:{String(report.timeSpent%60).padStart(2,'0')}</strong><span>Time together</span></div><div><strong>{report.taps}</strong><span>Touches</span></div><div><strong>{report.catches}</strong><span>Target contacts</span></div></div><button className="primary-button" onClick={()=>setReport(null)}>Back to the little worlds <ArrowLeft className="flip" size={16}/></button></section></div>}
  </>;
}



