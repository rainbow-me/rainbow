import { initialWindowMetrics } from 'react-native-safe-area-context';

export const BASE_TAB_BAR_HEIGHT = 52;
export const TAB_BAR_HEIGHT = BASE_TAB_BAR_HEIGHT + (initialWindowMetrics?.insets.bottom ?? 0) + 6;
