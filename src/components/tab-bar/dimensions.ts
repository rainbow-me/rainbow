import { initialWindowMetrics } from 'react-native-safe-area-context';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

export const TAB_BAR_HORIZONTAL_INSET = (initialWindowMetrics?.insets.bottom ?? 0) + 6;
export const TAB_BAR_WIDTH = DEVICE_WIDTH - TAB_BAR_HORIZONTAL_INSET * 2;
export const TAB_BAR_ICON_SIZE = 28;

export const TAB_BAR_INNER_PADDING = 4;

export const BROWSER_BUTTONS_PILL_WIDTH = 72;
export const TAB_BAR_PILL_HEIGHT = 44;
export const TAB_BAR_PILL_WIDTH = (DEVICE_WIDTH - TAB_BAR_HORIZONTAL_INSET * 2 - TAB_BAR_INNER_PADDING * 2) / 5;
