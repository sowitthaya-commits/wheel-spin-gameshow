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
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-gold-bright animate-spin" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold-bright to-gold-dark drop-shadow-[0_0_20px_rgba(245,176,65,0.8)]">
              {gameTitle || 'LUCKY SPIN SHOW'}
            </h1>
          </div>
        )}
      </div>

      {/* Active Player Marquee Banner with Luxury Black & Gold Glow */}
      <div className="flex items-center gap-3.5 rounded-full border-2 border-gold/80 bg-black/85 px-6 py-2.5 shadow-[0_0_30px_rgba(245,176,65,0.45)] backdrop-blur-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-gold-dark to-gold-bright text-stage-dark shadow-md">
          <User className="h-5 w-5 fill-stage-dark" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-gold-light/90 drop-shadow">
            ผู้เล่นรอบนี้ / ACTIVE PLAYER
          </span>
          <span className="text-lg sm:text-xl font-black text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {activePlayerName || 'ยังไม่ได้เลือกผู้เล่น'}
          </span>
        </div>
      </div>
    </header>
  );
};
