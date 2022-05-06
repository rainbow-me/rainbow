export function toMaximalPrecision(value: number, precision: number): number {
  return (
    Math.round((value + Number.EPSILON) * Math.pow(10, precision)) /
    Math.pow(10, precision)
  );
}
