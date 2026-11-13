import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

interface GravityChaosProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function GravityChaos({ onAction }: GravityChaosProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          MouseConstraint = Matter.MouseConstraint,
          Mouse = Matter.Mouse,
          World = Matter.World,
          Bodies = Matter.Bodies;

    const engine = Engine.create();
    const world = engine.world;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#0f172a'
      }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Add walls
    const wallOptions = { isStatic: true, render: { fillStyle: '#1e293b' } };
    World.add(world, [
      Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions), // Bottom
      Bodies.rectangle(-25, height / 2, 50, height, wallOptions), // Left
      Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions) // Right
    ]);

    // Add objects periodically
    const addObj = () => {
      const type = Math.floor(Math.random() * 3);
      const x = Math.random() * (width - 100) + 50;
      let body;
      if (type === 0) {
        body = Bodies.circle(x, -50, 30, { render: { fillStyle: '#38bdf8' }, restitution: 0.8 });
      } else if (type === 1) {
        body = Bodies.rectangle(x, -50, 60, 60, { render: { fillStyle: '#a78bfa' }, restitution: 0.5 });
      } else {
        body = Bodies.polygon(x, -50, 5, 35, { render: { fillStyle: '#f472b6' }, restitution: 0.6 });
      }
      World.add(world, body);
    };

    const interval = setInterval(addObj, 2000);
    for(let i=0; i<5; i++) addObj();

    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    World.add(world, mouseConstraint);

    // Keep the mouse in sync with rendering
    render.mouse = mouse;

    Matter.Events.on(mouseConstraint, 'mousedown', function(event) {
      onAction('tap');
      if (mouseConstraint.body) {
        onAction('catch');
        // Apply a random force to simulate batting
        const forceMagnitude = 0.05 * mouseConstraint.body.mass;
        Matter.Body.applyForce(mouseConstraint.body, mouseConstraint.body.position, {
          x: (Math.random() - 0.5) * forceMagnitude,
          y: -Math.random() * forceMagnitude
        });
      }
    });

    return () => {
      clearInterval(interval);
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
