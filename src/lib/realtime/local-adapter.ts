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

type MessagePayload =
  | { type: 'CONFIG'; payload: GameConfig }
  | { type: 'GAME_STATE'; payload: GameState }
  | { type: 'SLICES'; payload: SliceItem[] }
  | { type: 'PLAYERS'; payload: PlayerItem[] }
  | { type: 'HISTORY'; payload: SpinHistoryLog[] };

export class LocalBroadcastChannelAdapter implements RealtimeAdapter {
  private channelName: string;
  private channel: BroadcastChannel | null = null;
  private configListeners: Set<(config: GameConfig) => void> = new Set();
  private stateListeners: Set<(state: GameState) => void> = new Set();
  private sliceListeners: Set<(slices: SliceItem[]) => void> = new Set();
  private playerListeners: Set<(players: PlayerItem[]) => void> = new Set();
  private historyListeners: Set<(history: SpinHistoryLog[]) => void> = new Set();

  private config: GameConfig;
  private gameState: GameState;
  private slices: SliceItem[];
  private players: PlayerItem[];
  private history: SpinHistoryLog[] = [];

  constructor(channelName: string = 'game_show_wheel_sync') {
    this.channelName = channelName;
    this.config = this.loadFromStorage('config', DEFAULT_CONFIG);
    this.gameState = this.loadFromStorage('gameState', DEFAULT_GAME_STATE);
    this.slices = this.loadFromStorage('slices', DEFAULT_SLICES);
    this.players = this.loadFromStorage('players', DEFAULT_PLAYERS);
    this.history = this.loadFromStorage('history', []);

    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event: MessageEvent<MessagePayload>) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel error, running in memory-only sync', err);
      }
    }
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

  private post(msg: MessagePayload): void {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('Post message failed', e);
      }
    }
  }

  private handleIncomingMessage(msg: MessagePayload): void {
    if (!msg || !msg.type) return;
    switch (msg.type) {
      case 'CONFIG':
        this.config = msg.payload;
        this.configListeners.forEach(cb => cb(this.config));
        break;
      case 'GAME_STATE':
        this.gameState = msg.payload;
        this.stateListeners.forEach(cb => cb(this.gameState));
        break;
      case 'SLICES':
        this.slices = msg.payload;
        this.sliceListeners.forEach(cb => cb(this.slices));
        break;
      case 'PLAYERS':
        this.players = msg.payload;
        this.playerListeners.forEach(cb => cb(this.players));
        break;
      case 'HISTORY':
        this.history = msg.payload;
        this.historyListeners.forEach(cb => cb(this.history));
        break;
    }
  }

  // Getters
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

  // Subscriptions
  subscribeConfig(callback: (config: GameConfig) => void): () => void {
    this.configListeners.add(callback);
    callback(this.config);
    return () => this.configListeners.delete(callback);
  }

  subscribeGameState(callback: (state: GameState) => void): () => void {
    this.stateListeners.add(callback);
    callback(this.gameState);
    return () => this.stateListeners.delete(callback);
  }

  subscribeSlices(callback: (slices: SliceItem[]) => void): () => void {
    this.sliceListeners.add(callback);
    callback(this.slices);
    return () => this.sliceListeners.delete(callback);
  }

  subscribePlayers(callback: (players: PlayerItem[]) => void): () => void {
    this.playerListeners.add(callback);
    callback(this.players);
    return () => this.playerListeners.delete(callback);
  }

  subscribeHistory(callback: (history: SpinHistoryLog[]) => void): () => void {
    this.historyListeners.add(callback);
    callback(this.history);
    return () => this.historyListeners.delete(callback);
  }

  // Mutations
  async updateConfig(updates: Partial<GameConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    this.saveToStorage('config', this.config);
    this.post({ type: 'CONFIG', payload: this.config });
    this.configListeners.forEach(cb => cb(this.config));
  }

  async updateGameState(updates: Partial<GameState>): Promise<void> {
    this.gameState = { ...this.gameState, ...updates };
    this.saveToStorage('gameState', this.gameState);
    this.post({ type: 'GAME_STATE', payload: this.gameState });
    this.stateListeners.forEach(cb => cb(this.gameState));
  }

  async updateSlices(slices: SliceItem[]): Promise<void> {
    this.slices = [...slices];
    this.saveToStorage('slices', this.slices);
    this.post({ type: 'SLICES', payload: this.slices });
    this.sliceListeners.forEach(cb => cb(this.slices));
  }

  async updatePlayers(players: PlayerItem[]): Promise<void> {
    this.players = [...players];
    this.saveToStorage('players', this.players);
    this.post({ type: 'PLAYERS', payload: this.players });
    this.playerListeners.forEach(cb => cb(this.players));
  }

  async triggerSpin(
    activePlayerId: string,
    playerName: string,
    triggeredBy: 'MANUAL' | 'AUTO'
  ): Promise<boolean> {
    // Re-check latest state from storage for atomic lock
    const latestState = this.loadFromStorage('gameState', this.gameState);
    if (latestState.status !== 'COUNTDOWN' && latestState.status !== 'IDLE') {
      return false;
    }

    const activeSlices = this.slices.filter(
      s => (s.stock === -1 || s.wonCount < s.stock) && s.percentage > 0
    );
    if (activeSlices.length === 0) {
      return false;
    }

    const winningSlice = selectWinningSlice(this.slices);
    const startAngle = latestState.spinData?.targetAngle || 0;
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

    const nextState: GameState = {
      ...latestState,
      status: 'SPINNING',
      activePlayerId,
      spinData,
    };

    this.gameState = nextState;
    this.saveToStorage('gameState', nextState);
    this.post({ type: 'GAME_STATE', payload: nextState });
    this.stateListeners.forEach(cb => cb(nextState));

    return true;
  }

  async completeSpin(
    winnerSliceId: string,
    playerName: string,
    triggeredBy: 'MANUAL' | 'AUTO'
  ): Promise<void> {
    // Only proceed if currently in SPINNING state (prevents multi-screen duplicate completion)
    const latestState = this.loadFromStorage('gameState', this.gameState);
    if (latestState.status !== 'SPINNING') {
      return;
    }

    // Find winner slice
    const slice = this.slices.find(s => s.id === winnerSliceId);
    const prizeLabel = slice ? slice.label : 'Prize';

    // 1. Update slices wonCount and handle stock depletion
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

    this.history = [newLog, ...this.history];
    this.saveToStorage('history', this.history);
    this.post({ type: 'HISTORY', payload: this.history });
    this.historyListeners.forEach(cb => cb(this.history));

    // 3. Update game state to RESULT
    await this.updateGameState({
      status: 'RESULT',
    });
  }

  async resetStats(): Promise<void> {
    this.history = [];
    this.saveToStorage('history', []);
    this.post({ type: 'HISTORY', payload: [] });
    this.historyListeners.forEach(cb => cb([]));

    const resetSlices = this.slices.map(s => ({
      ...s,
      wonCount: 0,
    }));
    await this.updateSlices(resetSlices);
  }
}
