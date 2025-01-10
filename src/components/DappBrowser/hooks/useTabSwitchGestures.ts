import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, interpolate, runOnJS, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { clamp } from '@/__swaps__/utils/swaps';
import { useBrowserContext } from '../BrowserContext';
import {
  MULTI_TAB_SCALE,
  SINGLE_TAB_SCALE,
  TAB_SWITCH_HORIZONTAL_GAP,
  TAB_SWITCH_TAB_WIDTH,
  TAB_SWITCH_X_AMPLIFICATION,
  WEBVIEW_HEIGHT,
} from '../Dimensions';
import { RAINBOW_HOME } from '../constants';
import { TabViewGestureStates } from '../types';
import { generateUniqueIdWorklet } from '../utils';

export const HIDE_SURROUNDING_TABS_X_OFFSET = 100;
export const TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS = 500;

const ACTIVATION_DISTANCE_Y = 16;
const DEFAULT_TO_ENTERING_TAB_VIEW_THRESHOLD = 25;
const VELOCITY_FACTOR_Y = 0.25;
const VELOCITY_THRESHOLD_X = 300;
const VELOCITY_THRESHOLD_Y = 400;

export enum GestureProgressThresholds {
  CENTER_TAB_SCALE_END = 80,
  HIDE_SURROUNDING_TABS = 70,
  LOCK_SURROUNDING_TABS_SCALE = 50,
  SKIP_SURROUNDING_TABS_ANIMATION = 5,
}

