import {
  GameConfig,
  GameState,
  SliceItem,
  PlayerItem,
  SpinHistoryLog,
} from '../../types/game';

export interface RealtimeAdapter {
  // Subscriptions
  subscribeConfig(callback: (config: GameConfig) => void): () => void;
  subscribeGameState(callback: (state: GameState) => void): () => void;
  subscribeSlices(callback: (slices: SliceItem[]) => void): () => void;
  subscribePlayers(callback: (players: PlayerItem[]) => void): () => void;
  subscribeHistory(callback: (history: SpinHistoryLog[]) => void): () => void;

  // Sync Getters
  getConfig(): GameConfig;
  getGameState(): GameState;
  getSlices(): SliceItem[];
  getPlayers(): PlayerItem[];
  getHistory(): SpinHistoryLog[];

  // Mutations
  updateConfig(updates: Partial<GameConfig>): Promise<void>;
  updateGameState(updates: Partial<GameState>): Promise<void>;
  updateSlices(slices: SliceItem[]): Promise<void>;
  updatePlayers(players: PlayerItem[]): Promise<void>;
  triggerSpin(
    activePlayerId: string,
    playerName: string,
    triggeredBy: 'MANUAL' | 'AUTO'
  ): Promise<boolean>;
  completeSpin(
    winnerSliceId: string,
    playerName: string,
    triggeredBy: 'MANUAL' | 'AUTO'
  ): Promise<void>;
  resetStats(): Promise<void>;
}

export const DEFAULT_CONFIG: GameConfig = {
  gameTitle: 'LUCKY SPIN SHOW',
  bgmTrack: 'arcade_gold',
  timerDurationSec: 60,
};

export const DEFAULT_SLICES: SliceItem[] = [
  { id: 'slice_1', label: 'JACKPOT: iPhone 16', color: '#141418', percentage: 5, stock: 1, wonCount: 0 },
  { id: 'slice_2', label: 'Voucher 1,000฿', color: '#E5A912', percentage: 15, stock: 5, wonCount: 0 },
  { id: 'slice_3', label: 'AirPods 4', color: '#F97316', percentage: 10, stock: 2, wonCount: 0 },
  { id: 'slice_4', label: 'Voucher 500฿', color: '#9333EA', percentage: 25, stock: 10, wonCount: 0 },
  { id: 'slice_5', label: 'Starbucks Card', color: '#10B981', percentage: 20, stock: 15, wonCount: 0 },
  { id: 'slice_6', label: 'Lucky Keychain', color: '#EC4899', percentage: 25, stock: 50, wonCount: 0 },
];

export const DEFAULT_PLAYERS: PlayerItem[] = [
  { id: 'player_1', name: 'คุณสมชาย' },
  { id: 'player_2', name: 'คุณสมหญิง' },
  { id: 'player_3', name: 'คุณอนันต์' },
];

export const DEFAULT_GAME_STATE: GameState = {
  status: 'IDLE',
  activePlayerId: 'player_1',
  isHoldManual: false,
  timerEndTimestamp: 0,
  remainingSecWhenPaused: 60,
  isPaused: false,
  spinData: null,
};
