import { hyperliquidMarketsActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { logger, RainbowError } from '@/logger';

import { transformHyperliquidMarketToTokenData } from './hyperliquidAdapter';
import { type TokenData } from './liveTokensStore';

/**
 * Fetches live Hyperliquid prices through the market store's `allMids` refresh.
 */
export async function fetchHyperliquidPrices(symbols: string[]): Promise<Record<string, TokenData>> {
  try {
    const markets = await hyperliquidMarketsActions.fetchPrices(symbols);
    if (!markets) return {};

    const updateTime = new Date().toISOString();
    const result: Record<string, TokenData> = {};

    for (const symbol of symbols) {
      const market = markets[symbol];
      if (!market) continue;
      result[getHyperliquidTokenId(symbol)] = transformHyperliquidMarketToTokenData(market, updateTime);
    }

    return result;
  } catch (error) {
    logger.error(new RainbowError('[fetchHyperliquidPrices] Failed to fetch Hyperliquid prices:', error));
    return {};
  }
}
