import { safeAreaInsetValues } from '@/utils';

export const DEFAULT_SLIPPAGE_BIPS = 50;
export const RAINBOW_BUILDER_SETTINGS = {
  b: '0xREPLACE_WITH_RAINBOW_BUILDER_ADDRESS',
  f: 10,
} as const;
export const HYPERCORE_PSEUDO_CHAIN_ID = 1337;

export const FOOTER_HEIGHT = 110;
export const FOOTER_HEIGHT_WITH_SAFE_AREA = 110 + safeAreaInsetValues.bottom;

export const HYPERLIQUID_USDC_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
// TODO (kane): remove these individual exports
export const HYPERLIQUID_GREEN = '#3ECFAD';
export const HYPERLIQUID_DARK_GREEN = '#072723';
export const HYPERLIQUID_MINT_GREEN = '#98FBE4';
export const HYPERLIQUID_GRADIENT = ['#72FFD9', '#3ECFAD'];

export const HYPERLIQUID_COLORS = {
  green: HYPERLIQUID_GREEN,
  darkGreen: HYPERLIQUID_DARK_GREEN,
  mintGreen: HYPERLIQUID_MINT_GREEN,
  gradient: HYPERLIQUID_GRADIENT,
};

export const PERPS_COLORS = {
  surfacePrimary: '#171E20',
};

export const UP_ARROW = '􀄨';
export const DOWN_ARROW = '􀄩';
