import { DerivedValue, SharedValue, interpolate, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { TabViewGestureStates } from '../BrowserContext';
import { X_BUTTON_PADDING, X_BUTTON_SIZE } from '../CloseTabButton';
import {
  COLLAPSED_WEBVIEW_HEIGHT_UNSCALED,
  INVERTED_MULTI_TAB_SCALE_DIFF,
  INVERTED_SINGLE_TAB_SCALE,
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
import { GestureProgressThresholds, HIDE_SURROUNDING_TABS_X_OFFSET, TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS } from '../hooks/useTabViewGestures';

/**
 * @worklet Calculates the border radius for the minimized tab to achieve concentric
 * corners around the close button.
 *
 * @param animatedMultipleTabsOpen The animated state of multiple tabs being open, represented as a number.
 * @returns The calculated border radius for the tab view.
 */
export function calculateTabViewBorderRadius(animatedMultipleTabsOpen: number): number {
  'worklet';
  const invertedScale = INVERTED_SINGLE_TAB_SCALE - INVERTED_MULTI_TAB_SCALE_DIFF * animatedMultipleTabsOpen;
  const spaceToXButton = invertedScale * X_BUTTON_PADDING;
  const xButtonBorderRadius = (X_BUTTON_SIZE / 2) * invertedScale;
  const tabViewBorderRadius = xButtonBorderRadius + spaceToXButton;

  return tabViewBorderRadius;
}

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
  enterTabViewProgress,
  gestureScale,
  gestureX,
  scrollViewOffset,
  tabId,
  tabViewProgress,
}: {
  animatedIsActiveTab: boolean;
  animatedMultipleTabsOpen: DerivedValue<number>;
  animatedTabXPosition: DerivedValue<number>;
  animatedTabYPosition: DerivedValue<number>;
  currentlyBeingClosedTabIds: SharedValue<string[]>;
  currentlyOpenTabIds: SharedValue<string[]>;
  enterTabViewProgress: number;
  gestureScale: SharedValue<number>;
  gestureX: SharedValue<number>;
  scrollViewOffset: SharedValue<number>;
  tabId: string;
  tabViewProgress: SharedValue<number>;
}) {
  'worklet';
  const isTabBeingClosed = currentlyBeingClosedTabIds.value.includes(tabId) && currentlyOpenTabIds.value.length !== 0;

  const opacity = interpolate(tabViewProgress.value, [0, 100], [animatedIsActiveTab ? 1 : 0, 1], 'clamp');

  const scale = interpolate(
    tabViewProgress.value,
    [0, 100],
    [
      animatedIsActiveTab && !isTabBeingClosed ? 1 : MULTI_TAB_SCALE,
      SINGLE_TAB_SCALE - MULTI_TAB_SCALE_DIFF * (isTabBeingClosed ? 1 : animatedMultipleTabsOpen.value),
    ]
  );

  const xPositionStart = animatedIsActiveTab && !isTabBeingClosed ? 0 : animatedTabXPosition.value;
  const xPositionEnd = (isTabBeingClosed ? 1 : animatedMultipleTabsOpen.value) * animatedTabXPosition.value;
  const xPositionForTab = interpolate(tabViewProgress.value, [0, 100], [xPositionStart, xPositionEnd]);

  const yPositionStart =
    animatedIsActiveTab && !isTabBeingClosed
      ? (1 - enterTabViewProgress) * scrollViewOffset.value
      : animatedTabYPosition.value + TAB_VIEW_EXTRA_TOP_PADDING;

  const yPositionEnd =
    animatedTabYPosition.value * animatedMultipleTabsOpen.value +
    (animatedIsActiveTab ? (1 - enterTabViewProgress) * scrollViewOffset.value : 0) +
    TAB_VIEW_EXTRA_TOP_PADDING;

  const yPositionForTab =
    interpolate(tabViewProgress.value, [0, 100], [yPositionStart, yPositionEnd]) -
    ((gestureScale.value - 1) * COLLAPSED_WEBVIEW_HEIGHT_UNSCALED * MULTI_TAB_SCALE) / 2;

  const shouldHideTab = !animatedIsActiveTab && tabViewProgress.value <= 1;

  return {
    opacity: shouldHideTab ? 0 : opacity,
    transform: [
      { translateX: shouldHideTab ? 0 : xPositionForTab + gestureX.value },
      { translateY: shouldHideTab ? 0 : yPositionForTab },
      { scale: shouldHideTab ? 0 : scale * gestureScale.value },
    ],
    transformOrigin: TAB_TRANSFORM_ORIGIN,
  };
}

