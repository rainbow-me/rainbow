/**
 * Generates a short string with sufficient randomness for use as a unique ID.
 */
export function generateUniqueId(): string {
  'worklet';
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return `${timestamp}${randomString}`;
}
