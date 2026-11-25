import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  runTransaction,
  Database,
  Unsubscribe,
} from 'firebase/database';
import {
  RealtimeAdapter,
  DEFAULT_CONFIG,
  DEFAULT_GAME_STATE,
  DEFAULT_SLICES,
  DEFAULT_PLAYERS,
} from './adapter';
import {
  GameConfig,
  GameState,
  SliceItem,
  PlayerItem,
  SpinHistoryLog,
} from '../../types/game';
import { selectWinningSlice, calculateTargetAngle } from '../wheel-math';

export class FirebaseRealtimeAdapter implements RealtimeAdapter {
  private db: Database;
  private config: GameConfig;
  private gameState: GameState;
  private slices: SliceItem[];
  private players: PlayerItem[];
  private history: SpinHistoryLog[] = [];

  constructor(firebaseConfig: Record<string, string | undefined>) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    this.db = getDatabase(app);
    this.config = this.loadFromStorage('config', DEFAULT_CONFIG);
    this.gameState = this.loadFromStorage('gameState', DEFAULT_GAME_STATE);
    this.slices = this.loadFromStorage('slices', DEFAULT_SLICES);
    this.players = this.loadFromStorage('players', DEFAULT_PLAYERS);
    this.history = this.loadFromStorage('history', []);
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const data = window.localStorage.getItem(`wheel_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveToStorage(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`wheel_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  getConfig(): GameConfig {
    return this.config;
  }
  getGameState(): GameState {
    return this.gameState;
  }
  getSlices(): SliceItem[] {
    return this.slices;
  }
  getPlayers(): PlayerItem[] {
    return this.players;
  }
  getHistory(): SpinHistoryLog[] {
    return this.history;
  }

  subscribeConfig(callback: (config: GameConfig) => void): () => void {
    const configRef = ref(this.db, 'config');
    const unsub: Unsubscribe = onValue(configRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        this.config = { ...DEFAULT_CONFIG, ...val };
        this.saveToStorage('config', this.config);
        callback(this.config);
      } else {
        set(configRef, DEFAULT_CONFIG);
        this.saveToStorage('config', DEFAULT_CONFIG);
        callback(DEFAULT_CONFIG);
      }
    });
    return () => unsub();
  }

  subscribeGameState(callback: (state: GameState) => void): () => void {
    const stateRef = ref(this.db, 'gameState');
    const unsub: Unsubscribe = onValue(stateRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        this.gameState = { ...DEFAULT_GAME_STATE, ...val };
        this.saveToStorage('gameState', this.gameState);
        callback(this.gameState);
      } else {
        set(stateRef, DEFAULT_GAME_STATE);
        this.saveToStorage('gameState', DEFAULT_GAME_STATE);
        callback(DEFAULT_GAME_STATE);
      }
    });
    return () => unsub();
  }

  subscribeSlices(callback: (slices: SliceItem[]) => void): () => void {
    const slicesRef = ref(this.db, 'slices');
    const unsub: Unsubscribe = onValue(slicesRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const sliceArray: SliceItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.values(val);
        this.slices = sliceArray;
        this.saveToStorage('slices', this.slices);
        callback(this.slices);
      } else {
        set(slicesRef, DEFAULT_SLICES);
        this.saveToStorage('slices', DEFAULT_SLICES);
        callback(DEFAULT_SLICES);
      }
    });
    return () => unsub();
  }

  subscribePlayers(callback: (players: PlayerItem[]) => void): () => void {
    const playersRef = ref(this.db, 'players');
    const unsub: Unsubscribe = onValue(playersRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const playerArray: PlayerItem[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.values(val);
        this.players = playerArray;
        this.saveToStorage('players', this.players);
        callback(this.players);
      } else {
        set(playersRef, DEFAULT_PLAYERS);
        this.saveToStorage('players', DEFAULT_PLAYERS);
        callback(DEFAULT_PLAYERS);
      }
    });
    return () => unsub();
  }

  subscribeHistory(callback: (history: SpinHistoryLog[]) => void): () => void {
    const historyRef = ref(this.db, 'history');
    const unsub: Unsubscribe = onValue(historyRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const historyArray: SpinHistoryLog[] = Array.isArray(val)
          ? val.filter(Boolean)
          : Object.values(val);
        // Sort newest first
        this.history = historyArray.sort((a, b) => b.timestamp - a.timestamp);
        this.saveToStorage('history', this.history);
        callback(this.history);
      } else {
        this.history = [];
        this.saveToStorage('history', []);
        callback([]);
      }
    });
    return () => unsub();
  }

  async updateConfig(updates: Partial<GameConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    this.saveToStorage('config', this.config);
    await update(ref(this.db, 'config'), updates);
  }

  async updateGameState(updates: Partial<GameState>): Promise<void> {
    this.gameState = { ...this.gameState, ...updates };
    this.saveToStorage('gameState', this.gameState);
    await update(ref(this.db, 'gameState'), updates);
  }

  async updateSlices(slices: SliceItem[]): Promise<void> {
    this.slices = [...slices];
    this.saveToStorage('slices', this.slices);
    await set(ref(this.db, 'slices'), slices);
  }

  async updatePlayers(players: PlayerItem[]): Promise<void> {
    this.players = [...players];
    this.saveToStorage('players', this.players);
    await set(ref(this.db, 'players'), players);
  }

  async triggerSpin(
    activePlayerId: string,
    playerName: string,
    triggeredBy: 'MANUAL' | 'AUTO'
  ): Promise<boolean> {
    const activeSlices = this.slices.filter(
      s => (s.stock === -1 || s.wonCount < s.stock) && s.percentage > 0
    );
    if (activeSlices.length === 0) {
      return false;
    }

    const winningSlice = selectWinningSlice(this.slices);
    const startAngle = this.gameState.spinData?.targetAngle || 0;
    const targetAngle = calculateTargetAngle(startAngle, winningSlice.id, this.slices, 8);

    const spinData = {
      spinId: `spin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      targetAngle,
      durationMs: 6000,
      startAngle,
      startTimestamp: Date.now(),
      winningSliceId: winningSlice.id,
      winningLabel: winningSlice.label,
      playerName: playerName || 'Player',
      triggeredBy,
    };

    let didSucceed = false;
    const stateRef = ref(this.db, 'gameState');

    await runTransaction(stateRef, (currentState: GameState | null) => {
      if (
        !currentState ||
        (currentState.status !== 'COUNTDOWN' && currentState.status !== 'IDLE')
      ) {
        // Abort transaction if not in ready state
        return;
      }
      didSucceed = true;
      return {
        ...currentState,
        status: 'SPINNING',
        activePlayerId,
        spinData,
      };
    });

    return didSucceed;
  }

  async completeSpin(
    winnerSliceId: string,
    playerName: string,
    triggeredBy: 'MANUAL' | 'AUTO'
  ): Promise<void> {
    if (this.gameState.status !== 'SPINNING') {
      return;
    }

    const slice = this.slices.find(s => s.id === winnerSliceId);
    const prizeLabel = slice ? slice.label : 'Prize';

    // 1. Update wonCount
    const updatedSlices = this.slices.map(s => {
      if (s.id === winnerSliceId) {
        const newWonCount = s.wonCount + 1;
        const isDepleted = s.stock !== -1 && newWonCount >= s.stock;
        return {
          ...s,
          wonCount: newWonCount,
          percentage: isDepleted ? 0 : s.percentage,
        };
      }
      return s;
    });

    await this.updateSlices(updatedSlices);

    // 2. Add history log
    const newLog: SpinHistoryLog = {
      id: `log_${Date.now()}`,
      round: this.history.length + 1,
      timestamp: Date.now(),
      playerName: playerName || 'Player',
      prizeLabel,
      triggerType: triggeredBy,
    };

    await set(ref(this.db, `history/${newLog.id}`), newLog);

    // 3. Set status to RESULT
    await this.updateGameState({
      status: 'RESULT',
    });
  }

  async resetStats(): Promise<void> {
    this.history = [];
    this.saveToStorage('history', []);
    await set(ref(this.db, 'history'), null);
    const resetSlices = this.slices.map(s => ({
      ...s,
      wonCount: 0,
    }));
    await this.updateSlices(resetSlices);
  }
}
