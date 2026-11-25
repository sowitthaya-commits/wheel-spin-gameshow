import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { WinnerModal } from '../src/components/wheel/WinnerModal';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('WinnerModal Cooldown and Dismissal Protection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('locks close button for 5 seconds upon opening', () => {
    const onClose = vi.fn();
    const { getByRole } = render(
      <WinnerModal
        isOpen={true}
        playerName="คุณสมชาย"
        prizeLabel="ทองคำแท่ง"
        onClose={onClose}
      />
    );

    const button = getByRole('button', { name: /ปิดได้ใน 5 วิ/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    // Clicking while locked should NOT call onClose
    fireEvent.click(button);
    expect(onClose).not.toHaveBeenCalled();

    // Advance 3 seconds -> should show 2 seconds remaining
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const buttonAfter3s = getByRole('button', { name: /ปิดได้ใน 2 วิ/i }) as HTMLButtonElement;
    expect(buttonAfter3s.disabled).toBe(true);
    fireEvent.click(buttonAfter3s);
    expect(onClose).not.toHaveBeenCalled();

    // Advance 2 more seconds -> cooldown finished (total 5s)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const unlockedButton = getByRole('button', { name: /ตกลง \/ ปิดหน้าต่าง/i }) as HTMLButtonElement;
    expect(unlockedButton.disabled).toBe(false);

    // Clicking unlocked button calls onClose
    fireEvent.click(unlockedButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
