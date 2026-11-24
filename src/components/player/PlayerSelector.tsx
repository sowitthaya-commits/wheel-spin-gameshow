'use client';

import React from 'react';
import { PlayerItem } from '../../types/game';
import { User, CheckCircle2 } from 'lucide-react';

interface PlayerSelectorProps {
  players: PlayerItem[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string) => void;
  onChangePlayer?: () => void;
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  onChangePlayer,
}) => {
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  if (selectedPlayer) {
    return (
      <div className="flex items-center justify-between w-full max-w-sm rounded-2xl border border-white/20 bg-stage-card/90 p-4 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
            <User className="h-6 w-6" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              เข้าเล่นในชื่อ
            </span>
            <span className="text-lg font-black text-white">{selectedPlayer.name}</span>
          </div>
        </div>

        {onChangePlayer && (
          <button
            onClick={onChangePlayer}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            เปลี่ยนผู้เล่น
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm rounded-3xl border border-gold/40 bg-stage-card/95 p-6 backdrop-blur-xl shadow-2xl text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold mb-3">
        <User className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-black text-white">เลือกชื่อของคุณ</h2>
      <p className="text-xs text-white/70 mt-1 mb-4">
        เลือกชื่อจากรายชื่อเพื่อรับสิทธิ์ในการกดหมุนวงล้อ
      </p>

      <div className="relative w-full">
        <select
          value=""
          onChange={e => {
            if (e.target.value) {
              onSelectPlayer(e.target.value);
            }
          }}
          className="w-full rounded-2xl border-2 border-gold/60 bg-stage-dark py-3.5 px-4 text-base font-bold text-white shadow-inner focus:border-gold outline-none cursor-pointer"
        >
          <option value="" disabled>
            -- แตะเพื่อเลือกชื่อของคุณ --
          </option>
          {players.map(p => (
            <option key={p.id} value={p.id} className="bg-stage-dark text-white py-2">
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
