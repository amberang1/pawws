import type { ToyControl, ToyScene } from './ToyWorlds';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const rand=(a:number,b:number)=>a+Math.random()*(b-a);
const neutral:ToyControl={x:.5,y:.5,active:false,hidden:false,twitch:0};
function oval(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,fill:string){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,7);c.fill();}

export function koiPond(c:CanvasRenderingContext2D,w:number,h:number):ToyScene {
  const base=document.createElement('canvas');base.width=w;base.height=h;const b=base.getContext('2d')!;
  const water=b.createLinearGradient(0,0,w,h);water.addColorStop(0,'#79918a');water.addColorStop(.5,'#466e68');water.addColorStop(1,'#294b4e');b.fillStyle=water;b.fillRect(0,0,w,h);
  for(let i=0;i<160;i++){const x=rand(0,w),y=rand(0,h),r=rand(3,15);oval(b,x,y,r,r*.68,['#a3a78c22','#d8cba126','#243d3930'][i%3]);}
  const size=clamp(Math.min(w,h)*.13,32,76),leaf={x:w*.83,y:h*.24,r:Math.min(w,h)*.22};
  const fish=[{x:w*.35,y:h*.45,a:0,phase:0,tone:0},{x:w*.6,y:h*.7,a:2,phase:1.8,tone:1}];
  let input={...neutral},target={x:w*.5,y:h*.6},timer=2,lastTwitch=0,flee=0,food=0;
  const ripples:{x:number;y:number;age:number}[]=[];
  function ripple(x:number,y:number){ripples.push({x,y,age:0});if(ripples.length>12)ripples.shift();}
  return {
    control(next){input=next;if(next.twitch!==lastTwitch){lastTwitch=next.twitch;fish[0].phase+=1.8;ripple(fish[0].x,fish[0].y);}},
    draw(dt,t){
      if(dt){timer-=dt;flee=Math.max(0,flee-dt);food=Math.max(0,food-dt);for(const r of ripples)r.age+=dt;
        if(timer<=0&&!input.active){target={x:rand(w*.15,w*.82),y:rand(h*.25,h*.83)};timer=rand(3,6);}
        fish.forEach((f,i)=>{let dest=flee>0||food>0?target:input.hidden?leaf:input.active?{x:input.x*w,y:input.y*h}:target;
          const dx=dest.x+(i?size*.9:0)-f.x,dy=dest.y+(i?size*.8:0)-f.y,d=Math.hypot(dx,dy),speed=Math.min(d*(food>0?1.5:.65),size*(flee>0?5:1.1));
          if(d>size*.1){const want=Math.atan2(dy,dx);f.a+=Math.atan2(Math.sin(want-f.a),Math.cos(want-f.a))*(1-Math.exp(-dt*(flee>0?6:2)));f.x=clamp(f.x+Math.cos(f.a)*speed*dt,size*.5,w-size*.5);f.y=clamp(f.y+Math.sin(f.a)*speed*dt,size*.5,h-size*.5);}
          f.phase+=dt*(speed/size*5+1.5);
        });
      }
      c.drawImage(base,0,0);
      // Slow surface caustics remain quieter than the fish.
      c.strokeStyle='#d8ead814';c.lineWidth=1;for(let i=0;i<9;i++){c.beginPath();for(let j=0;j<=14;j++){const x=j*w/14,y=h*i/8+Math.sin(j*.9+t*.28+i)*12;j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
      for(const f of fish){c.save();c.translate(f.x,f.y);c.rotate(f.a);c.scale(size/60,size/60);const tail=Math.sin(f.phase)*13;
        c.save();c.filter='blur(5px)';oval(c,-5,13,52,15,'#112e3970');c.restore();
        c.fillStyle='#e9e5d580';c.beginPath();c.moveTo(-30,0);c.quadraticCurveTo(-58,-25+tail,-66,tail);c.quadraticCurveTo(-55,19+tail,-30,0);c.fill();
        for(const side of [-1,1]){c.beginPath();c.moveTo(4,side*8);c.quadraticCurveTo(-8,side*36,-20,side*14);c.fill();}
        const g=c.createLinearGradient(0,-16,0,16);g.addColorStop(0,'#c6c9b7');g.addColorStop(.35,'#f4f2dc');g.addColorStop(1,'#a0b5a3');oval(c,0,0,40,15,g as unknown as string);
        c.save();c.beginPath();c.ellipse(0,0,40,15,0,0,7);c.clip();oval(c,13,-3,15,12,f.tone?'#dc9d39':'#c95c2f');oval(c,-16,6,12,11,f.tone?'#cf8d2b':'#d76c35');oval(c,-9,-8,7,8,'#354744');
        c.strokeStyle='#697e702c';c.lineWidth=.7;for(let row=-2;row<3;row++)for(let col=-5;col<6;col++){c.beginPath();c.arc(col*6+(row%2)*3,row*5,4,-1.3,1.3);c.stroke();}c.restore();
        oval(c,29,-8,1.8,2,'#132a2a');oval(c,29,8,1.8,2,'#132a2a');c.strokeStyle='#f6f2d6aa';c.beginPath();c.moveTo(34,-2);c.lineTo(43,-4);c.moveTo(34,2);c.lineTo(43,4);c.stroke();c.restore();}
      if(food>0){for(let i=0;i<5;i++)oval(c,target.x+Math.sin(i*5)*14,target.y+Math.cos(i*3)*12,2,2,'#bea879');}
      for(const r of ripples)if(r.age<2){c.strokeStyle=`rgba(214,235,221,${(1-r.age/2)*.55})`;c.lineWidth=1.5;for(let i=0;i<3;i++){c.beginPath();c.ellipse(r.x,r.y,8+r.age*65+i*12,5+r.age*43+i*8,0,0,7);c.stroke();}}
      // Opaque leaf provides a physical hiding place, with a submerged shadow.
      c.save();c.translate(leaf.x,leaf.y);c.rotate(-.4);oval(c,8,13,leaf.r,leaf.r*.65,'#163b3955');const g=c.createLinearGradient(-leaf.r,0,leaf.r,0);g.addColorStop(0,'#547755');g.addColorStop(1,'#819165');c.fillStyle=g;c.beginPath();c.ellipse(0,0,leaf.r,leaf.r*.65,0,.15,Math.PI*2-.15);c.lineTo(-leaf.r*.15,0);c.closePath();c.fill();c.strokeStyle='#b4bc883e';for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(-leaf.r*.15,0);c.lineTo(Math.cos(i*.6)*leaf.r*.9,Math.sin(i*.6)*leaf.r*.6);c.stroke();}c.restore();
    },
    command(kind){if(kind==='peek'){food=5;target={x:w*.42,y:h*.64};ripple(target.x,target.y);timer=6;}else{target={x:w*.25,y:h*.7};input={...input,hidden:false,active:false};timer=4;}},
    down(_id,p){ripple(p.x,p.y);let hit=false;for(const f of fish)if(Math.hypot(f.x-p.x,f.y-p.y)<size*.8)hit=true;const nearest=fish.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);const a=Math.atan2(nearest.y-p.y,nearest.x-p.x);target={x:clamp(nearest.x+Math.cos(a)*size*3,size,w-size),y:clamp(nearest.y+Math.sin(a)*size*3,size,h-size)};flee=1.5;timer=3;return hit;},drag(_id,p){if(!ripples.length||Math.hypot(p.x-ripples.at(-1)!.x,p.y-ripples.at(-1)!.y)>30)ripple(p.x,p.y);},up(){}
  };
}

