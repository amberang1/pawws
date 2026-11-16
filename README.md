# PawHunt

Little worlds for curious cats. React + Vite, with a small Cloudflare Worker and R2-backed remote sessions.

## Preview

https://pawhunt-amber.lustroushobby1.chatgpt.site

The preview is owner-private. Open it in a browser signed in to the owner's ChatGPT account; use that same account on a second device if prompted.

## Play

Choose Rainy Ride, Paper Bag Mystery, or The Escaping Receipt. These run autonomously and respond to paws. The original nine games remain in the original toy box.

Choose **Play together** to create a remote link. Open the link on a second phone. **Move**, **Peek**, and **Pause** trigger different behaviours in each world; the remote can also switch between the three worlds. Return to the cat's screen and close its human controls panel. Hold the small controls button for 0.9 seconds (or press Escape) to reopen it.

Remote links are unguessable bearer capabilities, expire after two hours, and are invalidated on disconnect or leaving the game. Keep them private. The remote is a miniature illustration, not a video stream of the cat's screen. Host connection survives refresh in the same tab. No camera, microphone, AI API key, or account setup inside the app is needed.

## Develop and verify

- `npm install`
- `npm run dev` — local development, including an in-memory remote API for two-browser/device testing. Use a host reachable from both devices.
- `npm run lint` — TypeScript check.
- `npm test` — remote isolation, commands, retries, conflicts, expiry, disconnect, validation.
- `npm run build` — Vite assets and deployable Worker at `dist/server/index.js`.

The Worker embeds the generated client assets. Production needs an R2 binding named `BUCKET`, declared in `.openai/hosting.json`. Static-only hosting supports the games but cannot provide the remote without an equivalent backend. No production secrets are included in browser bundles.

The games are procedural illustrations. Their appeal to individual cats needs observation; touches are reported as contacts rather than a purported engagement score.
