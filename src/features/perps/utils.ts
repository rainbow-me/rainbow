import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { hyperliquidMarketStoreActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import { OrderSide, PerpMarket, PerpPositionSide } from '@/features/perps/types';
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
  Navigation.handleAction(Routes.PERPS_ACCOUNT_NAVIGATOR, {
    screen: Routes.PERPS_NEW_POSITION_SCREEN,
    params: { market },
  });
}

export function navigateToPerpDetailScreen(symbol: string) {
  const market = hyperliquidMarketStoreActions.getMarket(symbol);
  if (market) {
    Navigation.handleAction(Routes.PERPS_DETAIL_SCREEN, {
      market,
    });
  }
}

export function convertSide(side: 'B' | 'A'): OrderSide {
  return side === 'B' ? 'buy' : 'sell';
}
