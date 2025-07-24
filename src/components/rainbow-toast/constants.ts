import { time } from '@/utils';

export const TOAST_ICON_SIZE = 28;

export const SWAP_ICON_INTERSECT = TOAST_ICON_SIZE * 0.2;
export const SWAP_ICON_WIDTH = TOAST_ICON_SIZE * 2 - SWAP_ICON_INTERSECT;

export const TOAST_HEIGHT = 60;
export const TOAST_GAP_NEAR = 4; // gap for first two items
export const TOAST_GAP_FAR = 3.5; // gap for third item
export const TOAST_TOP_OFFSET = 10;
export const TOAST_INITIAL_OFFSET_ABOVE = -80;
export const TOAST_INITIAL_OFFSET_BELOW = 10;
export const TOAST_DONE_HIDE_TIMEOUT_MS = time.seconds(4);
export const TOAST_HIDE_TIMEOUT_MS = time.seconds(30);

// make dismissing easier (lower) or harder (higher)
export const TOAST_EXPANDED_DISMISS_SENSITIVITY = 0.5;
// upward dragging more sensitive
export const TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER = 2;
