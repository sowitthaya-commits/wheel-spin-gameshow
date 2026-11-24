'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSoundEngine, SoundEngine } from '../lib/audio/sound-engine';

export function useSoundEngine() {
  const engine: SoundEngine = useMemo(() => getSoundEngine(), []);

  const [isReady, setIsReady] = useState<boolean>(() => engine.isReady());
  const [isMuted, setIsMutedState] = useState<boolean>(() => engine.isMuted());
  const [volume, setVolumeState] = useState<number>(() => engine.getVolume());
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(() => engine.isBGMPlaying());

  useEffect(() => {
    // Check initial state
    setIsReady(engine.isReady());
    setIsMutedState(engine.isMuted());
    setVolumeState(engine.getVolume());
    setIsBgmPlaying(engine.isBGMPlaying());
  }, [engine]);

  const unlockAudio = useCallback(async () => {
    await engine.unlockAudio();
    setIsReady(engine.isReady());
  }, [engine]);

  const setMuted = useCallback((muted: boolean) => {
    engine.setMuted(muted);
    setIsMutedState(muted);
  }, [engine]);

  const setVolume = useCallback((vol: number) => {
    engine.setVolume(vol);
    setVolumeState(vol);
  }, [engine]);

  const startBGM = useCallback((trackId: string = 'arcade_gold') => {
    engine.startBGM(trackId);
    setIsBgmPlaying(true);
  }, [engine]);

  const stopBGM = useCallback(() => {
    engine.stopBGM();
    setIsBgmPlaying(false);
  }, [engine]);

  const playPegTick = useCallback((speedFactor?: number) => {
    engine.playPegTick(speedFactor);
  }, [engine]);

  const playCountdownBeep = useCallback((isFinal?: boolean) => {
    engine.playCountdownBeep(isFinal);
  }, [engine]);

  const playFanfare = useCallback(() => {
    engine.playFanfare();
  }, [engine]);

  return {
    isReady,
    isMuted,
    volume,
    isBgmPlaying,
    unlockAudio,
    setMuted,
    setVolume,
    startBGM,
    stopBGM,
    playPegTick,
    playCountdownBeep,
    playFanfare,
  };
}
