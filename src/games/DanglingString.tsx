import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

interface DanglingStringProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function DanglingString({ onAction }: DanglingStringProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          MouseConstraint = Matter.MouseConstraint,
          Mouse = Matter.Mouse,
          World = Matter.World,
          Bodies = Matter.Bodies,
          Constraint = Matter.Constraint,
          Events = Matter.Events;

    const engine = Engine.create();
    const world = engine.world;
    
    // Zero gravity so it floats freely
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#050505'
      }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Add invisible walls to keep the stickman on screen
    const wallOptions = { isStatic: true, render: { visible: false }, restitution: 0.8 };
    const walls = [
      Bodies.rectangle(width / 2, -25, width, 50, wallOptions), // Top
      Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions), // Bottom
      Bodies.rectangle(-25, height / 2, 50, height, wallOptions), // Left
      Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions) // Right
    ];

    // Stickman dimensions based on screen size
    const headRadius = height * 0.04;
    const limbWidth = height * 0.015;
    const limbLength = height * 0.08;

    // Group prevents stickman parts from colliding with each other
    const group = Matter.Body.nextGroup(true);

    const createLimb = (x: number, y: number, w: number, h: number) => Bodies.rectangle(x, y, w, h, {
      render: { fillStyle: '#cbd5e1' }, // Light gray/white for body
      frictionAir: 0.01,
      density: 0.002,
      restitution: 0.8,
      collisionFilter: { group }
    });

    const head = Bodies.circle(width / 2, height / 2 - limbLength * 2, headRadius, {
      render: { fillStyle: '#00bfff' }, // Bright blue head
      frictionAir: 0.01,
      density: 0.002,
      restitution: 0.8,
      collisionFilter: { group }
    });

    // Torso
    const torso1 = createLimb(width/2, height/2 - limbLength, limbWidth, limbLength);
    const torso2 = createLimb(width/2, height/2, limbWidth, limbLength);

    // Arms (horizontal rectangles)
    const leftArm1 = createLimb(width/2 - limbLength/2, height/2 - limbLength*1.25, limbLength, limbWidth);
    const leftArm2 = createLimb(width/2 - limbLength*1.5, height/2 - limbLength*1.25, limbLength, limbWidth);

    const rightArm1 = createLimb(width/2 + limbLength/2, height/2 - limbLength*1.25, limbLength, limbWidth);
    const rightArm2 = createLimb(width/2 + limbLength*1.5, height/2 - limbLength*1.25, limbLength, limbWidth);

    // Legs (vertical rectangles)
    const leftLeg1 = createLimb(width/2 - limbWidth, height/2 + limbLength, limbWidth, limbLength);
    const leftLeg2 = createLimb(width/2 - limbWidth, height/2 + limbLength*2, limbWidth, limbLength);

    const rightLeg1 = createLimb(width/2 + limbWidth, height/2 + limbLength, limbWidth, limbLength);
    const rightLeg2 = createLimb(width/2 + limbWidth, height/2 + limbLength*2, limbWidth, limbLength);

    const allParts = [head, torso1, torso2, leftArm1, leftArm2, rightArm1, rightArm2, leftLeg1, leftLeg2, rightLeg1, rightLeg2];

    const link = (bodyA: Matter.Body, bodyB: Matter.Body, offsetA: any, offsetB: any) => Constraint.create({
      bodyA, bodyB,
      pointA: offsetA, pointB: offsetB,
      stiffness: 0.1, // Very low stiffness for a boneless, floppy feel
      damping: 0.1,
      render: { visible: false }
    });

    const constraints = [
      // Head to Torso
      link(head, torso1, {x:0, y:headRadius}, {x:0, y:-limbLength/2}),
      // Torso 1 to Torso 2
      link(torso1, torso2, {x:0, y:limbLength/2}, {x:0, y:-limbLength/2}),
      // Torso 1 to Left Arm 1
      link(torso1, leftArm1, {x:-limbWidth/2, y:-limbLength/4}, {x:limbLength/2, y:0}),
      // Left Arm 1 to Left Arm 2
      link(leftArm1, leftArm2, {x:-limbLength/2, y:0}, {x:limbLength/2, y:0}),
      // Torso 1 to Right Arm 1
      link(torso1, rightArm1, {x:limbWidth/2, y:-limbLength/4}, {x:-limbLength/2, y:0}),
      // Right Arm 1 to Right Arm 2
      link(rightArm1, rightArm2, {x:limbLength/2, y:0}, {x:-limbLength/2, y:0}),
      // Torso 2 to Left Leg 1
      link(torso2, leftLeg1, {x:-limbWidth/2, y:limbLength/2}, {x:0, y:-limbLength/2}),
      // Left Leg 1 to Left Leg 2
      link(leftLeg1, leftLeg2, {x:0, y:limbLength/2}, {x:0, y:-limbLength/2}),
      // Torso 2 to Right Leg 1
      link(torso2, rightLeg1, {x:limbWidth/2, y:limbLength/2}, {x:0, y:-limbLength/2}),
      // Right Leg 1 to Right Leg 2
      link(rightLeg1, rightLeg2, {x:0, y:limbLength/2}, {x:0, y:-limbLength/2}),
    ];

    World.add(world, [...walls, ...allParts, ...constraints]);

    // Give it an initial gentle spin and push
    Matter.Body.setVelocity(head, { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 });
    Matter.Body.setAngularVelocity(torso1, 0.1);

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.1,
        render: { visible: false }
      }
    });

    World.add(world, mouseConstraint);
    render.mouse = mouse;

    let flailTimer = 0;

    Events.on(mouseConstraint, 'mousedown', function(event) {
      onAction('tap');
      if (mouseConstraint.body) {
        onAction('catch');
        
        // Trigger boneless random writhing for a few seconds
        flailTimer = 180; // ~3 seconds at 60fps
        
        // Apply an initial burst of force to the touched body part
        const forceMagnitude = 0.25 * mouseConstraint.body.mass;
        Matter.Body.applyForce(mouseConstraint.body, mouseConstraint.body.position, {
          x: (Math.random() - 0.5) * forceMagnitude,
          y: -Math.random() * forceMagnitude * 0.5
        });
      }
    });

    // Make the creature writhe randomly when touched
    const updateWrithe = () => {
      if (flailTimer > 0) {
        flailTimer--;
        const time = engine.timing.timestamp;
        
        allParts.forEach((part, i) => {
          // Apply chaotic, random forces mixed with sine waves to simulate boneless flailing
          const forceX = Math.sin(time * 0.02 + i) * 0.002 * part.mass + (Math.random() - 0.5) * 0.002 * part.mass;
          const forceY = Math.cos(time * 0.025 + i) * 0.002 * part.mass + (Math.random() - 0.5) * 0.002 * part.mass;
          
          Matter.Body.applyForce(part, part.position, { x: forceX, y: forceY });
        });
      }
    };

    Events.on(engine, 'beforeUpdate', updateWrithe);

    return () => {
      Events.off(engine, 'beforeUpdate', updateWrithe);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      World.clear(world, false);
      Engine.clear(engine);
    };
  }, [onAction]);

  return <div ref={containerRef} className="w-full h-full touch-none" />;
}
