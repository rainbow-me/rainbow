import { gweiToWei } from '@/__swaps__/utils/ethereum';
import { getDefaultKeyboardHeight } from '@/redux/keyboardHeight';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { Easing } from 'react-native-reanimated';

// /---- 🔒 Constants 🔒 ----/ //
//
export const CUSTOM_KEYBOARD_HEIGHT = 209;
export const NAVBAR_HEIGHT_WITH_PADDING = 77;
export const SPACE_BETWEEN_SWAP_BUBBLES = 12;

// TODO: Need a more reliable way to get the keyboard height
export const NATIVE_KEYBOARD_HEIGHT = getDefaultKeyboardHeight();

export const REVIEW_SHEET_ROW_HEIGHT = 10;
export const REVIEW_SHEET_ROW_GAP = 24;
export const REVIEW_SHEET_HEIGHT = 412;
export const GAS_SHEET_HEIGHT = 274;
export const BOTTOM_ACTION_BAR_HEIGHT = 114;
export const BASE_INPUT_HEIGHT = 104;
export const BASE_INPUT_WIDTH = deviceUtils.dimensions.width - 24;
export const EXPANDED_REVIEW_SECTION = 408;
export const EXPANDED_INPUT_HEIGHT =
  deviceUtils.dimensions.height -
  safeAreaInsetValues.top -
  NAVBAR_HEIGHT_WITH_PADDING -
  BASE_INPUT_HEIGHT -
  SPACE_BETWEEN_SWAP_BUBBLES -
  Math.max(safeAreaInsetValues.bottom, SPACE_BETWEEN_SWAP_BUBBLES);
export const FOCUSED_INPUT_HEIGHT = deviceUtils.dimensions.height - safeAreaInsetValues.top - 20 - NATIVE_KEYBOARD_HEIGHT;
export const THICK_BORDER_WIDTH = 4 / 3;
export const INPUT_PADDING = 20 - THICK_BORDER_WIDTH;
export const INPUT_INNER_WIDTH = BASE_INPUT_WIDTH - THICK_BORDER_WIDTH * 2;

export const SLIDER_HEIGHT = 16;
export const SLIDER_COLLAPSED_HEIGHT = 10;
export const SLIDER_WIDTH = deviceUtils.dimensions.width - 40;
export const INITIAL_SLIDER_POSITION = 0.5;
export const SCRUBBER_WIDTH = 16;

export const SEPARATOR_COLOR = 'rgba(245, 248, 255, 0.03)';
export const LIGHT_SEPARATOR_COLOR = 'rgba(9, 17, 31, 0.03)';

export const ETH_COLOR = '#25292E';
export const ETH_COLOR_DARK = '#677483';
export const ETH_COLOR_DARK_ACCENT = '#9CA4AD';

export const LONG_PRESS_DELAY_DURATION = 200;
export const LONG_PRESS_REPEAT_DURATION = 69;

export const STABLECOIN_MINIMUM_SIGNIFICANT_DECIMALS = 2;
export const MAXIMUM_SIGNIFICANT_DECIMALS = 6;
//
// /---- END constants ----/ //

// /---- ⏱️ Animation configs ⏱️ ----/ //
//
export const buttonPressConfig = { duration: 160, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) };
export const caretConfig = { duration: 300, easing: Easing.bezier(0.87, 0, 0.13, 1) };
export const fadeConfig = { duration: 200, easing: Easing.bezier(0.22, 1, 0.36, 1) };
export const pulsingConfig = { duration: 1000, easing: Easing.bezier(0.37, 0, 0.63, 1) };
export const sliderConfig = { damping: 40, mass: 1.25, stiffness: 450 };
export const slowFadeConfig = { duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1) };
export const snappySpringConfig = { damping: 100, mass: 0.8, stiffness: 275 };
export const snappierSpringConfig = { damping: 42, mass: 0.8, stiffness: 800 };
export const springConfig = { damping: 100, mass: 1.2, stiffness: 750 };
//
// /---- END animation configs ----/ //

export const highPriceImpactThreshold = 0.05;
export const severePriceImpactThreshold = 0.1;

export const slippageStep = 0.5;

export const MIN_FLASHBOTS_PRIORITY_FEE = gweiToWei('6');
