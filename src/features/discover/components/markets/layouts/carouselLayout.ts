/**
 * Pure layout helpers for the market carousel.
 * No React, no RN imports — kept separate so tests run without native module mocks.
 */

/**
 * Computes the snap-to offset for each item in a horizontal carousel.
 * Each item's offset is the sum of all preceding item widths plus gaps.
 *
 * @param widths - Width of each item in display order.
 * @param gap    - Spacing between items (pixels).
 * @returns Array of leading-edge offsets, one per item. `offsets[0]` is always 0.
 */
export function computeSnapToOffsets(widths: number[], gap: number): number[] {
  let offset = 0;
  return widths.map(w => {
    const current = offset;
    offset += w + gap;
    return current;
  });
}
