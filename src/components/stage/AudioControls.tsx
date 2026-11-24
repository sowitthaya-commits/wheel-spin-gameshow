'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Settings2, Sparkles } from 'lucide-react';
import { useSoundEngine } from '../../hooks/useSoundEngine';

export const AudioControls: React.FC = () => {
  const {
    isReady,
    isMuted,
    volume,
    isBgmPlaying,
    unlockAudio,
    setMuted,
    setVolume,
    startBGM,
    stopBGM,
  } = useSoundEngine();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('arcade_gold');

  const handleTrackChange = (track: string) => {
    setSelectedTrack(track);
    if (track === 'off') {
      stopBGM();
    } else {
      startBGM(track);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* Audio Unlock Notification if suspended */}
      {!isReady && (
        <button
          onClick={unlockAudio}
          className="flex items-center gap-2 rounded-full border-2 border-gold bg-stage-purple px-4 py-2 text-sm font-bold text-gold shadow-[0_0_20px_rgba(245,176,65,0.8)] animate-bounce hover:scale-105 transition"
        >
          <Sparkles className="h-4 w-4" />
          <span>คลิกเพื่อเปิดระบบเสียง (Audio)</span>
        </button>
      )}

      {/* Expanded Audio Settings Modal */}
      {isOpen && (
        <div className="w-64 rounded-2xl border border-white/20 bg-stage-card/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold">ตั้งค่าเสียง Web Audio</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-white/50 hover:text-white"
            >
              ปิด
            </button>
          </div>

          {/* Mute Toggle */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-white">เสียงทั้งหมด</span>
            <button
              onClick={() => {
                unlockAudio();
                setMuted(!isMuted);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}
            >
              {isMuted ? 'ปิดเสียง (Muted)' : 'เปิดเสียง (On)'}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/70">
              <span>ระดับเสียง</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="mt-1 w-full accent-gold cursor-pointer"
            />
          </div>

          {/* BGM Loop Selection */}
          <div className="mt-3">
            <span className="text-xs text-white/70 block mb-1">เพลงประกอบ (BGM Synth)</span>
            <select
              value={isBgmPlaying ? selectedTrack : 'off'}
              onChange={e => {
                unlockAudio();
                handleTrackChange(e.target.value);
              }}
              className="w-full rounded-lg border border-white/20 bg-stage-dark px-2.5 py-1.5 text-xs text-white focus:border-gold outline-none"
            >
              <option value="arcade_gold">Arcade Gold (125 BPM)</option>
              <option value="disco_funk">Disco Funk (116 BPM)</option>
              <option value="dramatic_pulse">Dramatic Pulse (130 BPM)</option>
              <option value="off">ปิดเพลงประกอบ (Off)</option>
            </select>
          </div>
        </div>
      )}

      {/* Floating Toggle Pill */}
      <button
        onClick={() => {
          unlockAudio();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 rounded-full border border-gold/40 bg-stage-card/90 px-3.5 py-2 text-gold shadow-lg backdrop-blur-md hover:border-gold hover:scale-105 transition"
        title="Audio Settings"
      >
        {isMuted ? <VolumeX className="h-5 w-5 text-red-400" /> : <Volume2 className="h-5 w-5 text-gold" />}
        <Music className={`h-4 w-4 ${isBgmPlaying ? 'text-green-400 animate-spin' : 'text-white/40'}`} />
        <Settings2 className="h-4 w-4 text-white/60" />
      </button>
    </div>
  );
};
