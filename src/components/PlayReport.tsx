import React from 'react';
import { motion } from 'motion/react';
import { PlayStats } from '../types';

interface PlayReportProps {
  stats: PlayStats;
  onClose: () => void;
}

function StatRow({ label, value, capitalize = false }: { label: string, value: React.ReactNode, capitalize?: boolean }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-white/[0.08]">
      <span className="text-white/40 text-sm tracking-wide">{label}</span>
      <span className={`text-lg font-light text-white/90 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function PlayReport({ stats, onClose }: PlayReportProps) {
  const engagementScore = Math.min(100, Math.round((stats.taps * 2 + stats.catches * 10) / (stats.timeSpent / 60 || 1)));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-6"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-teal-500/10 blur-[60px] pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-10">
            Session Complete
          </h2>
          
          <div className="space-y-2 mb-10">
            <StatRow 
              label="Time Active" 
              value={`${Math.floor(stats.timeSpent / 60)}m ${stats.timeSpent % 60}s`} 
            />
            <StatRow 
              label="Favorite Prey" 
              value={stats.preyType} 
              capitalize 
            />
            <StatRow 
              label="Total Strikes" 
              value={stats.taps} 
            />
          </div>

          <div className="flex flex-col items-center pt-6 border-t border-white/[0.08]">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-3">
              Engagement
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-light text-teal-400 tracking-tighter">
                {engagementScore}
              </span>
              <span className="text-2xl font-light text-white/20">/100</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-12 py-4 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-xs font-semibold tracking-[0.15em] uppercase text-white/80"
          >
            Return to Menu
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
