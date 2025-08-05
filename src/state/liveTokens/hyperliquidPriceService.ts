import { hyperliquidMarketsClient } from '@/features/perps/services/hyperliquid-markets-client';
import { hyperliquidSymbolToTokenId, transformHyperliquidMarketToTokenData } from './hyperliquidAdapter';
import { TokenData } from './liveTokensStore';
import { logger, RainbowError } from '@/logger';

export async function fetchHyperliquidPrices(symbols: string[]): Promise<Record<string, TokenData>> {
  try {
    const allMarketsInfo = await hyperliquidMarketsClient.getAllMarketsInfo();
    const result: Record<string, TokenData> = {};

    allMarketsInfo.forEach(market => {
      if (market && symbols.includes(market.symbol)) {
        const tokenId = hyperliquidSymbolToTokenId(market.symbol);
        result[tokenId] = transformHyperliquidMarketToTokenData(market);
      }
    });

    return result;
  } catch (error) {
    logger.error(new RainbowError('[fetchHyperliquidPrices] Failed to fetch Hyperliquid prices:', error));
    return {};
  }
}
