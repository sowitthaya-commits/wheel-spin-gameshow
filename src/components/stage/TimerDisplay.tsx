'use client';

import React from 'react';
import { GameStatus } from '../../types/game';
import { Timer, Clock, AlertCircle, Pause } from 'lucide-react';

interface TimerDisplayProps {
  remainingSec: number;
  status: GameStatus;
  isHoldManual: boolean;
  isPaused?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingSec,
  status,
  isHoldManual,
  isPaused,
}) => {
  if (status === 'IDLE') {
    if (isPaused && remainingSec > 0) {
      const minutes = Math.floor(remainingSec / 60);
      const seconds = remainingSec % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return (
        <div className="flex items-center gap-3 rounded-full border-2 border-amber-500/60 bg-black/90 px-7 py-2 backdrop-blur-xl shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-pulse">
          <Pause className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">หยุดเวลาชั่วคราว:</span>
          <span className="font-mono text-2xl font-black text-gold" suppressHydrationWarning>
            {minutes > 0 ? `${pad(minutes)}:${pad(seconds)}` : `${pad(seconds)}`}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-black/80 px-6 py-2 backdrop-blur-xl shadow-[0_0_20px_rgba(245,176,65,0.25)]">
        <Clock className="h-5 w-5 text-gold-bright" />
        <span className="text-sm font-bold text-white/90">พร้อมเริ่มรอบใหม่</span>
      </div>
    );
  }

  if (status === 'SPINNING') {
    return (
      <div className="flex items-center gap-2.5 rounded-full border-2 border-gold-bright bg-black/90 px-7 py-2.5 backdrop-blur-xl shadow-[0_0_35px_rgba(245,176,65,0.7)] animate-pulse">
        <div className="h-3.5 w-3.5 rounded-full bg-gold-bright animate-ping" />
        <span className="text-lg font-black tracking-widest text-gold-bright uppercase drop-shadow-[0_0_10px_rgba(245,176,65,0.8)]">
          กำลังหมุนวงล้อ...
        </span>
      </div>
    );
  }

  if (status === 'RESULT') {
    return (
      <div className="flex items-center gap-2 rounded-full border-2 border-gold/60 bg-black/85 px-6 py-2 backdrop-blur-xl text-gold-bright font-black shadow-[0_0_25px_rgba(245,176,65,0.4)]">
        <span>สิ้นสุดการหมุนรอบนี้</span>
      </div>
    );
  }

  // COUNTDOWN status
  const isTimeUp = remainingSec <= 0;
  const isHolding = isHoldManual && isTimeUp;

  // Format time
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (isHolding) {
    return (
      <div className="flex flex-col items-center gap-2 animate-bounce">
        <div className="flex items-center gap-2.5 rounded-2xl border-2 border-gold-bright bg-black/90 px-7 py-3 shadow-[0_0_40px_rgba(245,176,65,0.7)] backdrop-blur-xl">
          <AlertCircle className="h-6 w-6 text-gold-bright animate-pulse" />
          <span className="text-xl font-black tracking-wide text-gold-bright drop-shadow-[0_0_12px_rgba(245,176,65,0.8)]">
            รอผู้เล่นกดหมุน / Ready for Manual Spin
          </span>
        </div>
        <span className="text-xs font-bold text-gold-light/90 uppercase tracking-widest drop-shadow">
          (โหมดรอทำงาน - ไม่หมุนอัตโนมัติ)
        </span>
      </div>
    );
  }

  // Remaining time > 60 seconds
  if (remainingSec > 60) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl border border-gold/50 bg-black/85 px-6 py-2.5 backdrop-blur-xl shadow-[0_0_25px_rgba(245,176,65,0.3)]">
        <Timer className="h-6 w-6 text-gold-bright" />
        <span suppressHydrationWarning className="font-mono text-3xl font-black text-white tracking-widest drop-shadow">
          {pad(minutes)}:{pad(seconds)}
        </span>
        {isHoldManual && (
          <span className="rounded-md bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-light border border-gold/40">
            โหมดรอ
          </span>
        )}
      </div>
    );
  }

  // Final 60 seconds or less: Large dramatic pulsing display
  const isFinal10 = remainingSec <= 10;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center justify-center rounded-3xl border-2 px-9 py-2.5 backdrop-blur-xl transition-all ${
          isFinal10
            ? 'border-red-500 bg-black/95 text-red-400 shadow-[0_0_50px_rgba(239,68,68,0.8)] animate-pulse-fast scale-110'
            : 'border-gold-bright bg-black/90 text-gold-bright shadow-[0_0_40px_rgba(245,176,65,0.6)]'
        }`}
      >
        <span suppressHydrationWarning className="font-mono text-5xl sm:text-6xl font-black tracking-tighter">
          {pad(remainingSec)}
        </span>
      </div>
      {isHoldManual && (
        <span className="mt-1 text-xs font-bold text-amber-400 tracking-wider">
          *ตั้งรอไว้: ถึง 00 จะไม่หมุนอัตโนมัติ
        </span>
      )}
    </div>
  );
};
