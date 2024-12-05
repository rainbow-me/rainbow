import { TabId, TabInfo, TabViewGestureStates } from '../types';

export function getTabInfo({
  animatedActiveTabIndex,
  currentlyOpenTabIds,
  pendingTabSwitchOffset,
  tabId,
  tabViewGestureState,
  tabViewProgress,
}: {
  animatedActiveTabIndex: number;
  currentlyOpenTabIds: TabId[];
  pendingTabSwitchOffset: number;
  tabId: TabId;
  tabViewGestureState: TabViewGestureStates;
  tabViewProgress: number;
}): TabInfo {
  'worklet';
  const pendingActiveIndex = Math.abs(animatedActiveTabIndex) + pendingTabSwitchOffset;
  const tabIndex = currentlyOpenTabIds.indexOf(tabId);

  const isLeftOfActiveTab = tabIndex === pendingActiveIndex - 1;
  const isRightOfActiveTab = tabIndex === pendingActiveIndex + 1;
  const isActivelySwitchingTabs =
    tabViewGestureState === TabViewGestureStates.ACTIVE || tabViewGestureState === TabViewGestureStates.DRAG_END_EXITING;

  const isPendingActiveTab = pendingActiveIndex === tabIndex;
  const isFullSizeTab =
    isPendingActiveTab || ((isLeftOfActiveTab || isRightOfActiveTab) && (isActivelySwitchingTabs || tabViewProgress < 1));

  return { isFullSizeTab, isPendingActiveTab };
}
