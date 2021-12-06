import { createContext } from 'react';
import { useSharedValue } from 'react-native-reanimated';
export default createContext(null);

export function useGenerateValues() {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const prevSmoothing = useSharedValue(0, 'prevSmoothing');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const currSmoothing = useSharedValue(0, 'currSmoothing');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const progress = useSharedValue(1, 'progress');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const dotScale = useSharedValue(0, 'dotScale');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const originalX = useSharedValue('', 'originalX');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const originalY = useSharedValue('', 'originalY');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const pathOpacity = useSharedValue(1, 'pathOpacity');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const layoutSize = useSharedValue(0, 'size');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const state = useSharedValue(0, 'state');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const positionX = useSharedValue(0, 'positionX');
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  const positionY = useSharedValue(0, 'positionY');

  return {
    currSmoothing,
    dotScale,
    layoutSize,
    originalX,
    originalY,
    pathOpacity,
    positionX,
    positionY,
    prevSmoothing,
    progress,
    state,
  };
}
