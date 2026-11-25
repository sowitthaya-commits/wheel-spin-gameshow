'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X, Clock } from 'lucide-react';

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
  const [cooldown, setCooldown] = useState<number>(5);

  useEffect(() => {
    if (isOpen) {
      setCooldown(5);

      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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

      return () => {
        clearInterval(timer);
        clearInterval(interval);
      };
    } else {
      setCooldown(5);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSafeClose = () => {
    if (cooldown === 0) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border-4 border-gold-bright bg-gradient-to-b from-black via-stage-card to-black p-8 text-center shadow-[0_0_90px_rgba(245,176,65,0.85)] animate-in zoom-in-95 duration-300">
        {/* Close Button (X) - Disabled during 5s cooldown */}
        <button
          onClick={handleSafeClose}
          disabled={cooldown > 0}
          className={`absolute right-4 top-4 rounded-full p-2 transition ${
            cooldown > 0
              ? 'opacity-20 cursor-not-allowed text-white/30'
              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
          }`}
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

        {/* Action Button with 5s Cooldown */}
        <button
          onClick={handleSafeClose}
          disabled={cooldown > 0}
          className={`mt-8 w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-xl font-bold transition-all duration-200 select-none ${
            cooldown > 0
              ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
              : 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-stage-dark shadow-[0_0_30px_rgba(245,176,65,0.7)] hover:brightness-110 active:scale-95'
          }`}
        >
          {cooldown > 0 ? (
            <>
              <Clock className="h-5 w-5 animate-pulse" />
              <span>ฉลองชัยชนะ... (ปิดได้ใน {cooldown} วิ)</span>
            </>
          ) : (
            <span>ตกลง / ปิดหน้าต่าง</span>
          )}
        </button>
      </div>
    </div>
  );
};
