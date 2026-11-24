import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundEngine } from '../src/lib/audio/sound-engine';

describe('Web Audio Synthesized Sound Engine', () => {
  let soundEngine: SoundEngine;

  beforeEach(() => {
    // Mock Web Audio API
    const mockAudioContext = {
      state: 'suspended',
      currentTime: 0,
      resume: vi.fn().mockImplementation(function (this: { state: string }) {
        this.state = 'running';
        return Promise.resolve();
      }),
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'bandpass',
        frequency: { setValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      createBuffer: vi.fn(() => ({
        getChannelData: vi.fn(() => new Float32Array(1000)),
      })),
      createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      destination: {},
    };

    // @ts-expect-error Mocking AudioContext
    window.AudioContext = vi.fn(() => mockAudioContext);
    // @ts-expect-error Mocking webkitAudioContext
    window.webkitAudioContext = window.AudioContext;

    soundEngine = new SoundEngine();
  });

  it('initializes in muted or suspended state until user unlock', async () => {
    expect(soundEngine.isReady()).toBe(false);
    await soundEngine.unlockAudio();
    expect(soundEngine.isReady()).toBe(true);
  });

  it('triggers peg tick sound without throwing', async () => {
    await soundEngine.unlockAudio();
    expect(() => soundEngine.playPegTick(1.0)).not.toThrow();
  });

  it('triggers countdown beep and winner fanfare without throwing', async () => {
    await soundEngine.unlockAudio();
    expect(() => soundEngine.playCountdownBeep(false)).not.toThrow();
    expect(() => soundEngine.playCountdownBeep(true)).not.toThrow();
    expect(() => soundEngine.playFanfare()).not.toThrow();
  });

  it('manages mute and volume controls correctly', () => {
    soundEngine.setMuted(true);
    expect(soundEngine.isMuted()).toBe(true);

    soundEngine.setVolume(0.5);
    expect(soundEngine.getVolume()).toBe(0.5);

    soundEngine.setMuted(false);
    expect(soundEngine.isMuted()).toBe(false);
  });

  it('starts and stops synthesized BGM loops', async () => {
    await soundEngine.unlockAudio();
    soundEngine.startBGM('arcade_gold');
    expect(soundEngine.isBGMPlaying()).toBe(true);

    soundEngine.stopBGM();
    expect(soundEngine.isBGMPlaying()).toBe(false);
  });
});
