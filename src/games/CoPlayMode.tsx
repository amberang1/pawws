import React, { useEffect, useRef } from 'react';

interface CoPlayModeProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function CoPlayMode({ onAction }: CoPlayModeProps) {
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

    let ball = {
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: 20,
    };

    let tilt = { beta: 0, gamma: 0 };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // beta: front-to-back tilt [-180, 180]
      // gamma: left-to-right tilt [-90, 90]
      tilt.beta = e.beta || 0;
      tilt.gamma = e.gamma || 0;
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permissionState = await (DeviceOrientationEvent as any).requestPermission();
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    // We can just call it on mount, or we might need a user interaction.
    // Since they just tapped the menu, we might be able to request it.
    requestPermission();

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Apply tilt to velocity
      ball.vx += tilt.gamma * 0.05;
      ball.vy += tilt.beta * 0.05;

      // Friction
      ball.vx *= 0.98;
      ball.vy *= 0.98;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // Bounce off walls
      if (ball.x < ball.radius) { ball.x = ball.radius; ball.vx *= -0.8; }
      if (ball.x > width - ball.radius) { ball.x = width - ball.radius; ball.vx *= -0.8; }
      if (ball.y < ball.radius) { ball.y = ball.radius; ball.vy *= -0.8; }
      if (ball.y > height - ball.radius) { ball.y = height - ball.radius; ball.vy *= -0.8; }

      // Draw ball
      ctx.fillStyle = '#10b981'; // Emerald 500
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw a little highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(ball.x - 5, ball.y - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      onAction('tap');
      const dx = ball.x - e.clientX;
      const dy = ball.y - e.clientY;
      if (Math.sqrt(dx * dx + dy * dy) < ball.radius * 2) {
        onAction('catch');
        // Bat it away
        ball.vx += (Math.random() - 0.5) * 20;
        ball.vy += (Math.random() - 0.5) * 20;
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', handleOrientation);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onAction]);

  return (
    <canvas ref={canvasRef} className="block w-full h-full touch-none" />
  );
}
