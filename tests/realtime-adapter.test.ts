import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalBroadcastChannelAdapter } from '../src/lib/realtime/local-adapter';
import { SliceItem, GameState } from '../src/types/game';

describe('Realtime Adapter - Local Demo Mode', () => {
  let adapterA: LocalBroadcastChannelAdapter;
  let adapterB: LocalBroadcastChannelAdapter;

  beforeEach(() => {
    // Clear localStorage mock
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    adapterA = new LocalBroadcastChannelAdapter('test_channel');
    adapterB = new LocalBroadcastChannelAdapter('test_channel');
  });

  it('subscribes to initial default slices and notifies on slice updates', async () => {
    let receivedSlices: SliceItem[] = [];
    const unsubscribe = adapterB.subscribeSlices(slices => {
      receivedSlices = slices;
    });

    const newSlices: SliceItem[] = [
      { id: 's1', label: 'Gold Bar', color: '#FFD700', percentage: 50, stock: 1, wonCount: 0 },
      { id: 's2', label: 'Silver Coin', color: '#C0C0C0', percentage: 50, stock: 10, wonCount: 0 },
    ];

    await adapterA.updateSlices(newSlices);

    // Wait for event loop dispatch to adapterB
    await new Promise(resolve => setTimeout(resolve, 30));

    // Verify adapterB received the updated slices
    expect(receivedSlices.length).toBe(2);
    expect(receivedSlices[0].label).toBe('Gold Bar');

    unsubscribe();
  });

  it('atomically triggers spin and prevents concurrent duplicate spins', async () => {
    // Both adapters attempt to trigger spin concurrently
    const [resultA, resultB] = await Promise.all([
      adapterA.triggerSpin('p1', 'Somchai', 'MANUAL'),
      adapterB.triggerSpin('p1', 'Somchai', 'AUTO'),
    ]);

    // Exactly one must succeed, the other must be rejected by atomic CAS
    expect((resultA && !resultB) || (!resultA && resultB)).toBe(true);

    let state: GameState | null = null;
    adapterA.subscribeGameState(s => {
      state = s;
    });

    expect(state).not.toBeNull();
    expect(state!.status).toBe('SPINNING');
    expect(state!.spinData).toBeDefined();
    expect(state!.spinData?.playerName).toBe('Somchai');
  });

  it('completes spin, records history and updates wonCount', async () => {
    const initialSlices = adapterA.getSlices();
    const targetSlice = initialSlices[0];

    await adapterA.completeSpin(targetSlice.id, 'Somchai', 'MANUAL');

    const updatedSlices = adapterA.getSlices();
    const updatedTarget = updatedSlices.find(s => s.id === targetSlice.id);
    expect(updatedTarget?.wonCount).toBe(targetSlice.wonCount + 1);

    const history = adapterA.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].playerName).toBe('Somchai');
  });
});
