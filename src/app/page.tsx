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
  const [isDismissedLocally, setIsDismissedLocally] = useState<boolean>(false);
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

  const handleCloseWinnerModal = () => {
    // Approach 2: Dismiss locally on this device only!
    // Does NOT broadcast status: IDLE to Firebase, so the Main Stage display stays open.
    setIsDismissedLocally(true);
    setIsWinnerModalOpen(false);
  };

  // Sync WinnerModal with real-time gameState:
  // When status is NOT 'RESULT' (e.g. IDLE from Admin click, or COUNTDOWN/SPINNING from next round),
  // automatically close the winner modal across ALL screens immediately and reset local dismissal.
  useEffect(() => {
    if (gameState.status !== 'RESULT') {
      setIsWinnerModalOpen(false);
      setIsDismissedLocally(false);
    } else {
      setIsWinnerModalOpen(true);
    }
  }, [gameState.status]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between p-4 overflow-hidden bg-stage-bg">
      {/* Background Cinematic Golden Lights & Flares (Reference Image Style) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[680px] w-[680px] rounded-full bg-gradient-radial from-amber-500/20 via-gold/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 right-0 h-44 -translate-y-1/2 bg-gradient-to-r from-transparent via-amber-500/15 to-transparent blur-2xl pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-[900px] rounded-full bg-gold/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-600/10 blur-[80px] pointer-events-none" />

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
          isPaused={Boolean(gameState.isPaused)}
        />
      </div>

      {/* Wheel Canvas Section */}
      <div className="my-auto flex items-center justify-center z-10 py-2">
        <WheelCanvas
          slices={slices}
          spinData={gameState.spinData}
          status={gameState.status}
          logoUrl={config.logoUrl}
          gameTitle={config.gameTitle}
          onPegTick={playPegTick}
          onSpinComplete={handleSpinComplete}
          size={560}
        />
      </div>

      {/* Winner Celebration Modal */}
      <WinnerModal
        isOpen={isWinnerModalOpen && !isDismissedLocally && gameState.status === 'RESULT'}
        playerName={gameState.spinData?.playerName || activePlayerName}
        prizeLabel={gameState.spinData?.winningLabel || 'รางวัล'}
        onClose={handleCloseWinnerModal}
      />

      {/* Floating Audio Controls */}
      <AudioControls />

      {/* Footer Navigation Links */}
      <footer className="w-full flex flex-col sm:flex-row items-center justify-between py-3 px-6 text-xs text-white/50 border-t border-white/10 max-w-7xl mx-auto z-10 gap-3">
        {/* Left Side: Real-time Sync & Quick Nav Links (Safe from AudioControls) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-medium text-white/70">Real-time Sync Active</span>
          </div>

          <Link
            href="/play"
            target="_blank"
            className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-gold-light hover:bg-gold/20 hover:border-gold transition font-bold shadow-sm"
          >
            <Smartphone className="h-3.5 w-3.5 text-green-400" />
            <span>จอมือถือผู้เล่น (/play)</span>
          </Link>

          <Link
            href="/admin"
            target="_blank"
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-white/85 hover:text-white hover:border-white/40 transition font-bold shadow-sm"
          >
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span>แผงควบคุมแอดมิน (/admin)</span>
          </Link>
        </div>

        {/* Right Side Spacer: Ensures floating AudioControls at bottom-right never covers any link */}
        <div className="hidden sm:block w-36 h-6" />
      </footer>
    </main>
  );
}
