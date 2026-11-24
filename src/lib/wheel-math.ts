import { SliceItem, SliceAngle } from '../types/game';

/**
 * Filter slices to only those that are currently active (have stock and positive percentage).
 */
export function getActiveSlices(slices: SliceItem[]): SliceItem[] {
  return slices.filter(slice => {
    const hasStock = slice.stock === -1 || slice.wonCount < slice.stock;
    return hasStock && slice.percentage > 0;
  });
}

/**
 * Calculates proportional slice angles (in degrees 0-360) for all active slices.
 */
export function calculateSliceAngles(slices: SliceItem[]): SliceAngle[] {
  const active = getActiveSlices(slices);
  if (active.length === 0) return [];

  const totalPercentage = active.reduce((sum, s) => sum + s.percentage, 0);
  if (totalPercentage <= 0) return [];

  let currentAngle = 0;
  const result: SliceAngle[] = [];

  for (let i = 0; i < active.length; i++) {
    const slice = active[i];
    const arcSpan = (slice.percentage / totalPercentage) * 360;
    const isLast = i === active.length - 1;
    const endAngle = isLast ? 360 : currentAngle + arcSpan;

    result.push({
      id: slice.id,
      label: slice.label,
      color: slice.color,
      startAngle: currentAngle,
      endAngle,
      arcSpan: endAngle - currentAngle,
      percentage: slice.percentage,
    });

    currentAngle = endAngle;
  }

  return result;
}

/**
 * Normalizes all active slice percentages so their sum equals exactly 100%.
 */
export function normalizePercentages(slices: SliceItem[]): SliceItem[] {
  const active = slices.filter(s => s.stock === -1 || s.wonCount < s.stock);
  if (active.length === 0) return slices;

  const total = active.reduce((sum, s) => sum + Math.max(0, s.percentage), 0);
  if (total === 0) {
    const equalShare = parseFloat((100 / active.length).toFixed(2));
    return slices.map(s => {
      const isActive = s.stock === -1 || s.wonCount < s.stock;
      return {
        ...s,
        percentage: isActive ? equalShare : 0,
      };
    });
  }

  let runningSum = 0;
  return slices.map((s, idx) => {
    const isActive = s.stock === -1 || s.wonCount < s.stock;
    if (!isActive) return { ...s, percentage: 0 };

    if (idx === slices.length - 1) {
      return {
        ...s,
        percentage: Math.max(0, parseFloat((100 - runningSum).toFixed(2))),
      };
    }

    const normalized = parseFloat(((s.percentage / total) * 100).toFixed(2));
    runningSum += normalized;
    return {
      ...s,
      percentage: normalized,
    };
  });
}

/**
 * Weighted random selection among active slices with stock.
 */
export function selectWinningSlice(slices: SliceItem[]): SliceItem {
  const active = getActiveSlices(slices);
  if (active.length === 0) {
    throw new Error('No active slices available with remaining stock.');
  }

  const totalWeight = active.reduce((sum, s) => sum + s.percentage, 0);
  const randomValue = Math.random() * totalWeight;

  let accumulated = 0;
  for (const slice of active) {
    accumulated += slice.percentage;
    if (randomValue <= accumulated) {
      return slice;
    }
  }

  return active[active.length - 1];
}

/**
 * Calculates a deterministic target angle so the winning slice lands centered under the top pointer (270 deg).
 *
 * Physics formula:
 * Pointer position = 270 deg.
 * Slice angle at rest: [startAngle, endAngle].
 * Rotation R rotates canvas clockwise: angle under pointer is (270 - (R % 360) + 360) % 360.
 * To place target within [startAngle, endAngle], we pick a landing angle inside the slice:
 * landingOffset = startAngle + arcSpan * randomFactor(0.25 to 0.75)
 * targetAngle % 360 = (270 - landingOffset + 360) % 360.
 */
export function calculateTargetAngle(
  currentAngle: number,
  winningSliceId: string,
  slices: SliceItem[],
  minRotations: number = 8
): number {
  const angles = calculateSliceAngles(slices);
  const winningSlice = angles.find(a => a.id === winningSliceId);
  if (!winningSlice) {
    throw new Error(`Winning slice ${winningSliceId} not found in active slices`);
  }

  // Safe inner landing offset (30% to 70% inside the slice to safely avoid edges)
  const safeFactor = 0.3 + Math.random() * 0.4;
  const landingOffsetInSlice = winningSlice.startAngle + winningSlice.arcSpan * safeFactor;

  // Compute desired remainder: (270 - landingOffset + 720) % 360
  const desiredRemainder = (270 - landingOffsetInSlice + 720) % 360;

  // Add at least minRotations full turns from currentAngle
  const baseAddedRotations = minRotations * 360;
  const estimatedTarget = currentAngle + baseAddedRotations;
  const currentRemainder = estimatedTarget % 360;

  let delta = desiredRemainder - currentRemainder;
  if (delta < 0) {
    delta += 360;
  }

  const finalTargetAngle = estimatedTarget + delta;
  return finalTargetAngle;
}

/**
 * Detects if the top pointer (at 270 deg) crossed any slice peg boundary between previousAngle and currentAngle.
 */
export function detectPegCrossings(
  previousAngle: number,
  currentAngle: number,
  sliceAngles: SliceAngle[]
): boolean {
  if (sliceAngles.length <= 1 || previousAngle === currentAngle) return false;

  // Angle under pointer for previous and current rotation
  const prevPointerAngle = (270 - (previousAngle % 360) + 360) % 360;
  const currPointerAngle = (270 - (currentAngle % 360) + 360) % 360;

  // Check if any slice startAngle lies between prevPointerAngle and currPointerAngle
  for (const slice of sliceAngles) {
    const boundary = slice.startAngle;
    // As wheel rotates clockwise, pointer angle decreases (or wraps from 0 to 360)
    if (prevPointerAngle >= currPointerAngle) {
      if (boundary < prevPointerAngle && boundary >= currPointerAngle) {
        return true;
      }
    } else {
      // Wrapped around 0
      if (boundary < prevPointerAngle || boundary >= currPointerAngle) {
        return true;
      }
    }
  }

  return false;
}
