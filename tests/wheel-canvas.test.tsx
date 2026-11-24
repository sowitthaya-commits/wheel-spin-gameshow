import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { WheelCanvas } from '../src/components/wheel/WheelCanvas';
import { WinnerModal } from '../src/components/wheel/WinnerModal';
import { SliceItem, SpinData } from '../src/types/game';

describe('WheelCanvas & WinnerModal Components', () => {
  const sampleSlices: SliceItem[] = [
    { id: 's1', label: 'iPhone 16 Pro', color: '#FF2E63', percentage: 20, stock: 1, wonCount: 0 },
    { id: 's2', label: 'Voucher 1000', color: '#08D9D6', percentage: 30, stock: 5, wonCount: 0 },
    { id: 's3', label: 'Keyring', color: '#F08A5D', percentage: 50, stock: 10, wonCount: 0 },
  ];

  it('renders canvas element without throwing', () => {
    const { container } = render(
      <WheelCanvas
        slices={sampleSlices}
        spinData={null}
        onSpinComplete={vi.fn()}
      />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('renders WinnerModal when winner is present', () => {
    const { getByText } = render(
      <WinnerModal
        isOpen={true}
        playerName="คุณสมชาย"
        prizeLabel="iPhone 16 Pro"
        onClose={vi.fn()}
      />
    );
    expect(getByText(/ยินดีด้วย/i)).toBeDefined();
    expect(getByText('คุณสมชาย')).toBeDefined();
    expect(getByText('iPhone 16 Pro')).toBeDefined();
  });
});
