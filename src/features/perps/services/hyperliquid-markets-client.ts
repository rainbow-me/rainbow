import { divide, multiply, subtract } from '@/helpers/utilities';
import { infoClient } from './hyperliquid-account-client';
import { RainbowError } from '@/logger';
import { convertHyperliquidPerpAssetIdToSpotAssetId } from '@/features/perps/utils';
import { Market } from '@/features/perps/types';

export class HyperliquidMarketsClient {
  async getAllAssetsInfo(): Promise<Market[]> {
    const response = await infoClient.metaAndAssetCtxs();
    const assetsBasicInfo = response[0].universe;
    const assetsPricingInfo = response[1];

    return assetsBasicInfo
      .map((asset, index) => {
        const assetId = index;
        const assetPricingInfo = assetsPricingInfo[index];
        if (!assetPricingInfo) {
          return null;
        }

        if (asset.isDelisted) return null;

        const currentPrice = assetPricingInfo.midPx ?? assetPricingInfo.markPx;
        const previousDayPrice = assetPricingInfo.prevDayPx;

        const priceChange24h = divide(subtract(currentPrice, previousDayPrice), multiply(previousDayPrice, 100));

        return {
          id: assetId,
          price: currentPrice,
          priceChange: {
            '1h': '',
            '24h': priceChange24h,
          },
          volume: {
            '24h': assetPricingInfo.dayNtlVlm,
          },
          symbol: asset.name,
          maxLeverage: asset.maxLeverage,
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
