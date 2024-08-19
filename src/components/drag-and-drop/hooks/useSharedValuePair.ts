import { useSharedValue, type SharedValue } from 'react-native-reanimated';

export type SharedValues<T extends Record<string, string | number | boolean>> = {
  [K in keyof T]: SharedValue<T[K]>;
};

export const useSharedValuePair = (x: number, y: number) => {
  return [useSharedValue(x), useSharedValue(y)];
};
