import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { X_BUTTON_TAPPABLE_AREA } from '../CloseTabButton';
import {
  TAB_VIEW_COLUMN_GAP,
  TAB_VIEW_ROW_GAP,
  TAB_VIEW_COLUMN_WIDTH,
  TAB_VIEW_EXTRA_TOP_PADDING,
  TOP_INSET,
  TAB_VIEW_TAB_HEIGHT,
  TAB_VIEW_SINGLE_TAB_WIDTH,
  TAB_VIEW_SINGLE_TAB_HEIGHT,
  SINGLE_TAB_SCALE,
} from '../Dimensions';

export type TabHitResult = {
  shouldClose: boolean;
  tabId: string;
  tabIndex: number;
};

function singleTabHitTest(x: number, y: number, scrollViewOffset: number, currentlyOpenTabIds: readonly string[]): TabHitResult | null {
  'worklet';

  const xBoundsStart = (DEVICE_WIDTH - TAB_VIEW_SINGLE_TAB_WIDTH) / 2;
  const xBoundsEnd = xBoundsStart + TAB_VIEW_SINGLE_TAB_WIDTH;

  const relativeY = y - (TOP_INSET + TAB_VIEW_EXTRA_TOP_PADDING) + scrollViewOffset;

  // Check if tap is within horizontal bounds
  if (x < xBoundsStart || x > xBoundsEnd) {
    return null;
  }

  // Check if tap is within vertical bounds
  if (relativeY < 0 || relativeY > TAB_VIEW_SINGLE_TAB_HEIGHT * SINGLE_TAB_SCALE) {
    return null;
  }

  // Calculate if the tap was in the close button region
  const relativeToTabX = x - xBoundsStart;
  const shouldClose =
    relativeToTabX >= TAB_VIEW_SINGLE_TAB_WIDTH - X_BUTTON_TAPPABLE_AREA &&
    relativeToTabX <= TAB_VIEW_SINGLE_TAB_WIDTH &&
    relativeY <= X_BUTTON_TAPPABLE_AREA;

  return {
    shouldClose,
    tabId: currentlyOpenTabIds[0],
    tabIndex: 0,
  };
}

export function tabHitTest(x: number, y: number, scrollViewOffset: number, currentlyOpenTabIds: readonly string[]): TabHitResult | null {
  'worklet';

  // Handle single tab case
  if (currentlyOpenTabIds.length === 1) {
    return singleTabHitTest(x, y, scrollViewOffset, currentlyOpenTabIds);
  }

  // Early return if outside horizontal bounds
  if (x < TAB_VIEW_COLUMN_GAP || x > DEVICE_WIDTH - TAB_VIEW_COLUMN_GAP) {
    return null;
  }

  // Normalize x coordinate relative to grid start
  const relativeX = x - TAB_VIEW_COLUMN_GAP;

  // Determine column (0 or 1) based on x position
  const column = relativeX > TAB_VIEW_COLUMN_WIDTH + TAB_VIEW_COLUMN_GAP ? 1 : 0;

  // Verify x is within a column's bounds, not in the gap
  const columnStart = column * (TAB_VIEW_COLUMN_WIDTH + TAB_VIEW_COLUMN_GAP);
  if (relativeX < columnStart || relativeX > columnStart + TAB_VIEW_COLUMN_WIDTH) {
    return null;
  }

  // Calculate vertical position relative to grid start
  const relativeY = y - (TOP_INSET + TAB_VIEW_EXTRA_TOP_PADDING) + scrollViewOffset;

  // Early return if above grid
  if (relativeY < 0) {
    return null;
  }

  // Calculate row and verify tap isn't in vertical gap
  const row = Math.floor(relativeY / (TAB_VIEW_TAB_HEIGHT + TAB_VIEW_ROW_GAP));
  const rowOffset = relativeY % (TAB_VIEW_TAB_HEIGHT + TAB_VIEW_ROW_GAP);
  if (rowOffset > TAB_VIEW_TAB_HEIGHT) {
    return null;
  }

  // Calculate tab index from row and column
  const tabIndex = row * 2 + column;

  // Verify tab index exists
  if (tabIndex >= currentlyOpenTabIds.length) {
    return null;
  }

  // Calculate if the tap was in the close button region
  const relativeToTabX = relativeX - columnStart;
  const shouldClose =
    relativeToTabX >= TAB_VIEW_COLUMN_WIDTH - X_BUTTON_TAPPABLE_AREA &&
    relativeToTabX <= TAB_VIEW_COLUMN_WIDTH &&
    rowOffset <= X_BUTTON_TAPPABLE_AREA;

  return {
    shouldClose,
    tabId: currentlyOpenTabIds[tabIndex],
    tabIndex,
  };
}
