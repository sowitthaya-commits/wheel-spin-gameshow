import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
const mockTriggerSpin = vi.fn().mockResolvedValue(undefined);

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('../src/hooks/useGameSync', () => ({
  useGameSync: () => ({
    config: { gameTitle: 'LUCKY SPIN SHOW', timerDurationSec: 60 },
    gameState: {
      status: 'COUNTDOWN',
      activePlayerId: 'p1',
      timerEndTimestamp: Date.now() + 30000,
      isHoldManual: false,
    },
    slices: [{ id: 's1', label: 'ทองคำ', percentage: 100, stock: -1, wonCount: 0 }],
    players: [{ id: 'p1', name: 'คุณสมชาย' }],
    triggerSpin: mockTriggerSpin,
  }),
}));

import PlayerPage from '../src/app/play/page';

describe('PlayerPage Auto-Redirect on Spin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem('wheel_selected_player_id', 'p1');
  });

  it('triggers spin and redirects to main stage screen (/) when spin button is pressed', async () => {
    const { getByRole } = render(<PlayerPage />);

    const button = getByRole('button', { name: /กดหมุน|SPIN/i });
    expect(button).toBeDefined();

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockTriggerSpin).toHaveBeenCalledWith('p1', 'คุณสมชาย', 'MANUAL');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
