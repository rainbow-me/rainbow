import { transformHyperliquidMarketToTokenData } from './hyperliquidAdapter';
import { TokenData } from './liveTokensStore';
import { logger, RainbowError } from '@/logger';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { getAllMarketsInfo } from '@/features/perps/utils/hyperliquid';

export async function fetchHyperliquidPrices(symbols: string[]): Promise<Record<string, TokenData>> {
  try {
    const allMarketsInfo = await getAllMarketsInfo();
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
