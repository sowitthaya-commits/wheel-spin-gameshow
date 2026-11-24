/**
 * Web Audio API Synthesized Sound Engine
 * Zero external MP3 / audio file dependencies.
 */

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private muted: boolean = false;
  private volume: number = 0.8;
  private bgmTimer: NodeJS.Timeout | null = null;
  private currentBgmTrack: string | null = null;
  private bgmStep: number = 0;

  constructor() {
    // AudioContext will be initialized upon user gesture
  }

  public isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  public async unlockAudio(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(1, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  /**
   * Mechanical Peg Tick SFX
   * Modulated slightly by angular velocity factor (0.5 to 2.5)
   */
  public playPegTick(speedFactor: number = 1.0): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High mechanical click chirp
    const baseFreq = 800 + Math.min(1.5, Math.max(0.3, speedFactor)) * 400;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);

    // Sharp attack and quick decay
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Tension Countdown Beep SFX
   */
  public playCountdownBeep(isFinal: boolean = false): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = isFinal ? 1760 : 880;
    const duration = isFinal ? 0.35 : 0.08;

    osc.type = isFinal ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(isFinal ? 0.6 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  /**
   * Celebratory Winner Fanfare SFX
   */
  public playFanfare(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;

    const now = this.ctx.currentTime;
    // Major chord arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [
      { f: 523.25, time: 0.00, dur: 0.15 },
      { f: 659.25, time: 0.12, dur: 0.15 },
      { f: 783.99, time: 0.24, dur: 0.15 },
      { f: 1046.50, time: 0.38, dur: 0.80 },
      // Harmony chord
      { f: 659.25, time: 0.38, dur: 0.80 },
      { f: 783.99, time: 0.38, dur: 0.80 },
    ];

    notes.forEach(note => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.time);

      gain.gain.setValueAtTime(0.35, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur + 0.05);
    });
  }

  /**
   * Synthesized Background Music (BGM)
   */
  public startBGM(trackId: string = 'arcade_gold'): void {
    this.stopBGM();
    this.currentBgmTrack = trackId;
    this.bgmStep = 0;

    const stepIntervalMs = trackId === 'disco_funk' ? 130 : 120;

    this.bgmTimer = setInterval(() => {
      this.playNextBgmStep();
    }, stepIntervalMs);
  }

  public stopBGM(): void {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgmTrack = null;
  }

  public isBGMPlaying(): boolean {
    return this.bgmTimer !== null;
  }

  private playNextBgmStep(): void {
    if (!this.ctx || !this.bgmGain || this.muted) return;

    const now = this.ctx.currentTime;
    const step = this.bgmStep % 16;
    this.bgmStep++;

    // Track 1: arcade_gold
    if (this.currentBgmTrack === 'arcade_gold') {
      const bassPattern = [110, 110, 146.83, 110, 164.81, 110, 130.81, 146.83];
      const bassFreq = bassPattern[step % bassPattern.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + 0.12);

      // Hi-hat noise on even steps
      if (step % 2 === 1) {
        this.playNoisePip(now, 0.04, 0.05);
      }
    }
    // Track 2: disco_funk
    else if (this.currentBgmTrack === 'disco_funk') {
      const funkBass = [98, 196, 98, 196, 116.54, 233.08, 130.81, 261.63];
      const bassFreq = funkBass[step % funkBass.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(bassFreq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + 0.1);

      if (step % 4 === 2) {
        this.playNoisePip(now, 0.06, 0.08);
      }
    }
    // Track 3: dramatic_pulse
    else {
      // Sub-bass pulse every 2 steps
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65.41, now); // C2

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(now);
        osc.stop(now + 0.22);
      }
      this.playNoisePip(now, 0.02, 0.03);
    }
  }

  private playNoisePip(time: number, duration: number, volume: number): void {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      whiteNoise.connect(gain);
      gain.connect(this.bgmGain);

      whiteNoise.start(time);
      whiteNoise.stop(time + duration + 0.01);
    } catch {
      // Fallback if buffer creation unsupported in test
    }
  }
}

// Global Singleton
let soundEngineInstance: SoundEngine | null = null;

export function getSoundEngine(): SoundEngine {
  if (!soundEngineInstance) {
    soundEngineInstance = new SoundEngine();
  }
  return soundEngineInstance;
}
