import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { handleAPI } from './worker/api.mjs';

function remotePreview() {
  const values = new Map<string, { text: string; etag: string }>();
  const BUCKET = {
    async get(key: string) { const value = values.get(key); return value ? { etag: value.etag, json: async () => JSON.parse(value.text) } : null; },
    async put(key: string, text: string, options?: any) {
      if (options?.onlyIf && values.get(key)?.etag !== options.onlyIf.etagMatches) return null;
      const etag = crypto.randomUUID(); values.set(key, { text, etag }); return { etag };
    },
    async delete(key: string) { values.delete(key); }
  };
  return { name: 'pawhunt-remote-preview', configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/api/')) return next();
      try {
        let body = ''; for await (const chunk of req) body += chunk;
        const origin = req.headers.origin || 'http://' + req.headers.host;
        const response = await handleAPI(new Request(new URL(req.url, origin), { method: req.method, headers: req.headers, ...(body ? { body } : {}) }), { BUCKET });
        res.statusCode = response.status;
        response.headers.forEach((v: string, k: string) => res.setHeader(k, v));
        res.end(await response.text());
      } catch { res.statusCode = 500; res.end('{"error":"Preview connection failed."}'); }
    });
  }};
}
export default defineConfig({ plugins: [react(), tailwindcss(), remotePreview()] });
