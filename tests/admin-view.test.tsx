import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { PinGate } from '../src/components/admin/PinGate';
import { LiveControlTab } from '../src/components/admin/LiveControlTab';
import { PrizeSetupTab } from '../src/components/admin/PrizeSetupTab';
import { PlayerItem, SliceItem, GameState, GameConfig } from '../src/types/game';

describe('Admin Control Panel Components', () => {
  it('PinGate unlocks with correct PIN', () => {
    const onUnlock = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <PinGate correctPin="1234" onUnlock={onUnlock} />
    );

    const input = getByPlaceholderText(/ใส่รหัส PIN|PIN/i);
    const button = getByRole('button', { name: /เข้าสู่ระบบ|Unlock/i });

    // Wrong PIN
    fireEvent.change(input, { target: { value: '0000' } });
    fireEvent.click(button);
    expect(onUnlock).not.toHaveBeenCalled();

    // Correct PIN
    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.click(button);
    expect(onUnlock).toHaveBeenCalled();
  });

  it('LiveControlTab allows toggling Hold Mode and Starting Timer', () => {
    const onToggleHold = vi.fn();
    const onStartTimer = vi.fn();

    const sampleState: GameState = {
      status: 'IDLE',
      activePlayerId: 'p1',
      isHoldManual: false,
      timerEndTimestamp: 0,
      remainingSecWhenPaused: 60,
      spinData: null,
    };

    const samplePlayers: PlayerItem[] = [{ id: 'p1', name: 'คุณสมชาย' }];

    const { getByRole } = render(
      <LiveControlTab
        gameState={sampleState}
        players={samplePlayers}
        onSelectActivePlayer={vi.fn()}
        onStartTimer={onStartTimer}
        onPauseTimer={vi.fn()}
        onResetTimer={vi.fn()}
        onToggleHoldManual={onToggleHold}
        onForceSpin={vi.fn()}
        onClearWinner={vi.fn()}
      />
    );

    const holdButton = getByRole('button', { name: /ตั้งโหมด.*รอ|โหมดรอ/i });
    fireEvent.click(holdButton);
    expect(onToggleHold).toHaveBeenCalled();

    const startButton = getByRole('button', { name: /เริ่มนับเวลา|Start/i });
    fireEvent.click(startButton);
    expect(onStartTimer).toHaveBeenCalled();
  });

  it('PrizeSetupTab allows normalizing slice percentages', () => {
    const onNormalize = vi.fn();
    const sampleSlices: SliceItem[] = [
      { id: 's1', label: 'Item A', color: '#FF0000', percentage: 20, stock: 1, wonCount: 0 },
      { id: 's2', label: 'Item B', color: '#00FF00', percentage: 20, stock: 1, wonCount: 0 },
    ];

    const sampleConfig: GameConfig = {
      gameTitle: 'LUCKY SHOW',
      bgmTrack: 'arcade_gold',
      timerDurationSec: 60,
    };

    const { getByRole } = render(
      <PrizeSetupTab
        config={sampleConfig}
        slices={sampleSlices}
        onUpdateConfig={vi.fn()}
        onUpdateSlices={vi.fn()}
        onNormalizePercentages={onNormalize}
      />
    );

    const normalizeBtn = getByRole('button', { name: /ปรับสัดส่วนรวม 100%|Normalize/i });
    fireEvent.click(normalizeBtn);
    expect(onNormalize).toHaveBeenCalled();
  });
});
