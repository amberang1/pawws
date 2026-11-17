const games = ['rain', 'bag', 'receipt', 'ribbon', 'mouse'];
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const lifetime = 2 * 60 * 60 * 1000;
export async function handleAPI(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return null;
  if (!env.BUCKET) return json({ error: 'The remote connection is not available. You can still play on this screen.' }, 503);
  if (request.method !== 'GET' && request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return json({ error: 'Use the remote link from this app.' }, 403);
  if (url.pathname === '/api/rooms' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
    if (!games.includes(body?.game)) return json({ error: 'Choose a supported game.' }, 400);
    const id = crypto.randomUUID().replaceAll('-', '');
    const state = { game: body.game, paused: false, move: 0, peek: 0, revision: 0, remoteSeen: 0, hostSeen: Date.now(), expires: Date.now() + lifetime, control: { x: .5, y: .5, active: false, hidden: false, twitch: 0 }, processed: [] };
    await env.BUCKET.put('rooms/' + id, JSON.stringify(state));
    return json({ id, ...publicState(state) }, 201);
  }
  const match = url.pathname.match(/^\/api\/rooms\/([a-f0-9]{32})$/);
  if (!match) return json({ error: 'Connection not found.' }, 404);
  const key = 'rooms/' + match[1];
  const object = await env.BUCKET.get(key);
  if (!object) return json({ error: 'This session has ended. Create another remote link on the cat’s screen.' }, 404);
  const state = await object.json();
  if (state.expires <= Date.now()) {
    await env.BUCKET.delete(key);
    return json({ error: 'This session has expired. Create a new link on the cat’s screen.' }, 410);
  }
  if (request.method === 'GET') return json(publicState(state));
  if (request.method === 'DELETE') { await env.BUCKET.delete(key); return json({ ended: true }); }
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (Number(request.headers.get('Content-Length') || 0) > 1024) return json({ error: 'Request too large.' }, 413);
  const raw = await request.text();
  if (raw.length > 1024) return json({ error: 'Request too large.' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid request.' }, 400); }
  const allowed = ['move', 'peek', 'pause', 'resume', 'game', 'remote-heartbeat', 'host-heartbeat', 'control'];
  if (!allowed.includes(body?.action) || typeof body.id !== 'string' || body.id.length > 64 || !body.id) return json({ error: 'Unknown command.' }, 400);
  if (state.processed.includes(body.id)) return json(publicState(state));
  if (body.action === 'game' && !games.includes(body?.game)) return json({ error: 'Choose a supported game.' }, 400);
  if (body.action === 'control') {
    const v = body.control;
    if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y) || v.x < 0 || v.x > 1 || v.y < 0 || v.y > 1 || typeof v.active !== 'boolean' || typeof v.hidden !== 'boolean' || !Number.isSafeInteger(v.twitch) || v.twitch < 0 || v.twitch > 1000000) return json({ error: 'Invalid toy position.' }, 400);
    state.control = { x: v.x, y: v.y, active: v.active, hidden: v.hidden, twitch: v.twitch };
    state.paused = false;
  }
  if (body.action === 'move' || body.action === 'peek') { state[body.action]++; state.paused = false; if(body.action === 'move' && state.control) { state.control.active = false; state.control.hidden = false; } }
  if (body.action === 'pause') state.paused = true;
  if (body.action === 'resume') state.paused = false;
  if (body.action === 'game') { state.game = body.game; state.paused = false; state.control = { x: .5, y: .5, active: false, hidden: false, twitch: 0 }; }
  if (body.action === 'host-heartbeat') state.hostSeen = Date.now();
  else state.remoteSeen = Date.now();
  state.revision++;
  state.processed = [...state.processed.slice(-31), body.id];
  const saved = await env.BUCKET.put(key, JSON.stringify(state), { onlyIf: { etagMatches: object.etag } });
  if (!saved) return json({ error: 'Another command arrived. Please retry.' }, 409);
  return json(publicState(state));
}
function publicState({ processed, ...state }) { return state; }
