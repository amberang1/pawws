import React, { useEffect, useRef } from 'react';

interface KoiRipplePondProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function KoiRipplePond({ onAction }: KoiRipplePondProps) {
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

    // Fish logic
    let fish = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      targetX: width / 2,
      targetY: height / 2,
      stunned: false,
      stunTimer: 0,
      nearMisses: 0,
      angle: 0,
    };

    const ripples: { x: number; y: number; radius: number; alpha: number }[] = [];

    const draw = () => {
      // Clear with water color
      ctx.fillStyle = '#0f3842'; // Dark blue-green
      ctx.fillRect(0, 0, width, height);

      // Draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 200, 220, ${r.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        r.radius += 2;
        r.alpha -= 0.02;
        if (r.alpha <= 0) ripples.splice(i, 1);
      }

      // Update fish
      if (!fish.stunned) {
        const dx = fish.targetX - fish.x;
        const dy = fish.targetY - fish.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          fish.vx = (dx / dist) * 4;
          fish.vy = (dy / dist) * 4;
          fish.angle = Math.atan2(dy, dx);
        } else {
          // Wander
          if (Math.random() < 0.02) {
            fish.targetX = fish.x + (Math.random() - 0.5) * 300;
            fish.targetY = fish.y + (Math.random() - 0.5) * 300;
            fish.targetX = Math.max(50, Math.min(width - 50, fish.targetX));
            fish.targetY = Math.max(50, Math.min(height - 50, fish.targetY));
          }
          fish.vx *= 0.9;
          fish.vy *= 0.9;
        }
        
        fish.x += fish.vx;
        fish.y += fish.vy;
      } else {
        fish.stunTimer--;
        if (fish.stunTimer <= 0) {
          // Reset fish
          fish.stunned = false;
          fish.nearMisses = 0;
          fish.x = Math.random() * width;
          fish.y = Math.random() * height;
          fish.targetX = fish.x;
          fish.targetY = fish.y;
        }
      }

      // Draw fish
      ctx.save();
      ctx.translate(fish.x, fish.y);
      ctx.rotate(fish.angle);
      
      if (fish.stunned) {
        ctx.fillStyle = '#ff9900'; // Stunned color
      } else {
        ctx.fillStyle = '#ff5500'; // Normal koi color
      }
      
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Tail
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-30, -10);
      ctx.lineTo(-30, 10);
      ctx.fill();
      
      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      ripples.push({ x, y, radius: 10, alpha: 1 });
      
      onAction('tap');

      const dx = fish.x - x;
      const dy = fish.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 40 && !fish.stunned) {
        // Catch!
        fish.stunned = true;
        fish.stunTimer = 120; // 2 seconds at 60fps
        onAction('catch');
      } else if (dist < 150 && !fish.stunned) {
        // Near miss, flee
        fish.nearMisses++;
        if (fish.nearMisses > 4) {
          // Stun after too many near misses
          fish.stunned = true;
          fish.stunTimer = 120;
          onAction('catch');
        } else {
          // Flee away from tap
          fish.targetX = fish.x + (dx / dist) * 300;
          fish.targetY = fish.y + (dy / dist) * 300;
          fish.targetX = Math.max(50, Math.min(width - 50, fish.targetX));
          fish.targetY = Math.max(50, Math.min(height - 50, fish.targetY));
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
