import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Hand, Sparkles, WandSparkles } from 'lucide-react';
import type { ToyControl } from '../games/ToyWorlds';
import type { World } from '../games/EverydayWorlds';

const initial:ToyControl={x:.5,y:.5,active:false,hidden:false,twitch:0};
export function Touchpad({world,control,disabled,onControl}:{world:World;control?:ToyControl;disabled:boolean;onControl:(value:ToyControl)=>void}) {
  const [value,setValue]=useState<ToyControl>(control||initial);
  const current=useRef(value),pointer=useRef<number|null>(null);
  const manual=world==='ribbon'||world==='mouse'||world==='door';
  useEffect(()=>{const next={...initial,...control};current.current=next;setValue(next);},[world]);
  useEffect(()=>{if(pointer.current===null && control){current.current=control;setValue(control);}},[control]);
  function update(patch:Partial<ToyControl>){const next={...current.current,...patch};current.current=next;setValue(next);onControl(next);}
  function locate(e:React.PointerEvent<HTMLDivElement>){const b=e.currentTarget.getBoundingClientRect();return{x:Math.max(.04,Math.min(.96,(e.clientX-b.left)/b.width)),y:Math.max(.04,Math.min(.96,(e.clientY-b.top)/b.height))};}
  if(!manual)return null;
  return <section className="touchpad-section" aria-label="Direct toy control">
    <div className="touchpad-heading"><strong>Your finger. Their toy.</strong><span>{value.active?'You’re in control':'Playing on its own'}</span></div>
    <div className={'toy-touchpad '+(disabled?'disabled':'')+(value.hidden?' toy-hidden':'')} role="application" aria-label="Toy touchpad. Drag to move. Arrow keys move the toy. Space holds it still." tabIndex={disabled?-1:0}
      onPointerDown={e=>{if(disabled||pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update({...locate(e),active:true,hidden:false});}}
      onPointerMove={e=>{if(pointer.current===e.pointerId&&!disabled)update({...locate(e),active:true});}}
      onPointerUp={e=>{if(pointer.current===e.pointerId){pointer.current=null;if(!disabled)update({...locate(e),active:true});}}}
      onPointerCancel={()=>{pointer.current=null;}}
      onLostPointerCapture={()=>{pointer.current=null;}}
      onKeyDown={e=>{if(disabled)return;const keys:Record<string,Partial<ToyControl>>={ArrowLeft:{x:Math.max(.04,value.x-.04)},ArrowRight:{x:Math.min(.96,value.x+.04)},ArrowUp:{y:Math.max(.04,value.y-.04)},ArrowDown:{y:Math.min(.96,value.y+.04)},' ':{active:true}};if(keys[e.key]){e.preventDefault();update({active:true,hidden:false,...keys[e.key]});}}}>
      <span className="pad-edge">{world==='ribbon'?'CURTAIN →':world==='door'?'↑ DOOR GAP':'↑ MOUSE HOLES'}</span>
      <span className="pad-crosshair horizontal"/><span className="pad-crosshair vertical"/>
      <span className="toy-dot" style={{left:value.x*100+'%',top:value.y*100+'%'}}><span>{world==='ribbon'||world==='door'?'〰':'•'}</span></span>
      <span className="pad-instruction">{value.hidden?'Hidden. Make them wait…':'Drag here to move the toy'}</span>
    </div>
    <p className="pad-help"><Hand size={12}/> Lift your finger to hold still. Let them come closer.</p>
    <div className="pad-buttons">
      <button disabled={disabled} onClick={()=>update({active:true,twitch:Math.min(1000000,value.twitch+1)})}><Sparkles size={16}/> Twitch</button>
      <button disabled={disabled} aria-pressed={value.hidden} onClick={()=>update({active:true,hidden:!value.hidden})}>{value.hidden?<Eye size={16}/>:<EyeOff size={16}/>} {value.hidden?'Show':'Hide'}</button>
      <button disabled={disabled} onClick={()=>update({active:false,hidden:false})}><WandSparkles size={16}/> Auto play</button>
    </div>
    <p className="pad-help">The toy follows across the internet; response depends on your connection.</p>
  </section>;
}

