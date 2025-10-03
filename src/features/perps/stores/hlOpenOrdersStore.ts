import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { infoClient } from '@/features/perps/services/hyperliquid-account-client';
import { OrderSide } from '@/features/perps/types';
import * as hl from '@nktkas/hyperliquid';
import { convertSide } from '@/features/perps/utils';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

export type HlOpenOrder = {
  id: number;
  symbol: string;
  side: OrderSide;
  triggerPrice: string;
  size: string;
  originalSize: string;
  limitPrice: string;
  isPositionTpsl: boolean;
  orderType: hl.FrontendOrder['orderType'];
  triggerCondition: string;
  reduceOnly: boolean;
  tif: hl.FrontendOrder['tif'];
};

type HlOpenOrdersParams = {
  address: Address | null;
};

type FetchHlOpenOrdersResponse = {
  ordersBySymbol: Record<string, HlOpenOrder[]>;
};

type HlOpenOrdersStoreState = {
  ordersBySymbol: Record<string, HlOpenOrder[]>;
};

type HlOpenOrdersStore = HlOpenOrdersStoreState;

async function fetchHlOpenOrders(
  { address }: HlOpenOrdersParams,
  abortController: AbortController | null
): Promise<FetchHlOpenOrdersResponse> {
  if (!address) throw new RainbowError('[HlOpenOrdersStore] Address is required');

  const frontendOrders = await infoClient.frontendOpenOrders({ user: address }, abortController?.signal);
  const orders: HlOpenOrder[] = frontendOrders.map(order => ({
    id: order.oid,
    symbol: order.coin,
    side: convertSide(order.side),
    triggerPrice: order.triggerPx,
    size: order.sz,
    originalSize: order.origSz,
    limitPrice: order.limitPx,
    isPositionTpsl: order.isPositionTpsl,
    orderType: order.orderType,
    triggerCondition: order.triggerCondition,
    reduceOnly: order.reduceOnly,
    tif: order.tif,
  }));

  const ordersBySymbol = orders.reduce(
    (acc, order) => {
      acc[order.symbol] = [...(acc[order.symbol] || []), order];
      return acc;
    },
    {} as Record<string, HlOpenOrder[]>
  );

  return {
    ordersBySymbol,
  };
}

export const useHlOpenOrdersStore = createQueryStore<FetchHlOpenOrdersResponse, HlOpenOrdersParams, HlOpenOrdersStore>(
  {
    fetcher: fetchHlOpenOrders,
    cacheTime: time.days(1),
    params: {
      address: $ => $(useWalletsStore).accountAddress,
    },
    staleTime: time.minutes(1),
  },
  () => ({
    ordersBySymbol: {},
  })
);

export const hlOpenOrdersStoreActions = createStoreActions(useHlOpenOrdersStore);
