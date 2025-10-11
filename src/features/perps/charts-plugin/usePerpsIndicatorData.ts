import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { isHyperliquidToken } from '@/features/charts/utils';
import { useHlOpenOrdersStore } from '@/features/perps/stores/hlOpenOrdersStore';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { PerpsIndicatorKey } from './PerpsIndicator';
import { PerpsIndicatorData } from './PerpsIndicatorBuilder';

enum OrderType {
  StopLimit = 'Stop Limit',
  StopMarket = 'Stop Market',
  TakeProfitLimit = 'Take Profit Limit',
  TakeProfitMarket = 'Take Profit Market',
}

const EMPTY_PERPS_INDICATOR_DATA: PerpsIndicatorData = Object.freeze({
  [PerpsIndicatorKey.Liquidation]: null,
  [PerpsIndicatorKey.StopLoss]: null,
  [PerpsIndicatorKey.TakeProfit]: null,
});

/**
 * Derives perps indicator data for the currently viewed chart, if applicable.
 * Returns liquidation and trigger order prices (SL/TP).
 */
export const usePerpsIndicatorData = createDerivedStore<PerpsIndicatorData | null>(
  $ => {
    const token = $(useChartsStore).token;
    const symbol = isHyperliquidToken(token) ? token : '';
    const position = $(useHyperliquidAccountStore, state => state.getPosition(symbol));
    const openOrders = $(useHlOpenOrdersStore, state => state.getData()?.ordersBySymbol[symbol]);

    if (!position || !symbol) return EMPTY_PERPS_INDICATOR_DATA;

    const liquidationPrice = position?.liquidationPrice ? Number(position.liquidationPrice) : null;

    let stopLossPrice: number | null = null;
    let takeProfitPrice: number | null = null;

    if (openOrders) {
      for (const order of openOrders) {
        if (!order.isPositionTpsl) continue;

        const triggerPrice = Number(order.triggerPrice);
        if (isNaN(triggerPrice)) continue;

        switch (order.orderType) {
          case OrderType.StopLimit:
          case OrderType.StopMarket:
            stopLossPrice = triggerPrice;
            break;
          case OrderType.TakeProfitLimit:
          case OrderType.TakeProfitMarket:
            takeProfitPrice = triggerPrice;
            break;
        }
      }
    }

    return {
      [PerpsIndicatorKey.Liquidation]: liquidationPrice,
      [PerpsIndicatorKey.StopLoss]: stopLossPrice,
      [PerpsIndicatorKey.TakeProfit]: takeProfitPrice,
    };
  },

  { fastMode: true }
);
