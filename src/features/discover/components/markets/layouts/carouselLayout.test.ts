import { computeSnapToOffsets } from './carouselLayout';

describe('computeSnapToOffsets', () => {
  it('returns an empty array for empty input', () => {
    expect(computeSnapToOffsets([], 12)).toEqual([]);
  });

  it('returns [0] for a single item', () => {
    expect(computeSnapToOffsets([100], 12)).toEqual([0]);
  });

  it('computes prefix sums correctly: [100, 100, 100] gap 12', () => {
    expect(computeSnapToOffsets([100, 100, 100], 12)).toEqual([0, 112, 224]);
  });

  it('handles mixed widths: [100, 200, 50] gap 10', () => {
    expect(computeSnapToOffsets([100, 200, 50], 10)).toEqual([0, 110, 320]);
  });

  it('handles zero gap (pure prefix sums)', () => {
    expect(computeSnapToOffsets([10, 20, 30], 0)).toEqual([0, 10, 30]);
  });

  it('first offset is always 0', () => {
    const widths = [80, 120, 90, 110];
    const offsets = computeSnapToOffsets(widths, 8);
    expect(offsets[0]).toBe(0);
  });

  it('output length equals input length', () => {
    const widths = [50, 60, 70, 80, 90];
    const offsets = computeSnapToOffsets(widths, 12);
    expect(offsets.length).toBe(widths.length);
  });
});
