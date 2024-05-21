import {
  convertToRGBA,
  interpolate,
  isColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { globalColors, useColorMode } from '@/design-system';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from '../BrowserContext';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  TAB_VIEW_COLUMN_WIDTH,
  TAB_VIEW_EXTRA_TOP_PADDING,
  TAB_VIEW_ROW_HEIGHT,
  ZOOMED_TAB_BORDER_RADIUS,
} from '../Dimensions';

export function useAnimatedTab({ tabId }: { tabId: string }) {
  const {
    animatedActiveTabIndex,
    animatedMultipleTabsOpen,
    animatedTabViewBorderRadius,
    animatedWebViewHeight,
    currentlyOpenTabIds,
    scrollViewOffset,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();

  const animatedTabIndex = useSharedValue(useBrowserStore.getState().tabIds.indexOf(tabId));
  const gestureScale = useSharedValue(1);
  const gestureX = useSharedValue(0);

  const { isDarkMode } = useColorMode();
  const defaultBackgroundColor = isDarkMode ? '#191A1C' : globalColors.white100;
  const backgroundColor = useSharedValue<string>(defaultBackgroundColor);

  const safeBackgroundColor = useDerivedValue(() => {
    if (!backgroundColor.value) return defaultBackgroundColor;

    const isValidColor = isColor(backgroundColor.value);
    if (isValidColor) {
      const [r, g, b, alpha] = convertToRGBA(backgroundColor.value);
      if (alpha > 0.2 && alpha < 1) {
        return `rgba(${r * 255}, ${g * 255}, ${b * 255}, 1)`;
      } else if (alpha === 1) {
        return backgroundColor.value;
      } else {
        return defaultBackgroundColor;
      }
    }
    return defaultBackgroundColor;
  });

  const animatedTabXPosition = useDerivedValue(() =>
    withSpring((animatedTabIndex.value % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2, SPRING_CONFIGS.slowSpring)
  );

  const animatedTabYPosition = useDerivedValue(() =>
    withSpring(Math.floor(animatedTabIndex.value / 2) * TAB_VIEW_ROW_HEIGHT - 181, SPRING_CONFIGS.slowSpring)
  );

  const animatedWebViewBackgroundColorStyle = useAnimatedStyle(() => ({
    backgroundColor: safeBackgroundColor.value,
  }));

  const animatedWebViewStyle = useAnimatedStyle(() => {
    const isTabBeingClosed = currentlyOpenTabIds.value.indexOf(tabId) === -1 && currentlyOpenTabIds.value.length !== 0;
    const animatedIsActiveTab = animatedActiveTabIndex.value === animatedTabIndex.value;

    const opacity = interpolate(tabViewProgress.value, [0, 100], [animatedIsActiveTab ? 1 : 0, 1], 'clamp');

    const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH;
    const scale = interpolate(
      tabViewProgress.value,
      [0, 100],
      [
        animatedIsActiveTab && !isTabBeingClosed ? 1 : TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH,
        0.7 - scaleDiff * (isTabBeingClosed ? 1 : animatedMultipleTabsOpen.value),
      ]
    );

    const xPositionStart = animatedIsActiveTab && !isTabBeingClosed ? 0 : animatedTabXPosition.value;
    const xPositionEnd = (isTabBeingClosed ? 1 : animatedMultipleTabsOpen.value) * animatedTabXPosition.value;
    const xPositionForTab = interpolate(tabViewProgress.value, [0, 100], [xPositionStart, xPositionEnd]);

    const yPositionStart =
      (animatedIsActiveTab && !isTabBeingClosed ? 0 : animatedTabYPosition.value + TAB_VIEW_EXTRA_TOP_PADDING) +
      (animatedIsActiveTab && !isTabBeingClosed ? (1 - tabViewProgress.value / 100) * scrollViewOffset.value : 0);
    const yPositionEnd =
      (animatedTabYPosition.value + TAB_VIEW_EXTRA_TOP_PADDING) * animatedMultipleTabsOpen.value +
      (animatedIsActiveTab ? (1 - tabViewProgress.value / 100) * scrollViewOffset.value : 0);
    const yPositionForTab = interpolate(tabViewProgress.value, [0, 100], [yPositionStart, yPositionEnd]);

    const shouldHideTab = !animatedIsActiveTab && tabViewProgress.value <= 1;

    return {
      opacity: shouldHideTab ? 0 : opacity,
      transform: [
        { translateX: shouldHideTab ? 0 : xPositionForTab + gestureX.value },
        { translateY: shouldHideTab ? 0 : yPositionForTab },
        { scale: shouldHideTab ? 0 : scale * gestureScale.value },
      ],
    };
  });

  const expensiveAnimatedWebViewStyles = useAnimatedStyle(() => {
    const isTabBeingClosed = currentlyOpenTabIds.value.indexOf(tabId) === -1;
    const animatedIsActiveTab = animatedActiveTabIndex.value === animatedTabIndex.value;

    const borderRadius = interpolate(
      tabViewProgress.value,
      [0, 100],
      // eslint-disable-next-line no-nested-ternary
      [animatedIsActiveTab ? ZOOMED_TAB_BORDER_RADIUS : animatedTabViewBorderRadius.value, animatedTabViewBorderRadius.value],
      'clamp'
    );

    return {
      borderRadius,
      height: animatedIsActiveTab ? animatedWebViewHeight.value : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
      // eslint-disable-next-line no-nested-ternary
      pointerEvents: isTabBeingClosed ? 'none' : tabViewVisible.value ? 'auto' : animatedIsActiveTab ? 'auto' : 'none',
    };
  });

  const zIndexAnimatedStyle = useAnimatedStyle(() => {
    const animatedIsActiveTab = animatedActiveTabIndex.value === animatedTabIndex.value;
    const wasCloseButtonPressed = gestureScale.value === 1 && gestureX.value < 0;

    const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH;
    const scaleWeighting =
      gestureScale.value *
      interpolate(
        tabViewProgress.value,
        [0, 100],
        [animatedIsActiveTab ? 1 : TAB_VIEW_COLUMN_WIDTH / DEVICE_WIDTH, 0.7 - scaleDiff * animatedMultipleTabsOpen.value],
        'clamp'
      );
    const zIndex = scaleWeighting * (animatedIsActiveTab || gestureScale.value > 1 ? 9999 : 1) + (wasCloseButtonPressed ? 9999 : 0);

    return { zIndex };
  });

  useAnimatedReaction(
    () => ({ currentlyOpenTabIds: currentlyOpenTabIds.value }),
    current => {
      const currentIndex = current.currentlyOpenTabIds.indexOf(tabId);
      // This allows us to give the tab its previous animated index when it's being closed, so that the close
      // animation is allowed to complete with the X and Y coordinates it had based on its last real index.
      if (currentIndex >= 0) {
        animatedTabIndex.value = currentIndex;
      }
    }
  );

  return {
    animatedTabIndex,
    animatedWebViewBackgroundColorStyle,
    animatedWebViewStyle,
    backgroundColor,
    expensiveAnimatedWebViewStyles,
    gestureScale,
    gestureX,
    zIndexAnimatedStyle,
  };
}
