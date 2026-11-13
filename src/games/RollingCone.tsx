import React, { useEffect, useRef } from 'react';

interface RollingConeProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function RollingCone({ onAction }: RollingConeProps) {
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

    let cone = {
      x: width / 2,
      y: height / 2,
      vx: 4,
      vy: 2,
      rotation: 0,
      vRot: 0.1,
      scale: 1,
      color: '#f97316' // orange-500
    };

    const draw = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Update physics
      cone.x += cone.vx;
      cone.y += cone.vy;
      cone.rotation += cone.vRot;

      // Bounce off walls
      if (cone.x < 50 || cone.x > width - 50) {
        cone.vx *= -1;
        cone.vRot *= -1;
        cone.x = Math.max(50, Math.min(width - 50, cone.x));
      }
      if (cone.y < 50 || cone.y > height - 50) {
        cone.vy *= -1;
        cone.y = Math.max(50, Math.min(height - 50, cone.y));
      }

      // Draw cone
      ctx.save();
      ctx.translate(cone.x, cone.y);
      ctx.rotate(cone.rotation);
      ctx.scale(cone.scale, cone.scale);

      // Draw a 2D cone/triangle
      ctx.fillStyle = cone.color;
      ctx.beginPath();
      ctx.moveTo(40, 0); // Tip
      ctx.lineTo(-30, 25); // Bottom right
      ctx.lineTo(-30, -25); // Bottom left
      ctx.closePath();
      ctx.fill();

      // Draw some stripes on the cone to show rolling
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(10, 12);
      ctx.lineTo(10, -12);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(-10, -20);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      onAction('tap');
      const dx = cone.x - e.clientX;
      const dy = cone.y - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 80) {
        onAction('catch');
        // Dart away and spin faster
        cone.vx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 5 + 8);
        cone.vy = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 5 + 8);
        cone.vRot = (Math.random() > 0.5 ? 1 : -1) * 0.4;
        
        // Pop effect
        cone.scale = 1.5;
        setTimeout(() => { cone.scale = 1; }, 150);
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
