import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MainMenu } from './components/MainMenu';
import { PlayReport } from './components/PlayReport';
import { GameType, PlayStats } from './types';
import { KoiRipplePond } from './games/KoiRipplePond';
import { BugUnderGlass } from './games/BugUnderGlass';
import { PeekABooShadows } from './games/PeekABooShadows';
import { GravityChaos } from './games/GravityChaos';
import { HuntCycle } from './games/HuntCycle';
import { CoPlayMode } from './games/CoPlayMode';
import { SoundReactor } from './games/SoundReactor';
import { DanglingString } from './games/DanglingString';
import { RollingCone } from './games/RollingCone';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [playStats, setPlayStats] = useState<PlayStats | null>(null);
  const [currentStats, setCurrentStats] = useState<PlayStats | null>(null);
  
  const [lockProgress, setLockProgress] = useState(0);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const handleStartGame = (game: GameType) => {
    setActiveGame(game);
    setCurrentStats({ game, timeSpent: 0, taps: 0, catches: 0, preyType: getPreyType(game) });
    startTimeRef.current = Date.now();
  };

  const getPreyType = (game: GameType) => {
    switch (game) {
      case 'koi': return 'koi fish';
      case 'bug': return 'beetle';
      case 'shadows': return 'shadow mouse';
      case 'gravity': return 'falling objects';
      case 'hunt': return 'feather toy';
      case 'coplay': return 'laser/bug';
      case 'sound': return 'cricket';
      case 'string': return 'string toy';
      case 'cone': return 'rolling cone';
      default: return 'unknown';
    }
  };

  const handleGameAction = useCallback((action: 'tap' | 'catch') => {
    setCurrentStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        taps: action === 'tap' ? prev.taps + 1 : prev.taps,
        catches: action === 'catch' ? prev.catches + 1 : prev.catches,
      };
    });
  }, []);

  const handlePointerDown = () => {
    if (!activeGame) return;
    
    // Start 3-second lock timer
    lockTimerRef.current = setTimeout(() => {
      exitGame();
    }, 3000);

    // Progress bar for visual feedback
    let progress = 0;
    lockIntervalRef.current = setInterval(() => {
      progress += (100 / 30); // 30 steps for 3 seconds (100ms interval)
      setLockProgress(Math.min(progress, 100));
    }, 100);
  };

  const handlePointerUp = () => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    setLockProgress(0);
  };

  const exitGame = () => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    setLockProgress(0);
    
    if (currentStats) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setPlayStats({ ...currentStats, timeSpent });
    }
    
    setActiveGame(null);
    setCurrentStats(null);
  };

  return (
    <div className={`fixed inset-0 overflow-hidden bg-black select-none ${activeGame ? 'touch-none' : ''}`}>
      {!activeGame && !playStats && (
        <MainMenu onSelectGame={handleStartGame} />
      )}

      {playStats && (
        <PlayReport stats={playStats} onClose={() => setPlayStats(null)} />
      )}

      {activeGame && (
        <div className="absolute inset-0 z-10">
          {/* Hidden exit button area - top right corner */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 z-50"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Lock Progress Indicator */}
            {lockProgress > 0 && (
              <div className="absolute top-6 right-6 w-16 h-16 rounded-full border border-white/10 flex items-center justify-center pointer-events-none backdrop-blur-md bg-black/20 shadow-2xl">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                  <circle 
                    cx="32" cy="32" r="30" 
                    fill="none" 
                    stroke="#2dd4bf" 
                    strokeWidth="2" 
                    strokeDasharray="188.5" 
                    strokeDashoffset={188.5 - (188.5 * lockProgress) / 100} 
                    className="transition-all duration-100 ease-linear" 
                  />
                </svg>
                <span className="text-white/50 text-[9px] font-medium tracking-[0.2em] uppercase">Exit</span>
              </div>
            )}
          </div>

          {/* Game Container */}
          <div className="absolute inset-0">
            {activeGame === 'koi' && <KoiRipplePond onAction={handleGameAction} />}
            {activeGame === 'bug' && <BugUnderGlass onAction={handleGameAction} />}
            {activeGame === 'shadows' && <PeekABooShadows onAction={handleGameAction} />}
            {activeGame === 'gravity' && <GravityChaos onAction={handleGameAction} />}
            {activeGame === 'hunt' && <HuntCycle onAction={handleGameAction} />}
            {activeGame === 'coplay' && <CoPlayMode onAction={handleGameAction} />}
            {activeGame === 'sound' && <SoundReactor onAction={handleGameAction} />}
            {activeGame === 'string' && <DanglingString onAction={handleGameAction} />}
            {activeGame === 'cone' && <RollingCone onAction={handleGameAction} />}
          </div>
        </div>
      )}
    </div>
  );
}
