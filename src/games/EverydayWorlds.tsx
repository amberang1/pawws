import React, { useEffect, useRef } from 'react';
import { underTheDoor } from './UnderTheDoor';
import { stringAndSeek, hidingMouse, type ToyControl } from './ToyWorlds';

export type World = 'rain' | 'bag' | 'receipt' | 'ribbon' | 'mouse' | 'door';
export type Tease = { move: number; peek: number; paused: boolean; control?: ToyControl };
export const quiet: Tease = { move: 0, peek: 0, paused: false };
type Point = { x: number; y: number };
type Scene = {
  draw: (dt: number, t: number) => void;
  command: (kind: 'move' | 'peek') => void;
  control?: (control: ToyControl) => void;
  down: (id: number, p: Point) => boolean;
  drag: (id: number, p: Point) => void;
  up: (id: number, p: Point) => void;
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const random = (a: number, b: number) => a + Math.random() * (b - a);
function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, angle = 0) {
  c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), angle, 0, Math.PI * 2); c.fill();
}
function path(c: CanvasRenderingContext2D, points: number[], fill: string) {
  c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.closePath(); c.fillStyle = fill; c.fill();
}
function background(w: number, h: number, render: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  render(canvas.getContext('2d')!); return canvas;
}

function rainyRide(c: CanvasRenderingContext2D, w: number, h: number): Scene {
  const base = background(w, h, b => {
    const sky = b.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#6b8389'); sky.addColorStop(.52, '#b9c8c1'); sky.addColorStop(1, '#323e42');
    b.fillStyle = sky; b.fillRect(0, 0, w, h);
    // A quiet garden road seen from inside a parked car.
    b.save(); b.filter = 'blur(7px)';
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? 1 : -1;
      const x = w * .5 + side * random(w * .12, w * .65);
      const y = random(h * .1, h * .52);
      b.fillStyle = '#364d46'; b.fillRect(x, y, 8, h * .55 - y);
      ellipse(b, x, y, random(w * .04, w * .1), random(h * .08, h * .16), ['#425c50', '#52695b', '#344f48'][i % 3]);
    }
    path(b, [w * .48, h * .43, w * .52, h * .43, w * .94, h * .88, w * .06, h * .88], '#6a7372');
    b.strokeStyle = '#bbc1a5'; b.lineWidth = 3;
    b.beginPath(); b.moveTo(w * .5, h * .53); b.lineTo(w * .5, h * .59); b.moveTo(w * .5, h * .67); b.lineTo(w * .5, h * .81); b.stroke();
    b.restore();
    const haze = b.createLinearGradient(0, 0, 0, h); haze.addColorStop(0, '#d5e8e51c'); haze.addColorStop(1, '#0e282333');
    b.fillStyle = haze; b.fillRect(0, 0, w, h);
  });
  type Drop = { x: number; y: number; r: number; speed: number; wait: number };
  const drops: Drop[] = Array.from({ length: Math.floor(w * h / 3200) + 40 }, () => ({ x: random(0, w), y: random(0, h * .85), r: random(1.8, 5), speed: random(6, 34), wait: random(0, 7) }));
  let next = 2, sweep = -1, nextLeaf = 8, leaf: { x: number; y: number; angle: number } | null = null;
  let mark: Point | null = null, markAge = 0;
  const pivots = [w * .28, w * .72], py = h * .9, length = Math.min(h * .76, w * .69);
  function angleAt(p: number) { return -Math.PI * .5 - .88 + Math.sin(clamp(p, 0, 1) * Math.PI) * 1.68; }
  function clearSweep(previous: number, current: number) {
    for (const px of pivots) {
      for (const d of drops) {
        const distance = Math.hypot(d.x - px, d.y - py);
        const angle = Math.atan2(d.y - py, d.x - px);
        if (distance < length && distance > length * .12 && angle >= Math.min(previous, current) - .045 && angle <= Math.max(previous, current) + .045) { d.y = -random(4, h * .35); d.x = random(0, w); d.wait = random(.8, 4); }
      }
    }
  }
  return {
    draw(dt, t) {
      c.drawImage(base, 0, 0);
      if (dt) {
        next -= dt; nextLeaf -= dt; markAge += dt;
        if (next <= 0 && sweep < 0) { sweep = 0; next = random(3.2, 6.5); }
        if (nextLeaf <= 0) { leaf = { x: random(w * .25, w * .75), y: h * .3, angle: random(-1, 1) }; nextLeaf = random(12, 22); }
        const oldAngle = angleAt(sweep);
        if (sweep >= 0) { sweep += dt / 1.45; clearSweep(oldAngle, angleAt(sweep)); if (sweep > 1) { sweep = -1; if (leaf) leaf = null; } }
        for (const d of drops) {
          if (d.wait > 0) d.wait -= dt;
          else d.y += d.speed * dt;
          if (d.y > h * .86) { d.y = -10; d.x = random(0, w); d.wait = random(0, 5); }
        }
      }
      // Drop trails, a bright refracted edge, and a dark centre.
      for (const d of drops) {
        if (d.y < 0) continue;
        if (d.wait <= 0) {
          c.strokeStyle = '#dce7e53b'; c.lineWidth = d.r * .5; c.beginPath(); c.moveTo(d.x, d.y - d.r * 6); c.lineTo(d.x + .5, d.y); c.stroke();
        }
        ellipse(c, d.x + 1, d.y + 1, d.r * .85, d.r * 1.4, '#142c4055');
        ellipse(c, d.x, d.y, d.r * .7, d.r * 1.1, '#d8f1ef70');
        ellipse(c, d.x - d.r * .18, d.y - d.r * .4, d.r * .23, d.r * .35, '#f2fffaaf');
      }
      if (leaf) {
        c.save(); c.translate(leaf.x, leaf.y); c.rotate(leaf.angle + Math.sin(t * 2) * .05);
        ellipse(c, 0, 0, 20, 8, '#b6954e', -.4); c.strokeStyle = '#62582b'; c.beginPath(); c.moveTo(-20, 8); c.lineTo(20, -8); c.stroke(); c.restore();
      }
      if (mark && markAge < 2) {
        ellipse(c, mark.x, mark.y, 35 + markAge * 6, 30, '#e2efeb' + Math.floor((1 - markAge / 2) * 40).toString(16).padStart(2, '0'));
      }
      // Rubber wipers follow the exact arc used to clear the rain.
      const a = angleAt(sweep);
      for (const px of pivots) {
        c.save(); c.strokeStyle = '#101a1e'; c.lineCap = 'round';
        c.lineWidth = Math.max(4, w * .006); c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * length * .6, py + Math.sin(a) * length * .6); c.stroke();
        c.lineWidth = Math.max(6, w * .009); c.beginPath(); c.moveTo(px + Math.cos(a) * length * .32, py + Math.sin(a) * length * .32); c.lineTo(px + Math.cos(a) * length, py + Math.sin(a) * length); c.stroke(); c.restore();
      }
      // Windshield frame, dashboard, mirror and the edges of the front seats.
      path(c, [0, 0, w * .07, 0, w * .14, h * .82, 0, h], '#182125');
      path(c, [w, 0, w * .93, 0, w * .86, h * .82, w, h], '#182125');
      const dash = c.createLinearGradient(0, h * .83, 0, h); dash.addColorStop(0, '#30383b'); dash.addColorStop(1, '#0c1216');
      path(c, [0, h * .87, w * .14, h * .82, w * .86, h * .82, w, h * .87, w, h, 0, h], dash as any);
      c.strokeStyle = '#65716a55'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * .15, h * .85); c.quadraticCurveTo(w * .5, h * .81, w * .85, h * .85); c.stroke();
      c.fillStyle = '#152025'; c.fillRect(w * .49, 0, w * .02, h * .08);
      c.beginPath(); c.roundRect(w * .39, h * .055, w * .22, h * .065, 8); c.fill();
      c.fillStyle = '#7b93945c'; c.beginPath(); c.roundRect(w * .4, h * .065, w * .2, h * .04, 4); c.fill();
      ellipse(c, -w * .03, h * 1.05, w * .28, h * .24, '#0b1217');
      ellipse(c, w * 1.03, h * 1.05, w * .28, h * .24, '#0b1217');
    },
    command(kind) { if (kind === 'move') { if (sweep < 0) sweep = 0; next = 5; } else { leaf = { x: random(w * .3, w * .7), y: random(h * .25, h * .55), angle: random(-1, 1) }; } },
    down(_id, p) {
      mark = p; markAge = 0;
      let hit = false;
      for (const d of [...drops]) if (Math.hypot(d.x - p.x, d.y - p.y) < 35) {
        hit = true; d.r = Math.max(1.8, d.r * .65); d.x += random(-15, 15); d.wait = 0; d.speed = 65;
      }
      if (leaf && Math.hypot(leaf.x - p.x, leaf.y - p.y) < 45) { leaf.y += 30; leaf.angle += .8; hit = true; }
      return hit;
    },
    drag() {}, up() {}
  };
}

