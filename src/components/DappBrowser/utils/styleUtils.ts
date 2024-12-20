/* eslint-disable no-nested-ternary */
import { interpolate, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  MULTI_TAB_SCALE,
  MULTI_TAB_SCALE_DIFF,
  SINGLE_TAB_SCALE,
  TAB_SWITCH_HORIZONTAL_GAP,
  TAB_SWITCH_TAB_WIDTH,
  TAB_SWITCH_X_AMPLIFICATION,
  TAB_TRANSFORM_ORIGIN,
  TAB_VIEW_EXTRA_TOP_PADDING,
  WEBVIEW_HEIGHT,
} from '../Dimensions';
import {
  GestureProgressThresholds,
  HIDE_SURROUNDING_TABS_X_OFFSET,
  TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS,
} from '../hooks/useTabSwitchGestures';
import { TabViewGestureStates } from '../types';

/**
 * @worklet Calculates browser tab styles while the tab view gesture is inactive.
 *
 * @returns An animated style object to be returned from within `useAnimatedStyle`.
 */
export function getTabStyles({
  animatedIsActiveTab,
  animatedMultipleTabsOpen,
  animatedTabXPosition,
  animatedTabYPosition,
  currentlyBeingClosedTabIds,
  currentlyOpenTabIds,
  gestureScale,
  gestureX,
  scrollViewOffset,
  tabId,
  tabViewProgress,
}: {
  animatedIsActiveTab: boolean;
  animatedMultipleTabsOpen: number;
  animatedTabXPosition: number;
  animatedTabYPosition: number;
  currentlyBeingClosedTabIds: string[];
  currentlyOpenTabIds: string[];
  gestureScale: number;
  gestureX: number;
  scrollViewOffset: number;
  tabId: string;
  tabViewProgress: number;
}) {
  'worklet';
  const isTabBeingClosed = currentlyBeingClosedTabIds.includes(tabId) && currentlyOpenTabIds.length !== 0;

  const opacity = interpolate(tabViewProgress, [0, 100], [animatedIsActiveTab ? 1 : 0, 1], 'clamp');

  const scale = interpolate(
    tabViewProgress,
    [0, 100],
    [
      animatedIsActiveTab && !isTabBeingClosed ? 1 : MULTI_TAB_SCALE,
      SINGLE_TAB_SCALE - MULTI_TAB_SCALE_DIFF * (isTabBeingClosed ? 1 : animatedMultipleTabsOpen),
    ]
  );

  const xPositionStart = animatedIsActiveTab && !isTabBeingClosed ? 0 : animatedTabXPosition;
  const xPositionEnd = (isTabBeingClosed ? 1 : animatedMultipleTabsOpen) * animatedTabXPosition;
  const xPositionForTab = interpolate(tabViewProgress, [0, 100], [xPositionStart, xPositionEnd]);

  const yPositionStart =
    animatedIsActiveTab && !isTabBeingClosed ? 0 : -scrollViewOffset + animatedTabYPosition + TAB_VIEW_EXTRA_TOP_PADDING;
  const yPositionEnd = animatedTabYPosition * animatedMultipleTabsOpen - scrollViewOffset + TAB_VIEW_EXTRA_TOP_PADDING;

  const yPositionForTab =
    interpolate(tabViewProgress, [0, 100], [yPositionStart, yPositionEnd]) -
    ((gestureScale - 1) * COLLAPSED_WEBVIEW_HEIGHT_UNSCALED * MULTI_TAB_SCALE) / 2;

  const shouldHideTab = !animatedIsActiveTab && tabViewProgress <= 1;

  return {
    opacity: shouldHideTab ? 0 : opacity,
    transform: [
      { translateX: shouldHideTab ? 0 : xPositionForTab + gestureX },
      { translateY: shouldHideTab ? 0 : yPositionForTab },
      { scale: shouldHideTab ? 0 : scale * gestureScale },
    ],
    transformOrigin: TAB_TRANSFORM_ORIGIN,
  };
}

/**
 * @worklet Calculates browser tab styles while the tab view gesture is active.
 *
 * @returns An animated style object to be returned from within `useAnimatedStyle`.
 */
