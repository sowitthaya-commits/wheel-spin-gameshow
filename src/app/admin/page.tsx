'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameSync } from '../../hooks/useGameSync';
import { PinGate } from '../../components/admin/PinGate';
import { LiveControlTab } from '../../components/admin/LiveControlTab';
import { PrizeSetupTab } from '../../components/admin/PrizeSetupTab';
import { PlayerRosterTab } from '../../components/admin/PlayerRosterTab';
import { StatsTab } from '../../components/admin/StatsTab';
import { JoinQrModal } from '../../components/admin/JoinQrModal';
import { normalizePercentages } from '../../lib/wheel-math';
import {
  ShieldCheck,
  Gamepad2,
  Sliders,
  Users,
  BarChart3,
  QrCode,
  Tv,
  Smartphone,
  LogOut,
} from 'lucide-react';

type AdminTab = 'live' | 'prizes' | 'players' | 'stats';

export default function AdminPage() {
  const {
    config,
    gameState,
    slices,
    players,
    history,
    isFirebase,
    updateConfig,
    updateGameState,
    updateSlices,
    updatePlayers,
    triggerSpin,
    resetStats,
    isReady = true,
  } = useGameSync();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('live');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

  // Check saved session auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = window.sessionStorage.getItem('wheel_admin_authenticated') === 'true';
      if (isAuth) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('wheel_admin_authenticated');
    }
    setIsAuthenticated(false);
  };

  // Live Game Handlers
  const handleSelectActivePlayer = async (playerId: string) => {
    await updateGameState({ activePlayerId: playerId });
  };

  const handleStartTimer = async (durationSec?: number) => {
    const duration = durationSec || config.timerDurationSec || 60;
    const timerEndTimestamp = Date.now() + duration * 1000;
    await updateGameState({
      status: 'COUNTDOWN',
      isPaused: false,
      timerEndTimestamp,
      remainingSecWhenPaused: duration,
    });
  };

  const handlePauseTimer = async () => {
    if (gameState.status === 'COUNTDOWN') {
      const remaining = Math.max(0, Math.floor((gameState.timerEndTimestamp - Date.now()) / 1000));
      await updateGameState({
        status: 'IDLE',
        isPaused: true,
        remainingSecWhenPaused: remaining,
        timerEndTimestamp: 0,
      });
    }
  };

  const handleResumeTimer = async () => {
    const remaining = gameState.remainingSecWhenPaused > 0
      ? gameState.remainingSecWhenPaused
      : (config.timerDurationSec || 60);
    const timerEndTimestamp = Date.now() + remaining * 1000;
    await updateGameState({
      status: 'COUNTDOWN',
      isPaused: false,
      timerEndTimestamp,
      remainingSecWhenPaused: remaining,
    });
  };

  const handleResetTimer = async () => {
    const duration = config.timerDurationSec || 60;
    await updateGameState({
      status: 'IDLE',
      isPaused: false,
      remainingSecWhenPaused: duration,
      timerEndTimestamp: 0,
    });
  };

  const handleToggleHoldManual = async () => {
    await updateGameState({
      isHoldManual: !gameState.isHoldManual,
    });
  };

  const handleForceSpin = async () => {
    const activePlayer = players.find(p => p.id === gameState.activePlayerId);
    await triggerSpin(
      gameState.activePlayerId,
      activePlayer ? activePlayer.name : 'Admin',
      'MANUAL'
    );
  };

  const handleClearWinner = async () => {
    await updateGameState({
      status: 'IDLE',
      remainingSecWhenPaused: config.timerDurationSec || 60,
    });
  };

  const handleNormalizePercentages = async () => {
    const normalized = normalizePercentages(slices);
    await updateSlices(normalized);
  };

  // If not authenticated, render PinGate
  if (!isAuthenticated) {
    return <PinGate correctPin={adminPin} onUnlock={() => setIsAuthenticated(true)} />;
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-stage-dark text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
          <p className="text-gold font-bold text-sm tracking-wider">กำลังโหลดข้อมูลแอดมิน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stage-bg text-white pb-16 selection:bg-gold selection:text-black">
      {/* Top Admin Navbar */}
      <nav className="border-b border-white/10 bg-stage-dark/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wide text-white">
                แผงควบคุมแอดมิน (Admin Console)
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                <span>{isFirebase ? 'Firebase Realtime Mode' : 'Local Demo Sync Mode'}</span>
              </div>
            </div>
          </div>

          {/* Quick Nav Tools */}
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 font-bold text-gold hover:bg-gold/20 transition"
            >
              <QrCode className="h-4 w-4" />
              <span>QR Code ผู้เล่น</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 font-bold text-white/80 hover:bg-white/15 transition"
            >
              <Tv className="h-4 w-4 text-blue-400" />
              <span>จอหลัก</span>
            </Link>

            <Link
              href="/play"
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 font-bold text-white/80 hover:bg-white/15 transition"
            >
              <Smartphone className="h-4 w-4 text-green-400" />
              <span>จอมือถือ</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-white/50 hover:text-red-400 transition"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/10 scrollbar-none">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-stage-dark shadow-[0_0_20px_rgba(245,176,65,0.4)]'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>1. ควบคุมเกมสด (Live Control)</span>
          </button>

          <button
            onClick={() => setActiveTab('prizes')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'prizes'
                ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-stage-dark shadow-[0_0_20px_rgba(245,176,65,0.4)]'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>2. ตั้งค่าวงล้อ & รางวัล (Prizes)</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'players'
                ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-stage-dark shadow-[0_0_20px_rgba(245,176,65,0.4)]'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>3. รายชื่อผู้เล่น (Roster)</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-gold-dark via-gold to-gold-light text-stage-dark shadow-[0_0_20px_rgba(245,176,65,0.4)]'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>4. สถิติ & ประวัติ (Stats & Logs)</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'live' && (
          <LiveControlTab
            gameState={gameState}
            players={players}
            onSelectActivePlayer={handleSelectActivePlayer}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResumeTimer={handleResumeTimer}
            onResetTimer={handleResetTimer}
            onToggleHoldManual={handleToggleHoldManual}
            onForceSpin={handleForceSpin}
            onClearWinner={handleClearWinner}
          />
        )}

        {activeTab === 'prizes' && (
          <PrizeSetupTab
            config={config}
            slices={slices}
            onUpdateConfig={updateConfig}
            onUpdateSlices={updateSlices}
            onNormalizePercentages={handleNormalizePercentages}
          />
        )}

        {activeTab === 'players' && (
          <PlayerRosterTab
            players={players}
            activePlayerId={gameState.activePlayerId}
            onUpdatePlayers={updatePlayers}
            onSelectActivePlayer={handleSelectActivePlayer}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            slices={slices}
            history={history}
            onResetStats={resetStats}
          />
        )}
      </main>

      {/* QR Code Modal */}
      <JoinQrModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </div>
  );
}
