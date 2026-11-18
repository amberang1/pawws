import type { ToyControl, ToyScene } from './ToyWorlds';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
type Point = { x: number; y: number };
type Fish = Point & { heading: number; phase: number; scale: number; speed: number; target: Point; timer: number; kind: number };
type Ripple = Point & { age: number; strength: number };
type Pellet = Point & { age: number };
const frames = 24;
const assetRoot = '/koi-v2/';
let loaded: { pond: HTMLImageElement; poses: HTMLCanvasElement[][] } | undefined;
let requested = false;

function image(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// The source is a straight, head-right fish. Precompute a gentle travelling
// wave in the rear half only; the head stays stable and the tail leads the stroke.
function poses(img: HTMLImageElement): HTMLCanvasElement[] {
  const w = img.naturalWidth, h = img.naturalHeight, pad = Math.ceil(w * .09);
  return Array.from({ length: frames }, (_, k) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h + 2 * pad;
    const ctx = canvas.getContext('2d')!;
    const phase = k / frames * Math.PI * 2;
    for (let x = 0; x < w; x++) {
      const rear = 1 - x / w;
      const amp = Math.pow(Math.max(0, (rear - .30) / .70), 2.2) * w * .065;
      const shift = Math.sin(phase - rear * 3.1) * amp;
      ctx.drawImage(img, x, 0, 1, h, x, pad + shift, 1, h);
    }
    return canvas;
  });
}
function requestAssets() {
  if (requested) return;
  requested = true;
  Promise.all([image(assetRoot + 'pond.jpg'), ...['sanke','kohaku','gold'].map(n => image(assetRoot + n + '.png'))])
    .then(([pond, ...fish]) => { loaded = { pond, poses: fish.map(poses) }; })
    .catch(() => { /* Original pond is a graceful fallback until assets are installed. */ });
}
function cover(c: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  c.drawImage(img, (w-img.naturalWidth*s)/2, (h-img.naturalHeight*s)/2, img.naturalWidth*s, img.naturalHeight*s);
}

