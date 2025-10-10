/**
 * Normalize DApp name for display (remove version suffixes)
 */
export function normalizeDappName(name: string): string {
  return name.replace(/\s+v\d+$/i, '').trim();
}
