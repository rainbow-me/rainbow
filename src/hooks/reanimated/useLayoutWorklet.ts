import { useEvent } from 'react-native-reanimated';
import { WorkletFunction } from 'react-native-reanimated/lib/typescript/commonTypes';

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// @ts-expect-error This overload is required by the Reanimated API
export function useLayoutWorklet(worklet: (layout: Layout) => void);

export function useLayoutWorklet(worklet: WorkletFunction) {
  return useEvent(
    (event: { layout: Layout }) => {
      'worklet';
      worklet(event.layout);
    },
    ['topLayout']
    // true
  );
}
