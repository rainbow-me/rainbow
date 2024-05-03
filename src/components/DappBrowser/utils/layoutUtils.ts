import { X_BUTTON_PADDING, X_BUTTON_SIZE } from '../CloseTabButton';
import { INVERTED_SCALE_DIFF, INVERTED_SINGLE_TAB_SCALE } from '../Dimensions';

/**
 * @worklet Calculates the border radius for the minimized tab to achieve concentric
 * corners around the close button.
 *
 * @param animatedMultipleTabsOpen The animated state of multiple tabs being open, represented as a number.
 * @returns The calculated border radius for the tab view.
 */
export function calculateTabViewBorderRadius(animatedMultipleTabsOpen: number): number {
  'worklet';
  const invertedScale = INVERTED_SINGLE_TAB_SCALE - INVERTED_SCALE_DIFF * animatedMultipleTabsOpen;
  const spaceToXButton = invertedScale * X_BUTTON_PADDING;
  const xButtonBorderRadius = (X_BUTTON_SIZE / 2) * invertedScale;
  const tabViewBorderRadius = xButtonBorderRadius + spaceToXButton;

  return tabViewBorderRadius;
}
