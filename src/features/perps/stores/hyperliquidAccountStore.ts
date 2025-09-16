import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { PerpPositionSide, PerpsPosition, TriggerOrder } from '../types';
import { getHyperliquidAccountClient, getHyperliquidExchangeClient } from '../services';
import { RainbowError } from '@/logger';
import { add, divide, multiply, subtract } from '@/helpers/utilities';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { OrderResponse } from '@nktkas/hyperliquid';
import { DEFAULT_SLIPPAGE_BIPS } from '@/features/perps/constants';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { useHlOpenOrdersStore } from '@/features/perps/stores/hlOpenOrdersStore';

type HyperliquidAccountStoreState = {
  positions: Record<string, PerpsPosition>;
  balance: string;
  value: string;
};

type HyperliquidAccountStoreActions = {
  withdraw: (amount: string) => Promise<void>;
  createIsolatedMarginPosition: ({
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
  }) => Promise<OrderResponse>;
  closeIsolatedMarginPosition: ({ symbol, price, size }: { symbol: string; price: string; size: string }) => Promise<void>;
  checkIfHyperliquidAccountExists: () => Promise<boolean>;
  cancelOrder: ({ symbol, orderId }: { symbol: string; orderId: number }) => Promise<void>;
  getTotalPositionsInfo: () => {
    equity: string;
    unrealizedPnl: string;
    unrealizedPnlPercent: string;
  };
  getPosition: (symbol: string) => PerpsPosition | undefined;
};

type HyperliquidAccountStore = HyperliquidAccountStoreState & HyperliquidAccountStoreActions;

type HyperliquidAccountParams = {
  address: Address | string | null;
};

type FetchHyperliquidAccountResponse = {
  positions: Record<string, PerpsPosition>;
  balance: string;
  value: string;
};

async function fetchHyperliquidAccount({ address }: HyperliquidAccountParams): Promise<FetchHyperliquidAccountResponse> {
  if (!address) throw new RainbowError('[HyperliquidAccountStore] Address is required');

  const accountClient = getHyperliquidAccountClient(address);

  const { positions, balance, value } = await accountClient.getPerpAccount();

  return {
    positions,
    balance,
    value,
  };
}

export const useHyperliquidAccountStore = createQueryStore<
  FetchHyperliquidAccountResponse,
  HyperliquidAccountParams,
  HyperliquidAccountStore
>(
  {
    fetcher: fetchHyperliquidAccount,
    setData: ({ data, set }) => {
      set({
        positions: data.positions,
        balance: data.balance,
        value: data.value,
      });
    },
    cacheTime: time.days(1),
    params: {
      address: $ => $(useWalletsStore).accountAddress,
    },
    staleTime: time.seconds(10),
  },
  (set, get) => ({
    positions: {},
    balance: '0',
    value: '0',
    withdraw: async (amount: string) => {
      const address = useWalletsStore.getState().accountAddress;
      const exchangeClient = await getHyperliquidExchangeClient(address);
      await exchangeClient.withdraw(amount);
    },
    getPosition: symbol => get().positions[symbol],
    createIsolatedMarginPosition: async ({ symbol, side, leverage, marginAmount, price, triggerOrders }) => {
      const address = useWalletsStore.getState().accountAddress;
      const exchangeClient = await getHyperliquidExchangeClient(address);
      const market = useHyperliquidMarketsStore.getState().markets[symbol];
      if (!market) {
        throw new RainbowError('[HyperliquidAccountStore] Market not found');
      }
      const result = await exchangeClient.openIsolatedMarginPosition({
        assetId: market.id,
        side,
        marginAmount,
        price,
        leverage,
        sizeDecimals: market.decimals,
        triggerOrders,
      });

      // Refetch positions
      await get().fetch(undefined, { force: true });

      return result;
    },
    closeIsolatedMarginPosition: async ({ symbol, price, size }) => {
      const address = useWalletsStore.getState().accountAddress;
      const market = useHyperliquidMarketsStore.getState().markets[symbol];
      if (!market) {
        throw new RainbowError('[HyperliquidAccountStore] Market not found');
      }
      const exchangeClient = await getHyperliquidExchangeClient(address);
      await exchangeClient.closeIsolatedMarginPosition({ assetId: market.id, price, sizeDecimals: market.decimals, size });
      // Refetch positions
      await get().fetch(undefined, { force: true });
    },
    cancelOrder: async ({ symbol, orderId }: { symbol: string; orderId: number }) => {
      const address = useWalletsStore.getState().accountAddress;
      const market = useHyperliquidMarketsStore.getState().markets[symbol];
      if (!market) {
        throw new RainbowError('[HyperliquidAccountStore] Market not found');
      }
      const exchangeClient = await getHyperliquidExchangeClient(address);
      await exchangeClient.cancelOrder({ assetId: market.id, orderId });
      // Refetch open orders
      await useHlOpenOrdersStore.getState().fetch(undefined, { force: true });
    },
    checkIfHyperliquidAccountExists: async () => {
      // TODO (kane): save to state, address -> exists and don't check if true
      const address = useWalletsStore.getState().accountAddress;
      const accountClient = await getHyperliquidAccountClient(address);
      return await accountClient.hasAccount();
    },
    getTotalUnrealizedPnl: () => {
      const positions = Object.values(get().positions);
      return positions.reduce((acc, position) => {
        return add(acc, position.unrealizedPnl);
      }, '0');
    },
    getTotalPositionsInfo: () => {
      const positions = Object.values(get().positions);
      let totalPositionsEquity = '0';
      let totalPositionsPnl = '0';

      positions.forEach(position => {
        totalPositionsEquity = add(totalPositionsEquity, position.equity);
        totalPositionsPnl = add(totalPositionsPnl, position.unrealizedPnl);
      });

      const initialMargin = subtract(totalPositionsEquity, totalPositionsPnl);

      return {
        equity: totalPositionsEquity,
        unrealizedPnl: totalPositionsPnl,
        unrealizedPnlPercent: initialMargin === '0' ? '0' : multiply(divide(totalPositionsPnl, initialMargin), 100),
      };
    },
  }),
  { storageKey: 'hlAccount' }
);

export const hyperliquidAccountStoreActions = createStoreActions(useHyperliquidAccountStore);
