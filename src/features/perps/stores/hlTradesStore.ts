import * as hl from '@nktkas/hyperliquid';
import { Address } from 'viem';
import { getHyperliquidAccountClient, useHyperliquidClients } from '@/features/perps/services';
import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { time } from '@/utils/time';
import { TriggerOrderType, HlTrade, TradeExecutionType } from '../types';
import { convertSide } from '../utils';
import * as i18n from '@/languages';
import { subWorklet } from '@/safe-math/SafeMath';

type HlTradesParams = {
  address: Address | string | null;
};

type FetchHlTradesResponse = {
  trades: HlTrade[];
  tradesBySymbol: Record<string, HlTrade[]>;
};

export const tradeExecutionDescriptions: Readonly<Record<TradeExecutionType, string>> = Object.freeze({
  [TradeExecutionType.TAKE_PROFIT_EXECUTED]: i18n.t(i18n.l.perps.history.trade_execution.take_profit_executed),
  [TradeExecutionType.STOP_LOSS_EXECUTED]: i18n.t(i18n.l.perps.history.trade_execution.stop_loss_executed),
  [TradeExecutionType.LONG_OPENED]: i18n.t(i18n.l.perps.history.trade_execution.long_opened),
  [TradeExecutionType.SHORT_OPENED]: i18n.t(i18n.l.perps.history.trade_execution.short_opened),
  [TradeExecutionType.LONG_CLOSED]: i18n.t(i18n.l.perps.history.trade_execution.long_closed),
  [TradeExecutionType.SHORT_CLOSED]: i18n.t(i18n.l.perps.history.trade_execution.short_closed),
  [TradeExecutionType.LONG_LIQUIDATED]: i18n.t(i18n.l.perps.history.trade_execution.long_liquidated),
  [TradeExecutionType.SHORT_LIQUIDATED]: i18n.t(i18n.l.perps.history.trade_execution.short_liquidated),
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

function convertFillAndOrderToTrade({ fill, order }: { fill: hl.Fill; order: hl.FrontendOrder }): HlTrade {
  const isTakeProfit = order.isPositionTpsl && order.orderType.includes('Take Profit');
  const isStopLoss = order.isPositionTpsl && order.orderType.includes('Stop');
  const triggerOrderType = isTakeProfit ? TriggerOrderType.TAKE_PROFIT : isStopLoss ? TriggerOrderType.STOP_LOSS : undefined;
  const isLong = fill.dir.includes('Long');
  const entryPrice = getEntryPriceFromFill(fill);

  const trade: Omit<HlTrade, 'description' | 'executionType'> = {
    id: fill.tid,
    clientId: fill.cloid || undefined,
    symbol: fill.coin,
    side: convertSide(order.side),
    entryPrice,
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
    netPnl: subWorklet(fill.closedPnl, fill.fee),
    isLong,
  };

  const executionType = getTradeExecutionType(trade);

  return {
    ...trade,
    executionType,
    description: tradeExecutionDescriptions[executionType],
  };
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

function getEntryPriceFromFill(fill: hl.Fill): string | undefined {
  const closedPnl = Number(fill.closedPnl);
  if (closedPnl === 0) return;

  const size = Number(fill.sz);
  const exitPrice = Number(fill.px);

  const positionSize = fill.side === 'B' ? -size : size;

  const entryPrice = exitPrice - closedPnl / positionSize;
  return String(entryPrice);
}

function getTradeExecutionType(trade: Omit<HlTrade, 'description' | 'executionType'>): TradeExecutionType {
  const startPos = Number(trade.fillStartSize);
  const isBuy = trade.side === 'buy';

  const isLong = isBuy ? startPos >= 0 : startPos > 0;

  if (trade.liquidation) {
    return isLong ? TradeExecutionType.LONG_LIQUIDATED : TradeExecutionType.SHORT_LIQUIDATED;
  }

  if (trade.triggerOrderType) {
    return trade.triggerOrderType === TriggerOrderType.TAKE_PROFIT
      ? TradeExecutionType.TAKE_PROFIT_EXECUTED
      : TradeExecutionType.STOP_LOSS_EXECUTED;
  }

  const isOpening = (isBuy && startPos >= 0) || (!isBuy && startPos <= 0);

  if (isOpening) {
    return isBuy ? TradeExecutionType.LONG_OPENED : TradeExecutionType.SHORT_OPENED;
  } else {
    return isBuy ? TradeExecutionType.SHORT_CLOSED : TradeExecutionType.LONG_CLOSED;
  }
}
