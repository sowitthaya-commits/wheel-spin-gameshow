'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X } from 'lucide-react';

interface WinnerModalProps {
  isOpen: boolean;
  playerName: string;
  prizeLabel: string;
  onClose: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  playerName,
  prizeLabel,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire festive fireworks confetti
      const duration = 3.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFE57F', '#FFD700', '#F5B041', '#FFFFFF', '#D4AF37'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFE57F', '#FFD700', '#F5B041', '#FFFFFF', '#D4AF37'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border-4 border-gold-bright bg-gradient-to-b from-black via-stage-card to-black p-8 text-center shadow-[0_0_90px_rgba(245,176,65,0.85)] animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Trophy Icon */}
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-gold-dark via-gold to-gold-light shadow-[0_0_40px_rgba(245,176,65,0.9)] animate-bounce">
          <Trophy className="h-14 w-14 text-stage-dark" />
        </div>

        {/* Header Title */}
        <div className="flex items-center justify-center gap-2 text-gold-light font-bold text-lg tracking-wider uppercase">
          <Sparkles className="h-5 w-5 text-gold animate-spin" />
          <span>ยินดีด้วย! คุณคือผู้โชคดี</span>
          <Sparkles className="h-5 w-5 text-gold animate-spin" />
        </div>

        {/* Player Name */}
        <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {playerName || 'ผู้เล่น'}
        </h2>

        {/* Prize Box */}
        <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm shadow-inner">
          <p className="text-sm font-medium text-white/70">ได้รับรางวัล</p>
          <p className="mt-2 text-2xl font-black text-gold sm:text-3xl drop-shadow-[0_0_15px_rgba(245,176,65,0.6)]">
            {prizeLabel}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light py-4 text-xl font-bold text-stage-dark shadow-[0_0_30px_rgba(245,176,65,0.6)] hover:brightness-110 active:scale-95 transition"
        >
          ตกลง / ปิดหน้าต่าง
        </button>
      </div>
    </div>
  );
};
