import { hyperliquidMarketsClient } from '@/features/perps/services/hyperliquid-markets-client';
import { hyperliquidSymbolToTokenId, transformHyperliquidAssetInfo } from './hyperliquidAdapter';
import { TokenData } from './liveTokensStore';
import { logger, RainbowError } from '@/logger';

export async function fetchHyperliquidPrices(symbols: string[]): Promise<Record<string, TokenData>> {
  try {
    const allAssetsInfo = await hyperliquidMarketsClient.getAllAssetsInfo();
    const result: Record<string, TokenData> = {};

    // Filter and transform only the requested symbols
    allAssetsInfo.forEach(assetInfo => {
      if (assetInfo && symbols.includes(assetInfo.symbol)) {
        const tokenId = hyperliquidSymbolToTokenId(assetInfo.symbol);
        result[tokenId] = transformHyperliquidAssetInfo(assetInfo);
      }
    });

    return result;
  } catch (error) {
    logger.error(new RainbowError('[fetchHyperliquidPrices] Failed to fetch Hyperliquid prices:', error));
    return {};
  }
}
