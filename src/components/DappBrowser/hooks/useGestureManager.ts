import { useCallback, useRef } from 'react';
import { GestureResponderEvent, NativeSyntheticEvent } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { clamp } from '@/__swaps__/utils/swaps';
import { EXTRA_WEBVIEW_HEIGHT, GROW_WEBVIEW_THRESHOLD, SHRINK_WEBVIEW_THRESHOLD, WEBVIEW_HEIGHT } from '../Dimensions';
import { ActiveTabCloseGestures, BrowserContextType, GestureManagerState, TabViewGestureStates, WebViewScrollEvent } from '../types';

export function useGestureManager({
  activeTabId,
  activeTabInfo,
  extraWebViewHeight,
  lastActiveHomepageTab,
  shouldCollapseBottomBar,
  tabViewProgress,
  tabViewVisible,
}: Pick<
  BrowserContextType,
  | 'activeTabId'
  | 'activeTabInfo'
  | 'extraWebViewHeight'
  | 'lastActiveHomepageTab'
  | 'shouldCollapseBottomBar'
  | 'tabViewProgress'
  | 'tabViewVisible'
>) {
  const activeTabCloseGestures = useSharedValue<ActiveTabCloseGestures>({});
  const gestureManagerState = useSharedValue<GestureManagerState>('inactive');
  const pendingTabSwitchOffset = useSharedValue(0);
  const shouldToggleAfterTabSwitch = useSharedValue<boolean | number>(false);
  const tabSwitchGestureX = useSharedValue(0);
  const tabViewGestureHoldDuration = useSharedValue(0);
  const tabViewGestureProgress = useSharedValue(0);
  const tabViewGestureState = useSharedValue(TabViewGestureStates.INACTIVE);

  const scrollPositionRef = useRef<number | undefined>(undefined);
  const startScrollPositionRef = useRef<number | undefined>(undefined);
  const touchPositionYRef = useRef<number | undefined>(undefined);

  const onScrollWebView = useCallback(
    (event: NativeSyntheticEvent<WebViewScrollEvent>) => {
      const previousScrollY = scrollPositionRef.current;
      const scrollY = event.nativeEvent.contentOffset.y;

      scrollPositionRef.current = scrollY;

      const contentHeight = event.nativeEvent.contentSize.height;
      if (contentHeight < WEBVIEW_HEIGHT + EXTRA_WEBVIEW_HEIGHT) {
        shouldCollapseBottomBar.value = false;
        return;
      }

      if (startScrollPositionRef.current === undefined) return;
      if (startScrollPositionRef.current > contentHeight) {
        startScrollPositionRef.current = contentHeight;
      }

      const clampedScrollY = clamp(scrollY, 0, contentHeight);
      const scrollDelta = clampedScrollY - startScrollPositionRef.current;
      const isScrollingUp = scrollY - startScrollPositionRef.current < 0;
      const didScrollToTop = clampedScrollY === 0 && previousScrollY !== undefined && previousScrollY > 0;

      if (scrollDelta > GROW_WEBVIEW_THRESHOLD) {
        shouldCollapseBottomBar.value = true;
      } else if (scrollDelta < -SHRINK_WEBVIEW_THRESHOLD || (scrollY < 0 && isScrollingUp) || didScrollToTop) {
        shouldCollapseBottomBar.value = false;
      }
    },
    [shouldCollapseBottomBar]
  );

  const onTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      const isScrollingUp = touchPositionYRef.current && event.nativeEvent.pageY > touchPositionYRef.current;

      if (isScrollingUp && (scrollPositionRef.current === 0 || scrollPositionRef.current === undefined)) {
        shouldCollapseBottomBar.value = false;
      }

      touchPositionYRef.current = undefined;
    },
    [shouldCollapseBottomBar]
  );

  const onTouchMove = useCallback((event: GestureResponderEvent) => {
    const isScrollingUp = touchPositionYRef.current && event.nativeEvent.pageY > touchPositionYRef.current;
    touchPositionYRef.current = isScrollingUp ? event.nativeEvent.pageY - 1 : event.nativeEvent.pageY;

    if (startScrollPositionRef.current === undefined && scrollPositionRef.current !== undefined) {
      startScrollPositionRef.current = Math.max(0, scrollPositionRef.current);
    }
  }, []);

  const onTouchStart = useCallback(() => {
    if (scrollPositionRef.current !== undefined) {
      startScrollPositionRef.current = Math.max(0, scrollPositionRef.current);
    }
  }, []);

  const resetScrollHandlers = useCallback(() => {
    startScrollPositionRef.current = undefined;
    scrollPositionRef.current = undefined;
    touchPositionYRef.current = undefined;
  }, []);

  // Manages setting the last active homepage tab, which is used to determine which homepage should allow reordering favorites
  useAnimatedReaction(
    () => ({
      activeHomepageId: activeTabInfo.value.isOnHomepage ? activeTabId.value : null,
      tabSwitchGestureX: tabSwitchGestureX.value,
      tabViewProgress: tabViewProgress.value,
    }),
    (current, previous) => {
      if (!previous || !current.activeHomepageId || current.activeHomepageId === lastActiveHomepageTab.value || tabViewVisible.value)
        return;

      const didCloseTab =
        current.tabSwitchGestureX === 0 &&
        previous.tabSwitchGestureX === 0 &&
        current.tabViewProgress === 0 &&
        previous.tabViewProgress === 0;

      const didFinishSwitchingTabs =
        previous && current.tabSwitchGestureX === 0 && previous.tabSwitchGestureX !== 0 && current.tabViewProgress <= 1;

      const exitTabViewAnimationIsComplete =
        previous && !tabViewVisible.value && current.tabViewProgress <= 2 && previous.tabViewProgress > 2;

      if (didCloseTab || didFinishSwitchingTabs || exitTabViewAnimationIsComplete) {
        lastActiveHomepageTab.value = current.activeHomepageId;
      }
    },
    []
  );

  return {
    activeTabCloseGestures,
    extraWebViewHeight,
    gestureManagerState,
    pendingTabSwitchOffset,
    shouldCollapseBottomBar,
    shouldToggleAfterTabSwitch,
    tabSwitchGestureX,
    tabViewGestureHoldDuration,
    tabViewGestureProgress,
    tabViewGestureState,
    onScrollWebView,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    resetScrollHandlers,
  };
}