function paperBag(c: CanvasRenderingContext2D, w: number, h: number): Scene {
  const s = Math.min(w / 900, h / 650), cx = w * .5, cy = h * .5;
  const floor = background(w, h, b => {
    const g = b.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d6c3a0'); g.addColorStop(1, '#a48c69');
    b.fillStyle = g; b.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 95 * s) {
      b.strokeStyle = '#634d352a'; b.lineWidth = 2; b.beginPath(); b.moveTo(0, y); b.lineTo(w, y + h * .04); b.stroke();
      for (let j = 0; j < 9; j++) { b.strokeStyle = '#f1dfb51c'; b.lineWidth = 1; b.beginPath(); b.moveTo(random(0, w), y + j * 10 * s); b.bezierCurveTo(w * .3, y + j * 11 * s, w * .6, y + j * 8 * s, w, y + j * 10 * s); b.stroke(); }
    }
  });
  let timer = 1.2, rustle = 0, reveal = 0, held: number | null = null, press: Point | null = null, side = 1, wiggle = 0;
  function tailPoint() { return { x: cx + side * (145 + reveal * 115) * s, y: cy + (25 - Math.sin(wiggle * 2) * 30 * reveal) * s }; }
  return {
    draw(dt, t) {
      if (dt) {
        timer -= dt; rustle = Math.max(0, rustle - dt); if (held === null) wiggle += dt;
        if (held === null) reveal = Math.max(0, reveal - dt * .16);
        if (timer < 0 && held === null) { rustle = random(.6, 1.4); reveal = random(.45, 1); side = Math.random() < .5 ? -1 : 1; timer = random(3, 7); }
      }
      c.drawImage(floor, 0, 0);
      c.save(); c.translate(cx, cy); c.scale(s, s);
      const shake = held !== null ? 1.3 : Math.sin(t * 37) * rustle * 3;
      c.translate(shake, Math.sin(t * 29) * rustle);
      c.save(); c.filter = 'blur(15px)'; ellipse(c, 10, 112, 210, 47, '#3d2c2859'); c.restore();
      // Tail emerges from behind the bag; its end remains visible outside the opening.
      const tip = tailPoint();
      if (reveal > .03) {
        c.save(); c.scale(side, 1); c.lineCap = 'round';
        const tx = Math.abs(tip.x - cx) / s, ty = (tip.y - cy) / s;
        const tail = new Path2D(); tail.moveTo(135, 40); tail.bezierCurveTo(190, 110, 255, -40 * reveal, tx, ty);
        c.strokeStyle = '#40382e'; c.lineWidth = 28; c.stroke(tail);
        c.strokeStyle = '#998774'; c.lineWidth = 22; c.stroke(tail);
        c.strokeStyle = '#51473d'; c.lineWidth = 5;
        for (let i = 0; i < 5; i++) {
          const u = .3 + i * .125, inv = 1 - u;
          const x = inv ** 3 * 135 + 3 * inv ** 2 * u * 190 + 3 * inv * u ** 2 * 255 + u ** 3 * tx;
          const y = inv ** 3 * 40 + 3 * inv ** 2 * u * 110 - 3 * inv * u ** 2 * 40 * reveal + u ** 3 * ty;
          c.beginPath(); c.moveTo(x - 3, y - 9); c.lineTo(x + 3, y + 9); c.stroke();
        }
        c.restore();
      }
      // Open mouth, gusset, crumpled body and light-catching folded rim.
      path(c, [-155,-85, 95,-115, 167,-47, 138,102, -147,124, -182,37], '#9c7648');
      path(c, [95,-115, 167,-47, 138,102, 95,47], '#795738');
      const paper = c.createLinearGradient(-150, -80, 140, 120); paper.addColorStop(0, '#d4b17a'); paper.addColorStop(.55, '#bd945e'); paper.addColorStop(1, '#a77b49');
      const bulge = Math.sin(t * 5) * rustle * 12;
      c.beginPath(); c.moveTo(-155, -85); c.lineTo(95, -115); c.quadraticCurveTo(133 + bulge, -5, 138, 102); c.lineTo(-147, 124); c.quadraticCurveTo(-170 - bulge, 20, -155, -85); c.fillStyle = paper; c.fill();
      path(c, [-155,-85, -126,-111, 117,-132, 95,-115, -130,-66], '#dabe8c');
      path(c, [-130,-66, 95,-115, 117,-90, -118,-45], '#493421');
      path(c, [-155,-85, -130,-66, -118,-45, -145,-63], '#e0c492');
      path(c, [-147,124, -111,87, 104,73, 138,102], '#b78d55');
      c.strokeStyle = '#805d354a'; c.lineWidth = 1.5;
      for (const pts of [[-150,12,-80,40,-111,87], [-118,-45,-93,14,-80,40], [95,-80,50,-12,104,73], [-111,87,-5,65,104,73]]) {
        c.beginPath(); c.moveTo(pts[0],pts[1]); c.lineTo(pts[2],pts[3]); c.lineTo(pts[4],pts[5]); c.stroke();
      }
      c.strokeStyle = '#eed7a74d'; c.beginPath(); c.moveTo(-134,-49); c.lineTo(-117,65); c.lineTo(-111,87); c.stroke();
      c.save(); c.translate(-12, 12); c.rotate(-.08); c.fillStyle = '#75553888'; c.font = '12px monospace'; c.textAlign = 'center'; c.fillText('SOMETHING IN HERE.', 0, 0); c.restore();
      if (press) { const px = (press.x - cx) / s, py = (press.y - cy) / s; ellipse(c, px, py, 27, 17, '#5e432b35'); }
      c.restore();
    },
    command(kind) { if (kind === 'peek') { reveal = 1; rustle = .5; } else { rustle = 2; if (held === null) { side *= -1; reveal = .65; } } timer = 5; },
    down(id, p) {
      const tip = tailPoint();
      if (reveal > .1 && Math.hypot(p.x - tip.x, p.y - tip.y) < 55 * s + 20) { held = id; press = p; rustle = .25; return true; }
      if (Math.abs(p.x - cx) < 180 * s && Math.abs(p.y - cy) < 135 * s) { held = id; press = p; rustle = .1; return true; }
      rustle = .8; timer = 1; return false;
    },
    drag(id, p) { if (held === id) press = p; },
    up(id) { if (held === id) { held = null; press = null; rustle = 1; reveal = .8; timer = 2; } }
  };
}

