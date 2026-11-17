import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wiperAngle,sweptDrop,sweepAngles} from '../src/games/wiper-motion.mjs';
const pivot={x:0,y:0},length=200,width=8;
const at=(a,r=150)=>({x:Math.cos(a)*r,y:Math.sin(a)*r,r:2});
function clears(drop,from,to){return sweepAngles(from,to).some(([a,b])=>sweptDrop(drop,pivot,length,a,b,width));}
test('a sweep clears between frames, in both directions, with the same rubber area',()=>{
  const drop=at((wiperAngle(.12)+wiperAngle(.18))/2);
  assert.equal(clears(drop,.12,.18),true);
  assert.equal(clears(drop,.82,.88),true);
  assert.equal(clears(at(-1.4,25),0,.5),false);
  assert.equal(clears(at(-1.4,230),0,.5),false);
  assert.equal(clears(at(.7),0,.5),false);
});
test('a frame crossing the reversal still clears the tip of the arc',()=>{
  assert.equal(clears(at(wiperAngle(.5)),.48,.52),true);
});
test('low and high frame rates clear identical droplets over a full sweep',()=>{
  const sample=Array.from({length:71},(_,i)=>at(-Math.PI+i*.05));
  const run=frames=>sample.map(drop=>Array.from({length:frames},(_,i)=>clears(drop,i/frames,(i+1)/frames)).some(Boolean));
  assert.deepEqual(run(17),run(144));
});
test('wipers park in the same position after the return stroke',()=>{
  assert.ok(Math.abs(wiperAngle(0)-wiperAngle(1))<1e-10);
});
