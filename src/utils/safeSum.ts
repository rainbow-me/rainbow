import { type BigNumberish, convertStringToNumber } from '@/helpers/utilities';

type MappableValue = BigNumberish | null | undefined;

export const safeSum = <T>(values: readonly T[] | undefined, mapValue: (value: T) => MappableValue) => {
  return (
    values?.reduce((sum, value) => {
      const mappedValue = mapValue(value);
      if (mappedValue == null) return sum;
      const parsedValue = convertStringToNumber(mappedValue);
      return Number.isFinite(parsedValue) ? sum + parsedValue : sum;
    }, 0) ?? 0
  );
};