export function kitchenBeetle(c:CanvasRenderingContext2D,w:number,h:number):ToyScene {
  const size=clamp(Math.min(w,h)*.045,12,25),coaster={x:w*.78,y:h*.32,r:Math.min(w,h)*.2};
  const base=document.createElement('canvas');base.width=w;base.height=h;const b=base.getContext('2d')!;b.fillStyle='#d7d1bd';b.fillRect(0,0,w,h);
  const tile=Math.max(120,Math.min(w,h)*.43);for(let x=0;x<w;x+=tile)for(let y=0;y<h;y+=tile){const g=b.createLinearGradient(x,y,x+tile,y+tile);g.addColorStop(0,'#f0ede0');g.addColorStop(1,'#dcd9ca');b.fillStyle=g;b.fillRect(x+2,y+2,tile-4,tile-4);}
  for(let i=0;i<850;i++){b.fillStyle=i%2?'#756e5b0a':'#fffaf71f';b.fillRect(rand(0,w),rand(0,h),rand(1,5),1);}
  const crumbs=[{x:w*.3,y:h*.66},{x:w*.5,y:h*.4},{x:w*.2,y:h*.3}];
  let x=coaster.x,y=coaster.y,a=2.6,phase=0,timer=1,peek=0,lastTwitch=0,twitch=0,flee=0,held:number|null=null,input={...neutral},target={...crumbs[0]},state=0;
  return {
    control(next){input=next;if(next.twitch!==lastTwitch){lastTwitch=next.twitch;twitch=1.2;}},
    draw(dt,t){
      if(dt){phase+=dt;timer-=dt;peek=Math.max(0,peek-dt);twitch=Math.max(0,twitch-dt);flee=Math.max(0,flee-dt);
        if(!input.active&&timer<=0&&held===null){state=(state+1)%4;target=state===0?{...coaster}:state===1?{x:coaster.x-coaster.r-size*.3,y:coaster.y+size}:state===2?{...crumbs[Math.floor(rand(0,3))]}:{x,y};timer=state===1?2:rand(2,5);}
        let dest=flee>0?coaster:peek>0?{x:coaster.x-coaster.r-size*.3,y:coaster.y}:input.hidden?{x:coaster.x-(peek>0?coaster.r+size*.1:0),y:coaster.y}:input.active?{x:input.x*w,y:input.y*h}:target;
        if(held===null){const dx=dest.x-x,dy=dest.y-y,d=Math.hypot(dx,dy),speed=Math.min(d*3,size*(flee>0?13:4));if(d>1){const angle=Math.atan2(dy,dx);a+=Math.atan2(Math.sin(angle-a),Math.cos(angle-a))*(1-Math.exp(-dt*12));x=clamp(x+dx/d*speed*dt,size,w-size);y=clamp(y+dy/d*speed*dt,size,h-size);}phase+=dt*speed/size;}
      }
      c.drawImage(base,0,0);crumbs.forEach((p,i)=>{oval(c,p.x+2,p.y+3,5,3,'#8c78573a');c.save();c.translate(p.x,p.y);c.rotate(i);c.fillStyle='#b99959';c.beginPath();c.moveTo(-5,3);c.lineTo(-3,-4);c.lineTo(4,-2);c.lineTo(6,3);c.fill();c.restore();});
      c.save();c.translate(x,y);c.rotate(a);c.scale(size/20,size/20);
      oval(c,-2,4,20,12,'#3c362b45');
      c.strokeStyle='#302a20';c.lineWidth=1.5;for(let i=0;i<3;i++)for(const side of [-1,1]){const step=held!==null?Math.sin(t*36+i)*2:Math.sin(phase*12+i*2+side)*4;c.beginPath();c.moveTo(-10+i*9,side*7);c.lineTo(-14+i*10+step,side*17);c.lineTo(-18+i*10+step,side*22);c.stroke();}
      const g=c.createLinearGradient(-12,-12,8,12);g.addColorStop(0,'#87825a');g.addColorStop(.25,'#424c31');g.addColorStop(.65,'#1e2b21');g.addColorStop(1,'#141c17');oval(c,-4,0,19,11,g as unknown as string);oval(c,14,0,8,7,'#283325');
      c.strokeStyle='#a8a47788';c.lineWidth=.8;c.beginPath();c.moveTo(-20,0);c.lineTo(12,0);c.stroke();for(let i=0;i<5;i++){c.strokeStyle='#c0b78019';c.beginPath();c.ellipse(-5,i-2,14,5+i,0,Math.PI,Math.PI*2);c.stroke();}
      c.strokeStyle='#322e21';c.lineWidth=1;for(const side of [-1,1]){c.beginPath();c.moveTo(17,side*4);c.quadraticCurveTo(30,side*(11+Math.sin(t*(twitch>0?18:3)+side)*4),38,side*12);c.stroke();}oval(c,18,-4,1.4,1.4,'#0d110d');oval(c,18,4,1.4,1.4,'#0d110d');c.restore();
      // The coaster is drawn over the beetle, so antennae appear before the body.
      c.save();c.translate(coaster.x,coaster.y);c.shadowBlur=12;c.shadowOffsetY=5;c.shadowColor='#382a2759';oval(c,0,0,coaster.r,coaster.r,'#aa8654');c.shadowBlur=0;c.shadowOffsetY=0;
      c.save();c.beginPath();c.arc(0,0,coaster.r,0,7);c.clip();for(let i=0;i<600;i++){const px=Math.sin(i*7.3)*coaster.r,py=Math.cos(i*4.9)*coaster.r;c.fillStyle=i%2?'#76562f35':'#d3b88266';c.fillRect(px,py,2+i%4,1+i%3);}c.restore();c.strokeStyle='#e0c89d66';c.lineWidth=2;c.beginPath();c.arc(0,0,coaster.r-3,0,7);c.stroke();c.restore();
    },
    command(kind){if(kind==='peek'){peek=2;twitch=2;target={x:coaster.x-coaster.r-size*.3,y:coaster.y};timer=3;}else{input={...input,active:false,hidden:false};target={...crumbs[Math.floor(rand(0,3))]};timer=4;}},
    down(id,p){if(held!==null||Math.hypot(x-coaster.x,y-coaster.y)<coaster.r)return false;const d=Math.hypot(x-p.x,y-p.y);if(d<size+14){held=id;return true;}if(d<size*5){flee=1.6;timer=3;}return false;},drag(id,p){if(id===held){x=clamp(p.x,size,w-size);y=clamp(p.y,size,h-size);}},up(id){if(id===held){held=null;flee=2;timer=3;}}
  };
}
