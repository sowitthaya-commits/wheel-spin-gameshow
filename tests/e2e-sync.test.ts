import { describe, it, expect, beforeEach } from 'vitest';
import { LocalBroadcastChannelAdapter } from '../src/lib/realtime/local-adapter';
import { GameState, SliceItem, SpinHistoryLog } from '../src/types/game';

describe('End-to-End Multi-View Real-Time Synchronization Flow', () => {
  let stageAdapter: LocalBroadcastChannelAdapter;
  let playerAdapter: LocalBroadcastChannelAdapter;
  let adminAdapter: LocalBroadcastChannelAdapter;

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    const channelName = 'e2e_game_show_test';
    stageAdapter = new LocalBroadcastChannelAdapter(channelName);
    playerAdapter = new LocalBroadcastChannelAdapter(channelName);
    adminAdapter = new LocalBroadcastChannelAdapter(channelName);
  });

  it('coordinates a complete game show round between Stage, Player and Admin', async () => {
    // 1. Stage and Player listen to gameState
    let stageState: GameState = stageAdapter.getGameState();
    let playerState: GameState = playerAdapter.getGameState();

    const unsubStage = stageAdapter.subscribeGameState(s => {
      stageState = s;
    });
    const unsubPlayer = playerAdapter.subscribeGameState(s => {
      playerState = s;
    });

    // 2. Admin sets active player to player_2 and enables isHoldManual
    await adminAdapter.updateGameState({
      activePlayerId: 'player_2',
      isHoldManual: true,
      status: 'COUNTDOWN',
      timerEndTimestamp: Date.now() + 60000,
    });

    // Wait for cross-tab broadcast dispatch
    await new Promise(r => setTimeout(r, 30));

    expect(stageState.activePlayerId).toBe('player_2');
    expect(playerState.activePlayerId).toBe('player_2');
    expect(playerState.isHoldManual).toBe(true);
    expect(playerState.status).toBe('COUNTDOWN');

    // 3. Player 2 clicks SPIN NOW
    const spinSuccess = await playerAdapter.triggerSpin('player_2', 'คุณสมหญิง', 'MANUAL');
    expect(spinSuccess).toBe(true);

    await new Promise(r => setTimeout(r, 30));

    // Both Stage and Admin observe the SPINNING state with deterministic targetAngle
    expect(stageState.status).toBe('SPINNING');
    expect(stageState.spinData).toBeDefined();
    expect(stageState.spinData?.playerName).toBe('คุณสมหญิง');
    expect(stageState.spinData?.targetAngle).toBeGreaterThan(0);
    expect(stageState.spinData?.durationMs).toBe(6000);

    const winningSliceId = stageState.spinData!.winningSliceId;

    // 4. Stage completes spin animation and calls completeSpin
    await stageAdapter.completeSpin(winningSliceId, 'คุณสมหญิง', 'MANUAL');

    await new Promise(r => setTimeout(r, 30));

    // 5. Verify RESULT state, wonCount increment, and history log across all views
    let adminHistory: SpinHistoryLog[] = [];
    adminAdapter.subscribeHistory(h => {
      adminHistory = h;
    });

    expect(adminHistory.length).toBe(1);
    expect(adminHistory[0].playerName).toBe('คุณสมหญิง');
    expect(adminHistory[0].triggerType).toBe('MANUAL');

    const adminSlices = adminAdapter.getSlices();
    const wonSlice = adminSlices.find(s => s.id === winningSliceId);
    expect(wonSlice?.wonCount).toBe(1);

    unsubStage();
    unsubPlayer();
  });
});
