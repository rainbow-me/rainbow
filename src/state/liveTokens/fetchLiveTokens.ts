import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { ETH_ADDRESS, WETH_ADDRESS } from '@/references/constants';
import { getPlatformClient } from '@/resources/platform/client';
import { useUserAssetsStore } from '@/state/assets/userAssets';

import { parseHyperliquidTokenId } from './hyperliquidAdapter';
import { fetchHyperliquidPrices } from './hyperliquidPriceService';
import { fetchPolymarketPrices, isPolymarketToken } from './polymarketAdapter';
import { type LiveTokensData } from './types';

export type LiveTokensParams = {
  currency: SupportedCurrencyKey;
  tokenIds: readonly string[];
};

type LiveTokensResponse = {
  metadata: {
    currency: string;
    requestId: string;
    requestTime: string;
  };
  result?: LiveTokensData;
  errors?: string[];
};

const ETH_MAINNET_ASSET_ID = `${ETH_ADDRESS}_1`;
const ETH_MAINNET_TOKEN_ID = `${ETH_ADDRESS}:1`;

/** Fetches and combines live quotes from the supported price sources. */
export async function fetchLiveTokens({ tokenIds, currency }: LiveTokensParams): Promise<LiveTokensData | null> {
  if (tokenIds.length === 0) return null;

  let ethVariants: string[] | undefined;
  let hyperliquidSymbols: string[] | undefined;
  let regularTokens: string[] | undefined;
  let polymarketTokens: string[] | undefined;

  for (const tokenId of tokenIds) {
    const hyperliquidSymbol = parseHyperliquidTokenId(tokenId);
    const isHyperliquidToken = hyperliquidSymbol !== null;

    if (isHyperliquidToken) {
      if (hyperliquidSymbol) (hyperliquidSymbols ??= []).push(hyperliquidSymbol);
    } else if (isPolymarketToken(tokenId)) {
      (polymarketTokens ??= []).push(tokenId);
    } else if (isEthVariant(tokenId)) {
      (ethVariants ??= []).push(tokenId);
    } else {
      (regularTokens ??= []).push(tokenId.replace('_', ':'));
    }
  }

  if (ethVariants) (regularTokens ??= []).push(ETH_MAINNET_TOKEN_ID);

  const [regularTokensResponse, hyperliquidPrices, polymarketPrices] = await Promise.all([
    regularTokens
      ? getPlatformClient().get<LiveTokensResponse>('/prices/GetCurrentPrices', {
          params: { tokenIds: regularTokens.join(','), currency },
        })
      : null,
    hyperliquidSymbols ? fetchHyperliquidPrices(hyperliquidSymbols) : null,
    polymarketTokens ? fetchPolymarketPrices(polymarketTokens) : null,
  ]);

  const result: LiveTokensData = {};
  let hasResult = false;

  const regularTokenData = regularTokensResponse?.data.result;
  if (regularTokenData) {
    for (const tokenId in regularTokenData) {
      if (!Object.hasOwn(regularTokenData, tokenId)) continue;

      const tokenData = regularTokenData[tokenId];

      if (tokenId === ETH_MAINNET_TOKEN_ID) {
        if (!tokenData || !ethVariants) continue;
        for (const id of ethVariants) result[id] = tokenData;
      } else {
        result[tokenId.replace(':', '_')] = tokenData;
      }

      hasResult = true;
    }
  }

  if (hyperliquidPrices) {
    Object.assign(result, hyperliquidPrices);
    hasResult = true;
  }

  if (polymarketPrices) {
    Object.assign(result, polymarketPrices);
    hasResult = true;
  }

  return hasResult ? result : null;
}

function isEthVariant(tokenId: string): boolean {
  if (tokenId === ETH_MAINNET_ASSET_ID) return true;

  const mainnetAddress = useUserAssetsStore.getState().getUserAsset(tokenId)?.mainnetAddress;
  return mainnetAddress === ETH_ADDRESS || mainnetAddress === WETH_ADDRESS;
}
