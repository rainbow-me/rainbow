import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { LinearTransition } from 'react-native-reanimated';
import { base } from 'viem/chains';

export const BLUE = '#268FFF';
export const ERROR_RED = '#FF4143';
export const FIELD_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.02)';
export const FIELD_BORDER_COLOR = 'rgba(255, 255, 255, 0.03)';
export const UNFOCUSED_FIELD_BORDER_COLOR = 'rgba(255, 255, 255, 0.03)';
export const FOCUSED_FIELD_BORDER_COLOR = BLUE;
export const INNER_FIELD_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.05)';
export const FIELD_BORDER_WIDTH = 2.5;
export const FIELD_BORDER_RADIUS = 28;
export const FIELD_INNER_BORDER_RADIUS = 16;
export const CLOUDINARY_TOKEN_LAUNCHER_PRESET = 'token_launcher';
export const CLOUDINARY_TOKEN_LAUNCHER_PRESET_GIFS = 'token_launcher_gifs';
export const DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR = BLUE;
export const STEP_TRANSITION_DURATION = 200;
export const INPUT_HEIGHT = 66;
export const SMALL_INPUT_HEIGHT = 50;
export const LINK_ICON_SIZE = 20;
export const GHOST_INPUT_ACCESSORY_NATIVE_ID = 'input-accessory';

export const MAX_SYMBOL_BYTES = 32;
export const MAX_DESCRIPTION_BYTES = 2_000;
export const MAX_NAME_BYTES = 32;
export const DEFAULT_MAX_AIRDROP_RECIPIENTS = 20_000;

export const DEFAULT_CHAIN_ID = base.id;
export const DEFAULT_TOTAL_SUPPLY = 1_000_000_000;
export const TARGET_MARKET_CAP_IN_USD = 35_000;

// Will be supported at a later time
// 2^256 - 1 (max uint256)
// export const MAX_TOTAL_SUPPLY = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');

// 1 trillion
export const MAX_TOTAL_SUPPLY = BigInt(1_000_000_000_000);

export const TOTAL_SUPPLY_PREBUY_PERCENTAGES = [0.005, 0.01, 0.05, 0.1];

// TODO: At some point these should be fetched through the sdk to the contract, because the contract can change these values
export const CREATOR_BPS = 100;
export const CREATOR_BPS_WITH_AIRDROP = 50;
export const AIRDROP_BPS = 50;
export const RAINBOW_BPS = 500;
export const TOKEN_LAUNCH_GAS_LIMIT = '8000000';

const ANIMATION_CONFIG = SPRING_CONFIGS.snappierSpringConfig;

export const COLLAPSABLE_FIELD_ANIMATION = LinearTransition.springify()
  .mass(ANIMATION_CONFIG.mass as number)
  .damping(ANIMATION_CONFIG.damping as number)
  .stiffness(ANIMATION_CONFIG.stiffness as number);
