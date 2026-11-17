export type ToyControl = { x: number; y: number; active: boolean; hidden: boolean; twitch: number; kind?: string; strength?: number };
export type ToyScene = {
  draw: (dt: number, t: number) => void;
  command: (kind: 'move' | 'peek') => void;
  control?: (control: ToyControl) => void;
  down: (id: number, p: { x: number; y: number }) => boolean;
  drag: (id: number, p: { x: number; y: number }) => void;
  up: (id: number, p: { x: number; y: number }) => void;
};
type Point = { x: number; y: number };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const neutral: ToyControl = { x: .5, y: .5, active: false, hidden: false, twitch: 0 };
function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  c.beginPath(); c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2); c.fillStyle=color; c.fill();
}
function floor(w: number, h: number, linen: boolean) {
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d')!;
  const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,linen?'#ede9dd':'#d0b797');g.addColorStop(1,linen?'#d9d6c8':'#b49473');
  c.fillStyle=g;c.fillRect(0,0,w,h);
  c.globalAlpha=.12;
  if(linen) {
    for(let x=0;x<w;x+=4){c.strokeStyle=x%8?'#a4a393':'#fffef6';c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
    for(let y=0;y<h;y+=4){c.strokeStyle=y%8?'#9b9c8a':'#ffffff';c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  } else {
    for(let y=70;y<h;y+=115){c.fillStyle='#725638';c.fillRect(0,y,w,2);for(let i=0;i<14;i++){c.strokeStyle=i%2?'#5a4328':'#fff1d6';c.beginPath();c.moveTo(0,y+i*7);c.bezierCurveTo(w*.3,y+i*7+4,w*.7,y+i*7-5,w,y+i*7);c.stroke();}}
    for(let row=0;row<h/115;row++){c.fillStyle='#5c442a';c.fillRect((row%3)*w*.31+30,row*115+70,2,115);}
  }
  c.globalAlpha=1;return canvas;
}

export function stringAndSeek(c:CanvasRenderingContext2D,w:number,h:number):ToyScene {
  const base=floor(w,h,true), n=38, ropeLength=Math.min(w*.65,h*.8,460), gap=ropeLength/(n-1);
  const pts=Array.from({length:n},(_,i)=>({x:w*.52-i*gap,y:h*.5+Math.sin(i*.24)*25,px:w*.52-i*gap,py:h*.5+Math.sin(i*.24)*25}));
  const pins=new Map<number,{index:number;p:Point}>();
  let input={...neutral}, target={x:w*.6,y:h*.5}, timer=1.2, twitch=0, peeking=0, wasTwitch=0;
  function curtain(t:number) {
    const edge=w*.84;
    c.save();c.shadowColor='#36403955';c.shadowBlur=16;c.shadowOffsetX=-8;
    const g=c.createLinearGradient(edge,0,w,0);g.addColorStop(0,'#7a8575');g.addColorStop(.2,'#a5ad96');g.addColorStop(.45,'#737f6b');g.addColorStop(.7,'#a3ab94');g.addColorStop(1,'#74816c');
    c.fillStyle=g;c.beginPath();c.moveTo(edge,0);c.lineTo(w,0);c.lineTo(w,h);c.bezierCurveTo(w*.94,h-12,w*.89,h+7,edge,h-9);c.bezierCurveTo(edge-4,h*.7,edge+3,h*.3,edge,0);c.fill();c.restore();
    c.strokeStyle='#d0d5bf33';c.lineWidth=1;for(let i=0;i<6;i++){const x=edge+(w-edge)*(i/6);c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+4,h*.3,x-3,h*.7,x,h-8);c.stroke();}
  }
  return {
    control(next){input=next;if(next.twitch!==wasTwitch){twitch=.65;wasTwitch=next.twitch;}},
    draw(dt,t) {
      if(dt) {
        timer-=dt;twitch=Math.max(0,twitch-dt);peeking=Math.max(0,peeking-dt);
        if(!input.active&&timer<=0){target={x:rand(w*.12,w*.75),y:rand(h*.2,h*.83)};timer=rand(1.3,3.5);twitch=.25;}
        let desired=input.active?{x:input.x*w,y:input.y*h}:target;
        if(input.hidden)desired={x:peeking>0?w*.8:w+ropeLength*.9,y:clamp(input.y,.2,.8)*h};
        desired={x:clamp(desired.x,20,w+ropeLength),y:clamp(desired.y,30,h-30)};
        const k=1-Math.exp(-dt*(twitch>0?16:9));
        pts[0].x+=(desired.x+(twitch>0?Math.sin(t*60)*18:0)-pts[0].x)*k;pts[0].y+=(desired.y+(twitch>0?Math.cos(t*48)*9:0)-pts[0].y)*k;
        for(let i=1;i<n;i++){const p=pts[i],vx=(p.x-p.px)*.91,vy=(p.y-p.py)*.91;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+dt*dt*35;}
        if(pins.size && twitch>0){const end=pts[n-1];end.x+=Math.sin(t*42)*dt*65;end.y+=Math.cos(t*33)*dt*45;}
        for(let pass=0;pass<9;pass++) {
          for(let i=1;i<n;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,err=(d-gap)/d,weight=i===1?1:.5;if(i>1){a.x+=dx*err*.5;a.y+=dy*err*.5;}b.x-=dx*err*weight;b.y-=dy*err*weight;b.y=clamp(b.y,8,h-8);}
          for(const {index,p} of pins.values()){pts[index].x=p.x;pts[index].y=p.y;}
        }
      }
      c.drawImage(base,0,0);
      function rope(offset:number,color:string,width:number) {
        c.beginPath();c.moveTo(pts[0].x,pts[0].y+offset);
        for(let i=1;i<n-1;i++)c.quadraticCurveTo(pts[i].x,pts[i].y+offset,(pts[i].x+pts[i+1].x)/2,(pts[i].y+pts[i+1].y)/2+offset);
        c.lineTo(pts[n-1].x,pts[n-1].y+offset);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
      }
      const thickness=clamp(Math.min(w,h)*.018,6,12);
      c.save();c.filter='blur(3px)';rope(5,'#3f474140',thickness+4);c.restore();
      rope(0,'#203549',thickness+2);rope(-1,'#466b88',thickness-1);
      c.save();c.strokeStyle='#a1b4bd99';c.lineWidth=1;
      for(let i=1;i<n;i++){const a=pts[i-1],b=pts[i],angle=Math.atan2(b.y-a.y,b.x-a.x);for(let j=0;j<2;j++){const x=a.x+(b.x-a.x)*j/2,y=a.y+(b.y-a.y)*j/2;c.beginPath();c.moveTo(x+Math.cos(angle+1)*thickness*.4,y+Math.sin(angle+1)*thickness*.4);c.lineTo(x-Math.cos(angle+1)*thickness*.4,y-Math.sin(angle+1)*thickness*.4);c.stroke();}}
      const end=pts[n-1];for(let i=0;i<5;i++){c.strokeStyle=i%2?'#6d91a8':'#294760';c.beginPath();c.moveTo(end.x,end.y);c.lineTo(end.x-7-i*1.4,end.y+(i-2)*2.5);c.stroke();}c.restore();
      for(const {p} of pins.values())ellipse(c,p.x,p.y,21,16,'#2d423b18');
      curtain(t);
    },
    command(kind){if(kind==='peek'){peeking=1.4;twitch=.35;if(!input.hidden)target={x:w*.8,y:rand(h*.3,h*.7)};}else{target={x:rand(w*.15,w*.7),y:rand(h*.2,h*.8)};twitch=.6;timer=3;}},
    down(id,p){let closest=-1,d=35;pts.forEach((v,i)=>{const distance=Math.hypot(v.x-p.x,v.y-p.y);if(v.x<w*.84&&distance<d){closest=i;d=distance;}});if(closest>=0){pins.set(id,{index:closest,p});twitch=.45;return true;}return false;},
    drag(id,p){const pin=pins.get(id);if(pin)pin.p={x:clamp(p.x,5,w*.83),y:clamp(p.y,5,h-5)};},
    up(id){if(pins.has(id)){pins.delete(id);twitch=.45;}}
  };
}

