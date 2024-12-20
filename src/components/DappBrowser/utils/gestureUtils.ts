import { SharedValue } from 'react-native-reanimated';
import { TAB_VIEW_COLUMN_WIDTH } from '../Dimensions';
import { RAINBOW_HOME } from '../constants';
import { ActiveTabCloseGestures, GestureManagerState, TabCloseGesture, TabId } from '../types';
import { TabHitResult } from '../utils/tabHitTest';

const GESTURE_THRESHOLDS = {
  CLOSE_GESTURE_X: 4,
  CLOSE_RATIO: 1.5, // X movement must be 150% Y movement
  SCROLL_RATIO: 1.5, // Y movement must be 150% of X movement
  SCROLL_Y: 4,
} as const;

const TAP_MAX_DISTANCE = 6;
const TAP_MAX_DURATION_MS = 500;

type TabTouchInfo = {
  initialTappedTab: TabHitResult | null;
  timestamp: number;
  x: number;
  y: number;
};

type GestureDecision = {
  type: 'beginClose' | 'beginScroll' | 'continueClose' | 'ignore';
  tabInfo?: TabHitResult;
  translationX?: number;
};

interface DetermineGestureTypeParams {
  activeTabCloseGestures: ActiveTabCloseGestures;
  currentX: number;
  currentY: number;
  gestureState: GestureManagerState;
  touchInfo: TabTouchInfo | undefined;
}

export function determineGestureType({
  activeTabCloseGestures,
  currentX,
  currentY,
  gestureState,
  touchInfo,
}: DetermineGestureTypeParams): GestureDecision {
  'worklet';
  if (!touchInfo) return { type: 'ignore' };

  const translation = {
    x: currentX - touchInfo.x,
    y: currentY - touchInfo.y,
  };

  // Continue active close gesture
  if (
    gestureState === 'active' &&
    touchInfo.initialTappedTab?.tabId &&
    activeTabCloseGestures[touchInfo.initialTappedTab.tabId]?.isActive
  ) {
    return {
      tabInfo: touchInfo.initialTappedTab,
      translationX: translation.x,
      type: 'continueClose',
    };
  }

  // Initial gesture decision
  if (gestureState === 'pending') {
    // Check for scroll gesture
    const isScroll =
      Math.abs(translation.y) > GESTURE_THRESHOLDS.SCROLL_Y &&
      Math.abs(translation.y * GESTURE_THRESHOLDS.SCROLL_RATIO) >= Math.abs(translation.x);

    if (isScroll) return { type: 'beginScroll' };

    // Check for close gesture
    const isCloseGesture =
      Math.abs(translation.x) > GESTURE_THRESHOLDS.CLOSE_GESTURE_X &&
      Math.abs(translation.x) >= Math.abs(translation.y * GESTURE_THRESHOLDS.CLOSE_RATIO);

    if (isCloseGesture && touchInfo.initialTappedTab) {
      return {
        tabInfo: touchInfo.initialTappedTab,
        translationX: translation.x,
        type: 'beginClose',
      };
    }
  }

  return { type: 'ignore' };
}

type TabGestureUpdate = TabCloseGesture & { tabId: TabId };

export function updateTabGestureState(activeTabCloseGestures: SharedValue<ActiveTabCloseGestures>, update: TabGestureUpdate) {
  'worklet';
  const { gestureScale, gestureX, isActive, tabId, tabIndex } = update;

  activeTabCloseGestures.modify(gestures => ({
    ...gestures,
    [tabId]: {
      isActive,
      gestureScale,
      gestureX,
      tabIndex,
    } satisfies TabCloseGesture,
  }));
}

type TapResult =
  | {
      tabInfo: TabHitResult;
      type: 'close' | 'select';
    }
  | {
      type: 'ignore';
    };

interface DetermineTapResultParams {
  currentTouch: { x: number; y: number };
  gestureState: 'inactive' | 'pending' | 'active';
  tabViewVisible: boolean;
  touchInfo: TabTouchInfo | undefined;
}

export function determineTapResult({ currentTouch, gestureState, tabViewVisible, touchInfo }: DetermineTapResultParams): TapResult {
  'worklet';
  if (!touchInfo?.initialTappedTab || !tabViewVisible || gestureState !== 'pending') {
    return { type: 'ignore' };
  }

  const isValidTap =
    performance.now() - touchInfo.timestamp < TAP_MAX_DURATION_MS &&
    Math.abs(currentTouch.x - touchInfo.x) < TAP_MAX_DISTANCE &&
    Math.abs(currentTouch.y - touchInfo.y) < TAP_MAX_DISTANCE;

  if (!isValidTap) return { type: 'ignore' };

  return {
    type: touchInfo.initialTappedTab.shouldClose ? 'close' : 'select',
    tabInfo: touchInfo.initialTappedTab,
  };
}

type GestureEndParams = {
  multipleTabsOpen: boolean;
  tabViewVisible: boolean;
  translationX: number;
  url: string;
  velocityX: number;
};

export function handleGestureEnd({ multipleTabsOpen, tabViewVisible, translationX, url, velocityX }: GestureEndParams): {
  shouldClose: boolean;
} {
  'worklet';
  const isBeyondDismissThreshold = translationX < -(TAB_VIEW_COLUMN_WIDTH / 2 + 20) && velocityX <= 0;
  const isFastLeftwardSwipe = velocityX < -500;
  const isEmptyState = !multipleTabsOpen && url === RAINBOW_HOME;

  const shouldClose = tabViewVisible && !isEmptyState && (isBeyondDismissThreshold || isFastLeftwardSwipe);

  return { shouldClose };
}

export function resetTabCloseGestures({
  activeTabCloseGestures,
  currentlyBeingClosedTabIds,
}: {
  activeTabCloseGestures: SharedValue<ActiveTabCloseGestures>;
  currentlyBeingClosedTabIds: TabId[];
}) {
  'worklet';
  const gesturesNeedReset = Object.entries(activeTabCloseGestures.value).some(
    ([tabId, gesture]) => gesture?.isActive && !currentlyBeingClosedTabIds.includes(tabId)
  );

  if (!gesturesNeedReset) return;

  activeTabCloseGestures.modify(gestures => {
    const updatedGestures = { ...gestures };
    const initialState = { isActive: false, gestureScale: 1, gestureX: 0 };
    for (const tabId in gestures) {
      if (gestures[tabId]?.isActive && !currentlyBeingClosedTabIds.includes(tabId)) {
        updatedGestures[tabId] = { ...gestures[tabId], ...initialState };
      }
    }
    return updatedGestures;
  });
}
