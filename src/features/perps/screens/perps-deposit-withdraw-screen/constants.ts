import { navbarHeight } from '@/components/navbar/Navbar';
import { CUSTOM_KEYBOARD_HEIGHT } from '@/features/perps/components/NumberPad/NumberPad';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

export const FOOTER_HEIGHT = 64;
export const SLIDER_WITH_LABELS_HEIGHT = 78;
const NAVBAR_WITH_PADDING = navbarHeight + 20;
const CONTENT_HEIGHT = DEVICE_HEIGHT - safeAreaInsetValues.top - NAVBAR_WITH_PADDING - safeAreaInsetValues.bottom;
export const BASE_INPUT_HEIGHT = CONTENT_HEIGHT - CUSTOM_KEYBOARD_HEIGHT - SLIDER_WITH_LABELS_HEIGHT - FOOTER_HEIGHT;
export const EXPANDED_INPUT_HEIGHT = CONTENT_HEIGHT;