function escapingReceipt(c: CanvasRenderingContext2D, w: number, h: number): Scene {
  const s = Math.min(w / 850, h / 600), rw = 100 * s, rh = 225 * s;
  const floor = background(w, h, b => {
    b.fillStyle = '#bfc3bc'; b.fillRect(0,0,w,h);
    const tile = 185 * s;
    for (let row = -1; row < h / tile + 1; row++) for (let col = -1; col < w / tile + 1; col++) {
      const x = col * tile, y = row * tile;
      const g = b.createLinearGradient(x,y,x+tile,y+tile);
      g.addColorStop(0,'#e5e7de');g.addColorStop(1,'#d2d7ce');b.fillStyle=g;b.fillRect(x+2,y+2,tile-4,tile-4);
      b.strokeStyle='#f2f3e977';b.lineWidth=1;b.strokeRect(x+3,y+3,tile-6,tile-6);
      for(let i=0;i<8;i++){ b.fillStyle='#8190880c';b.fillRect(x+random(0,tile),y+random(0,tile),random(4,40)*s,1); }
    }
  });
  let x = w * .5, y = h * .5, vx = 22, vy = -9, rot = -.25, spin = .08, gust = 1.5, next = 3.5, flutter = 0;
  let held: number | null = null, last: Point | null = null, lastTime = 0, releaseVX = 0, releaseVY = 0, offsetX = 0, offsetY = 0, pinX = 0, pinY = 0;
  return {
    draw(dt, t) {
      if (dt) {
        flutter += dt;
        next -= dt; gust = Math.max(0, gust - dt);
        if (next <= 0 && held === null) { gust = random(1,2); vx += random(-110,110); vy += random(-65,65); spin += random(-.8,.8); next = random(4,8); }
        if (held === null) {
          if (gust > 0) { vx += Math.sin(flutter * 2.5) * 32 * dt; vy += Math.cos(flutter * 1.3) * 20 * dt; }
          vx *= Math.exp(-.4*dt); vy *= Math.exp(-.4*dt); spin *= Math.exp(-.6*dt);
          x += vx * dt; y += vy * dt; rot += spin * dt;
          const radius = Math.hypot(rw,rh)*.53;
          if (x < radius || x > w-radius) { vx *= -.65; spin += .2; x = clamp(x,radius,w-radius); }
          if (y < radius || y > h-radius) { vy *= -.65; spin -= .15; y = clamp(y,radius,h-radius); }
        }
      }
      c.drawImage(floor,0,0);
      c.save(); c.translate(x,y); c.rotate(rot);
      const curl = Math.sin(flutter*9)*(held===null?gust*5:5)*s + 7*s;
      c.save();c.filter='blur(9px)';c.fillStyle='#48534735';c.fillRect(-rw*.5+8*s,-rh*.5+10*s,rw,rh);c.restore();
      c.beginPath();c.moveTo(-rw*.5,-rh*.5+curl);c.quadraticCurveTo(0,-rh*.5-9*s,rw*.5,-rh*.5-curl*.5);
      c.lineTo(rw*.5,rh*.5-curl);
      for(let i=0;i<=10;i++) c.lineTo(rw*.5-rw*i/10,rh*.5+(i%2?2:-2)*s-curl*Math.sin(i*.31));
      c.closePath(); const pg=c.createLinearGradient(-rw/2,0,rw/2,0);pg.addColorStop(0,'#dddcd0');pg.addColorStop(.2,'#fffdf1');pg.addColorStop(.8,'#f3f1e4');pg.addColorStop(1,'#d3d4c8');c.fillStyle=pg;c.fill();
      // Printed details travel with the paper, giving its rotation a readable reference.
      c.save();c.scale(s,s);c.fillStyle='#525952';c.textAlign='center';c.font='bold 9px monospace';c.fillText('THE CORNER STORE',0,-80);
      c.font='6px monospace';c.fillText('THANK YOU FOR VISITING',0,-68);
      c.strokeStyle='#7a8175';c.lineWidth=.5;
      for(const yy of [-57,38,62]){c.beginPath();c.moveTo(-37,yy);c.lineTo(37,yy);c.stroke();}
      c.font='7px monospace';c.textAlign='left';
      const lines=[['TUNA','2.80'],['CATNIP','1.50'],['PAPER BAG','0.10'],['MYSTERY ITEM','?.??']];
      lines.forEach(([item,price],i)=>{c.fillText(item,-36,-41+i*17);c.textAlign='right';c.fillText(price,36,-41+i*17);c.textAlign='left';});
      c.font='bold 8px monospace';c.fillText('TOTAL',-36,53);c.textAlign='right';c.fillText('4.40',36,53);
      for(let i=0;i<28;i++){c.fillStyle='#424d44';c.fillRect(-34+i*2.4,74,i%3===0?1.6:.7,15);}
      c.textAlign='center';c.font='6px monospace';c.fillText('KEEP THIS LITTLE RECEIPT',0,100);c.restore();
      c.strokeStyle='#9a9d8b5a';c.lineWidth=1;c.beginPath();c.moveTo(-rw*.45,rh*.1);c.quadraticCurveTo(0,rh*.08,rw*.45,rh*.14);c.stroke();
      if(held!==null) ellipse(c,pinX,pinY,19*s,14*s,'#53604b27');
      c.restore();
    },
    command(kind) {
      if(kind==='move'){ if(held===null){vx+=random(-180,180);vy+=random(-110,110);spin+=random(-1.5,1.5);}gust=2; }
      else { gust=1.2; flutter+=.8; } next=5;
    },
    down(id,p) {
      if(held!==null)return false;
      const dx=p.x-x,dy=p.y-y, lx=dx*Math.cos(rot)+dy*Math.sin(rot),ly=-dx*Math.sin(rot)+dy*Math.cos(rot);
      if(Math.abs(lx)<rw*.65+12&&Math.abs(ly)<rh*.55+12){held=id;last=p;lastTime=performance.now();offsetX=dx;offsetY=dy;pinX=lx;pinY=ly;vx=0;vy=0;releaseVX=0;releaseVY=0;gust=.6;return true;}
      if(Math.hypot(dx,dy)<rh*1.2){vx+=dx*.3;vy+=dy*.3;gust=1;}return false;
    },
    drag(id,p) {if(id===held&&last){const now=performance.now(),dt=Math.max(.016,(now-lastTime)/1000);releaseVX=clamp((p.x-last.x)/dt,-650,650);releaseVY=clamp((p.y-last.y)/dt,-650,650);x=p.x-offsetX;y=p.y-offsetY;last=p;lastTime=now;}},
    up(id) {if(id===held){held=null;vx=releaseVX;vy=releaseVY;spin=(vx+vy)*.002;last=null;gust=1;next=3;}}
  };
}

