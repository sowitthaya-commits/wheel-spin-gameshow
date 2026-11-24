'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GameConfig,
  GameState,
  SliceItem,
  PlayerItem,
  SpinHistoryLog,
} from '../types/game';
import {
  DEFAULT_CONFIG,
  DEFAULT_GAME_STATE,
  DEFAULT_SLICES,
  DEFAULT_PLAYERS,
} from '../lib/realtime/adapter';
import { getRealtimeAdapter, isFirebaseConfigured } from '../lib/realtime';

export function useGameSync() {
  const adapter = useMemo(() => getRealtimeAdapter(), []);

  const [config, setConfig] = useState<GameConfig>(() => adapter.getConfig() || DEFAULT_CONFIG);
  const [gameState, setGameState] = useState<GameState>(() => adapter.getGameState() || DEFAULT_GAME_STATE);
  const [slices, setSlices] = useState<SliceItem[]>(() => adapter.getSlices() || DEFAULT_SLICES);
  const [players, setPlayers] = useState<PlayerItem[]>(() => adapter.getPlayers() || DEFAULT_PLAYERS);
  const [history, setHistory] = useState<SpinHistoryLog[]>(() => adapter.getHistory() || []);
  const [isFirebase] = useState<boolean>(() => isFirebaseConfigured());

  useEffect(() => {
    const unsubConfig = adapter.subscribeConfig(setConfig);
    const unsubState = adapter.subscribeGameState(setGameState);
    const unsubSlices = adapter.subscribeSlices(setSlices);
    const unsubPlayers = adapter.subscribePlayers(setPlayers);
    const unsubHistory = adapter.subscribeHistory(setHistory);

    return () => {
      unsubConfig();
      unsubState();
      unsubSlices();
      unsubPlayers();
      unsubHistory();
    };
  }, [adapter]);

  const updateConfig = useCallback(
    (updates: Partial<GameConfig>) => adapter.updateConfig(updates),
    [adapter]
  );

  const updateGameState = useCallback(
    (updates: Partial<GameState>) => adapter.updateGameState(updates),
    [adapter]
  );

  const updateSlices = useCallback(
    (newSlices: SliceItem[]) => adapter.updateSlices(newSlices),
    [adapter]
  );

  const updatePlayers = useCallback(
    (newPlayers: PlayerItem[]) => adapter.updatePlayers(newPlayers),
    [adapter]
  );

  const triggerSpin = useCallback(
    (activePlayerId: string, playerName: string, triggeredBy: 'MANUAL' | 'AUTO') =>
      adapter.triggerSpin(activePlayerId, playerName, triggeredBy),
    [adapter]
  );

  const completeSpin = useCallback(
    (winnerSliceId: string, playerName: string, triggeredBy: 'MANUAL' | 'AUTO') =>
      adapter.completeSpin(winnerSliceId, playerName, triggeredBy),
    [adapter]
  );

  const resetStats = useCallback(() => adapter.resetStats(), [adapter]);

  return {
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
    completeSpin,
    resetStats,
  };
}
