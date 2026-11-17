import type { ToyControl, ToyScene } from './ToyWorlds';

type Point = { x: number; y: number };
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const random = (a: number, b: number) => a + Math.random() * (b-a);

/** A feather teased beneath a door. Positions are scaled to the available screen. */
export function underTheDoor(c: CanvasRenderingContext2D, w: number, h: number): ToyScene {
  const doorBottom = h * .36;
  const featherLength = clamp(Math.min(w,h) * .19, 44, 120);
  const floor = document.createElement('canvas');
  floor.width = Math.max(1, Math.ceil(w)); floor.height = Math.max(1, Math.ceil(h));
  const b = floor.getContext('2d')!;
  const wood = b.createLinearGradient(0,doorBottom,0,h);
  wood.addColorStop(0,'#a78265'); wood.addColorStop(1,'#d5b797');
  b.fillStyle=wood; b.fillRect(0,doorBottom,w,h-doorBottom);
  const plank = Math.max(65,h*.16);
  for(let y=doorBottom;y<h;y+=plank) {
    b.fillStyle='#72543a5c';b.fillRect(0,y,w,2);
    for(let i=0;i<22;i++) {
      const yy=y+random(0,plank), start=random(-w*.3,w*.5);
      b.strokeStyle=i%2?'#f0d9ba25':'#60463120';b.lineWidth=random(.4,1.2);
      b.beginPath();b.moveTo(start,yy);b.bezierCurveTo(w*.33,yy+random(-3,3),w*.7,yy+random(-3,3),w+20,yy+random(-2,2));b.stroke();
    }
  }
  const paint=b.createLinearGradient(0,0,w,0);
  paint.addColorStop(0,'#b5b4aa');paint.addColorStop(.22,'#dbd9cd');paint.addColorStop(.75,'#d2d0c4');paint.addColorStop(1,'#9c9e94');
  b.fillStyle=paint;b.fillRect(0,0,w,doorBottom-8);
  b.strokeStyle='#a5a69b88';b.lineWidth=2;
  for(const x of [w*.14,w*.51,w*.88]) {
    b.strokeRect(x-w*.12,-h*.08,w*.24,doorBottom*.8);
    b.strokeStyle='#eeeadd75';b.strokeRect(x-w*.115,-h*.075,w*.23,doorBottom*.78);b.strokeStyle='#a5a69b88';
  }
  const shadow=b.createLinearGradient(0,doorBottom-11,0,doorBottom+30);
  shadow.addColorStop(0,'#22241ddd');shadow.addColorStop(.2,'#1f201acb');shadow.addColorStop(1,'#26221a00');
  b.fillStyle=shadow;b.fillRect(0,doorBottom-11,w,41);
  b.fillStyle='#514438';b.fillRect(0,doorBottom-5,w,6);
  b.fillStyle='#e6cfae55';b.fillRect(0,doorBottom+1,w,2);

  let control: ToyControl = {x:.5,y:.6,active:false,hidden:false,twitch:0};
  let seenTwitch=0, x=w*.5, tipY=doorBottom+featherLength*.9, targetX=x, extension=.45;
  let targetExtension=.45, timer=1, twitch=0, phase=0, held:number|null=null, heldPoint:Point|null=null;
  let escape=0, peek=0, escapeX=x, escapeY=tipY;
  function shape(x0:number,y0:number,t:number) {
    const bend=Math.sin(t*7)*3 + (twitch>0?Math.sin(t*38)*4:0);
    const tipX=x0+bend, length=featherLength;
    c.save();
    c.shadowColor='#231c1555';c.shadowBlur=11;c.shadowOffsetX=4;c.shadowOffsetY=6;
    c.beginPath();c.moveTo(x0,doorBottom-3);c.quadraticCurveTo(x0+3,doorBottom+length*.45,tipX,y0);
    c.strokeStyle='#6e5141';c.lineWidth=Math.max(2,length*.035);c.lineCap='round';c.stroke();c.restore();
    // Layered translucent barbs give the feather a soft, uneven edge.
    for(let side of [-1,1]) for(let i=0;i<34;i++){
      const u=i/34, yy=y0-length*.78*u;
      const spread=Math.sin(Math.PI*u)*length*.24*(.8+.2*Math.sin(i*1.7));
      const rootX=tipX+(x0-tipX)*u;
      c.beginPath();c.moveTo(rootX,yy);c.quadraticCurveTo(rootX+side*spread*.56,yy-length*.10,rootX+side*spread,yy-length*(.10+.04*Math.sin(i)));
      c.strokeStyle=i%3===0?'#ede0c3aa':i%3===1?'#b99c78dd':'#cfb996dd';c.lineWidth=Math.max(.7,length*.013);c.stroke();
    }
    c.beginPath();c.moveTo(tipX,y0);c.quadraticCurveTo(tipX-1,y0-length*.36,x0,doorBottom+8);
    c.strokeStyle='#e7dcc1';c.lineWidth=Math.max(1.4,length*.022);c.stroke();
  }
  return {
    control(next) { control=next; if(next.twitch!==seenTwitch){seenTwitch=next.twitch;twitch=.6;} },
    draw(dt,t) {
      if(dt){
        phase+=dt; timer-=dt; twitch=Math.max(0,twitch-dt);escape=Math.max(0,escape-dt);peek=Math.max(0,peek-dt);
        if(!control.active && timer<=0 && held===null){
          targetX=clamp(x+random(-w*.22,w*.22),w*.1,w*.9);
          targetExtension=Math.random()<.32?.05:random(.35,1.4);
          twitch=.3;timer=random(1.4,3.6);
        }
        if(held===null) {
          let dx=control.active?control.x*w:targetX;
          let de=control.active?clamp((control.y*h-doorBottom)/featherLength,.05,2.2):targetExtension;
          if(control.hidden){de=.02;dx=control.x*w;}
          if(peek>0)de=.55;
          if(escape>0){dx=escapeX;de=clamp((escapeY-doorBottom)/featherLength,.05,2.2);}
          x+=(clamp(dx,w*.04,w*.96)-x)*(1-Math.exp(-dt*6));
          extension+=(de-extension)*(1-Math.exp(-dt*5));
          tipY=doorBottom+extension*featherLength;
        } else if(heldPoint) {
          x=clamp(heldPoint.x,w*.04,w*.96);tipY=clamp(heldPoint.y,doorBottom+4,h-15);
          extension=(tipY-doorBottom)/featherLength;
        }
      }
      c.drawImage(floor,0,0);
      c.save(); c.beginPath();c.rect(0,doorBottom,w,h-doorBottom);c.clip();
      if(tipY>doorBottom+2)shape(x,tipY,t);
      if(heldPoint){c.beginPath();c.ellipse(heldPoint.x,heldPoint.y,24,17,0,0,Math.PI*2);c.fillStyle='#332b1c20';c.fill();}
      c.restore();
    },
    command(kind) {
      if(kind==='peek'){targetExtension=.55;peek=1.5;twitch=.6;timer=2;}
      else {targetX=random(w*.12,w*.88);targetExtension=random(.8,1.8);twitch=.7;timer=3;}
    },
    down(id,p) {
      if(held!==null)return false;
      const near = Math.hypot(p.x-x,p.y-tipY)<featherLength*.48+24 ||
        (Math.abs(p.x-x)<30 && p.y>=doorBottom && p.y<=tipY);
      if(near){held=id;heldPoint=p;twitch=.45;return true;}
      if(p.y>doorBottom && Math.hypot(p.x-x,p.y-tipY)<featherLength*2){escapeX=clamp(x+(x-p.x)*1.5,w*.1,w*.9);escapeY=doorBottom+featherLength*.12;escape=.8;twitch=.5;}
      return false;
    },
    drag(id,p){if(held===id)heldPoint=p;},
    up(id){if(held===id){held=null;heldPoint=null;escapeX=clamp(x+random(-w*.12,w*.12),w*.1,w*.9);escapeY=doorBottom+featherLength*.08;escape=.9;twitch=.5;timer=2;}}
  };
}