export function EverydayWorld({ world, tease = quiet, preview = false, onAction }: { world: World; tease?: Tease; preview?: boolean; onAction?: (action: 'tap' | 'catch') => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inputs = useRef({ tease, onAction }); inputs.current = { tease, onAction };
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!;
    let frame = 0, scene: Scene, time = 0, previous = performance.now(), lastRender = 0;
    let seen = { move: inputs.current.tease.move, peek: inputs.current.tease.peek };
    const points = new Map<number, Point>();
    function resize() {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      points.clear();
      scene = (world === 'door' ? underTheDoor : world === 'ribbon' ? stringAndSeek : world === 'mouse' ? hidingMouse : world === 'rain' ? rainyRide : world === 'bag' ? paperBag : escapingReceipt)(ctx,width,height);
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if(preview && now-lastRender<45)return;
      const dt = inputs.current.tease.paused || document.hidden ? 0 : Math.min((now-previous)/1000,.05);
      previous=now;lastRender=now;
      const current = inputs.current.tease;
      for(const kind of ['move','peek'] as const) if(current[kind]!==seen[kind]) {scene.command(kind);seen[kind]=current[kind];}
      if(current.control)scene.control?.(current.control);
      time+=dt;scene.draw(dt,time);
    }
    frame=requestAnimationFrame(tick);
    const point = (e: PointerEvent) => {const box=canvas.getBoundingClientRect();return{x:e.clientX-box.left,y:e.clientY-box.top};};
    function down(e:PointerEvent){if(preview||inputs.current.tease.paused)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=point(e);points.set(e.pointerId,p);inputs.current.onAction?.('tap');if(scene.down(e.pointerId,p))inputs.current.onAction?.('catch');}
    function move(e:PointerEvent){if(!points.has(e.pointerId))return;const p=point(e);points.set(e.pointerId,p);if(!inputs.current.tease.paused)scene.drag(e.pointerId,p);}
    function up(e:PointerEvent){if(!points.has(e.pointerId))return;scene.up(e.pointerId,points.get(e.pointerId)!);points.delete(e.pointerId);}
    function blur(){for(const [id,p] of points)scene.up(id,p);points.clear();}
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);window.addEventListener('blur',blur);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);window.removeEventListener('blur',blur);};
  },[world,preview]);
  return <canvas ref={ref} className={'world-canvas '+(preview?'world-preview':'')} aria-label={world === 'door' ? 'A feather toy peeks out from under a door' : world === 'ribbon' ? 'A flexible braided string that hides behind a curtain' : world === 'mouse' ? 'A realistic mouse that hides in skirting-board holes' : world === 'rain' ? 'Rain on a car windscreen with moving wipers' : world === 'bag' ? 'A rustling paper bag with a peeking tail' : 'A fluttering receipt you can hold and swipe'} />;
}

