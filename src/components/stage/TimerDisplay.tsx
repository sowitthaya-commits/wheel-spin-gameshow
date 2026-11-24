'use client';

import React from 'react';
import { GameStatus } from '../../types/game';
import { Timer, Clock, AlertCircle } from 'lucide-react';

interface TimerDisplayProps {
  remainingSec: number;
  status: GameStatus;
  isHoldManual: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingSec,
  status,
  isHoldManual,
}) => {
  if (status === 'IDLE') {
    return (
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-md shadow-lg">
        <Clock className="h-5 w-5 text-gold-light" />
        <span className="text-sm font-semibold text-white/80">พร้อมเริ่มรอบใหม่</span>
      </div>
    );
  }

  if (status === 'SPINNING') {
    return (
      <div className="flex items-center gap-2 rounded-full border border-gold bg-stage-purple/80 px-6 py-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(245,176,65,0.6)] animate-pulse">
        <div className="h-3 w-3 rounded-full bg-gold animate-ping" />
        <span className="text-lg font-black tracking-wider text-gold">กำลังหมุนวงล้อ...</span>
      </div>
    );
  }

  if (status === 'RESULT') {
    return (
      <div className="flex items-center gap-2 rounded-full border border-green-500/50 bg-green-950/60 px-6 py-2 backdrop-blur-md text-green-400 font-bold">
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
        <div className="flex items-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-950/80 px-6 py-3 shadow-[0_0_30px_rgba(251,191,36,0.6)] backdrop-blur-md">
          <AlertCircle className="h-6 w-6 text-amber-400 animate-pulse" />
          <span className="text-xl font-extrabold tracking-wide text-amber-300">
            รอผู้เล่นกดหมุน / Ready for Manual Spin
          </span>
        </div>
        <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-widest">
          (โหมดรอทำงาน - ไม่หมุนอัตโนมัติ)
        </span>
      </div>
    );
  }

  // Remaining time > 60 seconds
  if (remainingSec > 60) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-stage-card/80 px-6 py-2.5 backdrop-blur-md shadow-xl">
        <Timer className="h-6 w-6 text-gold" />
        <span className="font-mono text-3xl font-black text-white tracking-widest">
          {pad(minutes)}:{pad(seconds)}
        </span>
        {isHoldManual && (
          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
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
        className={`flex items-center justify-center rounded-3xl border-2 px-8 py-2 backdrop-blur-md transition-all ${
          isFinal10
            ? 'border-red-500 bg-red-950/70 text-red-400 shadow-[0_0_40px_rgba(239,68,68,0.7)] animate-pulse-fast scale-110'
            : 'border-gold bg-stage-purple/80 text-gold shadow-[0_0_25px_rgba(245,176,65,0.4)]'
        }`}
      >
        <span className="font-mono text-5xl sm:text-6xl font-black tracking-tighter">
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
