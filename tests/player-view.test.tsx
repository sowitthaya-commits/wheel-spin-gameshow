import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SpinButton } from '../src/components/player/SpinButton';
import { PlayerSelector } from '../src/components/player/PlayerSelector';
import { PlayerItem } from '../src/types/game';

describe('Player Mobile View Components', () => {
  const samplePlayers: PlayerItem[] = [
    { id: 'p1', name: 'คุณสมชาย' },
    { id: 'p2', name: 'คุณสมหญิง' },
  ];

  it('renders PlayerSelector and allows selecting player', () => {
    const onSelect = vi.fn();
    const { getByRole } = render(
      <PlayerSelector
        players={samplePlayers}
        selectedPlayerId={null}
        onSelectPlayer={onSelect}
      />
    );

    const select = getByRole('combobox');
    fireEvent.change(select, { target: { value: 'p1' } });
    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('enables SPIN button when my turn and wheel is ready', () => {
    const onSpin = vi.fn();
    const { getByRole } = render(
      <SpinButton
        isMyTurn={true}
        canSpin={true}
        status="COUNTDOWN"
        onSpin={onSpin}
      />
    );

    const button = getByRole('button', { name: /กดหมุน|SPIN/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(onSpin).toHaveBeenCalled();
  });

  it('disables SPIN button and displays waiting message when not my turn', () => {
    const { getByText, queryByRole } = render(
      <SpinButton
        isMyTurn={false}
        canSpin={false}
        activePlayerName="คุณสมหญิง"
        status="COUNTDOWN"
        onSpin={vi.fn()}
      />
    );

    expect(getByText(/รอตาของคุณ คุณสมหญิง/i)).toBeDefined();
    const button = queryByRole('button', { name: /กดหมุน|SPIN/i });
    expect(button).toBeNull();
  });
});