export function photoKoiPond(c: CanvasRenderingContext2D, w: number, h: number, fallback: ToyScene): ToyScene {
  requestAssets();
  const length = Math.min(Math.max(25, Math.min(w,h)*.19), 240);
  const margin = Math.min(Math.min(w,h)*.23, length*.69);
  const safe = (x: number, y: number): Point => ({x:clamp(x,margin,w-margin), y:clamp(y,margin,h-margin)});
  const roam = () => safe(rand(w*.17,w*.83),rand(h*.17,h*.83));
  const fish: Fish[] = Array.from({length:5},(_,i)=>({
    ...safe(w*(.23+.14*i), h*(i%2?.66:.35)), heading: rand(-Math.PI,Math.PI),
    phase: rand(0,Math.PI*2), scale: rand(.78,1.13), speed: 0, target: roam(), timer: rand(2,6), kind:i%3
  }));
  const ripples: Ripple[] = [];
  let pellets: Pellet[] = [], bubbles: Ripple[] = [], lastTwitch = 0, elapsed = 0, feedUntil = 0;
  let foodCenter: Point = {x:w*.5,y:h*.5};
  function ripple(p: Point, strength=1) {
    ripples.push({...p,age:0,strength});
    if(ripples.length>22)ripples.shift();
  }
  function feed(p: Point) {
    foodCenter = safe(p.x,p.y); feedUntil = elapsed+11;
    pellets = Array.from({length:14},()=>({...safe(foodCenter.x+rand(-length*.24,length*.24),foodCenter.y+rand(-length*.20,length*.20)),age:0}));
    ripple(foodCenter,1.1);
  }
  function disperse() {
    feedUntil=0;pellets=[];
    fish.forEach(f=>{f.target=roam();f.timer=rand(4,8);});
  }
  return {
    control(next: ToyControl) {
      fallback.control?.(next);
      if(next.twitch===lastTwitch)return;
      lastTwitch=next.twitch;
      const p={x:clamp(next.x,0,1)*w,y:clamp(next.y,0,1)*h};
      if(next.kind==='pond-food')feed(p);
      else if(next.kind==='pond-ripple')ripple(p);
    },
    command(kind) {
      fallback.command(kind);
      if(kind==='peek')feed({x:w*.48,y:h*.56});else disperse();
    },
    draw(dt,t) {
      if(!loaded){fallback.draw(dt,t);return;}
      const {pond,poses}=loaded;
      if(dt>0) {
        elapsed+=dt;
        ripples.forEach(r=>r.age+=dt);
        bubbles.forEach(r=>r.age+=dt);
        for(let i=ripples.length-1;i>=0;i--)if(ripples[i].age>2.6)ripples.splice(i,1);
        bubbles=bubbles.filter(r=>r.age<1.6);
        pellets.forEach(p=>p.age+=dt);
        if(elapsed>feedUntil)pellets=[];
        fish.forEach((f,i)=>{
          f.timer-=dt;
          const eating=pellets.length>0;
          if(eating) {
            const a=i*2.4+elapsed*.19;
            const target=pellets.reduce((best,p)=>Math.hypot(p.x-f.x,p.y-f.y)<Math.hypot(best.x-f.x,best.y-f.y)?p:best,pellets[0]);
            const offset=length*.12;
            f.target=safe(target.x+Math.cos(a)*offset,target.y+Math.sin(a)*offset);
          } else if(f.timer<=0||Math.hypot(f.target.x-f.x,f.target.y-f.y)<length*.28){f.target=roam();f.timer=rand(4,9);}
          let dx=f.target.x-f.x,dy=f.target.y-f.y;
          // Keep a soft personal space; never let the school stack into one sprite.
          for(const other of fish)if(other!==f){
            const ax=f.x-other.x,ay=f.y-other.y,d=Math.hypot(ax,ay),r=length*.57;
            if(d>0&&d<r){const weight=(r-d)*.75;dx+=ax/d*weight;dy+=ay/d*weight;}
          }
          const want=Math.atan2(dy,dx),delta=wrap(want-f.heading);
          f.heading+=clamp(delta,-dt*(eating?1.9:1.25),dt*(eating?1.9:1.25));
          const distance=Math.hypot(dx,dy);
          const ideal=length*(eating?.62:.39)*f.scale*(.45+.55*Math.max(0,Math.cos(delta)));
          const goal=Math.min(ideal,Math.max(length*.10,distance*.9));
          f.speed+=(goal-f.speed)*(1-Math.exp(-dt*1.8));
          const p=safe(f.x+Math.cos(f.heading)*f.speed*dt,f.y+Math.sin(f.heading)*f.speed*dt);
          f.x=p.x;f.y=p.y;f.phase=(f.phase+dt*(2.4+f.speed/length*5))%(Math.PI*2);
          if(eating){
            const nose={x:f.x+Math.cos(f.heading)*length*f.scale*.43,y:f.y+Math.sin(f.heading)*length*f.scale*.43};
            const hit=pellets.findIndex(p=>Math.hypot(p.x-nose.x,p.y-nose.y)<length*.16);
            if(hit>=0){const p=pellets.splice(hit,1)[0];ripple(p,.45);for(let k=0;k<3;k++)bubbles.push({x:p.x+rand(-8,8),y:p.y+rand(-6,6),age:0,strength:rand(1.5,3.5)});}
          }
        });
      }
      cover(c,pond,w,h);
      // Low contrast moving highlights, not opaque ripple stickers.
      c.save();c.globalCompositeOperation='screen';c.globalAlpha=.09;
      for(let i=0;i<5;i++){
        const x=w*(.12+i*.19),y=h*(.3+.18*Math.sin(i*4+elapsed*.16));
        const g=c.createRadialGradient(x,y,0,x,y,length*1.5);
        g.addColorStop(0,'#a0d7b4');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-length*1.5,y-length*1.5,length*3,length*3);
      }
      c.restore();
      for(const f of fish){
        const pose=poses[f.kind][Math.floor(f.phase/(Math.PI*2)*frames)%frames];
        const l=length*f.scale,hh=l*pose.height/pose.width;
        c.save();c.translate(f.x,f.y);c.rotate(f.heading);
        c.globalAlpha=.18;c.fillStyle='#041f23';c.beginPath();c.ellipse(-l*.04,l*.055,l*.43,l*.115,0,0,Math.PI*2);c.fill();
        c.globalAlpha=.88+.07*Math.sin(f.kind+elapsed*.25);
        c.drawImage(pose,-l*.5,-hh*.5,l,hh);c.restore();
      }
      for(const p of pellets){
        c.fillStyle='#ab8954';c.beginPath();c.arc(p.x,p.y,Math.max(1.1,length*.013),0,Math.PI*2);c.fill();
        c.fillStyle='#e1c492';c.beginPath();c.arc(p.x-.5,p.y-.5,Math.max(.5,length*.005),0,Math.PI*2);c.fill();
      }
      for(const r of ripples){
        const fade=Math.max(0,1-r.age/2.6);
        for(let j=0;j<3;j++){
          const radius=(r.age*length*.65+j*length*.09+3)*r.strength;
          c.strokeStyle='rgba(190,225,216,'+(fade*(.31-j*.065))+')';c.lineWidth=Math.max(.65,length*.009);
          c.beginPath();c.arc(r.x,r.y,radius,0,Math.PI*2);c.stroke();
        }
      }
      for(const b of bubbles){
        const radius=b.strength*(1+b.age*.6);
        c.strokeStyle='rgba(221,245,238,'+(.64*(1-b.age/1.6))+')';c.lineWidth=1;
        c.beginPath();c.arc(b.x,b.y-b.age*7,radius,0,Math.PI*2);c.stroke();
      }
    },
    down(){return false;},drag(){},up(){}
  };
}
