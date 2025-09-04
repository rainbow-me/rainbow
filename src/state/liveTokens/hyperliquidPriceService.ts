import { hyperliquidMarketsClient } from '@/features/perps/services/hyperliquid-markets-client';
import { transformHyperliquidMarketToTokenData } from './hyperliquidAdapter';
import { TokenData } from './liveTokensStore';
import { logger, RainbowError } from '@/logger';
import { getHyperliquidTokenId } from '@/features/perps/utils';

export async function fetchHyperliquidPrices(symbols: string[]): Promise<Record<string, TokenData>> {
  try {
    const allMarketsInfo = await hyperliquidMarketsClient.getAllMarketsInfo();
    const result: Record<string, TokenData> = {};

    allMarketsInfo.forEach(market => {
      if (market && symbols.includes(market.symbol)) {
        const tokenId = getHyperliquidTokenId(market.symbol);
        result[tokenId] = transformHyperliquidMarketToTokenData(market);
      }
    });

    return result;
  } catch (error) {
    logger.error(new RainbowError('[fetchHyperliquidPrices] Failed to fetch Hyperliquid prices:', error));
    return {};
  }
}
