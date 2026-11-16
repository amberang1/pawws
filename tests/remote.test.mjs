import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAPI } from '../worker/api.mjs';

function fixture() {
  const records = new Map();
  let conflict = false;
  const env = { BUCKET: {
    async get(key) { const v = records.get(key); return v ? { etag: v.etag, json: async () => JSON.parse(v.text) } : null; },
    async put(key, text, options) {
      if (conflict) { conflict = false; return null; }
      if (options?.onlyIf && records.get(key)?.etag !== options.onlyIf.etagMatches) return null;
      const etag = crypto.randomUUID(); records.set(key, { text, etag }); return { etag };
    },
    async delete(key) { records.delete(key); }
  }};
  const request = (path='', method='GET', body, origin) => handleAPI(new Request('https://cats.example/api/rooms'+path,{method,headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},...(body === undefined?{}:{body:JSON.stringify(body)})}),env);
  return { request, records, conflict:()=>{conflict=true;} };
}
async function create(f, game='rain') { const r=await f.request('','POST',{game});assert.equal(r.status,201);return r.json(); }
const command = (action, extra={}) => ({ action,id:crypto.randomUUID(),...extra });

test('pairs isolated rooms, hides internal state and preserves events across polling',async()=>{
  const f=fixture(),one=await create(f),two=await create(f,'bag');
  assert.match(one.id,/^[a-f0-9]{32}$/);assert.notEqual(one.id,two.id);assert.equal(one.processed,undefined);
  await f.request('/'+one.id,'POST',command('move'));await f.request('/'+one.id,'POST',command('peek'));
  const state=await (await f.request('/'+one.id)).json();assert.equal(state.move,1);assert.equal(state.peek,1);
  const other=await (await f.request('/'+two.id)).json();assert.equal(other.move,0);
});
test('pause, resume, game changes and heartbeat are distinct operations',async()=>{
  const f=fixture(),room=await create(f);
  const path='/'+room.id;
  let state=await (await f.request(path,'POST',command('pause'))).json();assert.equal(state.paused,true);
  state=await (await f.request(path,'POST',command('remote-heartbeat'))).json();assert.equal(state.paused,true);assert.ok(state.remoteSeen>0);
  state=await (await f.request(path,'POST',command('resume'))).json();assert.equal(state.paused,false);
  await f.request(path,'POST',command('pause'));
  state=await (await f.request(path,'POST',command('game',{game:'receipt'}))).json();assert.equal(state.game,'receipt');assert.equal(state.paused,false);
});
test('duplicate network retries do not send two moves',async()=>{
  const f=fixture(),room=await create(f),cmd=command('move');
  await f.request('/'+room.id,'POST',cmd);
  const state=await (await f.request('/'+room.id,'POST',cmd)).json();assert.equal(state.move,1);assert.equal(state.revision,1);
});
test('conditional writes reject a conflict and safely allow retry',async()=>{
  const f=fixture(),room=await create(f),cmd=command('peek');
  f.conflict();assert.equal((await f.request('/'+room.id,'POST',cmd)).status,409);
  const state=await (await f.request('/'+room.id,'POST',cmd)).json();assert.equal(state.peek,1);
});
test('ending a session prevents further control',async()=>{
  const f=fixture(),room=await create(f);
  assert.equal((await f.request('/'+room.id,'DELETE')).status,200);
  assert.equal((await f.request('/'+room.id,'POST',command('move'))).status,404);
});
test('expired links are refused and their record is removed',async()=>{
  const f=fixture(),room=await create(f),key='rooms/'+room.id,v=f.records.get(key);
  const state=JSON.parse(v.text);state.expires=Date.now()-1;v.text=JSON.stringify(state);
  assert.equal((await f.request('/'+room.id)).status,410);assert.equal(f.records.has(key),false);
});
test('invalid commands, malformed tokens, null payloads and foreign origins are rejected',async()=>{
  const f=fixture(),room=await create(f);
  assert.equal((await f.request('','POST',null)).status,400);
  assert.equal((await f.request('','POST',{game:'unknown'})).status,400);
  assert.equal((await f.request('/1234')).status,404);
  assert.equal((await f.request('/'+room.id,'POST',null)).status,400);
  assert.equal((await f.request('/'+room.id,'POST',command('game',{game:'koi'}))).status,400);
  assert.equal((await f.request('/'+room.id,'POST',command('erase'))).status,400);
  assert.equal((await f.request('/'+room.id,'POST',command('move'),'https://other.example')).status,403);
});
test('unavailable storage reports a useful error instead of pretending to pair',async()=>{
  const r=await handleAPI(new Request('https://cats.example/api/rooms',{method:'POST',body:'{"game":"rain"}'}),{});
  assert.equal(r.status,503);assert.match((await r.json()).error,/still play/);
});
