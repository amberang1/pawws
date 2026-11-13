import React from 'react';
import { motion } from 'motion/react';
import { GameType } from '../types';
import { Fish, Bug, Moon, Box, Target, Smartphone, Volume2, Lasso, Cone } from 'lucide-react';

interface MainMenuProps {
  onSelectGame: (game: GameType) => void;
}

const games: { id: GameType; title: string; description: string; icon: React.ReactNode; gradient: string }[] = [
  { id: 'koi', title: 'Koi Ripple Pond', description: 'Fluid ripples and fleeing fish.', icon: <Fish strokeWidth={1.5} size={24} />, gradient: 'from-teal-500/20 to-transparent' },
  { id: 'bug', title: 'Bug Under Glass', description: 'Corner the bug to crack the glass.', icon: <Bug strokeWidth={1.5} size={24} />, gradient: 'from-emerald-500/20 to-transparent' },
  { id: 'shadows', title: 'Peek-a-Boo Shadows', description: 'Moving prey shadows in low light.', icon: <Moon strokeWidth={1.5} size={24} />, gradient: 'from-slate-500/20 to-transparent' },
  { id: 'gravity', title: 'Gravity Chaos', description: 'Physics sandbox with falling objects.', icon: <Box strokeWidth={1.5} size={24} />, gradient: 'from-cyan-500/20 to-transparent' },
  { id: 'hunt', title: 'Hunt Cycle', description: 'Stalk, chase, catch. The ultimate loop.', icon: <Target strokeWidth={1.5} size={24} />, gradient: 'from-blue-500/20 to-transparent' },
  { id: 'coplay', title: 'Co-Play Mode', description: 'Tilt your phone to scurry the prey.', icon: <Smartphone strokeWidth={1.5} size={24} />, gradient: 'from-indigo-500/20 to-transparent' },
  { id: 'sound', title: 'Sound Reactor', description: 'Audio-first dark screen hunt.', icon: <Volume2 strokeWidth={1.5} size={24} />, gradient: 'from-violet-500/20 to-transparent' },
  { id: 'string', title: 'Floppy Stickman', description: 'A free-floating boneless stickman that flails.', icon: <Lasso strokeWidth={1.5} size={24} />, gradient: 'from-pink-500/20 to-transparent' },
  { id: 'cone', title: 'Rolling Cone', description: 'A round cone that rolls across the screen.', icon: <Cone strokeWidth={1.5} size={24} />, gradient: 'from-orange-500/20 to-transparent' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function MainMenu({ onSelectGame }: MainMenuProps) {
  return (
    <div className="absolute inset-0 bg-[#050505] text-white flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(20,60,70,0.4)_0%,_transparent_70%)] pointer-events-none" />
      
      <div className="max-w-6xl w-full relative z-10 py-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-light tracking-tighter mb-3">
            PawHunt<span className="text-teal-500">.</span>
          </h1>
          <p className="text-white/40 text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase">
            The only game your cat finishes
          </p>
        </motion.header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5"
        >
          {games.map((game) => (
            <motion.button
              key={game.id}
              variants={itemVariants}
              onClick={() => onSelectGame(game.id)}
              className="group relative flex flex-col items-start p-5 md:p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-500 text-left overflow-hidden"
            >
              {/* Hover gradient glow */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${game.gradient}`} />
              
              <div className="relative z-10">
                <div className="mb-4 text-white/30 group-hover:text-white/80 transition-colors duration-500">
                  {game.icon}
                </div>
                <h2 className="text-base md:text-lg font-light text-white/90 mb-1.5 tracking-wide">{game.title}</h2>
                <p className="text-white/40 text-xs font-light leading-relaxed line-clamp-2">{game.description}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
