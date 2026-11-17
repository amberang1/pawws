import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToyControl } from '../games/ToyWorlds';
import type { World } from '../games/EverydayWorlds';

export type Room = { game: World; paused: boolean; caught?: boolean; move: number; peek: number; revision: number; expires: number; remoteSeen: number; hostSeen: number; control?: ToyControl };
export type RemoteAction = 'move' | 'peek' | 'pause' | 'resume' | 'game' | 'remote-heartbeat' | 'host-heartbeat' | 'control' | 'catch' | 'release';
async function api(path: string, options?: RequestInit) {
  const response = await fetch('/api/rooms' + path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers }, cache: 'no-store' });
  let body;
  try { body = await response.json(); } catch { throw new Error('The remote service is unavailable. Try again in a moment.'); }
  if (!response.ok) { const error = new Error(body.error || 'Could not connect.') as Error & { status: number }; error.status = response.status; throw error; }
  return body;
}
export async function createRoom(game: World): Promise<Room & { id: string }> {
  return api('', { method: 'POST', body: JSON.stringify({ game }) });
}
export async function endRoom(id: string) { return api('/' + id, { method: 'DELETE' }); }
export function remoteURL(id: string) { return window.location.origin + window.location.pathname + '#remote=' + id; }

export function useRemote(id: string | null, role: 'host' | 'remote') {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);
  const [ended, setEnded] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(id); active.current = id;
  const latest = useRef<Room | null>(null);
  const controlPending = useRef<ToyControl | null>(null);
  const controlBusy = useRef(false);
  const controlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accept = useCallback((next: Room) => {
    if (!latest.current || next.revision >= latest.current.revision) { latest.current = next; setRoom(next); }
  }, []);
  useEffect(() => {
    let cancelled = false, timer: ReturnType<typeof setTimeout>;
    latest.current = null; setRoom(null); setEnded(false); setError('');
    if (!id) return;
    async function poll() {
      try {
        const next = await api('/' + id);
        if (cancelled) return;
        accept(next); setError('');
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message);
        if (e.status === 404 || e.status === 410) { setEnded(true); return; }
      }
      if (!cancelled) timer = setTimeout(poll, document.hidden ? 2500 : latest.current?.control?.active ? 160 : 450);
    }
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [id, accept]);
  const send = useCallback((action: RemoteAction, game?: World, control?: ToyControl) => {
    if(action === 'pause' || action === 'game' || action === 'move' || action === 'catch' || action === 'release') {
      controlPending.current=null;
      if(controlTimer.current)clearTimeout(controlTimer.current);
      controlTimer.current=null;
    }
    const connection = id;
    if (!connection) return Promise.resolve(false);
    const command = { action, game, control, id: crypto.randomUUID() };
    const quiet = action.endsWith('heartbeat') || action === 'control';
    if (!quiet) setPending(p => p + 1);
    const operation = queue.current.catch(() => {}).then(async () => {
      if (active.current !== connection) return;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const next = await api('/' + connection, { method: 'POST', body: JSON.stringify(command) });
          if (active.current === connection) { accept(next); setError(''); }
          return true;
        } catch (e: any) {
          if (e.status === 409 && attempt < 3) continue;
          if (active.current === connection) { setError(e.message); if (e.status === 404 || e.status === 410) setEnded(true); }
          throw e;
        }
      }
    });
    queue.current = operation;
    return operation.catch(() => false).finally(() => { if (!quiet) setPending(p => Math.max(0, p - 1)); });
  }, [id, accept]);
  useEffect(() => {
    if (!id || ended) return;
    const ping = () => { if (!document.hidden) send(role === 'host' ? 'host-heartbeat' : 'remote-heartbeat'); };
    ping();
    const timer = setInterval(ping, 9000);
    document.addEventListener('visibilitychange', ping);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', ping); };
  }, [id, role, send, ended]);
  const sendControl = useCallback((control: ToyControl) => {
    if(!id || ended)return;
    controlPending.current = control;
    const drain = async () => {
      controlTimer.current=null;
      if(controlBusy.current || !controlPending.current)return;
      const next=controlPending.current;controlPending.current=null;controlBusy.current=true;
      try { await send('control', undefined, next); }
      finally {controlBusy.current=false;if(controlPending.current)controlTimer.current=setTimeout(drain,90);}
    };
    if(!controlBusy.current && !controlTimer.current)controlTimer.current=setTimeout(()=>{controlTimer.current=null;drain();},55);
  },[id,ended,send]);
  useEffect(()=>()=>{if(controlTimer.current)clearTimeout(controlTimer.current);controlTimer.current=null;controlPending.current=null;},[id]);
  return { room, error, pending, ended, send, sendControl };

}

