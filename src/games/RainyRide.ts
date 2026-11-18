import type { ToyScene, ToyControl } from './ToyWorlds';
import { wiperAngle, sweptDrop, sweepAngles } from './wiper-motion.mjs';
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
export function rainyRide(c:CanvasRenderingContext2D,w:number,h:number):ToyScene {
  const road = new Image();
  road.src = '/rain-v2/forest-road.jpg';
  let travel=0;
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#577b78');sky.addColorStop(1,'#273f40');
  function scenery(){
    c.fillStyle=sky;c.fillRect(0,0,w,h);
    if(!road.complete||!road.naturalWidth)return;
    const cover=Math.max(w/road.naturalWidth,h/road.naturalHeight);
    // Crossfade two continuously expanding views around the road's vanishing point.
    const p=(travel/12)%1;
    const paint=(phase:number,alpha:number)=>{
      const scale=cover*(1.025+phase*.24),dw=road.naturalWidth*scale,dh=road.naturalHeight*scale;
      c.globalAlpha=alpha;c.drawImage(road,w*.48-dw*.48+Math.sin(travel*.35)*w*.002,h*.475-dh*.475,dw,dh);
    };
    paint(p,1);
    if(p>.76)paint(Math.max(0,p-.76),Math.min(1,(p-.76)/.24));
    c.globalAlpha=1;
  }
  type Drop={x:number;y:number;r:number;v:number;wait:number;alive:boolean;age:number};
  const drops:Drop[]=Array.from({length:Math.min(420,Math.floor(w*h/2200)+60)},()=>({x:rand(0,w),y:rand(0,h*.87),r:rand(1.3,4.2),v:rand(2,19),wait:0,alive:true,age:1}));
  const pivots=[{x:w*.23,y:h*.91},{x:w*.73,y:h*.91}],length=Math.min(h*.82,w*.98),bladeWidth=Math.max(7,Math.min(w,h)*.017);
  let progress=1, running=false, duration=1.55, wait=1.2, steady=0, burst=0, input:ToyControl|undefined,lastTwitch=0;
  let forcedNext=false, mode='slow',strength=.5, surprise:{x:number;y:number;kind:'leaf'|'bug';age:number;hits:number;lastPass:number}|null=null;
  let finger:{x:number;y:number;age:number}|null=null;
  function start(){running=true;progress=0;duration=mode==='fast'?.85:mode==='slow'?2.3:1.55;}
  function clear(from:number,to:number){for(const [previous,current] of sweepAngles(from,to))for(const drop of drops){if(drop.alive&&pivots.some(p=>sweptDrop(drop,p,length,previous,current,bladeWidth))){drop.alive=false;drop.wait=rand(1.8,5);drop.age=0;}}}
  return {
    control(next){input=next;if(next.strength!==undefined)strength=next.strength;
      if(next.twitch!==lastTwitch){lastTwitch=next.twitch;
        if(next.kind==='rain-slow'){mode='slow';burst=0;forcedNext=false;duration=2.3;wait=.1;}
        else if(next.kind==='rain-fast'){mode='fast';burst=0;forcedNext=false;duration=.85;wait=.1;}
        else if(next.kind==='rain-double'){burst=1;if(!running)start();wait=.1;}
        else if(next.kind==='rain-steady'){mode='steady';wait=.1;}
        else if(next.kind==='rain-intermittent'){mode='intermittent';wait=1;}
        else if(next.kind==='rain-manual'){mode='manual';}
        else if(next.kind==='rain-sweep'){if(!running)start();}
        else if(next.kind==='rain-surprise'){const pivot=pivots[Math.random()<.5?0:1], angle=rand(-2.15,-1.05), radius=length*rand(.45,.7);surprise={x:Math.max(w*.08,Math.min(w*.92,pivot.x+Math.cos(angle)*radius)),y:Math.max(h*.08,Math.min(h*.78,pivot.y+Math.sin(angle)*radius)),kind:Math.random()<.5?'leaf':'bug',age:0,hits:0,lastPass:-1};}
        else if(next.kind!=='rain-strength'){burst=1;if(!running)start();}
      }},
    draw(dt){
      if(dt){
        travel+=dt;
        if(finger)finger.age+=dt;if(surprise)surprise.age+=dt;
        for(const d of drops){if(!d.alive){d.wait-=dt*(.2+strength*2.5);if(d.wait<=0){d.alive=true;d.x=rand(0,w);d.y=rand(0,h*.86);d.age=0;}}else{d.age=Math.min(1,d.age+dt*.9);d.y+=d.v*dt;if(d.y>h*.88){d.alive=false;d.wait=rand(.8,3);}}}
        if(running){const previous=progress;progress=Math.min(1,progress+dt/duration);clear(previous,progress);if(surprise){
          // Count each outbound or return stroke once, regardless of frame rate or overlapping blades.
          const segments=previous<.5&&progress>.5?[[previous,.5],[.5,progress]]:[[previous,progress]];
          for(const [from,to] of segments){if(!surprise)break;const pass=steady*2+(from>=.5?1:0);const hit=pivots.some(p=>sweepAngles(from,to).some(([a,b])=>sweptDrop({...surprise!,r:8},p,length,a,b,bladeWidth)));if(hit&&surprise.lastPass!==pass){surprise.lastPass=pass;surprise.hits++;if(surprise.hits>=3)surprise=null;}}
        }if(progress>=1){running=false;steady++;if(burst>0){burst--;wait=.15;forcedNext=true;}else if(mode==='slow')wait=1.4;else if(mode==='fast'||mode==='steady')wait=.25;else if(steady%4===0){wait=rand(2.7,5.2);}else wait=steady%7===0?rand(.2,.55):1.15;}}
        else if(mode!=='manual'||forcedNext){wait-=dt;if(wait<=0){forcedNext=false;if(mode==='intermittent'&&steady%6===5)burst=1;start();}}
      }
      scenery();
      // Airborne rain is distinct from the drops attached to the glass.
      c.lineWidth=.85;c.strokeStyle='rgba(218,236,238,'+(.09+strength*.17)+')';
      for(let i=0;i<Math.floor(35+strength*125);i++){
        const x=((i*137.51+travel*45)%w),y=((i*83.17+travel*(120+i%7*15))%(h*.9));
        const len=7+(i%9)*2+strength*12;c.beginPath();c.moveTo(x,y);c.lineTo(x-2-strength*3,y+len);c.stroke();
      }
      const visible=Math.floor(drops.length*(.15+.85*strength));

      for(const d of drops.slice(0,visible)){if(!d.alive)continue;c.save();c.globalAlpha=d.age;c.lineWidth=d.r*.35;c.strokeStyle='#cde5e33b';c.beginPath();c.moveTo(d.x,d.y-d.r*3);c.lineTo(d.x,d.y);c.stroke();
        const lens=c.createRadialGradient(d.x-d.r*.28,d.y-d.r*.45,0,d.x,d.y,d.r*1.5);
        lens.addColorStop(0,'#d8f3ef70');lens.addColorStop(.45,'#789b9830');lens.addColorStop(.8,'#16343b60');lens.addColorStop(1,'#b8e2e370');
        c.fillStyle=lens;c.beginPath();c.ellipse(d.x,d.y,d.r,d.r*1.4,0,0,7);c.fill();c.strokeStyle='#dbeeeac0';c.lineWidth=.8;c.beginPath();c.ellipse(d.x,d.y,d.r*.75,d.r*1.25,0,0,7);c.stroke();c.fillStyle='#efffffb0';c.beginPath();c.ellipse(d.x-d.r*.25,d.y-d.r*.5,d.r*.2,d.r*.32,0,0,7);c.fill();c.restore();}
      if(surprise){c.save();c.translate(surprise.x,surprise.y);c.rotate(Math.sin(surprise.age)*.15);if(surprise.kind==='leaf'){c.fillStyle='#a28b43';c.beginPath();c.ellipse(0,0,18,8,-.4,0,7);c.fill();c.strokeStyle='#60562e';c.beginPath();c.moveTo(-16,6);c.lineTo(17,-6);c.stroke();}else{c.fillStyle='#34312a';c.beginPath();c.ellipse(0,0,7,4,.3,0,7);c.fill();c.strokeStyle='#34312a';for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*4,-3);c.lineTo(i*6-3,-8);c.moveTo(i*4,3);c.lineTo(i*6-3,8);c.stroke();}}c.restore();}
      if(finger&&finger.age<1.3){c.strokeStyle=`rgba(220,242,238,${.2*(1-finger.age/1.3)})`;c.lineWidth=2;c.beginPath();c.arc(finger.x,finger.y,14+finger.age*24,0,7);c.stroke();}
      const a=wiperAngle(progress);
      for(const p of pivots){const cos=Math.cos(a),sin=Math.sin(a);c.lineCap='round';c.shadowColor='#0008';c.shadowBlur=5;c.shadowOffsetY=3;
        c.strokeStyle='#11191b';c.lineWidth=4;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+cos*length*.67,p.y+sin*length*.67);c.stroke();
        c.lineWidth=bladeWidth;c.beginPath();c.moveTo(p.x+cos*length*.25,p.y+sin*length*.25);c.lineTo(p.x+cos*length,p.y+sin*length);c.stroke();c.shadowBlur=0;c.shadowOffsetY=0;
        c.strokeStyle='#647176';c.lineWidth=1.5;c.beginPath();c.moveTo(p.x+cos*length*.28,p.y+sin*length*.28-2);c.lineTo(p.x+cos*length*.96,p.y+sin*length*.96-2);c.stroke();}
      // The glass takes almost the whole screen; only a narrow car frame remains.
      c.fillStyle='#172124';c.beginPath();c.moveTo(0,0);c.lineTo(w*.035,0);c.lineTo(w*.075,h*.89);c.lineTo(0,h);c.fill();c.beginPath();c.moveTo(w,0);c.lineTo(w*.965,0);c.lineTo(w*.925,h*.89);c.lineTo(w,h);c.fill();
      const dash=c.createLinearGradient(0,h*.9,0,h);dash.addColorStop(0,'#364144');dash.addColorStop(1,'#101719');c.fillStyle=dash;c.beginPath();c.moveTo(0,h*.94);c.quadraticCurveTo(w*.5,h*.84,w,h*.94);c.lineTo(w,h);c.lineTo(0,h);c.fill();
    },
    command(kind){if(kind==='move'){if(!running)start();burst=0;wait=1.15;steady=0;}else{burst=2;duration=.95;if(!running)start();duration=.95;wait=.12;}},
    down(_id,p){finger={...p,age:0};let hit=false;for(const d of drops)if(d.alive&&Math.hypot(d.x-p.x,d.y-p.y)<32){d.v=65;hit=true;}const a=wiperAngle(progress);if(pivots.some(pivot=>sweptDrop({...p,r:20},pivot,length,a,a,bladeWidth))){if(!running)start();return true;}return hit;},
    drag(_id,p){finger={...p,age:0};for(const d of drops)if(d.alive&&Math.hypot(d.x-p.x,d.y-p.y)<22)d.v=85;},up(){}
  };
}
