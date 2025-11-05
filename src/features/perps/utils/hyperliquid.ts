import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { PerpMarket } from '@/features/perps/types';
import { divide, subtract, multiply } from '@/helpers/utilities';
import { MetaAndAssetCtxsResponse } from '@nktkas/hyperliquid';
import { getSymbolConverter } from '@/features/perps/utils/hyperliquidSymbolConverter';
import { extractBaseSymbol, normalizeDexSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';
import { hyperliquidDexActions } from '@/features/perps/stores/hyperliquidDexStore';

function processMarketsForDex({
  metaAndAssetCtxs,
  dex,
  converter,
}: {
  metaAndAssetCtxs: MetaAndAssetCtxsResponse;
  dex: string;
  converter: SymbolConverter;
}): PerpMarket[] {
  const [meta, assetCtxs] = metaAndAssetCtxs;
  const assetsBasicInfo = meta.universe;
  const assetsPricingInfo = assetCtxs;

  return assetsBasicInfo
    .map((asset, index) => {
      const assetPricingInfo = assetsPricingInfo[index];
      if (!assetPricingInfo || asset.isDelisted) {
        return null;
      }

      const symbol = normalizeDexSymbol(asset.name, dex);
      const assetId = converter.getAssetId(symbol);

      if (assetId === undefined) {
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
        symbol,
        baseSymbol: extractBaseSymbol(asset.name),
        maxLeverage: asset.maxLeverage,
        marginTiers: marginTable?.marginTiers,
        decimals: asset.szDecimals,
        fundingRate: assetPricingInfo.funding,
        dex,
      } satisfies PerpMarket;
    })
    .filter(Boolean);
}

export async function getAllMarketsInfo(): Promise<PerpMarket[]> {
  const dexIds = hyperliquidDexActions.getDexIds();
  const converter = await getSymbolConverter();
  const dexResponses: MetaAndAssetCtxsResponse[] = await Promise.all(dexIds.map(dex => infoClient.metaAndAssetCtxs({ dex })));

  const allMarkets = dexResponses.map((metaAndAssetCtxs, index) => {
    const dex = dexIds[index];
    return processMarketsForDex({ metaAndAssetCtxs, dex, converter });
  });

  return allMarkets.flat();
}
