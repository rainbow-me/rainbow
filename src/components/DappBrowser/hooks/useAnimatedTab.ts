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
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors, useColorMode } from '@/design-system';
import { useBrowserStore } from '@/state/browser/browserStore';
import { TabViewGestureStates, useBrowserContext } from '../BrowserContext';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  MULTI_TAB_SCALE,
  MULTI_TAB_SCALE_DIFF,
  SINGLE_TAB_SCALE,
  TAB_VIEW_COLUMN_WIDTH,
  TAB_VIEW_ROW_HEIGHT,
  ZOOMED_TAB_BORDER_RADIUS,
} from '../Dimensions';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT } from '../constants';
import { getTabStyles, getTabViewGestureStyles } from '../utils/layoutUtils';

export function useAnimatedTab({ tabId }: { tabId: string }) {
  const {
    activeTabInfo,
    animatedActiveTabIndex,
    animatedMultipleTabsOpen,
    animatedTabViewBorderRadius,
    animatedWebViewHeight,
    currentlyBeingClosedTabIds,
    currentlyOpenTabIds,
    extraWebViewHeight,
    isSwitchingTabs,
    pendingTabSwitchOffset,
    scrollViewOffset,
    tabSwitchGestureX,
    tabViewGestureHoldDuration,
    tabViewGestureProgress,
    tabViewGestureState,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();

  const animatedTabIndex = useSharedValue(useBrowserStore.getState().tabIds.indexOf(tabId));
  const gestureScale = useSharedValue(1);
  const gestureX = useSharedValue(0);

  const { isDarkMode } = useColorMode();
  const defaultBackgroundColor = isDarkMode ? '#191A1C' : globalColors.white100;
  const homepageBackgroundColor = isDarkMode ? HOMEPAGE_BACKGROUND_COLOR_DARK : HOMEPAGE_BACKGROUND_COLOR_LIGHT;

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
    withSpring(Math.floor(animatedTabIndex.value / 2) * TAB_VIEW_ROW_HEIGHT, SPRING_CONFIGS.slowSpring)
  );

  const animatedWebViewBackgroundColorStyle = useAnimatedStyle(() => ({
    backgroundColor: activeTabInfo.value.isOnHomepage ? homepageBackgroundColor : safeBackgroundColor.value,
  }));

  const animatedWebViewStyle = useAnimatedStyle(() => {
    const tabIndex = currentlyOpenTabIds.value.indexOf(tabId);
    const activeIndex = Math.abs(animatedActiveTabIndex.value);
    const pendingActiveIndex = activeIndex + pendingTabSwitchOffset.value;
    const isPendingActiveTab = pendingActiveIndex === tabIndex;
    const animatedIsActiveTab = isPendingActiveTab || currentlyOpenTabIds.value.length === 0;

    const enterTabViewProgress = tabViewProgress.value / 100;
    const isRunningEnterTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING;
    const shouldUseTabViewGestureStyles = isSwitchingTabs.value && (animatedIsActiveTab || !isRunningEnterTabViewAnimation);

    if (shouldUseTabViewGestureStyles) {
      return getTabViewGestureStyles({
        activeIndex,
        animatedIsActiveTab,
        animatedMultipleTabsOpen,
        animatedTabXPosition,
        animatedTabYPosition,
        enterTabViewProgress,
        extraWebViewHeight,
        gestureScale,
        gestureX,
        isRunningEnterTabViewAnimation,
        pendingActiveIndex,
        pendingTabSwitchOffset,
        scrollViewOffset,
        tabIndex,
        tabSwitchGestureX,
        tabViewGestureHoldDuration,
        tabViewGestureProgress,
        tabViewGestureState,
        tabViewProgress,
      });
    }

    return getTabStyles({
      animatedIsActiveTab,
      animatedMultipleTabsOpen,
      animatedTabXPosition,
      animatedTabYPosition,
      currentlyBeingClosedTabIds,
      currentlyOpenTabIds,
      enterTabViewProgress,
      gestureScale,
      gestureX,
      scrollViewOffset,
      tabId,
      tabViewProgress,
    });
  });

  const expensiveAnimatedWebViewStyles = useAnimatedStyle(() => {
    const isTabBeingClosed = currentlyBeingClosedTabIds.value.includes(tabId);
    const isRunningEnterTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING;

    const tabIndex = currentlyOpenTabIds.value.indexOf(tabId);
    const activeIndex = Math.abs(animatedActiveTabIndex.value);
    const pendingActiveIndex = activeIndex + pendingTabSwitchOffset.value;
    const isPendingActiveTab = pendingActiveIndex === tabIndex;
    const isFullSizeTab = isPendingActiveTab || (isSwitchingTabs.value && !isRunningEnterTabViewAnimation);

    const borderRadius = interpolate(
      isSwitchingTabs.value ? tabViewGestureProgress.value : tabViewProgress.value,
      [0, 0, 100],
      // eslint-disable-next-line no-nested-ternary
      [
        ZOOMED_TAB_BORDER_RADIUS,
        isFullSizeTab ? ZOOMED_TAB_BORDER_RADIUS : animatedTabViewBorderRadius.value,
        animatedTabViewBorderRadius.value,
      ],
      'clamp'
    );

    const height =
      isFullSizeTab || (!tabViewVisible.value && tabViewProgress.value <= 1)
        ? animatedWebViewHeight.value
        : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED;

    return {
      borderRadius,
      height,
      // eslint-disable-next-line no-nested-ternary
      pointerEvents: isTabBeingClosed
        ? 'none'
        : // eslint-disable-next-line no-nested-ternary
          tabViewVisible.value
          ? 'auto'
          : isPendingActiveTab && !isSwitchingTabs.value
            ? 'auto'
            : 'none',
    };
  });

  const zIndexAnimatedStyle = useAnimatedStyle(() => {
    const tabIndex = currentlyOpenTabIds.value.indexOf(tabId);
    const activeIndex = Math.abs(animatedActiveTabIndex.value);
    const pendingActiveIndex = activeIndex + pendingTabSwitchOffset.value;
    const isPendingActiveTab = pendingActiveIndex === tabIndex;

    const wasCloseButtonPressed = gestureScale.value === 1 && gestureX.value < 0;
    const isRunningEnterTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING;

    const scaleWeighting =
      gestureScale.value *
      interpolate(
        isRunningEnterTabViewAnimation ? tabViewGestureProgress.value : tabViewProgress.value,
        [0, 100],
        [
          isPendingActiveTab || isSwitchingTabs.value ? 1 : MULTI_TAB_SCALE,
          SINGLE_TAB_SCALE - MULTI_TAB_SCALE_DIFF * animatedMultipleTabsOpen.value,
        ],
        'clamp'
      );

    const zIndex = scaleWeighting * (isPendingActiveTab || gestureScale.value > 1 ? 9999 : 1) + (wasCloseButtonPressed ? 9999 : 0);

    return { zIndex };
  });

  useAnimatedReaction(
    () => currentlyOpenTabIds.value.indexOf(tabId),
    currentIndex => {
      // This allows us to give the tab its previous animated index when it's being closed, so that the close
      // animation is allowed to complete with the X and Y coordinates it had based on its last real index.
      if (currentIndex >= 0) {
        animatedTabIndex.value = currentIndex;
      }
    },
    []
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
