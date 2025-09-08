import { AddressOrEth } from '@/__swaps__/types/assets';
import { SearchAsset } from '@/__swaps__/types/search';
import { ChainId } from '@/state/backendNetworks/types';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { Address } from 'viem';

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
  shortRed: '#C4362D',
  longGreen: '#23D246',
};

export const UP_ARROW = '􀄨';
export const DOWN_ARROW = '􀄩';

export const SLIDER_HEIGHT = 10;
export const SLIDER_EXPANDED_HEIGHT = 14;
export const SLIDER_WIDTH = DEVICE_WIDTH - 80;

export const DEFAULT_MAINTENANCE_MARGIN_RATE = 0.006;
export const DEFAULT_INITIAL_AMOUNT = 0.5;

export const HYPERLIQUID_TAKER_FEE_RATE = '0.00035';
export const HYPERLIQUID_MAKER_FEE_RATE = '0.0002';
export const USDC_ICON_URL =
  'https://rainbowme-res.cloudinary.com/image/upload/v1668633498/assets/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png';
export const USDC_COLORS = {
  primary: '#2775CA',
  fallback: '#FFFFFF',
};
