'use client';

import React, { useState } from 'react';
import { GameState, PlayerItem } from '../../types/game';
import {
  Play,
  Pause,
  RotateCcw,
  Hand,
  FastForward,
  User,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface LiveControlTabProps {
  gameState: GameState;
  players: PlayerItem[];
  onSelectActivePlayer: (playerId: string) => void;
  onStartTimer: (durationSec?: number) => void;
  onPauseTimer: () => void;
  onResumeTimer?: () => void;
  onResetTimer: () => void;
  onToggleHoldManual: () => void;
  onForceSpin: () => void;
  onClearWinner: () => void;
}

export const LiveControlTab: React.FC<LiveControlTabProps> = ({
  gameState,
  players,
  onSelectActivePlayer,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onToggleHoldManual,
  onForceSpin,
  onClearWinner,
}) => {
  const [customMin, setCustomMin] = useState(1);
  const [customSec, setCustomSec] = useState(0);

  const activePlayer = players.find(p => p.id === gameState.activePlayerId);
  const isPaused = Boolean(gameState.isPaused && (gameState.remainingSecWhenPaused ?? 0) > 0);

  const handleStartWithCustom = () => {
    const totalSec = customMin * 60 + customSec;
    onStartTimer(totalSec > 0 ? totalSec : 60);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Active Player Selection */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider mb-3">
          <User className="h-5 w-5" />
          <span>กำหนดผู้เล่นรอบปัจจุบัน (Active Turn)</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select
            value={gameState.activePlayerId}
            onChange={e => onSelectActivePlayer(e.target.value)}
            className="w-full sm:w-80 rounded-2xl border-2 border-gold/50 bg-stage-dark p-3.5 text-base font-bold text-white focus:border-gold outline-none"
          >
            {players.length === 0 && <option value="">(ไม่มีรายชื่อผู้เล่น)</option>}
            {players.map(p => (
              <option key={p.id} value={p.id} className="bg-stage-dark text-white">
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>ผู้เล่นที่ได้รับสิทธิ์หมุน:</span>
            <span className="font-extrabold text-gold text-base">
              {activePlayer ? activePlayer.name : 'ยังไม่ได้เลือก'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Timer Setup & Hold Mode Controls */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider mb-4">
          <Clock className="h-5 w-5" />
          <span>ระบบนับเวลา & โหมดรอ (Hold for Manual)</span>
        </div>

        {/* Status Badge */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs text-white/60">สถานะเกมปัจจุบัน:</span>
          {isPaused ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              <Pause className="h-3.5 w-3.5" />
              <span>หยุดเวลาชั่วคราว (เหลือ {gameState.remainingSecWhenPaused} วินาที)</span>
            </span>
          ) : (
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              gameState.status === 'SPINNING'
                ? 'bg-gold/20 text-gold border border-gold animate-pulse'
                : gameState.status === 'COUNTDOWN'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : gameState.status === 'RESULT'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/10 text-white/70 border border-white/20'
            }`}>
              {gameState.status}
            </span>
          )}

          {gameState.isHoldManual && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Hand className="h-3.5 w-3.5" />
              <span>เปิดโหมดรอ (Manual Hold Active)</span>
            </span>
          )}
        </div>

        {/* Custom Timer Input */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/70">นาที:</label>
            <input
              type="number"
              min="0"
              max="59"
              value={customMin}
              onChange={e => setCustomMin(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 rounded-xl border border-white/20 bg-stage-dark p-2 text-center text-sm font-bold text-white outline-none focus:border-gold"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/70">วินาที:</label>
            <input
              type="number"
              min="0"
              max="59"
              value={customSec}
              onChange={e => setCustomSec(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 rounded-xl border border-white/20 bg-stage-dark p-2 text-center text-sm font-bold text-white outline-none focus:border-gold"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => { setCustomMin(0); setCustomSec(30); }}
              className="rounded-lg bg-white/10 px-2.5 py-1.5 hover:bg-white/20 text-white/80"
            >
              30 วิ
            </button>
            <button
              onClick={() => { setCustomMin(1); setCustomSec(0); }}
              className="rounded-lg bg-white/10 px-2.5 py-1.5 hover:bg-white/20 text-white/80"
            >
              1 นาที
            </button>
            <button
              onClick={() => { setCustomMin(2); setCustomSec(0); }}
              className="rounded-lg bg-white/10 px-2.5 py-1.5 hover:bg-white/20 text-white/80"
            >
              2 นาที
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Start / Resume */}
          <button
            onClick={() => {
              if (isPaused) {
                if (onResumeTimer) {
                  onResumeTimer();
                } else {
                  onStartTimer(gameState.remainingSecWhenPaused);
                }
              } else {
                handleStartWithCustom();
              }
            }}
            disabled={gameState.status === 'SPINNING'}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 px-4 font-bold text-white shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition"
          >
            <Play className="h-5 w-5 fill-white" />
            <span>
              {isPaused
                ? `นับเวลาต่อ (Resume: ${gameState.remainingSecWhenPaused}s)`
                : 'เริ่มนับเวลา (Start)'}
            </span>
          </button>

          {/* Pause */}
          <button
            onClick={onPauseTimer}
            disabled={gameState.status !== 'COUNTDOWN'}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 py-3.5 px-4 font-bold text-white hover:bg-white/20 active:scale-95 disabled:opacity-50 transition"
          >
            <Pause className="h-5 w-5" />
            <span>หยุดชั่วคราว (Pause)</span>
          </button>

          {/* Reset Timer */}
          <button
            onClick={onResetTimer}
            disabled={gameState.status === 'SPINNING'}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 py-3.5 px-4 font-bold text-white hover:bg-white/20 active:scale-95 disabled:opacity-50 transition"
          >
            <RotateCcw className="h-5 w-5" />
            <span>รีเซ็ตเวลา (Reset)</span>
          </button>

          {/* Hold Mode Button (ปุ่มรอ) */}
          <button
            onClick={onToggleHoldManual}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 font-bold transition shadow-lg active:scale-95 border ${
              gameState.isHoldManual
                ? 'bg-amber-500 text-stage-dark border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                : 'bg-stage-dark text-amber-300 border-amber-500/50 hover:bg-amber-500/20'
            }`}
          >
            <Hand className="h-5 w-5" />
            <span>
              {gameState.isHoldManual ? 'โหมดรอ: เปิดอยู่ (คลิกเพื่อปิด)' : 'ตั้งโหมด "รอ" (Hold)'}
            </span>
          </button>
        </div>

        {/* Explanation Note for Hold Mode */}
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-200/90">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong>ตรรกะปุ่มรอ (Hold Mode):</strong> หากเปิดไว้ เวลาจะนับถอยหลังตามปกติจนถึง <strong>00:00</strong> แล้วจะ <strong>หยุดค้างรอผู้เล่นกด</strong> โดยระบบจะไม่หมุนอัตโนมัติ จนกว่าผู้เล่นหรือแอดมินจะกด SPIN ด้วยตนเอง
          </span>
        </div>
      </div>

      {/* 3. Force Actions (Emergency / Host Override) */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider mb-4">
          <Sparkles className="h-5 w-5" />
          <span>คำสั่งควบคุมพิเศษ (Admin Force Actions)</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Force Spin */}
          <button
            onClick={onForceSpin}
            disabled={gameState.status === 'SPINNING'}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 py-3.5 px-6 font-black text-white shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition"
          >
            <FastForward className="h-5 w-5 fill-white" />
            <span>สั่งหมุนวงล้อทันที (Force Spin)</span>
          </button>

          {/* Clear Winner Modal */}
          <button
            onClick={onClearWinner}
            className="flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 py-3.5 px-5 font-bold text-white hover:bg-white/20 active:scale-95 transition"
          >
            <span>ปิดหน้าจอผู้ชนะ / พร้อมรอบใหม่</span>
          </button>
        </div>
      </div>
    </div>
  );
};
