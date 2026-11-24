'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useGameSync } from '../hooks/useGameSync';
import { useSoundEngine } from '../hooks/useSoundEngine';
import { StageHeader } from '../components/stage/StageHeader';
import { TimerDisplay } from '../components/stage/TimerDisplay';
import { AudioControls } from '../components/stage/AudioControls';
import { WheelCanvas } from '../components/wheel/WheelCanvas';
import { WinnerModal } from '../components/wheel/WinnerModal';
import { Smartphone, Shield } from 'lucide-react';

export default function StagePage() {
  const {
    config,
    gameState,
    slices,
    players,
    triggerSpin,
    completeSpin,
    updateGameState,
  } = useGameSync();

  const { playPegTick, playCountdownBeep, playFanfare } = useSoundEngine();

  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (gameState.status === 'COUNTDOWN' && gameState.timerEndTimestamp) {
      return Math.max(0, Math.floor((gameState.timerEndTimestamp - Date.now()) / 1000));
    }
    return gameState.remainingSecWhenPaused || config.timerDurationSec || 60;
  });

  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState<boolean>(false);
  const lastBeepSecondRef = useRef<number>(-1);
  const hasTriggeredAutoSpinRef = useRef<boolean>(false);

  // Active player info
  const activePlayer = players.find(p => p.id === gameState.activePlayerId);
  const activePlayerName = activePlayer ? activePlayer.name : 'ยังไม่ได้เลือก';

  // Timer calculation loop
  useEffect(() => {
    if (gameState.status !== 'COUNTDOWN') {
      hasTriggeredAutoSpinRef.current = false;
      if (gameState.status === 'IDLE') {
        setRemainingSec(gameState.remainingSecWhenPaused || config.timerDurationSec || 60);
      }
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((gameState.timerEndTimestamp - now) / 1000));
      setRemainingSec(left);

      // Countdown audio ticks for final 10 seconds
      if (left <= 10 && left > 0 && left !== lastBeepSecondRef.current) {
        lastBeepSecondRef.current = left;
        playCountdownBeep(false);
      }

      // Check timer expiration at 00:00
      if (left === 0 && !hasTriggeredAutoSpinRef.current) {
        if (lastBeepSecondRef.current !== 0) {
          lastBeepSecondRef.current = 0;
          playCountdownBeep(true);
        }

        // Auto-Spin Trigger Rules:
        // If isHoldManual === false: Automatically trigger spin
        if (!gameState.isHoldManual) {
          hasTriggeredAutoSpinRef.current = true;
          triggerSpin(gameState.activePlayerId, activePlayerName, 'AUTO');
        }
        // If isHoldManual === true: System holds indefinitely at 00:00 without spinning
      }
    }, 200);

    return () => clearInterval(interval);
  }, [
    gameState.status,
    gameState.timerEndTimestamp,
    gameState.isHoldManual,
    gameState.activePlayerId,
    activePlayerName,
    config.timerDurationSec,
    triggerSpin,
    playCountdownBeep,
  ]);

  // Handle spin completion callback from WheelCanvas
  const handleSpinComplete = async (winningSliceId: string) => {
    playFanfare();
    setIsWinnerModalOpen(true);
    await completeSpin(
      winningSliceId,
      gameState.spinData?.playerName || activePlayerName,
      gameState.spinData?.triggeredBy || 'MANUAL'
    );
  };

  const handleCloseWinnerModal = async () => {
    setIsWinnerModalOpen(false);
    await updateGameState({
      status: 'IDLE',
      remainingSecWhenPaused: config.timerDurationSec || 60,
    });
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between p-4 overflow-hidden">
      {/* Background radial spotlights */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-stage-purple/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <StageHeader
        gameTitle={config.gameTitle}
        logoUrl={config.logoUrl}
        activePlayerName={activePlayerName}
      />

      {/* Timer & Status Bar */}
      <div className="my-2 flex flex-col items-center z-10">
        <TimerDisplay
          remainingSec={remainingSec}
          status={gameState.status}
          isHoldManual={gameState.isHoldManual}
        />
      </div>

      {/* Wheel Canvas Section */}
      <div className="my-auto flex items-center justify-center z-10 py-2">
        <WheelCanvas
          slices={slices}
          spinData={gameState.spinData}
          logoUrl={config.logoUrl}
          gameTitle={config.gameTitle}
          onPegTick={playPegTick}
          onSpinComplete={handleSpinComplete}
          size={560}
        />
      </div>

      {/* Winner Celebration Modal */}
      <WinnerModal
        isOpen={isWinnerModalOpen || gameState.status === 'RESULT'}
        playerName={gameState.spinData?.playerName || activePlayerName}
        prizeLabel={gameState.spinData?.winningLabel || 'รางวัล'}
        onClose={handleCloseWinnerModal}
      />

      {/* Floating Audio Controls */}
      <AudioControls />

      {/* Footer Navigation Links */}
      <footer className="w-full flex items-center justify-between py-3 px-6 text-xs text-white/50 border-t border-white/10 max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/play"
            target="_blank"
            className="flex items-center gap-1.5 text-white/70 hover:text-gold transition font-medium"
          >
            <Smartphone className="h-4 w-4" />
            <span>จอมือถือผู้เล่น (/play)</span>
          </Link>
          <Link
            href="/admin"
            target="_blank"
            className="flex items-center gap-1.5 text-white/70 hover:text-gold transition font-medium"
          >
            <Shield className="h-4 w-4" />
            <span>แผงควบคุมแอดมิน (/admin)</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}
