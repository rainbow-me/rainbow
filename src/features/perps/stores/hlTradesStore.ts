import * as hl from '@nktkas/hyperliquid';
import { Address } from 'viem';
import { getHyperliquidAccountClient, useHyperliquidClients } from '@/features/perps/services';
import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { time } from '@/utils/time';
import { TriggerOrderType, HlTrade } from '../types';
import { convertSide } from '../utils';
import * as i18n from '@/languages';

type HlTradesParams = {
  address: Address | string | null;
};

type FetchHlTradesResponse = {
  trades: HlTrade[];
  tradesBySymbol: Record<string, HlTrade[]>;
};

export const tradeExecutionDescriptions = Object.freeze({
  takeProfitExecuted: i18n.t(i18n.l.perps.history.trade_execution.take_profit_executed),
  stopLossExecuted: i18n.t(i18n.l.perps.history.trade_execution.stop_loss_executed),
  longOpened: i18n.t(i18n.l.perps.history.trade_execution.long_opened),
  shortOpened: i18n.t(i18n.l.perps.history.trade_execution.short_opened),
  longClosed: i18n.t(i18n.l.perps.history.trade_execution.long_closed),
  shortClosed: i18n.t(i18n.l.perps.history.trade_execution.short_closed),
  longLiquidated: i18n.t(i18n.l.perps.history.trade_execution.long_liquidated),
  shortLiquidated: i18n.t(i18n.l.perps.history.trade_execution.short_liquidated),
});

type HlTradesStoreActions = {
  getTrade: (tradeId: number) => HlTrade | undefined;
  getTrades: () => HlTrade[] | undefined;
  getTradesBySymbol: () => Record<string, HlTrade[]> | undefined;
};

export const useHlTradesStore = createQueryStore<FetchHlTradesResponse, HlTradesParams, HlTradesStoreActions>(
  {
    fetcher: fetchHlTrades,
    cacheTime: time.days(1),
    params: { address: $ => $(useHyperliquidClients).address },
    staleTime: time.minutes(1),
  },

  (_, get) => ({
    getTrade: (tradeId: number) =>
      get()
        .getData()
        ?.trades.find(trade => trade.id === tradeId),

    getTrades: () => get().getData()?.trades,

    getTradesBySymbol: () => get().getData()?.tradesBySymbol,
  })
);

export const hlTradesStoreActions = createStoreActions(useHlTradesStore);

async function fetchHlTrades({ address }: HlTradesParams, abortController: AbortController | null): Promise<FetchHlTradesResponse> {
  if (!address) throw new RainbowError('[HlTradesStore] Address is required');

  // Both of these return the 2,000 most recent objects. `getFilledOrders` could support pagination, but `getHistoricalOrders` cannot.
  const [historicalOrders, filledOrders] = await Promise.all([
    getHyperliquidAccountClient().getHistoricalOrders(abortController?.signal),
    getHyperliquidAccountClient().getFilledOrders(abortController?.signal),
  ]);

  const trades = createTradeHistory({ orders: historicalOrders, fills: filledOrders });

  return {
    trades,
    tradesBySymbol: buildTradesBySymbol(trades),
  };
}

function getTradeExecutionDescription(trade: Omit<HlTrade, 'description'>): string {
  const startPos = Number(trade.fillStartSize);
  const isBuy = trade.side === 'buy';

  const isLong = isBuy ? startPos >= 0 : startPos > 0;

  if (trade.liquidation) {
    return `${isLong ? tradeExecutionDescriptions.longLiquidated : tradeExecutionDescriptions.shortLiquidated}`;
  }

  if (trade.triggerOrderType) {
    return trade.triggerOrderType === TriggerOrderType.TAKE_PROFIT
      ? tradeExecutionDescriptions.takeProfitExecuted
      : tradeExecutionDescriptions.stopLossExecuted;
  }

  const isOpening = (isBuy && startPos >= 0) || (!isBuy && startPos <= 0);

  if (isOpening) {
    return isBuy ? tradeExecutionDescriptions.longOpened : tradeExecutionDescriptions.shortOpened;
  } else {
    return isBuy ? tradeExecutionDescriptions.shortClosed : tradeExecutionDescriptions.longClosed;
  }
}

function convertFillAndOrderToTrade({ fill, order }: { fill: hl.Fill; order: hl.FrontendOrder }): HlTrade {
  const isTakeProfit = order.isPositionTpsl && order.orderType.includes('Take Profit');
  const isStopLoss = order.isPositionTpsl && order.orderType.includes('Stop');
  const triggerOrderType = isTakeProfit ? TriggerOrderType.TAKE_PROFIT : isStopLoss ? TriggerOrderType.STOP_LOSS : undefined;

  const trade = {
    id: fill.tid,
    clientId: fill.cloid || undefined,
    description: '',
    symbol: fill.coin,
    side: convertSide(order.side),
    price: fill.px,
    size: fill.sz,
    fillStartSize: fill.startPosition,
    orderStartSize: order.origSz,
    pnl: fill.closedPnl,
    fee: fill.fee,
    orderId: fill.oid,
    tradeId: fill.tid,
    txHash: fill.hash,
    liquidation: fill.liquidation,
    executedAt: new Date(fill.time),
    direction: fill.dir,
    orderType: order.orderType,
    triggerOrderType,
    triggerOrderPrice: order.triggerPx,
    netPnl: fill.closedPnl,
  };

  trade.description = getTradeExecutionDescription(trade);
  return trade;
}

function createTradeHistory({ orders, fills }: { orders: hl.OrderStatus<hl.FrontendOrder>[]; fills: hl.Fill[] }): HlTrade[] {
  const ordersMap = new Map<number, hl.FrontendOrder>();
  const tradeHistory: HlTrade[] = [];

  orders.forEach(orderWithStatus => {
    const order = orderWithStatus.order;
    ordersMap.set(order.oid, order);
  });

  fills.forEach(fill => {
    const order = ordersMap.get(fill.oid);
    if (order) {
      tradeHistory.push(convertFillAndOrderToTrade({ fill, order }));
    }
  });

  return tradeHistory;
}

function buildTradesBySymbol(trades: HlTrade[]): Record<string, HlTrade[]> {
  return trades.reduce<Record<string, HlTrade[]>>((acc, trade) => {
    acc[trade.symbol] = [...(acc[trade.symbol] || []), trade];
    return acc;
  }, {});
}
