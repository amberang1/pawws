export default {
  async fetch(request, env) {
    try {
      const api = await handleAPI(request, env);
      if (api) return api;
      const path = new URL(request.url).pathname;
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
      const asset = ASSETS[path] || (path.includes('.') ? null : ASSETS['/index.html']);
      if (!asset) return new Response('Not found', { status: 404 });
      const bytes = Uint8Array.from(atob(asset.data), c => c.charCodeAt(0));
      return new Response(request.method === 'HEAD' ? null : bytes, { headers: {
        'Content-Type': asset.type,
        'Cache-Control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff'
      }});
    } catch {
      return Response.json({ error: 'The connection was interrupted. Please try again.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
  }
};
