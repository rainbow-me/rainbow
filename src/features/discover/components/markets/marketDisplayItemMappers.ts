import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import {
  getMarketPriceChangeColor,
  MARKET_NEUTRAL_CHART_COLOR,
  MARKET_PRICE_CHANGE_COLORS,
} from '@/features/discover/components/markets/marketCardChrome';
import { buildTokenLineChartId, useTokenLineChartsStore } from '@/features/discover/stores/tokenLineChartsStore';
import { type MarketDisplayItem } from '@/features/discover/types/marketDisplayItem';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { getHyperliquidTokenId, navigateToPerpDetailScreen } from '@/features/perps/utils';
import { formatPerpAssetPrice, selectFormattedMarkPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { type PerpMarketPlacementItem } from '@/features/placements/stores/derived/perpsPlacementStore';
import { type TokenPlacementItem } from '@/features/placements/stores/derived/tokensPlacementStore';
import { formatCurrency } from '@/helpers/strings';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getUniqueId } from '@/utils/ethereumUtils';

const TOKEN_SPARKLINE_MAX_POINTS = 24;

export function perpToMarketDisplayItem(item: PerpMarketPlacementItem): MarketDisplayItem {
  const { market } = item;
  const displayName = market.baseSymbol;
  const initialPriceChange = market.priceChange['24h'];

  return {
    id: item.id,
    accentColor: getPerpMarketAccentColor(market),
    chartColor: getPerpPriceChangeChartColor(initialPriceChange),
    chartId: market.symbol,
    chartStore: useHyperliquidLineChartsStore,
    displayName,
    iconUrl: market.metadata?.iconUrl,
    initialPrice: formatPerpAssetPrice(market.midPrice ?? market.price),
    initialPriceChange,
    leverage: market.maxLeverage,
    liveTokenId: getHyperliquidTokenId(market.symbol),
    onNavigate: () => navigateToPerpDetailScreen(market.symbol),
    pressMetadata: {
      marketId: market.symbol,
      marketName: market.metadata?.name ?? displayName,
      marketSymbol: displayName,
    },
    priceChangeSelector: token => token.change.change24hPct,
    priceSelector: selectFormattedMarkPrice,
  };
}

export function tokenToMarketDisplayItem({
  accentColor,
  item,
  nativeCurrency,
}: {
  accentColor: string;
  item: TokenPlacementItem;
  nativeCurrency: NativeCurrencyKey;
}): MarketDisplayItem {
  const { asset } = item;
  const initialPriceChange = normalizeTokenPriceChange(asset.price.relativeChange24h);
  const liveTokenId = getUniqueId(asset.address, asset.chainId);

  return {
    id: item.id,
    accentColor,
    chartColor: getTokenPriceChangeChartColor(asset.price.relativeChange24h),
    chartId: buildTokenLineChartId({ address: asset.address, chainId: asset.chainId, currency: nativeCurrency }),
    chartMaxPoints: TOKEN_SPARKLINE_MAX_POINTS,
    chartStore: useTokenLineChartsStore,
    displayName: asset.name,
    iconUrl: asset.iconUrl || asset.icon_url,
    initialPrice: formatCurrency(asset.price.value ? String(asset.price.value) : '0', { currency: nativeCurrency }),
    initialPriceLastUpdated: asset.price.updatedAt,
    initialPriceChange,
    leverage: undefined,
    liveTokenId,
    onNavigate: () => {
      Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, {
        asset,
        address: asset.address,
        chainId: asset.chainId,
      });
    },
    pressMetadata: {
      marketId: item.id,
      marketName: asset.name,
      marketSymbol: asset.symbol,
    },
    priceChangeSelector: token => normalizeTokenPriceChange(token.change.change24hPct),
    priceSelector: token => formatCurrency(token.price, { currency: nativeCurrency }),
  };
}

function getPerpMarketAccentColor(market: PerpMarketWithMetadata): string {
  return market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || HYPERLIQUID_COLORS.green;
}

function getPerpPriceChangeChartColor(priceChange: string): string {
  return getMarketPriceChangeColor(priceChange, MARKET_PRICE_CHANGE_COLORS.dark);
}

function getTokenPriceChangeChartColor(priceChange: number | string | null | undefined): string {
  const value = Number(priceChange || 0);
  if (value > 0) return MARKET_PRICE_CHANGE_COLORS.dark.positive;
  if (value < 0) return MARKET_PRICE_CHANGE_COLORS.dark.negative;
  return MARKET_NEUTRAL_CHART_COLOR;
}

function normalizeTokenPriceChange(priceChange: number | string | null | undefined): string {
  const value = Number(priceChange || 0);
  if (!Number.isFinite(value)) return '0';
  return String(value / 10_000);
}
