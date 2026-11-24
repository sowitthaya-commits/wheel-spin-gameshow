'use client';

import React from 'react';
import { User, Sparkles } from 'lucide-react';

interface StageHeaderProps {
  gameTitle: string;
  logoUrl?: string;
  activePlayerName: string;
}

export const StageHeader: React.FC<StageHeaderProps> = ({
  gameTitle,
  logoUrl,
  activePlayerName,
}) => {
  return (
    <header className="flex w-full flex-col items-center justify-between gap-4 py-4 px-6 md:flex-row max-w-7xl mx-auto">
      {/* Game Brand / Logo */}
      <div className="flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={gameTitle}
            className="h-12 w-auto max-w-[160px] object-contain drop-shadow-[0_0_15px_rgba(245,176,65,0.5)]"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-gold animate-spin" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-gold-light via-gold to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {gameTitle || 'LUCKY SPIN SHOW'}
            </h1>
          </div>
        )}
      </div>

      {/* Active Player Marquee Banner */}
      <div className="flex items-center gap-3 rounded-full border-2 border-gold/70 bg-stage-card/90 px-6 py-2 shadow-[0_0_25px_rgba(245,176,65,0.35)] backdrop-blur-md">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
          <User className="h-5 w-5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold-light/80">
            ผู้เล่นรอบนี้ / Active Player
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
            {activePlayerName || 'ยังไม่ได้เลือกผู้เล่น'}
          </span>
        </div>
      </div>
    </header>
  );
};