export function getTabSwitchGestureStyles({
  activeIndex,
  animatedIsActiveTab,
  animatedMultipleTabsOpen,
  animatedTabXPosition,
  animatedTabYPosition,
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
}: {
  activeIndex: number;
  animatedIsActiveTab: boolean;
  animatedMultipleTabsOpen: number;
  animatedTabXPosition: number;
  animatedTabYPosition: number;
  extraWebViewHeight: number;
  gestureScale: number;
  gestureX: number;
  isRunningEnterTabViewAnimation: boolean;
  pendingActiveIndex: number;
  pendingTabSwitchOffset: number;
  scrollViewOffset: number;
  tabIndex: number;
  tabSwitchGestureX: number;
  tabViewGestureHoldDuration: number;
  tabViewGestureProgress: number;
  tabViewGestureState: TabViewGestureStates;
  tabViewProgress: number;
}) {
  'worklet';
  const enterTabViewProgress = tabViewProgress / 100;
  const isRunningExitTabViewAnimation = tabViewGestureState === TabViewGestureStates.DRAG_END_EXITING;
  const minScale = SINGLE_TAB_SCALE - MULTI_TAB_SCALE_DIFF * animatedMultipleTabsOpen;

  const scale = animatedIsActiveTab
    ? interpolate(
        tabViewGestureProgress,
        [0, GestureProgressThresholds.CENTER_TAB_SCALE_END, 100, 110],
        [1, minScale, minScale, 1 - minScale * 1.1],
        isRunningEnterTabViewAnimation || isRunningExitTabViewAnimation ? 'extend' : 'clamp'
      )
    : interpolate(
        tabViewGestureProgress,
        [0, GestureProgressThresholds.LOCK_SURROUNDING_TABS_SCALE],
        [
          1,
          minScale +
            (1 - minScale) * (1 - GestureProgressThresholds.LOCK_SURROUNDING_TABS_SCALE / GestureProgressThresholds.CENTER_TAB_SCALE_END),
        ],
        'clamp'
      );

  const referenceScale = animatedIsActiveTab
    ? interpolate(
        tabViewGestureProgress,
        [0, GestureProgressThresholds.CENTER_TAB_SCALE_END, 100, 110],
        [
          1,
          minScale + (1 - minScale) * (1 - GestureProgressThresholds.CENTER_TAB_SCALE_END / 100),
          minScale + (1 - minScale) * (1 - GestureProgressThresholds.CENTER_TAB_SCALE_END / 100),
          1 - minScale * 1.1,
        ],
        isRunningEnterTabViewAnimation || isRunningExitTabViewAnimation ? 'extend' : 'clamp'
      )
    : interpolate(
        tabViewGestureProgress,
        [0, GestureProgressThresholds.LOCK_SURROUNDING_TABS_SCALE],
        [1, minScale + (1 - minScale) * (1 - GestureProgressThresholds.LOCK_SURROUNDING_TABS_SCALE / 100)],
        'clamp'
      );

  const adjustedScale = interpolate(tabViewProgress, [0, 100], [scale, minScale]);
  const activeIndexOffset = -TAB_SWITCH_TAB_WIDTH * activeIndex;
  const xPositionForTab = TAB_SWITCH_TAB_WIDTH * tabIndex + activeIndexOffset;

  const switchTabsXTranslation = tabSwitchGestureX * TAB_SWITCH_X_AMPLIFICATION;
  const currentHeight = WEBVIEW_HEIGHT + extraWebViewHeight;
  const scaleDiff = referenceScale - scale;
  const yPositionForTab = scaleDiff * currentHeight;

  const baseTranslateX =
    animatedIsActiveTab || tabViewGestureProgress < GestureProgressThresholds.HIDE_SURROUNDING_TABS
      ? xPositionForTab + switchTabsXTranslation
      : withSpring(
          xPositionForTab - (switchTabsXTranslation - (switchTabsXTranslation - TAB_SWITCH_TAB_WIDTH * pendingTabSwitchOffset)),
          SPRING_CONFIGS.tabSwitchConfig
        );

  const enterTabViewAnimationX = isRunningEnterTabViewAnimation ? animatedTabXPosition * animatedMultipleTabsOpen : 0;
  const enterTabViewAnimationY = isRunningEnterTabViewAnimation
    ? animatedTabYPosition * animatedMultipleTabsOpen + TAB_VIEW_EXTRA_TOP_PADDING
    : 0;

  const activeTabTranslateY = isRunningEnterTabViewAnimation
    ? enterTabViewAnimationY * enterTabViewProgress + yPositionForTab * (1 - enterTabViewProgress)
    : yPositionForTab;

  const isLeftOfPendingActiveTab = tabIndex < pendingActiveIndex;
  const isRightOfPendingActiveTab = tabIndex > pendingActiveIndex;

  const shouldRevealSurroundingTabs =
    (tabViewGestureState === TabViewGestureStates.ACTIVE && tabViewGestureHoldDuration === TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS) ||
    isRunningExitTabViewAnimation;

  const surroundingTabsXAdjustment =
    (!shouldRevealSurroundingTabs &&
      (isLeftOfPendingActiveTab ? -HIDE_SURROUNDING_TABS_X_OFFSET : isRightOfPendingActiveTab ? HIDE_SURROUNDING_TABS_X_OFFSET : 0)) ||
    0;

  const shouldForceFullOpacity =
    Math.abs(switchTabsXTranslation) > TAB_SWITCH_HORIZONTAL_GAP &&
    tabViewGestureProgress < GestureProgressThresholds.SKIP_SURROUNDING_TABS_ANIMATION &&
    tabViewGestureHoldDuration === TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS;

  const enteringTabViewOpacity = animatedIsActiveTab
    ? withSpring(1, SPRING_CONFIGS.tabSwitchConfig)
    : tabViewGestureProgress < GestureProgressThresholds.HIDE_SURROUNDING_TABS
      ? shouldRevealSurroundingTabs
        ? shouldForceFullOpacity
          ? 1
          : withSpring(1, SPRING_CONFIGS.snappierSpringConfig)
        : 0
      : withSpring(0, SPRING_CONFIGS.tabSwitchConfig);

  const opacity =
    scale === 1
      ? interpolate(
          xPositionForTab + switchTabsXTranslation,
          [
            -(TAB_SWITCH_TAB_WIDTH + 1),
            -TAB_SWITCH_TAB_WIDTH,
            -TAB_SWITCH_TAB_WIDTH,
            TAB_SWITCH_TAB_WIDTH,
            TAB_SWITCH_TAB_WIDTH,
            TAB_SWITCH_TAB_WIDTH + 1,
          ],
          [0, 0, 1, 1, 0, 0],
          'clamp'
        )
      : enteringTabViewOpacity;

  const closeTabGestureScale = isRunningEnterTabViewAnimation ? gestureScale : 1;
  const closeTabGestureYAdjustment = isRunningEnterTabViewAnimation
    ? -((gestureScale - 1) * COLLAPSED_WEBVIEW_HEIGHT_UNSCALED * MULTI_TAB_SCALE) / 2
    : 0;

  return {
    opacity,
    transform: [
      { translateX: isRunningEnterTabViewAnimation ? enterTabViewAnimationX * enterTabViewProgress + gestureX : 0 },
      { translateY: -scrollViewOffset * enterTabViewProgress + closeTabGestureYAdjustment },
      {
        translateY:
          animatedIsActiveTab || tabViewGestureProgress < GestureProgressThresholds.HIDE_SURROUNDING_TABS
            ? activeTabTranslateY
            : withSpring(0, SPRING_CONFIGS.tabSwitchConfig),
      },
      {
        translateX:
          isLeftOfPendingActiveTab || isRightOfPendingActiveTab
            ? withSpring(surroundingTabsXAdjustment, SPRING_CONFIGS.tabSwitchConfig)
            : 0,
      },
      { scale: adjustedScale * closeTabGestureScale },
      {
        scale:
          animatedIsActiveTab || tabViewGestureProgress < GestureProgressThresholds.HIDE_SURROUNDING_TABS
            ? 1
            : withSpring(1 / scale, SPRING_CONFIGS.tabSwitchConfig),
      },
      { translateX: isRunningEnterTabViewAnimation ? xPositionForTab * (1 - enterTabViewProgress) : baseTranslateX },
      {
        translateX: isRunningEnterTabViewAnimation
          ? switchTabsXTranslation -
            enterTabViewProgress * (switchTabsXTranslation - (switchTabsXTranslation + TAB_SWITCH_TAB_WIDTH * pendingTabSwitchOffset))
          : 0,
      },
    ],
    transformOrigin: TAB_TRANSFORM_ORIGIN,
  };
}
