import http from 'node:http';
import { randomUUID } from 'node:crypto';
import worker from './dist/server/index.js';

// A single Cloud Run instance keeps active remote sessions in memory.
// Sessions are temporary and intentionally disappear if the instance restarts.
const values = new Map();
const bucket = {
  async get(key) {
    const value = values.get(key);
    if (!value) return null;
    return { etag: value.etag, json: async () => JSON.parse(value.text) };
  },
  async put(key, text, options) {
    if (options?.onlyIf && values.get(key)?.etag !== options.onlyIf.etagMatches) return null;
    const etag = randomUUID();
    values.set(key, { text, etag });
    return { etag };
  },
  async delete(key) { values.delete(key); }
};
const cleanup = setInterval(() => {
  for (const [key, value] of values) {
    try { if (JSON.parse(value.text).expires <= Date.now()) values.delete(key); }
    catch { values.delete(key); }
  }
}, 60_000);
cleanup.unref();
const server = http.createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of incoming) {
      size += chunk.length;
      if (size > 2048) { outgoing.writeHead(413).end('Request too large'); return; }
      chunks.push(chunk);
    }
    const protocol = incoming.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = incoming.headers.host || 'localhost';
    const method = incoming.method || 'GET';
    const request = new Request(new URL(incoming.url || '/', protocol + '://' + host), {
      method, headers: incoming.headers,
      ...(!['GET', 'HEAD'].includes(method) && chunks.length ? { body: Buffer.concat(chunks) } : {})
    });
    const response = await worker.fetch(request, { BUCKET: bucket });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    if (!outgoing.headersSent) outgoing.writeHead(500, { 'content-type': 'application/json' });
    outgoing.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }));
  }
});
server.listen(Number(process.env.PORT) || 8080, '0.0.0.0');
