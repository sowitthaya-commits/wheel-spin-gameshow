export interface SliceItem {
  id: string;
  label: string;
  color: string;
  percentage: number;
  stock: number;      // -1 means unlimited, >0 means limited stock
  wonCount: number;
}

export interface SliceAngle {
  id: string;
  label: string;
  color: string;
  startAngle: number; // in degrees [0, 360)
  endAngle: number;   // in degrees [0, 360]
  arcSpan: number;    // endAngle - startAngle
  percentage: number;
}

export interface PlayerItem {
  id: string;
  name: string;
}

export type GameStatus = 'IDLE' | 'COUNTDOWN' | 'SPINNING' | 'RESULT';

export interface SpinData {
  spinId: string;
  targetAngle: number;       // Final rotation angle in degrees
  durationMs: number;        // e.g. 6000ms
  startAngle: number;        // Starting rotation angle
  startTimestamp: number;    // Date.now() when spin triggered
  winningSliceId: string;
  winningLabel: string;
  playerName: string;
  triggeredBy: 'MANUAL' | 'AUTO';
}

export interface GameState {
  status: GameStatus;
  activePlayerId: string;
  isHoldManual: boolean;
  timerEndTimestamp: number;
  remainingSecWhenPaused: number;
  isPaused?: boolean;
  spinData: SpinData | null;
}

export interface GameConfig {
  gameTitle: string;
  logoUrl?: string;          // Base64 or image URL
  bgmTrack: string;
  timerDurationSec: number;
  adminPassword?: string;
  firebaseConfig?: {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}

export interface SpinHistoryLog {
  id: string;
  round: number;
  timestamp: number;
  playerName: string;
  prizeLabel: string;
  triggerType: 'MANUAL' | 'AUTO';
}
