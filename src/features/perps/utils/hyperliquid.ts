import { infoClient } from '@/features/perps/services/hyperliquid-account-client';
import { PerpMarket } from '@/features/perps/types';
import { divide, subtract, multiply } from '@/helpers/utilities';

export async function getAllMarketsInfo(): Promise<PerpMarket[]> {
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

      const marginTable = meta.marginTables.find(mt => mt[0] === asset.marginTableId)?.[1] ?? null;
      const markPrice = assetPricingInfo.markPx;
      const midPrice = assetPricingInfo.midPx ?? markPrice;
      const price = midPrice ?? markPrice;
      const previousDayPrice = assetPricingInfo.prevDayPx;

      const priceChange24h = divide(subtract(price, previousDayPrice), multiply(previousDayPrice, 100));

      return {
        id: assetId,
        price,
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
