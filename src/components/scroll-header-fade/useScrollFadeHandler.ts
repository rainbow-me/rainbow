import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { DEFAULT_SCROLL_FADE_DISTANCE } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { clamp } from '@/worklets/numbers';

// ============ Constants ======================================================= //

const DEFAULT_OPTIONS: UseScrollFadeHandlerOptions = { fadeDistance: DEFAULT_SCROLL_FADE_DISTANCE };

// ============ Types =========================================================== //

export type UseScrollFadeHandlerOptions = {
  /**
   * Distance to track scroll within.
   * Set when providing a custom `fadeDistance` to the `ScrollHeaderFade` component.
   * @default 8
   */
  fadeDistance?: number;
};

// ============ Hook ============================================================ //

/**
 * Creates a scroll handler for use with the `ScrollHeaderFade` component.
 */
export function useScrollFadeHandler(
  scrollOffset: SharedValue<number>,
  options: UseScrollFadeHandlerOptions = DEFAULT_OPTIONS
): ReturnType<typeof useAnimatedScrollHandler> {
  const fadeDistance = options.fadeDistance ?? DEFAULT_SCROLL_FADE_DISTANCE;

  return useAnimatedScrollHandler({
    onScroll: event => {
      const clampedPosition = clamp(event.contentOffset.y, 0, fadeDistance);
      if (scrollOffset.value === clampedPosition) return;
      scrollOffset.value = clampedPosition;
    },
  });
}
