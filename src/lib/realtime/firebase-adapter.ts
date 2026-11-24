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
  private config: GameConfig = DEFAULT_CONFIG;
  private gameState: GameState = DEFAULT_GAME_STATE;
  private slices: SliceItem[] = DEFAULT_SLICES;
  private players: PlayerItem[] = DEFAULT_PLAYERS;
  private history: SpinHistoryLog[] = [];

  constructor(firebaseConfig: Record<string, string | undefined>) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    this.db = getDatabase(app);
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
        callback(this.config);
      } else {
        set(configRef, DEFAULT_CONFIG);
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
        callback(this.gameState);
      } else {
        set(stateRef, DEFAULT_GAME_STATE);
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
        callback(this.slices);
      } else {
        set(slicesRef, DEFAULT_SLICES);
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
        callback(this.players);
      } else {
        set(playersRef, DEFAULT_PLAYERS);
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
        callback(this.history);
      } else {
        this.history = [];
        callback([]);
      }
    });
    return () => unsub();
  }

  async updateConfig(updates: Partial<GameConfig>): Promise<void> {
    await update(ref(this.db, 'config'), updates);
  }

  async updateGameState(updates: Partial<GameState>): Promise<void> {
    await update(ref(this.db, 'gameState'), updates);
  }

  async updateSlices(slices: SliceItem[]): Promise<void> {
    await set(ref(this.db, 'slices'), slices);
  }

  async updatePlayers(players: PlayerItem[]): Promise<void> {
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
    await set(ref(this.db, 'history'), null);
    const resetSlices = this.slices.map(s => ({
      ...s,
      wonCount: 0,
    }));
    await this.updateSlices(resetSlices);
  }
}
