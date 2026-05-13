import { type MetaAndAssetCtxsResponse } from '@nktkas/hyperliquid';
import { type SymbolConverter } from '@nktkas/hyperliquid/utils';

import { SUPPORTED_COLLATERAL_TOKENS } from '@/features/perps/constants';
import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { hyperliquidDexActions } from '@/features/perps/stores/hyperliquidDexStore';
import { type PerpMarket } from '@/features/perps/types';
import { getSymbolConverter } from '@/features/perps/utils/hyperliquidSymbolConverter';
import { extractBaseSymbol, normalizeDexSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { divide, multiply, subtract } from '@/helpers/utilities';

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

  // Collateral token is the same for every market in a dex
  if (!(meta.collateralToken in SUPPORTED_COLLATERAL_TOKENS)) {
    return [];
  }

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

      const priceChange24h = calculatePerpPriceChange24h(price, previousDayPrice);

      return {
        id: assetId,
        price,
        midPrice,
        previousDayPrice,
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
        openInterest: assetPricingInfo.openInterest,
        dex,
      } satisfies PerpMarket;
    })
    .filter(Boolean);
}

/**
 * Fetches the full Hyperliquid market snapshot for every supported dex.
 */
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

/**
 * Calculates the stored Hyperliquid 24h price-change fraction from current and previous-day prices.
 */
export function calculatePerpPriceChange24h(price: string, previousDayPrice: string): string {
  return divide(subtract(price, previousDayPrice), multiply(previousDayPrice, 100));
}
