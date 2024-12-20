import { IS_IOS } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT as SCREEN_HEIGHT } from '@/utils/deviceUtils';
import { X_BUTTON_PADDING, X_BUTTON_SIZE } from '../CloseTabButton';
import { INVERTED_MULTI_TAB_SCALE_DIFF, INVERTED_SINGLE_TAB_SCALE, TAB_VIEW_ROW_HEIGHT } from '../Dimensions';

const HALF_SCREEN_HEIGHT = SCREEN_HEIGHT / 2;

/**
 * @worklet Calculates the scroll position that vertically centers the specified tab.
 *
 * @param index The index of the tab to center.
 * @param numberOfOpenTabs The current value of `currentlyOpenTabIds.value.length`.
 * @returns A number representing the optimal scroll position.
 */
export function calculateScrollPositionToCenterTab(index: number, numberOfOpenTabs: number): number {
  'worklet';

  const scrollViewHeight =
    Math.ceil(numberOfOpenTabs / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 165 + 28 + (IS_IOS ? 0 : 35);

  if (scrollViewHeight <= SCREEN_HEIGHT) {
    // No need to scroll if all tabs fit on the screen
    return 0;
  }

  const currentTabRow = Math.floor(index / 2);
  const tabCenterPosition = currentTabRow * TAB_VIEW_ROW_HEIGHT + (currentTabRow - 1) * 28 + TAB_VIEW_ROW_HEIGHT / 2 + 37;

  if (tabCenterPosition <= HALF_SCREEN_HEIGHT) {
    // Scroll to top if the tab is too near to the top of the scroll view to be centered
    return 0;
  } else if (tabCenterPosition + HALF_SCREEN_HEIGHT >= scrollViewHeight) {
    // Scroll to bottom if the tab is too near to the end of the scroll view to be centered
    return scrollViewHeight - SCREEN_HEIGHT;
  } else {
    // Otherwise, vertically center the tab on the screen
    return tabCenterPosition - HALF_SCREEN_HEIGHT;
  }
}

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