export const useTabSwitchGestures = () => {
  const {
    activeTabId,
    animatedActiveTabIndex,
    animatedTabUrls,
    currentlyOpenTabIds,
    extraWebViewHeight,
    multipleTabsOpen,
    pendingTabSwitchOffset,
    searchViewProgress,
    shouldToggleAfterTabSwitch,
    tabSwitchGestureX,
    tabViewGestureHoldDuration,
    tabViewGestureProgress,
    tabViewGestureState,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();

  const initialTabSwitchGestureX = useSharedValue(0);

  const setActiveTabIndex = useBrowserStore(state => state.setActiveTabIndex);

  const tabSwitchGestureHandler = useMemo(
    () =>
      Gesture.Pan()
        .onChange(e => {
          if (tabViewGestureState.value !== TabViewGestureStates.ACTIVE) {
            tabViewGestureState.value = TabViewGestureStates.ACTIVE;
          }

          const xChange = initialTabSwitchGestureX.value + e.translationX;
          tabSwitchGestureX.value = xChange;

          const currentHeight = WEBVIEW_HEIGHT + extraWebViewHeight.value;
          const maxYChange = currentHeight - currentHeight * (multipleTabsOpen.value ? MULTI_TAB_SCALE : SINGLE_TAB_SCALE);
          const yChange = clamp(-e.translationY - ACTIVATION_DISTANCE_Y, 0, maxYChange);
          const normalizedYChange = yChange / maxYChange;

          const interpolatedTabViewProgress = interpolate(normalizedYChange, [0, 1], [0, 100], 'clamp');
          const newTabViewGestureProgress = clamp(interpolatedTabViewProgress, 0, 95);
          tabViewGestureProgress.value = newTabViewGestureProgress;

          const switchTabsXTranslation = xChange * TAB_SWITCH_X_AMPLIFICATION;
          const shouldRevealSurroundingTabs =
            Math.abs(switchTabsXTranslation) > TAB_SWITCH_HORIZONTAL_GAP &&
            newTabViewGestureProgress < GestureProgressThresholds.SKIP_SURROUNDING_TABS_ANIMATION;

          if (shouldRevealSurroundingTabs && tabViewGestureHoldDuration.value !== TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS) {
            tabViewGestureHoldDuration.value = TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS;
          }
        })
        .onEnd(e => {
          const originalRawActiveIndex = animatedActiveTabIndex.value;
          const currentActiveIndex = Math.abs(originalRawActiveIndex);
          const currentOffset = -tabSwitchGestureX.value * TAB_SWITCH_X_AMPLIFICATION;
          const pendingIndex = currentActiveIndex + pendingTabSwitchOffset.value;

          const xVelocity = e.velocityX;
          const yVelocity = e.velocityY;

          const isFirstTab = pendingIndex === 0;
          const isLastTab = pendingIndex === currentlyOpenTabIds.value.length - 1;
          const canCreateNewTab =
            isLastTab && (animatedTabUrls.value[currentlyOpenTabIds.value[pendingIndex]] || RAINBOW_HOME) !== RAINBOW_HOME;

          // Calculate the effective active index based on the current offset
          const effectiveActiveIndex = clamp(
            currentActiveIndex + Math.round(currentOffset / TAB_SWITCH_TAB_WIDTH),
            0,
            canCreateNewTab ? currentlyOpenTabIds.value.length : currentlyOpenTabIds.value.length - 1
          );

          let newTabId: string | undefined;
          let targetIndex = pendingIndex;
          let targetOffset = TAB_SWITCH_TAB_WIDTH * pendingTabSwitchOffset.value;

          const isXGreaterThanYVelocity =
            tabViewGestureProgress.value < GestureProgressThresholds.HIDE_SURROUNDING_TABS &&
            Math.abs(xVelocity * (VELOCITY_THRESHOLD_X / VELOCITY_THRESHOLD_Y)) > Math.abs(yVelocity);

          const shouldLockToXAxis = Math.abs(tabSwitchGestureX.value) > 5;
          const allowUpwardSwipe = !shouldLockToXAxis || tabViewGestureProgress.value > 0;

          const didSwipeDown = !isXGreaterThanYVelocity && tabViewGestureProgress.value > 0 && yVelocity > VELOCITY_THRESHOLD_Y;
          const didSwipeUp = !isXGreaterThanYVelocity && allowUpwardSwipe && yVelocity < -VELOCITY_THRESHOLD_Y;
          const didSwipeToNextTab = isXGreaterThanYVelocity && xVelocity < -VELOCITY_THRESHOLD_X;
          const didSwipeToPreviousTab = isXGreaterThanYVelocity && xVelocity > VELOCITY_THRESHOLD_X;

          const isBeyondEnterTabViewThreshold = tabViewGestureProgress.value > DEFAULT_TO_ENTERING_TAB_VIEW_THRESHOLD;
          const isNextTabActive = effectiveActiveIndex > pendingIndex;
          const isPreviousTabActive = effectiveActiveIndex < pendingIndex;

          const shouldSwitchToPreviousTab =
            !isFirstTab &&
            ((didSwipeToPreviousTab && !isNextTabActive) || (!didSwipeToNextTab && isPreviousTabActive && !isBeyondEnterTabViewThreshold));

          const shouldSwitchToNextTab =
            (!isLastTab || canCreateNewTab) &&
            ((didSwipeToNextTab && !isPreviousTabActive) || (!didSwipeToPreviousTab && isNextTabActive && !isBeyondEnterTabViewThreshold));

          if (shouldSwitchToPreviousTab) {
            // Register a pending switch to the previous tab
            targetIndex -= 1;
            targetOffset -= TAB_SWITCH_TAB_WIDTH;
            pendingTabSwitchOffset.value -= 1;
          } else if (shouldSwitchToNextTab) {
            // Create a new tab if needed and register a pending switch to the next tab
            if (isLastTab) {
              currentlyOpenTabIds.modify(value => {
                newTabId = generateUniqueIdWorklet();
                value.push(newTabId);
                return value;
              });
            }
            targetIndex += 1;
            targetOffset += TAB_SWITCH_TAB_WIDTH;
            pendingTabSwitchOffset.value += 1;
          }

          // Reset gesture hold timer
          tabViewGestureHoldDuration.value = 0;

          const progressDestination = isBeyondEnterTabViewThreshold ? 100 : 0;
          const isEnteringTabView = didSwipeUp || progressDestination === 100;
          const xDestination = (targetOffset === 0 ? 0 : -targetOffset) / TAB_SWITCH_X_AMPLIFICATION;

          // Animate to the target tab
          tabSwitchGestureX.value = withSpring(
            xDestination,
            { ...(isEnteringTabView ? SPRING_CONFIGS.tabGestureConfig : SPRING_CONFIGS.tabSwitchConfig), velocity: xVelocity },
            isFinished => {
              if (isFinished) {
                const newActiveTabId = newTabId || currentlyOpenTabIds.value[targetIndex];
                const isNewActiveTabPending = tabViewVisible.value && typeof shouldToggleAfterTabSwitch.value === 'number';

                const shouldSetNewActiveTabId =
                  !!newActiveTabId &&
                  !isNewActiveTabPending &&
                  newActiveTabId !== activeTabId.value &&
                  animatedActiveTabIndex.value === originalRawActiveIndex;

                const shouldActivateTab = !tabViewVisible.value || targetIndex === 0 || activeTabId.value === newActiveTabId;
                const indexForNewTab = shouldActivateTab ? targetIndex : -targetIndex;

                const resetAnimationValues = () => {
                  if (tabViewGestureProgress.value === 0) tabViewGestureState.value = TabViewGestureStates.INACTIVE;
                  tabSwitchGestureX.value = 0;
                  pendingTabSwitchOffset.value = 0;
                };

                if (shouldSetNewActiveTabId) {
                  runOnJS(setActiveTabIndex)(indexForNewTab);
                  resetAnimationValues();
                  animatedActiveTabIndex.value = indexForNewTab;
                  if (shouldActivateTab) activeTabId.value = newActiveTabId;
                } else {
                  resetAnimationValues();
                }
              }
            }
          );

          // Determine whether to enter or exit the tab view
          const onComplete = (isFinished?: boolean) => {
            if (isFinished) {
              const isTabSwitchAnimationPending = tabSwitchGestureX.value !== 0 && !isEnteringTabView && !tabViewVisible.value;

              if (!isTabSwitchAnimationPending) tabViewGestureState.value = TabViewGestureStates.INACTIVE;
              tabViewGestureProgress.value = 0;
            }
          };

          const velocityDamper = interpolate(tabViewGestureProgress.value, [0, 25, 80, 100], [1, 1, 0, 0], 'clamp');

          if (didSwipeUp) {
            tabViewGestureState.value = TabViewGestureStates.DRAG_END_ENTERING;
            tabViewVisible.value = true;

            tabViewProgress.value = withSpring(100, {
              ...SPRING_CONFIGS.tabGestureConfig,
              velocity: -yVelocity * VELOCITY_FACTOR_Y * velocityDamper,
            });
            tabViewGestureProgress.value = withSpring(
              100,
              { ...SPRING_CONFIGS.tabGestureConfig, velocity: -yVelocity * VELOCITY_FACTOR_Y * velocityDamper },
              onComplete
            );
            return;
          } else if (didSwipeDown || shouldSwitchToPreviousTab || shouldSwitchToNextTab) {
            tabViewGestureState.value = TabViewGestureStates.DRAG_END_EXITING;
            tabViewVisible.value = false;

            tabViewProgress.value = withSpring(0, {
              ...SPRING_CONFIGS.tabGestureConfig,
              velocity: -yVelocity * VELOCITY_FACTOR_Y * velocityDamper,
            });
            tabViewGestureProgress.value = withSpring(
              0,
              { ...SPRING_CONFIGS.tabGestureConfig, velocity: -yVelocity * VELOCITY_FACTOR_Y * velocityDamper },
              onComplete
            );
            return;
          } else if ((!isBeyondEnterTabViewThreshold && tabViewVisible.value) || (isBeyondEnterTabViewThreshold && !tabViewVisible.value)) {
            tabViewVisible.value = !tabViewVisible.value;
          }

          const gestureStateNeedsReset =
            tabSwitchGestureX.value === 0 &&
            progressDestination === 0 &&
            tabViewGestureProgress.value === 0 &&
            tabViewProgress.value === 0 &&
            tabViewGestureState.value !== TabViewGestureStates.INACTIVE;

          if (gestureStateNeedsReset) {
            tabViewGestureState.value = TabViewGestureStates.INACTIVE;
          } else {
            tabViewGestureState.value = isEnteringTabView ? TabViewGestureStates.DRAG_END_ENTERING : TabViewGestureStates.DRAG_END_EXITING;
            tabViewProgress.value = withSpring(progressDestination, SPRING_CONFIGS.tabSwitchConfig);
            tabViewGestureProgress.value = withSpring(progressDestination, SPRING_CONFIGS.tabSwitchConfig, onComplete);
          }
        })
        .onStart(() => {
          if (searchViewProgress.value) return;
          tabViewGestureState.value = TabViewGestureStates.ACTIVE;
          tabViewGestureHoldDuration.value = 0;
          tabViewGestureHoldDuration.value = withTiming(TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS, {
            duration: TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS,
            easing: Easing.linear,
          });
          shouldToggleAfterTabSwitch.value = false;
          initialTabSwitchGestureX.value = tabSwitchGestureX.value;
        })
        .onTouchesDown((_, manager) => {
          if (searchViewProgress.value) manager.fail();
        }),
    [
      activeTabId,
      animatedActiveTabIndex,
      animatedTabUrls,
      currentlyOpenTabIds,
      extraWebViewHeight,
      initialTabSwitchGestureX,
      multipleTabsOpen,
      pendingTabSwitchOffset,
      searchViewProgress,
      setActiveTabIndex,
      shouldToggleAfterTabSwitch,
      tabSwitchGestureX,
      tabViewGestureHoldDuration,
      tabViewGestureProgress,
      tabViewGestureState,
      tabViewProgress,
      tabViewVisible,
    ]
  );

  return { tabSwitchGestureHandler };
};
