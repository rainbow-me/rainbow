import { PerpsNavigation } from '@/features/perps/screens/PerpsNavigator';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { hlOpenOrdersStoreActions } from '@/features/perps/stores/hlOpenOrdersStore';
import { hlTradesStoreActions } from '@/features/perps/stores/hlTradesStore';
import { hyperliquidAccountActions } from '@/features/perps/stores/hyperliquidAccountStore';
import { hyperliquidMarketsActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import { OrderSide, PerpMarket, PerpPositionSide } from '@/features/perps/types';
import { ensureError } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { toFixedWorklet } from '@/safe-math/SafeMath';

export function getHyperliquidTokenId(symbol?: string): string {
  if (!symbol) return '';
  return `${symbol}:hl`;
}

export function getOppositePositionSide(side: PerpPositionSide): PerpPositionSide {
  return side === PerpPositionSide.LONG ? PerpPositionSide.SHORT : PerpPositionSide.LONG;
}

export function convertHyperliquidPerpAssetIdToSpotAssetId(assetId: number): number {
  return assetId + 10_000;
}

export function formatPriceChange(priceChange: string) {
  return `${toFixedWorklet(Number(priceChange) * 10_000, 2)}%`;
}

export function navigateToNewPositionScreen(market: PerpMarket) {
  useHlNewPositionStore.getState().setMarket(market);
  PerpsNavigation.navigate(Routes.PERPS_NEW_POSITION_SCREEN);
}

export function navigateToPerpDetailScreen(symbol: string) {
  const market = hyperliquidMarketsActions.getMarket(symbol);
  if (market) {
    Navigation.handleAction(Routes.PERPS_DETAIL_SCREEN, {
      market,
    });
  }
}

export function convertSide(side: 'B' | 'A'): OrderSide {
  return side === 'B' ? 'buy' : 'sell';
}

export async function refetchHyperliquidStores() {
  await Promise.allSettled([
    hlOpenOrdersStoreActions.fetch(undefined, { force: true }),
    hlTradesStoreActions.fetch(undefined, { force: true }),
    hyperliquidMarketsActions.fetch(undefined, { force: true }),
    hyperliquidAccountActions.fetch(undefined, { force: true }),
  ]);
}

// Error strings are in the format: "Order ${orderNumber}: ${message}. asset=${assetId}"
export function parseHyperliquidErrorMessage(e: unknown): string {
  const error = ensureError(e);
  const match = error.message.match(/Order (\d+): (.+)\. asset=(\d+)/);
  return match ? match[2] : error.message;
}
