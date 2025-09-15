import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { getHyperliquidAccountClient } from '../services';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import * as hl from '@nktkas/hyperliquid';
import { TriggerOrderType, HlTrade } from '../types';
import { convertSide } from '../utils';

type HlTradesParams = {
  address: Address | string | null;
};

type FetchHlTradesResponse = {
  trades: HlTrade[];
  tradesBySymbol: Record<string, HlTrade[]>;
};

export const tradeExecutionDescriptions = {
  takeProfitExecuted: 'Take Profit Executed',
  stopLossExecuted: 'Stop Loss Executed',
  longOpened: 'Long Opened',
  shortOpened: 'Short Opened',
  longClosed: 'Long Closed',
  shortClosed: 'Short Closed',
  longLiquidated: 'Long Liquidated',
  shortLiquidated: 'Short Liquidated',
};

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
  // TODO (kane): trigger condition can also be the value "Triggered", am unsure what that represents
  const isTakeProfit = order.isPositionTpsl && order.triggerCondition?.includes('above');
  const isStopLoss = order.isPositionTpsl && order.triggerCondition?.includes('below');
  const triggerOrderType = isTakeProfit ? TriggerOrderType.TAKE_PROFIT : isStopLoss ? TriggerOrderType.STOP_LOSS : undefined;

  const trade = {
    id: fill.tid,
    clientId: fill.cloid || undefined,
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
  };

  return {
    ...trade,
    description: getTradeExecutionDescription(trade),
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
  return trades.reduce(
    (acc, trade) => {
      acc[trade.symbol] = [...(acc[trade.symbol] || []), trade];
      return acc;
    },
    {} as Record<string, HlTrade[]>
  );
}

type HlTradesStoreState = {
  trades: HlTrade[];
  tradesBySymbol: Record<string, HlTrade[]>;
};

type HlTradesStoreActions = {
  getTrade: (tradeId: number) => HlTrade | undefined;
};

type HlTradesStore = HlTradesStoreState & HlTradesStoreActions;

async function fetchHlTrades({ address }: HlTradesParams): Promise<FetchHlTradesResponse> {
  if (!address) throw new RainbowError('[HlTradesStore] Address is required');

  const accountClient = getHyperliquidAccountClient(address);

  // Both of these return the 2,000 most recent objects. `getFilledOrders` could support pagination, but `getHistoricalOrders` cannot.
  const [historicalOrders, filledOrders] = await Promise.all([accountClient.getHistoricalOrders(), accountClient.getFilledOrders()]);

  const trades = createTradeHistory({ orders: historicalOrders, fills: filledOrders });

  return {
    trades,
    tradesBySymbol: buildTradesBySymbol(trades),
  };
}

export const useHlTradesStore = createQueryStore<FetchHlTradesResponse, HlTradesParams, HlTradesStore>(
  {
    fetcher: fetchHlTrades,
    setData: ({ data, set }) => {
      set({
        trades: data.trades,
        tradesBySymbol: data.tradesBySymbol,
      });
    },
    cacheTime: time.days(1),
    params: {
      address: $ => $(useWalletsStore).accountAddress,
    },
    staleTime: time.minutes(1),
  },
  (_, get) => ({
    trades: [],
    tradesBySymbol: {},
    getTrade: (tradeId: number) => get().trades.find(trade => trade.id === tradeId),
  })
);
