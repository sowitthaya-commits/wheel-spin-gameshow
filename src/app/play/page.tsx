'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameSync } from '../../hooks/useGameSync';
import { PlayerSelector } from '../../components/player/PlayerSelector';
import { SpinButton } from '../../components/player/SpinButton';
import { Sparkles, Trophy, Tv, Radio } from 'lucide-react';

export default function PlayerPage() {
  const {
    config,
    gameState,
    slices,
    players,
    triggerSpin,
  } = useGameSync();

  const router = useRouter();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Restore player selection from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = window.localStorage.getItem('wheel_selected_player_id');
      if (savedId) {
        setSelectedPlayerId(savedId);
      }
    }
  }, []);

  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wheel_selected_player_id', id);
    }
  };

  const handleChangePlayer = () => {
    setSelectedPlayerId(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('wheel_selected_player_id');
    }
  };

  const myPlayer = players.find(p => p.id === selectedPlayerId);
  const activePlayer = players.find(p => p.id === gameState.activePlayerId);
  const isMyTurn = selectedPlayerId !== null && selectedPlayerId === gameState.activePlayerId;
  const hasActivePrizes = slices.some(
    s => (s.stock === -1 || s.wonCount < s.stock) && s.percentage > 0
  );
  const canSpin =
    isMyTurn &&
    (gameState.status === 'COUNTDOWN' || gameState.status === 'IDLE') &&
    hasActivePrizes;

  const handleSpinClick = async () => {
    if (!canSpin || !myPlayer || isRedirecting) return;
    setIsRedirecting(true);
    try {
      await triggerSpin(myPlayer.id, myPlayer.name, 'MANUAL');
      router.push('/');
    } catch (err) {
      console.error('Failed to trigger spin:', err);
      setIsRedirecting(false);
    }
  };

  // If the wheel is spinning for this player, ensure redirect to stage screen
  useEffect(() => {
    if (isMyTurn && gameState.status === 'SPINNING') {
      router.push('/');
    }
  }, [isMyTurn, gameState.status, router]);

  // Remaining time calculation
  const isPaused = Boolean(gameState.isPaused && (gameState.remainingSecWhenPaused ?? 0) > 0);
  const remainingSec = gameState.status === 'COUNTDOWN' && gameState.timerEndTimestamp
    ? Math.max(0, Math.floor((gameState.timerEndTimestamp - Date.now()) / 1000))
    : (isPaused ? gameState.remainingSecWhenPaused : 0);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between p-4 max-w-md mx-auto text-center select-none">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-radial-at-c from-stage-purple/40 via-stage-bg to-stage-dark pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="w-full pt-4 pb-2 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-gold">
          <Sparkles className="h-5 w-5" />
          <h1 className="text-xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-yellow-500">
            {config.gameTitle || 'LUCKY SPIN SHOW'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Radio className="h-3 w-3 text-green-400 animate-pulse" />
          <span>เชื่อมต่อระบบเกมสด (Live Sync)</span>
        </div>
      </header>

      {/* Main Interaction Area */}
      <section className="flex flex-col items-center justify-center my-auto w-full gap-6 py-4">
        {/* If no player selected yet, show selector */}
        {!selectedPlayerId || !myPlayer ? (
          <PlayerSelector
            players={players}
            selectedPlayerId={null}
            onSelectPlayer={handleSelectPlayer}
          />
        ) : (
          <>
            {/* Player Profile Header */}
            <PlayerSelector
              players={players}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={handleSelectPlayer}
              onChangePlayer={handleChangePlayer}
            />

            {/* Turn & Status Indicator */}
            {(gameState.status === 'COUNTDOWN' || isPaused) && (
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <span className="text-xs font-semibold text-white/80">เวลารอบนี้:</span>
                <span className="font-mono text-base font-extrabold text-gold">
                  {remainingSec}s
                </span>
                {isPaused && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    หยุดเวลาชั่วคราว
                  </span>
                )}
                {gameState.isHoldManual && !isPaused && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    รอผู้เล่น
                  </span>
                )}
              </div>
            )}

            {/* Result Announcement if completed */}
            {gameState.status === 'RESULT' && gameState.spinData && (
              <div className="w-full rounded-2xl border-2 border-gold/70 bg-gradient-to-b from-stage-purple to-stage-card p-5 shadow-[0_0_30px_rgba(245,176,65,0.4)] animate-in zoom-in-95">
                <div className="flex items-center justify-center gap-2 text-gold font-bold text-sm">
                  <Trophy className="h-5 w-5" />
                  <span>ผลการหมุนรอบนี้</span>
                </div>
                <p className="mt-2 text-lg font-bold text-white">
                  {gameState.spinData.playerName}
                </p>
                <p className="mt-1 text-2xl font-black text-gold drop-shadow">
                  {gameState.spinData.winningLabel}
                </p>
              </div>
            )}

            {/* Spin Button or Waiting View */}
            <SpinButton
              isMyTurn={isMyTurn}
              canSpin={canSpin}
              status={gameState.status}
              activePlayerName={activePlayer?.name}
              onSpin={handleSpinClick}
            />
          </>
        )}
      </section>

      {/* Footer link to Stage Display */}
      <footer className="w-full py-3 text-xs text-white/40 flex items-center justify-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-white/60 hover:text-gold transition font-medium"
        >
          <Tv className="h-3.5 w-3.5" />
          <span>ดูจอแสดงผลหลัก (Stage Screen)</span>
        </Link>
      </footer>
    </main>
  );
}
