import { useCallback, useEffect, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  dispatchCommand,
  runOnUI,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { IS_ANDROID, IS_IOS } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { TAB_VIEW_ROW_HEIGHT } from '../Dimensions';
import { RAINBOW_HOME } from '../constants';
import {
  determineGestureType,
  determineTapResult,
  handleGestureEnd,
  resetTabCloseGestures,
  updateTabGestureState,
} from '../utils/gestureUtils';
import { calculateScrollPositionToCenterTab } from '../utils/layoutUtils';
import { TabHitResult, tabHitTest } from '../utils/tabHitTest';
import { useBrowserStore } from '@/state/browser/browserStore';

const ENABLE_PAN_LOGS = false;
const ENABLE_SCROLL_VIEW_LOGS = false;

export function useBrowserScrollView() {
  const {
    activeTabCloseGestures,
    animatedActiveTabIndex,
    animatedTabUrls,
    currentlyBeingClosedTabIds,
    currentlyOpenTabIds,
    gestureManagerState,
    multipleTabsOpen,
    scrollViewOffset,
    scrollViewRef,
    tabViewVisible,
  } = useBrowserContext();
  const { toggleTabViewWorklet } = useBrowserWorkletsContext();

  const touchInfo = useSharedValue<{ initialTappedTab: TabHitResult | null; timestamp: number; x: number; y: number } | undefined>(
    undefined
  );

  const scrollViewHeight = useDerivedValue(() => {
    const numberOfTabs = _WORKLET ? currentlyOpenTabIds.value.length : useBrowserStore.getState().tabIds.length;
    const height = Math.max(
      Math.ceil(numberOfTabs / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 165 + 28 + (IS_ANDROID ? 35 : 0),
      DEVICE_HEIGHT
    );
    return withSpring(height, SPRING_CONFIGS.slowSpring);
  });

  const scrollViewContainerStyle = useAnimatedStyle(() => {
    const disableScroll = _WORKLET ? !tabViewVisible.value : true;
    return {
      pointerEvents: disableScroll ? 'none' : 'auto',
      zIndex: disableScroll ? -1 : 10000,
    };
  });

  const scrollViewStyle = useAnimatedStyle(() => ({ height: scrollViewHeight.value }));
  const gestureManagerStyle = useAnimatedStyle(() => ({ pointerEvents: _WORKLET && tabViewVisible.value ? 'auto' : 'box-none' }));
  const animatedProps = useAnimatedProps(() => ({ scrollEnabled: _WORKLET && tabViewVisible.value }));

  const closeTab = useCallback(
    (tabId: string, tabIndex: number, velocityX: number | undefined) => {
      'worklet';
      let xDestination: number;

      if (velocityX !== undefined) {
        // Closed via swipe gesture
        xDestination = -Math.min(Math.max(DEVICE_WIDTH, DEVICE_WIDTH + Math.abs(velocityX * 0.2)), 1200);
      } else {
        // X button press
        triggerHaptics('soft');
        const isOnlyOneTabOpen = currentlyOpenTabIds.value.length === 1;
        const isTabInLeftColumn = tabIndex % 2 === 0 && !isOnlyOneTabOpen;
        xDestination = isTabInLeftColumn ? -DEVICE_WIDTH / 1.5 : -DEVICE_WIDTH;
      }

      // Register that the tab is starting to close
      currentlyOpenTabIds.modify(openTabs => {
        const index = openTabs.indexOf(tabId);
        if (index !== -1) {
          currentlyBeingClosedTabIds.modify(closingTabs => {
            closingTabs.push(tabId);
            return closingTabs;
          });
          openTabs.splice(index, 1);
        }
        return openTabs;
      });

      updateTabGestureState(activeTabCloseGestures, {
        gestureScale: 1,
        gestureX: xDestination,
        isActive: false,
        tabId,
        tabIndex,
      });
    },
    [activeTabCloseGestures, currentlyBeingClosedTabIds, currentlyOpenTabIds]
  );

  const gestureManager = useMemo(() => {
    // Native ScrollView Gesture
    const nativeScrollViewGesture = Gesture.Native()
      .onTouchesDown((_, manager) => {
        if (ENABLE_SCROLL_VIEW_LOGS) console.log('[ScrollView Gesture] TOUCH DOWN');

        if (gestureManagerState.value === 'active') manager.fail();
      })
      .onTouchesMove((_, manager) => {
        if (ENABLE_SCROLL_VIEW_LOGS) console.log('[ScrollView Gesture] TOUCH MOVE');

        if (gestureManagerState.value === 'active') manager.fail();
      });

    // Custom Pan Gesture
    const manualPanGesture = Gesture.Pan()
      .blocksExternalGesture(nativeScrollViewGesture)
      .manualActivation(true)
      .onTouchesDown((e, manager) => {
        if (ENABLE_PAN_LOGS) console.log('[Pan Gesture] TOUCH DOWN');

        const areMultipleTouchesActive = e.allTouches.length > 1;

        if (!tabViewVisible.value || areMultipleTouchesActive) {
          manager.fail();
          gestureManagerState.value = 'inactive';
          return;
        }

        manager.begin();
        gestureManagerState.value = 'pending';

        const tappedTab = tabHitTest(
          e.changedTouches[0].absoluteX,
          e.changedTouches[0].absoluteY,
          scrollViewOffset.value,
          currentlyOpenTabIds.value
        );

        touchInfo.value = {
          initialTappedTab: tappedTab,
          timestamp: performance.now(),
          x: e.changedTouches[0].absoluteX,
          y: e.changedTouches[0].absoluteY,
        };
      })

      .onTouchesMove((e, manager) => {
        if (ENABLE_PAN_LOGS) console.log('[Pan Gesture] TOUCH MOVE');

        const decision = determineGestureType({
          currentX: e.changedTouches[0].absoluteX,
          currentY: e.changedTouches[0].absoluteY,
          gestureState: gestureManagerState.value,
          touchInfo: touchInfo.value,
          activeTabCloseGestures: activeTabCloseGestures.value,
        });

        switch (decision.type) {
          case 'beginScroll':
            manager.fail();
            gestureManagerState.value = 'inactive';
            touchInfo.value = undefined;
            return;

          case 'beginClose': {
            if (!decision.tabInfo) return;

            // Handle iOS scroll bounce
            if (gestureManagerState.value === 'pending') {
              if (IS_IOS) {
                if (scrollViewOffset.value < 0) {
                  // Snap back to top
                  dispatchCommand(scrollViewRef, 'scrollTo', [0, 0, true]);
                } else if (scrollViewOffset.value + DEVICE_HEIGHT > scrollViewHeight.value) {
                  // Snap back to bottom
                  const lastTabIndex = currentlyOpenTabIds.value.length - 1;
                  dispatchCommand(scrollViewRef, 'scrollTo', [
                    0,
                    calculateScrollPositionToCenterTab(lastTabIndex, currentlyOpenTabIds.value.length),
                    true,
                  ]);
                }
              }

              manager.activate();
              gestureManagerState.value = 'active';
            }

            updateTabGestureState(activeTabCloseGestures, {
              gestureScale: 1.1,
              gestureX: decision.translationX ?? 0,
              isActive: true,
              tabId: decision.tabInfo.tabId,
              tabIndex: decision.tabInfo.tabIndex,
            });
            break;
          }

          case 'continueClose': {
            if (!decision.tabInfo) return;

            updateTabGestureState(activeTabCloseGestures, {
              gestureScale: 1.1,
              gestureX: decision.translationX ?? 0,
              isActive: true,
              tabId: decision.tabInfo.tabId,
              tabIndex: decision.tabInfo.tabIndex,
            });
            break;
          }

          case 'ignore':
            break;
        }
      })

      .onTouchesCancelled((_, manager) => {
        if (ENABLE_PAN_LOGS) console.log('[Pan Gesture] TOUCH CANCELLED');

        resetTabCloseGestures({ activeTabCloseGestures, currentlyBeingClosedTabIds: currentlyBeingClosedTabIds.value });

        manager.fail();
        gestureManagerState.value = 'inactive';
        touchInfo.value = undefined;
      })

      .onTouchesUp((e, manager) => {
        if (ENABLE_PAN_LOGS) console.log('[Pan Gesture] TOUCH UP');

        const result = determineTapResult({
          currentTouch: {
            x: e.changedTouches[0].absoluteX,
            y: e.changedTouches[0].absoluteY,
          },
          gestureState: gestureManagerState.value,
          tabViewVisible: tabViewVisible.value,
          touchInfo: touchInfo.value,
        });

        switch (result.type) {
          case 'close':
            gestureManagerState.value = 'inactive';
            closeTab(result.tabInfo.tabId, result.tabInfo.tabIndex, undefined);
            touchInfo.value = undefined;
            break;

          case 'select':
            gestureManagerState.value = 'inactive';
            toggleTabViewWorklet(result.tabInfo.tabIndex);
            touchInfo.value = undefined;
            break;

          case 'ignore':
            resetTabCloseGestures({ activeTabCloseGestures, currentlyBeingClosedTabIds: currentlyBeingClosedTabIds.value });
            break;
        }

        manager.end();
        gestureManagerState.value = 'inactive';
        touchInfo.value = undefined;
      })

      .onEnd((e, success) => {
        if (ENABLE_PAN_LOGS) console.log('[Pan Gesture] ON END');

        if (!touchInfo.value?.initialTappedTab || !success) {
          resetTabCloseGestures({ activeTabCloseGestures, currentlyBeingClosedTabIds: currentlyBeingClosedTabIds.value });
          gestureManagerState.value = 'inactive';
          touchInfo.value = undefined;
          return;
        }

        const { tabId, tabIndex } = touchInfo.value.initialTappedTab;
        const url = animatedTabUrls.value[tabId] || RAINBOW_HOME;

        const { shouldClose } = handleGestureEnd({
          multipleTabsOpen: multipleTabsOpen.value,
          tabViewVisible: tabViewVisible.value,
          translationX: e.translationX,
          url,
          velocityX: e.velocityX,
        });

        if (shouldClose) closeTab(tabId, tabIndex, e.velocityX);
        else resetTabCloseGestures({ activeTabCloseGestures, currentlyBeingClosedTabIds: currentlyBeingClosedTabIds.value });
      });

    return Gesture.Simultaneous(manualPanGesture, nativeScrollViewGesture);
  }, [
    activeTabCloseGestures,
    animatedTabUrls,
    closeTab,
    currentlyBeingClosedTabIds,
    currentlyOpenTabIds,
    gestureManagerState,
    multipleTabsOpen,
    scrollViewHeight,
    scrollViewOffset,
    scrollViewRef,
    touchInfo,
    tabViewVisible,
    toggleTabViewWorklet,
  ]);

  // Vertically centers the active tab when the browser is mounted
  useEffect(() => {
    runOnUI(() => {
      dispatchCommand(scrollViewRef, 'scrollTo', [
        0,
        calculateScrollPositionToCenterTab(animatedActiveTabIndex.value, currentlyOpenTabIds.value.length),
        false,
      ]);
    })();
  }, [animatedActiveTabIndex, currentlyOpenTabIds, scrollViewRef]);

  return { animatedProps, gestureManager, scrollViewContainerStyle, scrollViewStyle, gestureManagerStyle };
}
