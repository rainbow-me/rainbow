import { greaterThanOrEqualToWorklet } from '@/framework/core/safeMath';

export function addCommasToNumber<T extends 0 | '0' | '0.00'>(number: string | number, fallbackValue: T = 0 as T): T | string {
  'worklet';
  if (isNaN(Number(number))) {
    return fallbackValue;
  }
  const numberString = number.toString();

  if (numberString.includes(',')) {
    return numberString;
  }

  if (greaterThanOrEqualToWorklet(number, 1000)) {
    const parts = numberString.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  } else {
    return numberString;
  }
}
