import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface HuntCycleProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function HuntCycle({ onAction }: HuntCycleProps) {
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

    let prey = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      phase: 'stalk', // stalk, chase, catch, pause
      nearHits: 0,
      timer: 0,
      targetX: width / 2,
      targetY: height / 2,
    };

    const draw = () => {
      ctx.fillStyle = '#1e293b'; // Slate 800
      ctx.fillRect(0, 0, width, height);

      if (prey.phase === 'pause') {
        prey.timer--;
        if (prey.timer <= 0) {
          prey.phase = 'stalk';
          prey.nearHits = 0;
          prey.x = Math.random() * width;
          prey.y = Math.random() * height;
        }
      } else {
        // Movement logic based on phase
        if (prey.phase === 'stalk') {
          // Slow, erratic movement
          if (Math.random() < 0.02) {
            prey.targetX = prey.x + (Math.random() - 0.5) * 100;
            prey.targetY = prey.y + (Math.random() - 0.5) * 100;
          }
          prey.vx = (prey.targetX - prey.x) * 0.05;
          prey.vy = (prey.targetY - prey.y) * 0.05;
        } else if (prey.phase === 'chase') {
          // Fast movement
          if (Math.random() < 0.05) {
            prey.targetX = Math.random() * width;
            prey.targetY = Math.random() * height;
          }
          prey.vx = (prey.targetX - prey.x) * 0.1;
          prey.vy = (prey.targetY - prey.y) * 0.1;
        } else if (prey.phase === 'catch') {
          // Tired, slow
          prey.vx *= 0.9;
          prey.vy *= 0.9;
        }

        prey.x += prey.vx;
        prey.y += prey.vy;

        // Keep in bounds
        prey.x = Math.max(20, Math.min(width - 20, prey.x));
        prey.y = Math.max(20, Math.min(height - 20, prey.y));

        // Draw prey (feather toy)
        ctx.save();
        ctx.translate(prey.x, prey.y);
        ctx.rotate(Math.atan2(prey.vy, prey.vx));
        
        ctx.fillStyle = prey.phase === 'catch' ? '#fca5a5' : '#ef4444'; // Red feather
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-15, 10);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-15, -10);
        ctx.fill();
        
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      onAction('tap');
      if (prey.phase === 'pause') return;

      const dx = prey.x - e.clientX;
      const dy = prey.y - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 60) {
        if (prey.phase === 'catch') {
          // Final catch!
          onAction('catch');
          prey.phase = 'pause';
          prey.timer = 120; // 2 seconds pause
          
          // Feather burst
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { x: e.clientX / width, y: e.clientY / height },
            colors: ['#ef4444', '#fca5a5', '#ffffff'],
            shapes: ['circle', 'square'],
            gravity: 0.5,
            ticks: 100
          });
        } else {
          // Near hit
          prey.nearHits++;
          if (prey.nearHits >= 3) {
            prey.phase = 'catch';
          } else {
            prey.phase = 'chase';
            // Dart away
            prey.targetX = prey.x + (dx > 0 ? 200 : -200);
            prey.targetY = prey.y + (dy > 0 ? 200 : -200);
          }
        }
      } else {
        // Missed, switch to chase if close enough
        if (dist < 150 && prey.phase === 'stalk') {
          prey.phase = 'chase';
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
