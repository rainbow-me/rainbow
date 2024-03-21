import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { deviceUtils, safeAreaInsetValues } from '@/utils';

export const WEBVIEW_HEIGHT = deviceUtils.dimensions.height - safeAreaInsetValues.top - TAB_BAR_HEIGHT - 88;
export const COLLAPSED_WEBVIEW_ASPECT_RATIO = 4 / 3;
export const COLLAPSED_WEBVIEW_HEIGHT_UNSCALED = Math.min(WEBVIEW_HEIGHT, deviceUtils.dimensions.width * COLLAPSED_WEBVIEW_ASPECT_RATIO);

export const TAB_VIEW_COLUMN_WIDTH = (deviceUtils.dimensions.width - 20 * 3) / 2;
export const TAB_VIEW_TAB_HEIGHT = TAB_VIEW_COLUMN_WIDTH * (COLLAPSED_WEBVIEW_HEIGHT_UNSCALED / deviceUtils.dimensions.width);
export const TAB_VIEW_ROW_HEIGHT = TAB_VIEW_TAB_HEIGHT + 28;
