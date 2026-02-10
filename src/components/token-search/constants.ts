import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { getDefaultKeyboardHeight } from '@/utils/keyboardHeight';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

export const TOKEN_SEARCH_CONTROL_ITEM_HEIGHT = 36;
export const TOKEN_SEARCH_FOCUSED_INPUT_HEIGHT = DEVICE_HEIGHT - safeAreaInsetValues.top - 20 - getDefaultKeyboardHeight();
export const TOKEN_SEARCH_INPUT_HORIZONTAL_PADDING = 20 - THICK_BORDER_WIDTH;
