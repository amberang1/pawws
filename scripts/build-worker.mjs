import fs from 'node:fs';
import path from 'node:path';
const assets = {};
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) walk(file);
    else {
      const ext = path.extname(file);
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
      assets['/' + path.relative('dist', file)] = { data: fs.readFileSync(file).toString('base64'), type: types[ext] || 'application/octet-stream' };
    }
  }
}
walk('dist');
fs.mkdirSync('dist/server', { recursive: true });
const api = fs.readFileSync('worker/api.mjs', 'utf8').replace('export async function', 'async function');
fs.writeFileSync('dist/server/index.js', 'const ASSETS = ' + JSON.stringify(assets) + ';\n' + api + '\n' + fs.readFileSync('worker/index.mjs', 'utf8'));
fs.mkdirSync('dist/.openai', { recursive: true });
fs.copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log('Built Worker with ' + Object.keys(assets).length + ' embedded assets.');

