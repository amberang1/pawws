import { koiPond, kitchenBeetle } from './GardenWorlds';
import { rainyRide } from './RainyRide';
import React, { useEffect, useRef } from 'react';
import { underTheDoor } from './UnderTheDoor';
import { stringAndSeek, hidingMouse, type ToyControl } from './ToyWorlds';

export type World = 'rain' | 'bag' | 'receipt' | 'ribbon' | 'mouse' | 'door' | 'koi' | 'bug';
export type Tease = { move: number; peek: number; paused: boolean; caught?: boolean; control?: ToyControl };
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
  let timer = 1.2, rustle = 0, reveal = 0, held: number | null = null, press: Point | null = null, side = 1, wiggle = 0, bulgeX = -90, bulgeY = 25, bulgeTargetX = 85, bulgeTargetY = 45, relocate = 0;
  function tailPoint() { return { x: cx + side * (145 + reveal * 115) * s, y: cy + (25 - Math.sin(wiggle * 2) * 30 * reveal) * s }; }
  return {
    draw(dt, t) {
      if (dt) {
        timer -= dt; rustle = Math.max(0, rustle - dt); if (held === null) { wiggle += dt; relocate -= dt;
          if(relocate<=0){bulgeTargetX=random(-110,90);bulgeTargetY=random(-25,70);relocate=random(1.5,3.5);rustle=Math.max(rustle,.7);}
          bulgeX+=(bulgeTargetX-bulgeX)*(1-Math.exp(-dt*2));bulgeY+=(bulgeTargetY-bulgeY)*(1-Math.exp(-dt*2));
        }
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
      c.save();c.clip();
      // A rounded local bulge crosses the paper instead of shaking the whole bag.
      const bx=held!==null&&press?(press.x-cx)/s:bulgeX,by=held!==null&&press?(press.y-cy)/s:bulgeY;
      const mound=c.createRadialGradient(bx-10,by-13,2,bx,by,held!==null?29:57);mound.addColorStop(0,held!==null?'#64432255':'#f3d39a80');mound.addColorStop(.6,'#8d613022');mound.addColorStop(1,'#9c703000');c.fillStyle=mound;c.fillRect(-180,-135,350,275);
      c.strokeStyle='#68451d28';c.lineWidth=1;for(let i=0;i<5;i++){const a=i*1.3;c.beginPath();c.moveTo(bx+Math.cos(a)*19,by+Math.sin(a)*15);c.lineTo(bx+Math.cos(a)*64,by+Math.sin(a)*42);c.stroke();}c.restore();
      path(c, [-155,-85, -126,-111, 117,-132, 95,-115, -130,-66], '#dabe8c');
      path(c, [-130,-66, 95,-115, 117,-90, -118,-45], '#493421');
      path(c, [-155,-85, -130,-66, -118,-45, -145,-63], '#e0c492');
      path(c, [-147,124, -111,87, 104,73, 138,102], '#b78d55');
      c.strokeStyle = '#805d354a'; c.lineWidth = 1.5;
      for (const pts of [[-150,12,-80,40,-111,87], [-118,-45,-93,14,-80,40], [95,-80,50,-12,104,73], [-111,87,-5,65,104,73]]) {
        c.beginPath(); c.moveTo(pts[0],pts[1]); c.lineTo(pts[2],pts[3]); c.lineTo(pts[4],pts[5]); c.stroke();
      }
      c.strokeStyle = '#eed7a74d'; c.beginPath(); c.moveTo(-134,-49); c.lineTo(-117,65); c.lineTo(-111,87); c.stroke();
      c.save(); c.translate(-12, 12); c.rotate(-.08); c.fillStyle = '#75553888'; c.font = '12px monospace'; c.textAlign = 'center'; c.fillText('THANK YOU', 0, 0); c.restore();
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
    up(id) { if (held === id) { held = null; press = null; rustle = 1; reveal = .8; side *= -1; bulgeTargetX = -bulgeX; relocate = 2; timer = 2; } }
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
    b.save();b.translate(w*.1,h*.55);b.rotate(.05);b.fillStyle='#858e83';b.beginPath();b.roundRect(-22*s,-95*s,44*s,190*s,6*s);b.fill();
    for(let i=0;i<16;i++){b.fillStyle='#3d4a44';b.fillRect(-15*s,(-82+i*10)*s,30*s,4*s);b.fillStyle='#d5d9c6';b.fillRect(-15*s,(-81+i*10)*s,30*s,1*s);}b.restore();
  });
  let x = w * .5, y = h * .5, vx = 22, vy = -9, rot = -.25, spin = .08, gust = 1.5, next = 3.5, flutter = 0, breeze = 1, lift = 0;
  let held: number | null = null, last: Point | null = null, lastTime = 0, releaseVX = 0, releaseVY = 0, offsetX = 0, offsetY = 0, pinX = 0, pinY = 0;
  return {
    draw(dt, t) {
      if (dt) {
        flutter += dt;
        next -= dt; gust = Math.max(0, gust - dt); lift = Math.max(0,lift-dt);
        if(next<.7&&next>0)lift=.7-next;
        if (next <= 0 && held === null) { gust = random(1,2); vx += breeze*random(65,140); vy += random(-35,35); spin += random(-.8,.8); next = random(4,8); }
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
      const curl = Math.sin(flutter*9)*(held===null?(gust*5+lift*19):7)*s + (7+lift*14)*s;
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
      if(kind==='move'){ if(held===null){breeze*=-1;vx+=breeze*170;vy+=random(-45,45);spin+=random(-1.5,1.5);}gust=2; }
      else { lift=1.4; gust=.4; flutter+=.8; } next=3;
    },
    down(id,p) {
      if(held!==null)return false;
      const dx=p.x-x,dy=p.y-y, lx=dx*Math.cos(rot)+dy*Math.sin(rot),ly=-dx*Math.sin(rot)+dy*Math.cos(rot);
      if(Math.abs(lx)<rw*.65+12&&Math.abs(ly)<rh*.55+12){held=id;last=p;lastTime=performance.now();offsetX=dx;offsetY=dy;pinX=lx;pinY=ly;vx=0;vy=0;releaseVX=0;releaseVY=0;gust=.6;return true;}
      if(Math.hypot(dx,dy)<rh*1.2){vx-=dx*.5;vy-=dy*.5;gust=1;}return false;
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
      scene = (world === 'koi' ? koiPond : world === 'bug' ? kitchenBeetle : world === 'door' ? underTheDoor : world === 'ribbon' ? stringAndSeek : world === 'mouse' ? hidingMouse : world === 'rain' ? rainyRide : world === 'bag' ? paperBag : escapingReceipt)(ctx,width,height);
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if(preview && now-lastRender<45)return;
      const dt = inputs.current.tease.paused || inputs.current.tease.caught || document.hidden ? 0 : Math.min((now-previous)/1000,.05);
      previous=now;lastRender=now;
      const current = inputs.current.tease;
      for(const kind of ['move','peek'] as const) if(current[kind]!==seen[kind]) {scene.command(kind);seen[kind]=current[kind];}
      if(current.control)scene.control?.(current.control);
      time+=dt;scene.draw(dt,time);
    }
    frame=requestAnimationFrame(tick);
    const point = (e: PointerEvent) => {const box=canvas.getBoundingClientRect();return{x:e.clientX-box.left,y:e.clientY-box.top};};
    function down(e:PointerEvent){if(preview||(inputs.current.tease.paused||inputs.current.tease.caught))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=point(e);points.set(e.pointerId,p);inputs.current.onAction?.('tap');if(scene.down(e.pointerId,p))inputs.current.onAction?.('catch');}
    function move(e:PointerEvent){if(!points.has(e.pointerId))return;const p=point(e);points.set(e.pointerId,p);if(!inputs.current.tease.paused&&!inputs.current.tease.caught)scene.drag(e.pointerId,p);}
    function up(e:PointerEvent){if(!points.has(e.pointerId))return;scene.up(e.pointerId,points.get(e.pointerId)!);points.delete(e.pointerId);}
    function blur(){for(const [id,p] of points)scene.up(id,p);points.clear();}
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);window.addEventListener('blur',blur);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);window.removeEventListener('blur',blur);};
  },[world,preview]);
  return <canvas ref={ref} className={'world-canvas '+(preview?'world-preview':'')} aria-label={world === 'koi' ? 'Koi swim through a shallow pond and hide under a leaf' : world === 'bug' ? 'A beetle explores crumbs and hides under a cork coaster' : world === 'door' ? 'A feather toy peeks out from under a door' : world === 'ribbon' ? 'A flexible braided string that hides behind a curtain' : world === 'mouse' ? 'A realistic mouse that hides in skirting-board holes' : world === 'rain' ? 'Rain on a car windscreen with moving wipers' : world === 'bag' ? 'A rustling paper bag with a peeking tail' : 'A fluttering receipt you can hold and swipe'} />;
}

