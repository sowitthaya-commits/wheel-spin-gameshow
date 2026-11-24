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

  it('PinGate does not reveal default password and provides back to main stage link', () => {
    const { queryByText, getByRole } = render(
      <PinGate correctPin="1234" onUnlock={vi.fn()} />
    );

    // Should NOT show default password hints
    expect(queryByText(/รหัสเริ่มต้น/i)).toBeNull();
    expect(queryByText(/1234/i)).toBeNull();

    // Should provide a link back to main stage
    const backLink = getByRole('link', { name: /หน้าหลัก|Stage/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute('href')).toBe('/');
  });

  it('LiveControlTab handles pause and resume', () => {
    const onPauseTimer = vi.fn();
    const onResumeTimer = vi.fn();

    const countdownState: GameState = {
      status: 'COUNTDOWN',
      activePlayerId: 'p1',
      isHoldManual: false,
      timerEndTimestamp: Date.now() + 45000,
      remainingSecWhenPaused: 0,
      spinData: null,
    };

    const { getByRole, rerender, getByText } = render(
      <LiveControlTab
        gameState={countdownState}
        players={[{ id: 'p1', name: 'คุณสมชาย' }]}
        onSelectActivePlayer={vi.fn()}
        onStartTimer={vi.fn()}
        onPauseTimer={onPauseTimer}
        onResumeTimer={onResumeTimer}
        onResetTimer={vi.fn()}
        onToggleHoldManual={vi.fn()}
        onForceSpin={vi.fn()}
        onClearWinner={vi.fn()}
      />
    );

    // Click pause while countdown is active
    const pauseButton = getByRole('button', { name: /หยุดชั่วคราว|Pause/i });
    fireEvent.click(pauseButton);
    expect(onPauseTimer).toHaveBeenCalled();

    // Re-render as paused with 42s remaining
    const pausedState: GameState = {
      ...countdownState,
      status: 'IDLE',
      isPaused: true,
      timerEndTimestamp: 0,
      remainingSecWhenPaused: 42,
    };

    rerender(
      <LiveControlTab
        gameState={pausedState}
        players={[{ id: 'p1', name: 'คุณสมชาย' }]}
        onSelectActivePlayer={vi.fn()}
        onStartTimer={vi.fn()}
        onPauseTimer={onPauseTimer}
        onResumeTimer={onResumeTimer}
        onResetTimer={vi.fn()}
        onToggleHoldManual={vi.fn()}
        onForceSpin={vi.fn()}
        onClearWinner={vi.fn()}
      />
    );

    // Should show paused status badge with remaining time
    expect(getByText(/หยุดเวลาชั่วคราว.*42/i)).toBeDefined();

    // Click resume button
    const resumeButton = getByRole('button', { name: /นับเวลาต่อ|Resume/i });
    fireEvent.click(resumeButton);
    expect(onResumeTimer).toHaveBeenCalled();
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