/**
 * @worklet Calculates browser tab styles while the tab view gesture is active.
 *
 * @returns An animated style object to be returned from within `useAnimatedStyle`.
 */
export function getTabViewGestureStyles({
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
}: {
  activeIndex: number;
  animatedIsActiveTab: boolean;
  animatedMultipleTabsOpen: DerivedValue<number>;
  animatedTabXPosition: DerivedValue<number>;
  animatedTabYPosition: DerivedValue<number>;
  enterTabViewProgress: number;
  extraWebViewHeight: DerivedValue<number>;
  gestureScale: SharedValue<number>;
  gestureX: SharedValue<number>;
  isRunningEnterTabViewAnimation: boolean;
  pendingActiveIndex: number;
  pendingTabSwitchOffset: SharedValue<number>;
  scrollViewOffset: SharedValue<number>;
  tabIndex: number;
  tabSwitchGestureX: SharedValue<number>;
  tabViewGestureHoldDuration: SharedValue<number>;
  tabViewGestureProgress: SharedValue<number>;
  tabViewGestureState: SharedValue<TabViewGestureStates>;
  tabViewProgress: SharedValue<number>;
}) {
  'worklet';
  const isRunningExitTabViewAnimation = tabViewGestureState.value === TabViewGestureStates.DRAG_END_EXITING;
  const minScale = SINGLE_TAB_SCALE - MULTI_TAB_SCALE_DIFF * animatedMultipleTabsOpen.value;

  const scale = animatedIsActiveTab
    ? interpolate(
        tabViewGestureProgress.value,
        [0, GestureProgressThresholds.CENTER_TAB_SCALE_END, 100, 110],
        [1, minScale, minScale, 1 - minScale * 1.1],
        isRunningEnterTabViewAnimation || isRunningExitTabViewAnimation ? 'extend' : 'clamp'
      )
    : interpolate(
        tabViewGestureProgress.value,
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
        tabViewGestureProgress.value,
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
        tabViewGestureProgress.value,
        [0, GestureProgressThresholds.LOCK_SURROUNDING_TABS_SCALE],
        [1, minScale + (1 - minScale) * (1 - GestureProgressThresholds.LOCK_SURROUNDING_TABS_SCALE / 100)],
        'clamp'
      );

  const adjustedScale = interpolate(tabViewProgress.value, [0, 100], [scale, minScale]);
  const activeIndexOffset = -TAB_SWITCH_TAB_WIDTH * activeIndex;
  const xPositionForTab = TAB_SWITCH_TAB_WIDTH * tabIndex + activeIndexOffset;

  const switchTabsXTranslation = tabSwitchGestureX.value * TAB_SWITCH_X_AMPLIFICATION;
  const currentHeight = WEBVIEW_HEIGHT + extraWebViewHeight.value;
  const scaleDiff = referenceScale - scale;
  const yPositionForTab = scaleDiff * currentHeight;

  const baseTranslateX =
    animatedIsActiveTab || tabViewGestureProgress.value < GestureProgressThresholds.HIDE_SURROUNDING_TABS
      ? xPositionForTab + switchTabsXTranslation
      : withSpring(
          xPositionForTab - (switchTabsXTranslation - (switchTabsXTranslation - TAB_SWITCH_TAB_WIDTH * pendingTabSwitchOffset.value)),
          SPRING_CONFIGS.tabSwitchConfig
        );

  const enterTabViewAnimationX = isRunningEnterTabViewAnimation ? animatedTabXPosition.value * animatedMultipleTabsOpen.value : 0;
  const enterTabViewAnimationY = isRunningEnterTabViewAnimation
    ? animatedTabYPosition.value * animatedMultipleTabsOpen.value + TAB_VIEW_EXTRA_TOP_PADDING
    : 0;

  const activeTabTranslateY = isRunningEnterTabViewAnimation
    ? enterTabViewAnimationY * enterTabViewProgress + yPositionForTab * (1 - enterTabViewProgress)
    : yPositionForTab;

  const isLeftOfPendingActiveTab = tabIndex < pendingActiveIndex;
  const isRightOfPendingActiveTab = tabIndex > pendingActiveIndex;

  const shouldRevealSurroundingTabs =
    (tabViewGestureState.value === TabViewGestureStates.ACTIVE &&
      tabViewGestureHoldDuration.value === TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS) ||
    isRunningExitTabViewAnimation;

  const surroundingTabsXAdjustment =
    (!shouldRevealSurroundingTabs &&
      // eslint-disable-next-line no-nested-ternary
      (isLeftOfPendingActiveTab ? -HIDE_SURROUNDING_TABS_X_OFFSET : isRightOfPendingActiveTab ? HIDE_SURROUNDING_TABS_X_OFFSET : 0)) ||
    0;

  const shouldForceFullOpacity =
    Math.abs(switchTabsXTranslation) > TAB_SWITCH_HORIZONTAL_GAP &&
    tabViewGestureProgress.value < GestureProgressThresholds.SKIP_SURROUNDING_TABS_ANIMATION &&
    tabViewGestureHoldDuration.value === TAB_VIEW_GESTURE_HOLD_THRESHOLD_MS;

  // eslint-disable-next-line no-nested-ternary
  const enteringTabViewOpacity = animatedIsActiveTab
    ? withSpring(1, SPRING_CONFIGS.tabSwitchConfig)
    : // eslint-disable-next-line no-nested-ternary
      tabViewGestureProgress.value < GestureProgressThresholds.HIDE_SURROUNDING_TABS
      ? // eslint-disable-next-line no-nested-ternary
        shouldRevealSurroundingTabs
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

  const closeTabGestureScale = isRunningEnterTabViewAnimation ? gestureScale.value : 1;
  const closeTabGestureYAdjustment = isRunningEnterTabViewAnimation
    ? -((gestureScale.value - 1) * COLLAPSED_WEBVIEW_HEIGHT_UNSCALED * MULTI_TAB_SCALE) / 2
    : 0;

  return {
    opacity,
    transform: [
      { translateX: isRunningEnterTabViewAnimation ? enterTabViewAnimationX * enterTabViewProgress + gestureX.value : 0 },
      { translateY: scrollViewOffset.value * (1 - enterTabViewProgress) + closeTabGestureYAdjustment },
      {
        translateY:
          animatedIsActiveTab || tabViewGestureProgress.value < GestureProgressThresholds.HIDE_SURROUNDING_TABS
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
          animatedIsActiveTab || tabViewGestureProgress.value < GestureProgressThresholds.HIDE_SURROUNDING_TABS
            ? 1
            : withSpring(1 / scale, SPRING_CONFIGS.tabSwitchConfig),
      },
      { translateX: isRunningEnterTabViewAnimation ? xPositionForTab * (1 - enterTabViewProgress) : baseTranslateX },
      {
        translateX: isRunningEnterTabViewAnimation
          ? switchTabsXTranslation -
            enterTabViewProgress * (switchTabsXTranslation - (switchTabsXTranslation + TAB_SWITCH_TAB_WIDTH * pendingTabSwitchOffset.value))
          : 0,
      },
    ],
    transformOrigin: TAB_TRANSFORM_ORIGIN,
  };
}
