import React, { useEffect, useRef } from 'react';

interface SoundReactorProps {
  onAction: (action: 'tap' | 'catch') => void;
}

export function SoundReactor({ onAction }: SoundReactorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

    // Initialize Audio Context on first interaction to comply with browser policies
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const playSqueak = (panX: number) => {
      if (!audioCtxRef.current) return;
      const t = audioCtxRef.current.currentTime;
      
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      const panner = audioCtxRef.current.createStereoPanner();
      
      osc.type = 'sine';
      // High frequency sweep
      osc.frequency.setValueAtTime(3000, t);
      osc.frequency.exponentialRampToValueAtTime(6000, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      
      panner.pan.value = panX; // -1 to 1

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(audioCtxRef.current.destination);
      
      osc.start(t);
      osc.stop(t + 0.2);
    };

    let prey = {
      x: width / 2,
      y: height / 2,
      glowAlpha: 0,
      timer: 0,
      state: 'hiding' // hiding, squeaking, caught
    };

    const draw = () => {
      // Very dark background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (prey.state === 'hiding') {
        prey.timer--;
        if (prey.timer <= 0) {
          prey.state = 'squeaking';
          prey.timer = 30; // glow duration
          prey.x = Math.random() * (width - 100) + 50;
          prey.y = Math.random() * (height - 100) + 50;
          prey.glowAlpha = 1;
          
          // Calculate pan based on x position
          const panX = (prey.x / width) * 2 - 1;
          playSqueak(panX);
        }
      } else if (prey.state === 'squeaking') {
        prey.timer--;
        prey.glowAlpha -= 0.03;
        if (prey.timer <= 0) {
          prey.state = 'hiding';
          prey.timer = Math.random() * 120 + 60; // 1 to 3 seconds
        }
      } else if (prey.state === 'caught') {
        prey.timer--;
        prey.glowAlpha -= 0.05;
        if (prey.timer <= 0) {
          prey.state = 'hiding';
          prey.timer = 60;
        }
      }

      // Draw glow
      if (prey.glowAlpha > 0) {
        const gradient = ctx.createRadialGradient(prey.x, prey.y, 0, prey.x, prey.y, 40);
        gradient.addColorStop(0, `rgba(100, 255, 150, ${prey.glowAlpha})`);
        gradient.addColorStop(1, 'rgba(100, 255, 150, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(prey.x, prey.y, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handlePointerDown = (e: PointerEvent) => {
      initAudio();
      onAction('tap');
      
      if (prey.state === 'caught') return;

      const dx = prey.x - e.clientX;
      const dy = prey.y - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 60) {
        prey.state = 'caught';
        prey.timer = 20;
        prey.glowAlpha = 1;
        onAction('catch');
        // Success sound
        if (audioCtxRef.current) {
          const t = audioCtxRef.current.currentTime;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        }
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [onAction]);

  return (
    <canvas ref={canvasRef} className="block w-full h-full touch-none" />
  );
}
