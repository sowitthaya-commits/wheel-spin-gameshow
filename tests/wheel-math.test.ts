import { describe, it, expect } from 'vitest';
import {
  calculateSliceAngles,
  selectWinningSlice,
  calculateTargetAngle,
  detectPegCrossings,
  normalizePercentages,
} from '../src/lib/wheel-math';
import { SliceItem } from '../src/types/game';

describe('Wheel Math & Probability Engine', () => {
  const sampleSlices: SliceItem[] = [
    { id: 's1', label: 'iPhone 16', color: '#FF2E63', percentage: 10, stock: 1, wonCount: 0 },
    { id: 's2', label: 'Voucher 500', color: '#08D9D6', percentage: 30, stock: 5, wonCount: 0 },
    { id: 's3', label: 'Keyring', color: '#F08A5D', percentage: 60, stock: 20, wonCount: 0 },
  ];

  describe('calculateSliceAngles', () => {
    it('calculates proportional slice angles strictly based on percentage weight', () => {
      const angles = calculateSliceAngles(sampleSlices);
      expect(angles).toHaveLength(3);

      // Total sum = 100
      // s1: 10% -> 36 degrees
      expect(angles[0].startAngle).toBeCloseTo(0);
      expect(angles[0].endAngle).toBeCloseTo(36);
      expect(angles[0].arcSpan).toBeCloseTo(36);

      // s2: 30% -> 108 degrees
      expect(angles[1].startAngle).toBeCloseTo(36);
      expect(angles[1].endAngle).toBeCloseTo(144);
      expect(angles[1].arcSpan).toBeCloseTo(108);

      // s3: 60% -> 216 degrees
      expect(angles[2].startAngle).toBeCloseTo(144);
      expect(angles[2].endAngle).toBeCloseTo(360);
      expect(angles[2].arcSpan).toBeCloseTo(216);
    });

    it('filters out disabled or out-of-stock slices when calculating active angles', () => {
      const slicesWithDepletedStock: SliceItem[] = [
        { id: 's1', label: 'iPhone', color: '#FF2E63', percentage: 50, stock: 1, wonCount: 1 }, // depleted
        { id: 's2', label: 'Voucher', color: '#08D9D6', percentage: 25, stock: 5, wonCount: 0 },
        { id: 's3', label: 'Keyring', color: '#F08A5D', percentage: 25, stock: 5, wonCount: 0 },
      ];

      const angles = calculateSliceAngles(slicesWithDepletedStock);
      expect(angles).toHaveLength(2);
      expect(angles[0].id).toBe('s2');
      expect(angles[0].arcSpan).toBeCloseTo(180);
      expect(angles[1].id).toBe('s3');
      expect(angles[1].arcSpan).toBeCloseTo(180);
    });
  });

  describe('normalizePercentages', () => {
    it('normalizes slice percentages to sum to exactly 100%', () => {
      const unnormalized: SliceItem[] = [
        { id: 's1', label: 'A', color: '#111', percentage: 10, stock: 1, wonCount: 0 },
        { id: 's2', label: 'B', color: '#222', percentage: 10, stock: 1, wonCount: 0 },
      ];

      const normalized = normalizePercentages(unnormalized);
      expect(normalized[0].percentage).toBe(50);
      expect(normalized[1].percentage).toBe(50);
    });
  });

  describe('selectWinningSlice', () => {
    it('selects a winning slice among active slices with stock', () => {
      const winner = selectWinningSlice(sampleSlices);
      expect(['s1', 's2', 's3']).toContain(winner.id);
    });

    it('never selects an out-of-stock slice', () => {
      const slicesWithExhausted: SliceItem[] = [
        { id: 's1', label: 'A', color: '#111', percentage: 99, stock: 1, wonCount: 1 }, // wonCount == stock
        { id: 's2', label: 'B', color: '#222', percentage: 1, stock: 10, wonCount: 0 },
      ];

      // Test 50 times
      for (let i = 0; i < 50; i++) {
        const winner = selectWinningSlice(slicesWithExhausted);
        expect(winner.id).toBe('s2');
      }
    });
  });

  describe('calculateTargetAngle', () => {
    it('calculates deterministic target angle where winning slice stops at top needle (270 deg)', () => {
      const startAngle = 0;
      const targetAngle = calculateTargetAngle(startAngle, 's2', sampleSlices, 10);

      // Must complete at least 10 full rotations (3600 deg)
      expect(targetAngle).toBeGreaterThan(startAngle + 3600);

      // In canvas coordinates, top pointer is at 270 deg (or -90 deg).
      // When wheel rotates by R deg clockwise, the slice at angle alpha moves to (alpha + R) mod 360.
      // So the pointer at 270 deg sees slice whose original angle satisfies (alpha + R) mod 360 == 270,
      // which means alpha = (270 - (R mod 360) + 360) mod 360.
      const normalizedRotation = targetAngle % 360;
      const angleUnderPointer = (270 - normalizedRotation + 360) % 360;

      const angles = calculateSliceAngles(sampleSlices);
      const s2Angle = angles.find(a => a.id === 's2')!;
      expect(angleUnderPointer).toBeGreaterThanOrEqual(s2Angle.startAngle);
      expect(angleUnderPointer).toBeLessThanOrEqual(s2Angle.endAngle);
    });
  });

  describe('detectPegCrossings', () => {
    it('detects boundary crossing when wheel advances past a slice border', () => {
      const angles = calculateSliceAngles(sampleSlices); // borders at 0, 36, 144
      // At wheel rotation = 230 deg, pointer at 270 - 230 = 40 deg.
      // At wheel rotation = 240 deg, pointer at 270 - 240 = 30 deg.
      // Slice border 36 is crossed!
      const crossed = detectPegCrossings(230, 240, angles);
      expect(crossed).toBe(true);

      // Movement between 200 and 210 deg (pointer from 70 to 60 deg, within s2: 36..144) does not cross
      const notCrossed = detectPegCrossings(200, 210, angles);
      expect(notCrossed).toBe(false);
    });
  });
});
