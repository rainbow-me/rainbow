import { useAnimatedScrollHandler, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_ANDROID, IS_IOS } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { useBrowserContext } from '../BrowserContext';
import { TAB_VIEW_ROW_HEIGHT } from '../Dimensions';

/**
 * ### `useSmoothScrollView`
 *
 * This hook corrects for the jitter that occurs on iOS within the animated browser ScrollView, most noticeably when
 * a tab is closed when the ScrollView is scrolled to the end.
 *
 * The jitter happens because the ScrollView's internal contentContainer is not directly animatable, which causes its
 * height to lag behind the smoothly animated height of our content wrapper view.
 *
 * To reverse the jitter, this hook measures the exact height discrepancy via the scroll handler event and generates a
 * corrective Y transform that offsets it.
 */
export function useSmoothScrollView() {
  const { currentlyOpenTabIds, scrollViewOffset } = useBrowserContext();

  const scrollViewHeight = useDerivedValue(() => {
    const height = Math.max(
      Math.ceil(currentlyOpenTabIds.value.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 165 + 28 + (IS_ANDROID ? 35 : 0),
      DEVICE_HEIGHT
    );
    return withSpring(height, SPRING_CONFIGS.slowSpring);
  });

  const contentContainerHeight = useSharedValue(scrollViewHeight.value);

  const smoothScrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollViewOffset.value = event.contentOffset.y;
      if (IS_IOS) {
        contentContainerHeight.value = event.contentSize.height;
      }
    },
  });

  const jitterCorrection = useDerivedValue(() => {
    if (IS_ANDROID) return 0;

    const rawScrollViewHeight =
      Math.ceil(currentlyOpenTabIds.value.length / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 165 + 28 + (IS_ANDROID ? 35 : 0);

    const isScrollViewTallerThanScreen = contentContainerHeight.value > DEVICE_HEIGHT;
    const isScrolledToEnd = isScrollViewTallerThanScreen
      ? DEVICE_HEIGHT + Math.ceil(scrollViewOffset.value) >= contentContainerHeight.value
      : scrollViewOffset.value > 0;

    const areTabsClosing = rawScrollViewHeight < scrollViewHeight.value;
    const isCorrectionNeeded = areTabsClosing && isScrolledToEnd;
    const reversedYJitter = isCorrectionNeeded ? -(scrollViewHeight.value - contentContainerHeight.value) : 0;

    return reversedYJitter;
  });

  return {
    contentContainerHeight,
    jitterCorrection,
    scrollViewHeight,
    smoothScrollHandler,
  };
}
