import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { TimerDisplay } from '../src/components/stage/TimerDisplay';
import { StageHeader } from '../src/components/stage/StageHeader';

describe('Stage Display Components', () => {
  it('formats timer as MM:SS when remaining seconds > 60', () => {
    const { getByText } = render(
      <TimerDisplay
        remainingSec={150} // 2 min 30 sec
        status="COUNTDOWN"
        isHoldManual={false}
      />
    );
    expect(getByText('02:30')).toBeDefined();
  });

  it('formats timer as pulsing seconds when remaining seconds <= 60', () => {
    const { getByText } = render(
      <TimerDisplay
        remainingSec={45}
        status="COUNTDOWN"
        isHoldManual={false}
      />
    );
    expect(getByText('45')).toBeDefined();
  });

  it('displays hold badge when isHoldManual is active and timer reached 0', () => {
    const { getByText } = render(
      <TimerDisplay
        remainingSec={0}
        status="COUNTDOWN"
        isHoldManual={true}
      />
    );
    expect(getByText(/รอผู้เล่นกดหมุน/i)).toBeDefined();
  });

  it('displays paused countdown time when isPaused is true during IDLE', () => {
    const { getByText } = render(
      <TimerDisplay
        remainingSec={42}
        status="IDLE"
        isHoldManual={false}
        isPaused={true}
      />
    );
    expect(getByText(/หยุดเวลาชั่วคราว/i)).toBeDefined();
    expect(getByText('42')).toBeDefined();
  });

  it('renders stage header with game title and active player name', () => {
    const { getByText } = render(
      <StageHeader
        gameTitle="LUCKY SPIN SHOW"
        activePlayerName="คุณสมชาย"
      />
    );
    expect(getByText('LUCKY SPIN SHOW')).toBeDefined();
    expect(getByText(/คุณสมชาย/i)).toBeDefined();
  });
});
