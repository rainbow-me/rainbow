export function computeSnapToOffsets(widths: number[], gap: number): number[] {
  let offset = 0;
  return widths.map(w => {
    const current = offset;
    offset += w + gap;
    return current;
  });
}
