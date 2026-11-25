'use client';

import React from 'react';
import { GameStatus } from '../../types/game';
import { Play, Hourglass, Sparkles, Loader2, Trophy, Clock } from 'lucide-react';

interface SpinButtonProps {
  isMyTurn: boolean;
  canSpin: boolean;
  status: GameStatus;
  activePlayerName?: string;
  onSpin: () => void;
}

export const SpinButton: React.FC<SpinButtonProps> = ({
  isMyTurn,
  canSpin,
  status,
  activePlayerName,
  onSpin,
}) => {
  const handlePress = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 80, 40]);
      } catch {
        // ignore
      }
    }
    onSpin();
  };

  // 1. Spinning status
  if (status === 'SPINNING') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-pulse">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gold bg-stage-purple shadow-[0_0_40px_rgba(245,176,65,0.7)] mb-4">
          <Loader2 className="h-12 w-12 text-gold animate-spin" />
        </div>
        <h3 className="text-2xl font-black text-gold tracking-wide">กำลังหมุนวงล้อ!</h3>
        <p className="text-xs text-white/70 mt-1">มองจอใหญ่เพื่อลุ้นรางวัลพร้อมกัน...</p>
      </div>
    );
  }

  // 2. Result status (Round completed - waiting for next round)
  if (status === 'RESULT') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-gold/40 bg-stage-card/90 p-6 text-center shadow-xl backdrop-blur-md max-w-sm w-full animate-in zoom-in-95">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold mb-2">
          <Trophy className="h-7 w-7 text-gold animate-bounce" />
        </div>
        <h3 className="text-lg font-black text-white">สิ้นสุดการหมุนรอบนี้แล้ว</h3>
        <p className="text-xs text-white/60 mt-1">
          ระบบบันทึกผลรางวัลเรียบร้อย รอแอดมินเริ่มรอบถัดไป
        </p>
      </div>
    );
  }

  // 3. Not my turn
  if (!isMyTurn) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-stage-card/80 p-8 text-center shadow-xl backdrop-blur-md max-w-sm w-full">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/40 mb-3">
          <Hourglass className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white/90">
          รอตาของคุณ {activePlayerName || 'ผู้เล่นคนอื่น'}
        </h3>
        <p className="text-xs text-white/50 mt-1">
          เมื่อถึงรอบของคุณ ปุ่มหมุนจะเปิดใช้งานอัตโนมัติ
        </p>
      </div>
    );
  }

  // 4. It IS my turn, but status is IDLE (Admin has not started countdown timer yet)
  if (status === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-gold/30 bg-stage-card/90 p-8 text-center shadow-xl backdrop-blur-md max-w-sm w-full animate-in zoom-in-95">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold mb-3">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-white">
          เตรียมตัวให้พร้อม!
        </h3>
        <p className="text-sm text-gold mt-1.5 font-bold">
          คุณคือผู้เล่นในรอบนี้ (รอแอดมินเริ่มนับเวลา)
        </p>
      </div>
    );
  }

  // 5. My turn and COUNTDOWN active (Giant glowing button)
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm">
      <div className="flex items-center gap-1.5 text-gold-light font-bold text-sm uppercase tracking-widest mb-3 animate-pulse">
        <Sparkles className="h-4 w-4 text-gold" />
        <span>ถึงตาคุณแล้ว!</span>
        <Sparkles className="h-4 w-4 text-gold" />
      </div>

      <button
        onClick={handlePress}
        disabled={!canSpin}
        aria-label="กดหมุน / SPIN"
        className="group relative flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center rounded-full border-4 border-gold-bright bg-gradient-to-tr from-gold-deep via-gold to-gold-bright text-stage-dark shadow-[0_0_65px_rgba(245,176,65,0.85)] active:scale-95 transition-all duration-150 hover:scale-105 hover:shadow-[0_0_90px_rgba(255,235,127,1)] animate-bounce"
      >
        {/* Glowing inner ripple */}
        <div className="absolute inset-2 rounded-full border-2 border-white/60 bg-gradient-to-b from-white/30 to-black/20 pointer-events-none" />

        <div className="flex flex-col items-center justify-center text-center z-10 text-stage-dark">
          <Play className="h-14 w-14 sm:h-16 sm:w-16 fill-stage-dark drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)] ml-1" />
          <span className="text-2xl sm:text-3xl font-black uppercase tracking-wider drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]">
            SPIN!
          </span>
          <span className="text-xs font-black tracking-wide uppercase drop-shadow mt-0.5">
            กดหมุนเลย
          </span>
        </div>
      </button>

      <span className="text-xs text-white/60 mt-4 text-center">
        แตะที่ปุ่มเพื่อสั่งหมุนวงล้อบนจอหลักทันที
      </span>
    </div>
  );
};
