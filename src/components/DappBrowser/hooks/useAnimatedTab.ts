/* eslint-disable no-nested-ternary */
import {
  convertToRGBA,
  interpolate,
  isColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors, useColorMode } from '@/design-system';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  MULTI_TAB_SCALE,
  MULTI_TAB_SCALE_DIFF,
  SINGLE_TAB_SCALE,
  TAB_VIEW_COLUMN_WIDTH,
  TAB_VIEW_ROW_HEIGHT,
  WEBVIEW_HEIGHT,
  ZOOMED_TAB_BORDER_RADIUS,
} from '../Dimensions';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, RAINBOW_HOME } from '../constants';
import { TabViewGestureStates } from '../types';
import { getTabInfo } from '../utils/getTabInfo';
import { getTabStyles, getTabSwitchGestureStyles } from '../utils/styleUtils';

export function useAnimatedTab({ tabId }: { tabId: string }) {
  const {
    activeTabCloseGestures,
    animatedActiveTabIndex,
    animatedMultipleTabsOpen,
    animatedTabUrls,
    currentlyBeingClosedTabIds,
    currentlyOpenTabIds,
    extraWebViewHeight,
    pendingTabSwitchOffset,
    scrollViewOffset,
    tabSwitchGestureX,
    tabViewBorderRadius,
    tabViewGestureHoldDuration,
    tabViewGestureProgress,
    tabViewGestureState,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();
  const { closeTabWorklet } = useBrowserWorkletsContext();

  const animatedTabIndex = useSharedValue(useBrowserStore.getState().tabIds.indexOf(tabId));

  const animatedTabXPosition = useDerivedValue(() =>
    withSpring((animatedTabIndex.value % 2) * (TAB_VIEW_COLUMN_WIDTH + 20) - (TAB_VIEW_COLUMN_WIDTH + 20) / 2, SPRING_CONFIGS.slowSpring)
  );

  const animatedTabYPosition = useDerivedValue(() =>
    withSpring(Math.floor(animatedTabIndex.value / 2) * TAB_VIEW_ROW_HEIGHT, SPRING_CONFIGS.slowSpring)
  );

  const gestureScale = useDerivedValue(() =>
    activeTabCloseGestures.value[tabId]?.gestureScale === 0
      ? 0
      : withTiming(activeTabCloseGestures.value[tabId]?.gestureScale ?? 1, TIMING_CONFIGS.tabPressConfig)
  );

  const gestureX = useDerivedValue(() =>
    activeTabCloseGestures.value[tabId]?.isActive
      ? activeTabCloseGestures.value[tabId].gestureX
      : withTiming(activeTabCloseGestures.value[tabId]?.gestureX ?? 0, TIMING_CONFIGS.tabPressConfig, isFinished => {
          // Handle tab removal after tab close animation completion
          if (isFinished && currentlyBeingClosedTabIds.value.includes(tabId) && activeTabCloseGestures.value[tabId]) {
            // Zero out scale to ensure the tab is hidden while unmounting
            activeTabCloseGestures.modify(gestures => ({ ...gestures, [tabId]: { ...gestures[tabId], gestureScale: 0 } }));
            // Finalize tab close
            closeTabWorklet({ tabId, tabIndex: activeTabCloseGestures.value[tabId].tabIndex });
            currentlyBeingClosedTabIds.modify(closingTabs => {
              const index = closingTabs.indexOf(tabId);
              if (index !== -1) {
                closingTabs.splice(index, 1);
              }
              return closingTabs;
            });
          }
        })
  );

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

  const animatedWebViewBackgroundColorStyle = useAnimatedStyle(() => {
    const tabUrl = animatedTabUrls.value[tabId] || RAINBOW_HOME;
    const isOnHomepage = tabUrl === RAINBOW_HOME;

    const { isFullSizeTab } = getTabInfo({
      animatedActiveTabIndex: animatedActiveTabIndex.value,
      currentlyOpenTabIds: currentlyOpenTabIds.value,
      pendingTabSwitchOffset: pendingTabSwitchOffset.value,
      tabId,
      tabViewGestureState: tabViewGestureState.value,
      tabViewProgress: tabViewProgress.value,
    });

    return {
      backgroundColor: isOnHomepage ? homepageBackgroundColor : safeBackgroundColor.value,
    };
  });

  const animatedWebViewStyle = useAnimatedStyle(() => {
    const { isFullSizeTab, isPendingActiveTab: animatedIsActiveTab } = getTabInfo({
      animatedActiveTabIndex: animatedActiveTabIndex.value,
      currentlyOpenTabIds: currentlyOpenTabIds.value,
      pendingTabSwitchOffset: pendingTabSwitchOffset.value,
      tabId,
      tabViewGestureState: tabViewGestureState.value,
      tabViewProgress: tabViewProgress.value,
    });

    const activeIndex = Math.abs(animatedActiveTabIndex.value);
    const pendingActiveIndex = activeIndex + pendingTabSwitchOffset.value;
    const tabIndex = currentlyOpenTabIds.value.indexOf(tabId);
    const isRunningEnterTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING;
    const isSwitchingTabs = tabViewGestureState.value !== TabViewGestureStates.INACTIVE;

    const borderRadius = interpolate(
      isSwitchingTabs && isFullSizeTab ? tabViewGestureProgress.value : tabViewProgress.value,
      [0, 0, 100],
      [ZOOMED_TAB_BORDER_RADIUS, isFullSizeTab ? ZOOMED_TAB_BORDER_RADIUS : tabViewBorderRadius.value, tabViewBorderRadius.value],
      'clamp'
    );
    const height = interpolate(
      tabViewProgress.value,
      [0, 100],
      [isFullSizeTab ? WEBVIEW_HEIGHT + extraWebViewHeight.value : COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, COLLAPSED_WEBVIEW_HEIGHT_UNSCALED],
      'clamp'
    );

    const isTabBeingClosed = !currentlyOpenTabIds.value.includes(tabId);
    const pointerEvents = isTabBeingClosed
      ? 'none'
      : tabViewVisible.value
        ? 'auto'
        : animatedIsActiveTab && !isSwitchingTabs
          ? 'auto'
          : 'none';

    const shouldUseTabSwitchStyles = tabViewGestureState.value !== TabViewGestureStates.INACTIVE && isFullSizeTab;

    return {
      borderRadius,
      height,
      pointerEvents,
      ...(shouldUseTabSwitchStyles
        ? getTabSwitchGestureStyles({
            activeIndex,
            animatedIsActiveTab,
            animatedMultipleTabsOpen: animatedMultipleTabsOpen.value,
            animatedTabXPosition: animatedTabXPosition.value,
            animatedTabYPosition: animatedTabYPosition.value,
            extraWebViewHeight: extraWebViewHeight.value,
            gestureScale: gestureScale.value,
            gestureX: gestureX.value,
            isRunningEnterTabViewAnimation,
            pendingActiveIndex,
            pendingTabSwitchOffset: pendingTabSwitchOffset.value,
            scrollViewOffset: scrollViewOffset.value,
            tabIndex,
            tabSwitchGestureX: tabSwitchGestureX.value,
            tabViewGestureHoldDuration: tabViewGestureHoldDuration.value,
            tabViewGestureProgress: tabViewGestureProgress.value,
            tabViewGestureState: tabViewGestureState.value,
            tabViewProgress: tabViewProgress.value,
          })
        : getTabStyles({
            animatedIsActiveTab,
            animatedMultipleTabsOpen: animatedMultipleTabsOpen.value,
            animatedTabXPosition: animatedTabXPosition.value,
            animatedTabYPosition: animatedTabYPosition.value,
            currentlyBeingClosedTabIds: currentlyBeingClosedTabIds.value,
            currentlyOpenTabIds: currentlyOpenTabIds.value,
            gestureScale: gestureScale.value,
            gestureX: gestureX.value,
            scrollViewOffset: scrollViewOffset.value,
            tabId,
            tabViewProgress: tabViewProgress.value,
          })),
    };
  });

  const zIndexAnimatedStyle = useAnimatedStyle(() => {
    const { isFullSizeTab, isPendingActiveTab } = getTabInfo({
      animatedActiveTabIndex: animatedActiveTabIndex.value,
      currentlyOpenTabIds: currentlyOpenTabIds.value,
      pendingTabSwitchOffset: pendingTabSwitchOffset.value,
      tabId,
      tabViewGestureState: tabViewGestureState.value,
      tabViewProgress: tabViewProgress.value,
    });

    const isRunningEnterTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING;

    const scaleWeighting =
      gestureScale.value *
      interpolate(
        isRunningEnterTabViewAnimation ? tabViewGestureProgress.value : tabViewProgress.value,
        [0, 100],
        [isFullSizeTab ? 1 : MULTI_TAB_SCALE, SINGLE_TAB_SCALE - MULTI_TAB_SCALE_DIFF * animatedMultipleTabsOpen.value],
        'clamp'
      );

    const wasCloseButtonPressed = gestureScale.value === 1 && gestureX.value < 0;
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
    animatedWebViewBackgroundColorStyle,
    animatedWebViewStyle,
    backgroundColor,
    zIndexAnimatedStyle,
  };
}
