export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function oneOf<T extends string>(values: readonly T[]) {
  return (value: unknown): value is T => typeof value === 'string' && values.includes(value as T);
}
