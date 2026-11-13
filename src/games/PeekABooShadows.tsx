import React, { useEffect, useRef } from 'react';

interface PeekABooShadowsProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function PeekABooShadows({ onAction }: PeekABooShadowsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const rocks = [
      { x: width * 0.2, y: height * 0.3, r: 80 },
      { x: width * 0.8, y: height * 0.7, r: 100 },
      { x: width * 0.5, y: height * 0.8, r: 60 },
      { x: width * 0.7, y: height * 0.2, r: 70 },
    ];

    let prey = {
      x: width / 2,
      y: height / 2,
      vx: 2,
      vy: 2,
      state: 'moving', // moving, hiding, caught
      timer: 0,
      targetRock: -1,
    };

    const draw = () => {
      // Very dark background
      ctx.fillStyle = '#020508';
      ctx.fillRect(0, 0, width, height);

      // Update prey
      if (prey.state === 'moving') {
        prey.x += prey.vx;
        prey.y += prey.vy;

        // Check if reached rock
        if (prey.targetRock !== -1) {
          const rock = rocks[prey.targetRock];
          const dx = rock.x - prey.x;
          const dy = rock.y - prey.y;
          if (Math.sqrt(dx * dx + dy * dy) < rock.r * 0.5) {
            prey.state = 'hiding';
            prey.timer = 120; // hide for 2 seconds
          }
        } else {
          // Bounce
          if (prey.x < 0 || prey.x > width) prey.vx *= -1;
          if (prey.y < 0 || prey.y > height) prey.vy *= -1;
          
          // Randomly pick a rock to hide
          if (Math.random() < 0.01) {
            prey.targetRock = Math.floor(Math.random() * rocks.length);
            const rock = rocks[prey.targetRock];
            const angle = Math.atan2(rock.y - prey.y, rock.x - prey.x);
            prey.vx = Math.cos(angle) * 3;
            prey.vy = Math.sin(angle) * 3;
          }
        }
      } else if (prey.state === 'hiding') {
        prey.timer--;
        if (prey.timer <= 0) {
          prey.state = 'moving';
          prey.targetRock = -1;
          const angle = Math.random() * Math.PI * 2;
          prey.vx = Math.cos(angle) * 3;
          prey.vy = Math.sin(angle) * 3;
        }
      } else if (prey.state === 'caught') {
        prey.timer--;
        if (prey.timer <= 0) {
          prey.state = 'moving';
          prey.x = Math.random() * width;
          prey.y = Math.random() * height;
        }
      }

      // Draw prey (shadow)
      if (prey.state !== 'hiding') {
        ctx.fillStyle = prey.state === 'caught' ? '#ff3333' : '#1a2b3c';
        ctx.beginPath();
        ctx.ellipse(prey.x, prey.y, 15, 8, Math.atan2(prey.vy, prey.vx), 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw rocks (silhouettes)
      ctx.fillStyle = '#050a10';
      rocks.forEach(rock => {
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      onAction('tap');
      if (prey.state === 'caught') return;

      const dx = prey.x - e.clientX;
      const dy = prey.y - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 40 && prey.state !== 'hiding') {
        prey.state = 'caught';
        prey.timer = 60;
        onAction('catch');
      } else if (prey.state === 'hiding') {
        // If tapped on the rock where it's hiding, flush it out
        const rock = rocks[prey.targetRock];
        if (rock) {
          const rdx = rock.x - e.clientX;
          const rdy = rock.y - e.clientY;
          if (Math.sqrt(rdx * rdx + rdy * rdy) < rock.r) {
            prey.state = 'moving';
            prey.targetRock = -1;
            const angle = Math.random() * Math.PI * 2;
            prey.vx = Math.cos(angle) * 6; // run fast
            prey.vy = Math.sin(angle) * 6;
          }
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onAction]);

  return (
    <canvas ref={canvasRef} className="block w-full h-full touch-none" />
  );
}
