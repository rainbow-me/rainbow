import { IS_IOS } from '@/env';
import { useEvent } from 'react-native-reanimated';
import { WorkletFunction } from 'react-native-reanimated/lib/typescript/commonTypes';

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SHOULD_REBUILD = IS_IOS ? undefined : false;

/**
 * ### `📐 useLayoutWorklet 📐`
 * @warning This hook is experimental and currently only works on iOS.
 *
 * Allows reacting to `onLayout` events directly from the UI thread.
 *
 * Meant to be used with `<Animated.View />`.
 *
 * @param worklet - A worklet function to be called when the layout changes.
 * The worklet receives a {@link Layout} object containing the new layout information.
 *
 * @returns A worklet function that can be passed to an `Animated.View` to handle layout changes.
 *
 * @example
 * ```tsx
 * const onLayoutWorklet = useLayoutWorklet((layout) => {
 *   'worklet';
 *   console.log('New layout:', layout);
 * });
 *
 * return (
 *   <Animated.View
 *     // iOS requires a noop so React Native will emit topLayout events
 *     onLayout={(layout) => {
 *       if (IS_IOS) return;
 *       handleAndroidLayout(layout);
 *     }}
 *     // ＠ts-expect-error The name of this prop does not matter but the
 *     // function must be passed to a prop
 *     onLayoutWorklet={IS_IOS ? onLayoutWorklet : undefined}
 *   >
 *     <Text>Measure me</Text>
 *   </Animated.View>
 * );
 * ```
 */

// @ts-expect-error This overload is required by the Reanimated API
export function useLayoutWorklet(worklet: (layout: Layout) => void);
export function useLayoutWorklet(worklet: WorkletFunction) {
  return useEvent(
    (event: { layout: Layout }) => {
      'worklet';
      worklet(event.layout);
    },
    ['topLayout'],
    SHOULD_REBUILD
  );
}
