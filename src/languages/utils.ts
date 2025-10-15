/**
 * A simple helper that finds a nested value in an object
 * by drilling down the path array.
 */
export function getValueAtPath(obj: unknown, path: string[]): unknown {
  let current: any = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}
