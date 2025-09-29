import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { PerpMarketWithMetadata, PerpPositionSide, PerpsPosition, TriggerOrder } from '../types';
import { getHyperliquidAccountClient, getHyperliquidExchangeClient, useHyperliquidClients } from '../services';
import { RainbowError } from '@/logger';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { OrderResponse } from '@nktkas/hyperliquid';
import { hyperliquidMarketsActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import { hlOpenOrdersStoreActions } from '@/features/perps/stores/hlOpenOrdersStore';
import { refetchHyperliquidStores } from '@/features/perps/utils';

type HyperliquidAccountActions = {
  getBalance: () => string;
  getValue: () => string;
  getPositions: () => Record<string, PerpsPosition>;
  getPosition: (symbol: string) => PerpsPosition | undefined;
};

type HyperliquidAccountParams = {
  address: Address;
};

type FetchHyperliquidAccountResponse = {
  positions: Record<string, PerpsPosition>;
  balance: string;
  value: string;
};

export const PERPS_EMPTY_ACCOUNT_DATA = Object.freeze({
  positions: {},
  balance: '0',
  value: '0',
});

export const useHyperliquidAccountStore = createQueryStore<
  FetchHyperliquidAccountResponse,
  HyperliquidAccountParams,
  HyperliquidAccountActions
>(
  {
    fetcher: fetchHyperliquidAccount,
    cacheTime: time.days(1),
    params: { address: $ => $(useHyperliquidClients).address },
    staleTime: time.seconds(10),
  },

  (_, get) => ({
    getBalance: () => get().getData()?.balance ?? PERPS_EMPTY_ACCOUNT_DATA.balance,
    getPosition: symbol => get().getData()?.positions[symbol],
    getPositions: () => get().getData()?.positions ?? PERPS_EMPTY_ACCOUNT_DATA.positions,
    getValue: () => get().getData()?.value ?? PERPS_EMPTY_ACCOUNT_DATA.value,
  }),

  { storageKey: 'hyperliquidAccountStore' }
);

export const hyperliquidAccountActions = createStoreActions(useHyperliquidAccountStore, {
  cancelOrder,
  closeIsolatedMarginPosition,
  createIsolatedMarginPosition,
  createTriggerOrder,
  withdraw,
});

async function fetchHyperliquidAccount(
  _: HyperliquidAccountParams,
  abortController: AbortController | null
): Promise<FetchHyperliquidAccountResponse> {
  const { balance, positions, value } = await getHyperliquidAccountClient().getPerpAccount(abortController?.signal);
  return {
    balance,
    positions,
    value,
  };
}

async function cancelOrder({ symbol, orderId }: { symbol: string; orderId: number }): Promise<void> {
  const market = getMarket(symbol);
  await getHyperliquidExchangeClient().cancelOrder({ assetId: market.id, orderId });
  await hlOpenOrdersStoreActions.fetch(undefined, { force: true });
}

async function closeIsolatedMarginPosition({ symbol, price, size }: { symbol: string; price: string; size: string }): Promise<void> {
  const market = getMarket(symbol);
  await getHyperliquidExchangeClient().closeIsolatedMarginPosition({
    assetId: market.id,
    price,
    sizeDecimals: market.decimals,
    size,
  });
  await refetchHyperliquidStores();
}

async function createIsolatedMarginPosition({
  symbol,
  side,
  leverage,
  marginAmount,
  price,
  triggerOrders,
}: {
  symbol: string;
  side: PerpPositionSide;
  leverage: number;
  marginAmount: string;
  price: string;
  triggerOrders?: TriggerOrder[];
}): Promise<OrderResponse | void> {
  const market = getMarket(symbol);

  const result = await getHyperliquidExchangeClient().openIsolatedMarginPosition({
    assetId: market.id,
    leverage,
    marginAmount,
    price,
    side,
    sizeDecimals: market.decimals,
    triggerOrders,
  });

  await refetchHyperliquidStores();
  return result;
}

async function createTriggerOrder({ symbol, triggerOrder }: { symbol: string; triggerOrder: TriggerOrder }): Promise<void> {
  const market = getMarket(symbol);
  const position = useHyperliquidAccountStore.getState().getPosition(symbol);
  if (!position) {
    throw new RainbowError('[HyperliquidTradingActions] No open position for trigger order');
  }

  const positionSize = Math.abs(Number(position.size)).toString();

  await getHyperliquidExchangeClient().createTriggerOrder({
    assetId: market.id,
    side: position.side,
    triggerPrice: triggerOrder.price,
    type: triggerOrder.type,
    orderFraction: triggerOrder.orderFraction,
    positionSize,
    sizeDecimals: market.decimals,
  });

  await refetchHyperliquidStores();
}

export async function withdraw(amount: string): Promise<void> {
  await getHyperliquidExchangeClient().withdraw(amount);
}

function getMarket(symbol: string): PerpMarketWithMetadata {
  const market = hyperliquidMarketsActions.getMarket(symbol);
  if (!market) {
    throw new RainbowError('[HyperliquidTradingActions] Market not found');
  }
  return market;
}
