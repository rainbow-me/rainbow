import { AddressOrEth } from '@/__swaps__/types/assets';
import { HlBuilderSettings } from '@/features/perps/types';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { Address } from 'viem';
import { getUniqueId } from '@/utils/ethereumUtils';
import { SearchAsset } from '@/__swaps__/types/search';
import { ChainId } from '@/state/backendNetworks/types';

export const DEFAULT_SLIPPAGE_BIPS = 100;
export const RAINBOW_BUILDER_SETTINGS = {
  b: '0x60dC8E3dAd2e4E0738e813B9cB09b9c00B5e0Fc9',
  f: 50,
} as const satisfies HlBuilderSettings;
export const HYPERCORE_PSEUDO_CHAIN_ID = 1337;
// The minimum total order size (margin * leverage)
export const MIN_ORDER_SIZE_USD = 10;

export const FOOTER_HEIGHT = 110;
export const FOOTER_HEIGHT_WITH_SAFE_AREA = 110 + safeAreaInsetValues.bottom;

export const INPUT_CARD_HEIGHT = 106;

export const HYPERLIQUID_USDC_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
// TODO (kane): remove these individual exports
export const HYPERLIQUID_GREEN = '#3ECFAD';
export const HYPERLIQUID_GREEN_LIGHT = '#31C8A4';

export const HYPERLIQUID_COLORS = {
  green: '#3ECFAD',
  darkGreen: '#072723',
  mintGreen: '#98FBE4',
  gradient: ['#72FFD9', '#3ECFAD'],
};

export const PERPS_COLORS = {
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

// Note: These are the base rates. Accounts with more trading volume will have lower rates and we should get this from the API: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees
// Taker fees apply to market orders
export const HYPERLIQUID_TAKER_FEE_BIPS = 4.5;
// Maker fees apply to limit orders
export const HYPERLIQUID_MAKER_FEE_BIPS = 1.5;
// Rainbow fees apply to all orders
export const RAINBOW_FEE_BIPS = 5;

export const USDC_ICON_URL =
  'https://rainbowme-res.cloudinary.com/image/upload/v1668633498/assets/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png';
export const USDC_COLORS = {
  primary: '#2775CA',
  fallback: '#FFFFFF',
};

export const MAX_SIG_FIGS = 5;
export const MAX_DECIMALS_PERP = 6;
export const MAX_DECIMALS_SPOT = 8;

export const USDC_ASSET = {
  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as AddressOrEth,
  chainId: 1337,
  colors: {
    primary: '#2775CA',
    fallback: '#FFFFFF',
  },
  decimals: 8,
  icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668633498/assets/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  isNativeAsset: false,
  isRainbowCurated: true,
  isVerified: true,
  mainnetAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as AddressOrEth,
  name: 'USD Coin',
  networks: {
    [ChainId.mainnet]: {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Address,
      decimals: 8,
    },
    1337: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address,
      decimals: 8,
    },
  },
  market: {
    market_cap: {
      value: 100000000000, // $100B market cap
    },
    volume_24h: 10000000000, // $10B volume
    circulating_supply: 100000000000,
  },
  symbol: 'USDC',
  uniqueId: getUniqueId('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, 1337),
  highLiquidity: true,
} satisfies SearchAsset;
