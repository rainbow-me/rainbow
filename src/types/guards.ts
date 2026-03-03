/**
 * Safely narrows unknown values to record-like objects.
 */
export function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
