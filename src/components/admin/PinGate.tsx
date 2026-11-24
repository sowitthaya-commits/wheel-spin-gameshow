'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';

interface PinGateProps {
  correctPin: string;
  onUnlock: () => void;
}

export const PinGate: React.FC<PinGateProps> = ({ correctPin, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('wheel_admin_authenticated', 'true');
      }
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl border border-gold/40 bg-stage-card/95 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold">
          <Lock className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-black text-white">แผงควบคุมแอดมิน</h2>
        <p className="mt-1 text-xs text-white/60">
          กรุณาใส่รหัสผ่าน PIN เพื่อเข้าสู่ระบบจัดการเกม
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={e => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="ใส่รหัส PIN"
              className="w-full rounded-2xl border-2 border-white/20 bg-stage-dark py-3 px-4 text-center text-xl font-bold tracking-widest text-white placeholder:text-white/30 focus:border-gold outline-none"
              autoFocus
            />
            <KeyRound className="absolute right-4 top-3.5 h-5 w-5 text-white/30 pointer-events-none" />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>รหัส PIN ไม่ถูกต้อง</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light py-3.5 text-base font-bold text-stage-dark shadow-[0_0_20px_rgba(245,176,65,0.5)] hover:brightness-110 active:scale-95 transition"
          >
            เข้าสู่ระบบ (Unlock)
          </button>
        </form>

        <p className="mt-4 text-[11px] text-white/40">
          รหัสเริ่มต้นคือ <span className="font-mono text-gold">1234</span> (หรือตามที่ตั้งใน ENV)
        </p>
      </div>
    </div>
  );
};
