import React, { useEffect, useRef } from 'react';

interface BugUnderGlassProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function BugUnderGlass({ onAction }: BugUnderGlassProps) {
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

    let bug = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 3,
      cracked: false,
      crackTimer: 0,
      crackX: 0,
      crackY: 0,
    };

    const draw = () => {
      // Clear with dark color
      ctx.fillStyle = '#0a1a1f';
      ctx.fillRect(0, 0, width, height);

      // Draw bug
      if (!bug.cracked) {
        // Move bug
        if (Math.random() < 0.05) {
          bug.angle += (Math.random() - 0.5) * Math.PI;
        }
        bug.vx = Math.cos(bug.angle) * bug.speed;
        bug.vy = Math.sin(bug.angle) * bug.speed;
        
        bug.x += bug.vx;
        bug.y += bug.vy;

        // Bounce off walls
        if (bug.x < 20 || bug.x > width - 20) {
          bug.vx *= -1;
          bug.angle = Math.atan2(bug.vy, bug.vx);
          bug.x = Math.max(20, Math.min(width - 20, bug.x));
        }
        if (bug.y < 20 || bug.y > height - 20) {
          bug.vy *= -1;
          bug.angle = Math.atan2(bug.vy, bug.vx);
          bug.y = Math.max(20, Math.min(height - 20, bug.y));
        }

        ctx.save();
        ctx.translate(bug.x, bug.y);
        ctx.rotate(bug.angle);
        
        // Draw beetle
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Legs
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        for(let i=-1; i<=1; i++) {
          ctx.beginPath(); ctx.moveTo(i*5, 8); ctx.lineTo(i*8, 15); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(i*5, -8); ctx.lineTo(i*8, -15); ctx.stroke();
        }
        ctx.restore();
      } else {
        bug.crackTimer--;
        if (bug.crackTimer <= 0) {
          bug.cracked = false;
          bug.x = width / 2;
          bug.y = height / 2;
        }
      }

      // Draw semi-transparent glass
      ctx.fillStyle = 'rgba(200, 220, 230, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Draw crack
      if (bug.cracked) {
        ctx.save();
        ctx.translate(bug.crackX, bug.crackY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(20, 30);
        ctx.lineTo(40, 20);
        ctx.moveTo(0, 0);
        ctx.lineTo(-30, 10);
        ctx.lineTo(-40, -20);
        ctx.moveTo(0, 0);
        ctx.lineTo(10, -30);
        ctx.lineTo(30, -40);
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      onAction('tap');
      if (bug.cracked) return;

      const dx = bug.x - e.clientX;
      const dy = bug.y - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 50) {
        // Cornered!
        bug.cracked = true;
        bug.crackTimer = 120;
        bug.crackX = e.clientX;
        bug.crackY = e.clientY;
        onAction('catch');
      } else {
        // Run away
        bug.angle = Math.atan2(dy, dx);
        bug.speed = 8;
        setTimeout(() => { bug.speed = 3; }, 1000);
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
