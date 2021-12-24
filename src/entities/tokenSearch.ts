import { RainbowToken } from '@rainbow-me/entities';
export type TokenSearchThreshold = 'CONTAINS' | 'CASE_SENSITIVE_EQUAL';
export type TokenSearchTokenListId =
  | 'highLiquidityAssets'
  | 'lowLiquidityAssets'
  | 'verifiedAssets';
export type TokenSearchUniswapAssetKey = keyof RainbowToken;