export function hidingMouse(c:CanvasRenderingContext2D,w:number,h:number):ToyScene {
  const base=floor(w,h,false), size=clamp(Math.min(w,h)*.085,23,52), wall=Math.min(h*.22,130), holes=[w*.2,w*.5,w*.8];
  let input={...neutral},x=w*.5,y=h*.62,angle=-.3,target={x:w*.32,y:h*.58},timer=1.5,phase=0,twitch=0,lastTwitch=0,peek=0,flee=0,escapeTarget={x:w*.5,y:h*.5},held:number|null=null,holdPoint:Point|null=null,hole=1,stage=0,sniff=0;
  const crumb={x:w*.38,y:h*.69};
  const tail=Array.from({length:14},()=>({x:x-70,y}));
  function renderMouse(t:number, speed:number) {
    c.save();c.translate(x+(held!==null?Math.sin(t*34)*Math.min(size*.045,2):0),y);c.rotate(angle);
    const s=size/36;c.scale(s,s);
    c.save();c.shadowBlur=10;c.shadowColor='#342b2670';ellipse(c,-5,4,35,19,'#51483e');c.restore();
    const fur=c.createRadialGradient(-12,-8,3,-5,0,37);fur.addColorStop(0,'#a79a86');fur.addColorStop(.6,'#756a59');fur.addColorStop(1,'#504839');
    c.fillStyle=fur;c.beginPath();c.ellipse(-6,0,32,18,0,0,Math.PI*2);c.fill();
    for(let i=0;i<35;i++){const a=i*2.399,rx=Math.cos(a)*(9+i*.6)-8,ry=Math.sin(a)*(5+i*.27);c.strokeStyle=i%2?'#d6c9ae4d':'#3c342c4a';c.lineWidth=.8;c.beginPath();c.moveTo(rx-2,ry);c.lineTo(rx+2,ry+1);c.stroke();}
    for(const side of [-1,1]){
      const foot=Math.sin(phase*24+side*2)*Math.min(speed/70,1)*6;
      ellipse(c,-12+foot,side*17,7,3,'#ae9280');ellipse(c,13-foot,side*12,5,3,'#ae9280');
      ellipse(c,14,side*12,9,8,'#594f43');ellipse(c,15,side*12,6,5,'#bd9d8a');
    }
    c.fillStyle='#82735f';c.beginPath();c.moveTo(9,-13);c.quadraticCurveTo(28,-13,40,0);c.quadraticCurveTo(28,13,9,13);c.fill();
    ellipse(c,25,-7,2.1,2.7,'#100f0d');ellipse(c,25,7,2.1,2.7,'#100f0d');ellipse(c,25.5,-7.7,.65,.65,'#f9f3db');ellipse(c,25.5,6.4,.65,.65,'#f9f3db');ellipse(c,39,0,3,2.8,'#ba8d82');
    c.strokeStyle='#e5dcc389';c.lineWidth=.7;for(let i=0;i<3;i++)for(const side of [-1,1]){c.beginPath();c.moveTo(33,side*3);c.quadraticCurveTo(41,side*(11+i*4),49-i*2,side*(13+i*6));c.stroke();}
    if(holdPoint)ellipse(c,0,0,17,12,'#30281f27');
    c.restore();
  }
  return {
    control(next){input=next;if(next.twitch!==lastTwitch){lastTwitch=next.twitch;
      if(next.kind==='hole'){hole=Math.min(2,Math.floor(next.x*3));target={x:holes[hole],y:wall-size*1.6};input={...next,active:false};timer=100;peek=0;}
      else if(next.kind==='mouse-peek'){hole=Math.min(2,Math.floor(next.x*3));target={x:holes[hole],y:wall+size*.2};peek=2;timer=100;}
      else if(next.kind==='mouse-out'){target={x:holes[Math.min(2,Math.floor(next.x*3))],y:wall+size*3};peek=0;timer=100;}
      else if(next.kind==='mouse-crumb'){target={...crumb};peek=0;timer=100;}
      else if(next.kind==='mouse-home'){hole=Math.min(2,Math.floor(next.x*3));target={x:holes[hole],y:wall-size*1.6};peek=0;timer=100;}
      else if(next.kind==='mouse-sniff'){target={x,y};peek=0;timer=100;twitch=.7;}
      else twitch=.7;
    }},
    draw(dt,t){
      let speed=0;
      if(dt){
        phase+=dt;timer-=dt;twitch=Math.max(0,twitch-dt);peek=Math.max(0,peek-dt);flee=Math.max(0,flee-dt);
        if(held===null){
          if(!input.active&&timer<=0){
            stage=(stage+1)%4;
            if(stage===0){hole=Math.floor(rand(0,3));target={x:holes[hole],y:wall-size*1.6};timer=rand(2,4);}
            if(stage===1){peek=1.6;target={x:holes[hole],y:wall+size*.2};timer=1.8;}
            if(stage===2){target={...crumb};timer=rand(3.5,5);}
            if(stage===3){target={x:holes[hole],y:wall-size*1.6};timer=2.5;}
          }
          sniff=Math.max(0,sniff-dt);
          if(!input.active&&stage===2&&Math.hypot(x-crumb.x,y-crumb.y)<size*.65){sniff=.2;angle+=Math.sin(t*15)*dt*.8;}

          let dest=flee>0?escapeTarget:input.kind?.startsWith('mouse-')||input.kind==='hole'?target:peek>0?target:input.active?{x:input.x*w,y:input.y*h}:target;
          if(input.hidden && flee<=0){hole=holes.reduce((best,v,i)=>Math.abs(v-input.x*w)<Math.abs(holes[best]-input.x*w)?i:best,0);dest={x:holes[hole],y:peek>0?wall+size*.25:wall-size*1.6};}
          else dest={x:clamp(dest.x,size*1.6,w-size*1.6),y:flee<=0&&target.y<wall&&(!input.active||input.kind?.startsWith('mouse-')||input.kind==='hole')?target.y:clamp(dest.y,wall+size*1.1,h-size*1.2)};
          const dx=dest.x-x,dy=dest.y-y,d=Math.hypot(dx,dy),v=Math.min(d*7,Math.min(w,h)*.65)*(twitch>0?1.7:1);
          if(d>.5){const step=Math.min(d,v*dt);x+=dx/(d||1)*step;y+=dy/(d||1)*step;speed=v;const a=Math.atan2(dy,dx);angle+=Math.atan2(Math.sin(a-angle),Math.cos(a-angle))*(1-Math.exp(-dt*12));}
          if(twitch>0){x+=Math.sin(t*55)*dt*25;y+=Math.cos(t*48)*dt*14;}
        }
        tail[0]={x:x-Math.cos(angle)*size*.8,y:y-Math.sin(angle)*size*.8};
        for(let i=1;i<tail.length;i++){const p=tail[i],a=tail[i-1],dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy)||1;const len=size*.13;p.x=a.x+dx/d*len;p.y=a.y+dy/d*len;p.y+=Math.sin(phase*3+i*.4)*dt*1.5;}
      }
      c.drawImage(base,0,0);
      // Real holes lead underneath the skirting, rather than teleporting the mouse.
      c.fillStyle='#e2ddcf';c.fillRect(0,0,w,wall);
      holes.forEach(hx=>{const g=c.createRadialGradient(hx,wall-10,1,hx,wall-10,size*1.5);g.addColorStop(0,'#171b18');g.addColorStop(1,'#514d3f');c.fillStyle=g;c.beginPath();c.roundRect(hx-size*1.3,wall-size*1.9,size*2.6,size*2.2,[size*1.3,size*1.3,0,0]);c.fill();});
      c.save();c.beginPath();c.rect(0,wall,w,h-wall);c.clip();
      c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(tail[0].x,tail[0].y);for(const p of tail)c.lineTo(p.x,p.y);c.strokeStyle='#6a5448';c.lineWidth=Math.max(3,size*.14);c.stroke();c.strokeStyle='#bf9b86';c.lineWidth=Math.max(2,size*.08);c.stroke();
      renderMouse(t,speed);c.restore();
      ellipse(c,crumb.x+2,crumb.y+3,5,3,'#6c4c2b44');ellipse(c,crumb.x,crumb.y,4,3,'#bc9b60');
      c.fillStyle='#c6beaa';c.fillRect(0,wall-3,w,3);c.strokeStyle='#77674a38';c.beginPath();c.moveTo(0,wall+2);c.lineTo(w,wall+2);c.stroke();
      // Nose and whiskers are visible in the hole during a deliberate peek.
      if(peek>0&&y<wall+size*.3){c.save();c.translate(holes[hole],wall-5);ellipse(c,0,0,size*.22,size*.13,'#bd9685');c.strokeStyle='#dfd5bf';c.lineWidth=1;for(const side of [-1,1])for(let i=0;i<3;i++){c.beginPath();c.moveTo(side*size*.12,-2);c.lineTo(side*size*(.6+i*.1),-size*(.1+i*.12));c.stroke();}c.restore();}
    },
    command(kind){if(kind==='peek'){peek=2;twitch=.3;hole=holes.reduce((best,v,i)=>Math.abs(v-x)<Math.abs(holes[best]-x)?i:best,0);target={x:holes[hole],y:wall+size*.2};timer=2.5;stage=1;}else{target={...crumb};timer=5;stage=2;twitch=.3;}},
    down(id,p){if(held!==null||y<wall)return false;if(Math.hypot(p.x-x,p.y-y)<size*1.1+14){held=id;holdPoint=p;twitch=.4;return true;}if(Math.hypot(p.x-x,p.y-y)<size*3){const a=Math.atan2(y-p.y,x-p.x);escapeTarget={x:x+Math.cos(a)*size*4,y:y+Math.sin(a)*size*4};flee=.7;twitch=.4;}return false;},
    drag(id,p){if(held===id){x=clamp(p.x,size,w-size);y=clamp(p.y,wall+size,h-size);holdPoint=p;}},
    up(id){if(held===id){const a=angle;held=null;holdPoint=null;twitch=.35;escapeTarget={x:x+Math.cos(a)*size*4,y:y+Math.sin(a)*size*4};flee=.8;timer=1.5;}}
  };
}


