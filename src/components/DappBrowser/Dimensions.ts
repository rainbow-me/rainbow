import { IS_IOS } from '@/env';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { deviceUtils, safeAreaInsetValues } from '@/utils';

export const TOP_INSET = IS_IOS ? safeAreaInsetValues.top : 40;
export const WEBVIEW_HEIGHT = deviceUtils.dimensions.height - TOP_INSET - TAB_BAR_HEIGHT - 88;
export const COLLAPSED_WEBVIEW_ASPECT_RATIO = 4 / 3;
export const COLLAPSED_WEBVIEW_HEIGHT_UNSCALED = Math.min(WEBVIEW_HEIGHT, deviceUtils.dimensions.width * COLLAPSED_WEBVIEW_ASPECT_RATIO);

export const TAB_VIEW_COLUMN_WIDTH = (deviceUtils.dimensions.width - 20 * 3) / 2;
export const TAB_VIEW_SINGLE_TAB_HEIGHT = deviceUtils.dimensions.width * (COLLAPSED_WEBVIEW_HEIGHT_UNSCALED / deviceUtils.dimensions.width);
export const TAB_VIEW_TAB_HEIGHT = TAB_VIEW_COLUMN_WIDTH * (COLLAPSED_WEBVIEW_HEIGHT_UNSCALED / deviceUtils.dimensions.width);
export const TAB_VIEW_ROW_HEIGHT = TAB_VIEW_TAB_HEIGHT + 28;
export const TAB_VIEW_EXTRA_TOP_PADDING = 20;

export const INVERTED_SINGLE_TAB_SCALE = 1 / 0.7;
export const INVERTED_MULTI_TAB_SCALE = deviceUtils.dimensions.width / TAB_VIEW_COLUMN_WIDTH;
export const INVERTED_SCALE_DIFF = INVERTED_SINGLE_TAB_SCALE - INVERTED_MULTI_TAB_SCALE;

export const ZOOMED_TAB_BORDER_RADIUS = 16;
