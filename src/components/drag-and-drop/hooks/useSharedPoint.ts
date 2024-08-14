import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Point } from '../utils';

export type SharedPoint = Point<SharedValue<number>>;

export const useSharedPoint = (x: number, y: number): SharedPoint => {
  return {
    x: useSharedValue(x),
    y: useSharedValue(y),
  };
};
