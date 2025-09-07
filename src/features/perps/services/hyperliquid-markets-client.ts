import { divide, multiply, subtract } from '@/helpers/utilities';
import { infoClient } from './hyperliquid-account-client';
import { RainbowError } from '@/logger';
import { convertHyperliquidPerpAssetIdToSpotAssetId } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';

export class HyperliquidMarketsClient {
  async getAllMarketsInfo(): Promise<PerpMarket[]> {
    const [meta, assetCtxs] = await infoClient.metaAndAssetCtxs();
    const assetsBasicInfo = meta.universe;
    const assetsPricingInfo = assetCtxs;

    return assetsBasicInfo
      .map((asset, index) => {
        const assetId = index;
        const assetPricingInfo = assetsPricingInfo[index];
        if (!assetPricingInfo || asset.isDelisted) {
          return null;
        }

        // TODO (kane): What are the default margin tiers, how are we supposed to handle the liq. calc?
        const marginTable = meta.marginTables.find(mt => mt[0] === asset.marginTableId)?.[1] ?? null;
        const markPrice = assetPricingInfo.markPx;
        const midPrice = assetPricingInfo.midPx ?? markPrice;
        const price = midPrice ?? markPrice;
        const previousDayPrice = assetPricingInfo.prevDayPx;

        const priceChange24h = divide(subtract(price, previousDayPrice), multiply(previousDayPrice, 100));

        return {
          id: assetId,
          price,
          // TODO (kane): if the mid price is undefined, should we not return this market?
          // what conditions is the mid price undefined? why is that possible? Can we just use the mark price in this case?
          midPrice,
          priceChange: {
            '1h': '',
            '24h': priceChange24h,
          },
          volume: {
            '24h': assetPricingInfo.dayNtlVlm,
          },
          symbol: asset.name,
          maxLeverage: asset.maxLeverage,
          marginTiers: marginTable?.marginTiers,
          decimals: asset.szDecimals,
          fundingRate: assetPricingInfo.funding,
        };
      })
      .filter(Boolean);
  }

  async getAllAssetPricesBySymbol() {
    return await infoClient.allMids();
  }

  async getAssetPricesBySymbol(assetSymbols: string[]) {
    const allAssetPrices = await this.getAllAssetPricesBySymbol();
    return assetSymbols.map(symbol => allAssetPrices[symbol]);
  }

  async getAssetId(symbol: string, isSpot?: boolean) {
    const meta = await infoClient.meta();
    const assetId = meta.universe.findIndex(u => u.name === symbol);
    if (assetId === -1) {
      throw new RainbowError('[HyperliquidMarketsClient] Asset not found', { symbol });
    }

    return isSpot ? convertHyperliquidPerpAssetIdToSpotAssetId(assetId) : assetId;
  }
}

export const hyperliquidMarketsClient = new HyperliquidMarketsClient();
