'use client';

import React, { useState } from 'react';
import { PlayerItem } from '../../types/game';
import { Users, UserPlus, Upload, Trash2, Check, CheckCircle2 } from 'lucide-react';

interface PlayerRosterTabProps {
  players: PlayerItem[];
  activePlayerId: string;
  onUpdatePlayers: (players: PlayerItem[]) => void;
  onSelectActivePlayer: (id: string) => void;
}

export const PlayerRosterTab: React.FC<PlayerRosterTabProps> = ({
  players,
  activePlayerId,
  onUpdatePlayers,
  onSelectActivePlayer,
}) => {
  const [singleName, setSingleName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    const newPlayer: PlayerItem = {
      id: `player_${Date.now()}`,
      name: singleName.trim(),
    };

    onUpdatePlayers([...players, newPlayer]);
    setSingleName('');
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const newPlayers: PlayerItem[] = lines.map((name, idx) => ({
      id: `player_${Date.now()}_${idx}`,
      name,
    }));

    onUpdatePlayers([...players, ...newPlayers]);
    setBulkText('');
    setShowBulk(false);
  };

  const handleDeletePlayer = (id: string) => {
    onUpdatePlayers(players.filter(p => p.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างรายชื่อผู้เล่นทั้งหมด?')) {
      onUpdatePlayers([]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Add Player Form */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
            <UserPlus className="h-5 w-5" />
            <span>เพิ่มรายชื่อผู้เล่น (Add Players)</span>
          </div>

          <button
            onClick={() => setShowBulk(!showBulk)}
            className="flex items-center gap-1.5 text-xs text-gold hover:underline"
          >
            <Upload className="h-4 w-4" />
            <span>{showBulk ? 'ซ่อนการนำเข้าแบบชุด' : 'นำเข้ารายชื่อแบบชุด (Bulk Import)'}</span>
          </button>
        </div>

        {/* Single Add Form */}
        <form onSubmit={handleAddSingle} className="flex gap-2">
          <input
            type="text"
            value={singleName}
            onChange={e => setSingleName(e.target.value)}
            placeholder="พิมพ์ชื่อผู้เล่น เช่น คุณสมชาย ใจดี"
            className="flex-1 rounded-2xl border border-white/20 bg-stage-dark p-3.5 text-sm font-semibold text-white focus:border-gold outline-none"
          />
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light px-6 py-3.5 text-sm font-bold text-stage-dark shadow hover:brightness-110 active:scale-95 transition shrink-0"
          >
            เพิ่มผู้เล่น
          </button>
        </form>

        {/* Bulk Import Section */}
        {showBulk && (
          <div className="mt-4 p-4 rounded-2xl bg-stage-dark border border-white/10 flex flex-col gap-2">
            <label className="text-xs text-white/70">
              วางรายชื่อผู้เล่น (1 บรรทัด ต่อ 1 ชื่อ):
            </label>
            <textarea
              rows={5}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="คุณสมชาย&#10;คุณสมหญิง&#10;คุณอนันต์&#10;..."
              className="w-full rounded-xl border border-white/20 bg-stage-card p-3 text-sm text-white focus:border-gold outline-none font-mono"
            />
            <button
              onClick={handleBulkImport}
              className="self-end rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              นำเข้าข้อมูล ({bulkText.split('\n').filter(l => l.trim()).length} รายชื่อ)
            </button>
          </div>
        )}
      </div>

      {/* 2. Player List Table */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
            <Users className="h-5 w-5" />
            <span>รายชื่อผู้เล่นทั้งหมด ({players.length} คน)</span>
          </div>

          {players.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-300 hover:underline"
            >
              ล้างรายชื่อทั้งหมด
            </button>
          )}
        </div>

        {players.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50 border-2 border-dashed border-white/10 rounded-2xl">
            ยังไม่มีรายชื่อผู้เล่น กรุณาเพิ่มผู้เล่นด้านบน
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((player, idx) => {
              const isActive = player.id === activePlayerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                    isActive
                      ? 'border-gold bg-stage-purple shadow-[0_0_15px_rgba(245,176,65,0.3)]'
                      : 'border-white/10 bg-stage-dark hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-xs font-bold text-white/40">#{idx + 1}</span>
                    <span className="text-sm font-bold text-white truncate">
                      {player.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onSelectActivePlayer(player.id)}
                      className={`p-1.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-gold text-stage-dark'
                          : 'bg-white/10 text-white/70 hover:bg-gold/20 hover:text-gold'
                      }`}
                      title={isActive ? 'ผู้เล่นรอบนี้' : 'ตั้งเป็นผู้เล่นรอบนี้'}
                    >
                      {isActive ? <Check className="h-4 w-4" /> : 'เลือก'}
                    </button>

                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 rounded-xl transition"
                      title="ลบ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
