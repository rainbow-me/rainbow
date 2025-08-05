import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { PositionSide, Position, FilledOrder } from '../types';
import { getHyperliquidAccountClient, getHyperliquidExchangeClient } from '../services';
import { RainbowError } from '@/logger';
import { add } from '@/helpers/utilities';

type HyperliquidAccountStoreState = {
  positions: Position[];
  filledOrders: FilledOrder[];
  balance: string;
  seenFilledOrders: Set<string>;
};

type HyperliquidAccountStoreActions = {
  deposit: ({ asset, amount }: { asset: string; amount: string }) => Promise<void>;
  withdraw: ({ asset, amount }: { asset: string; amount: string }) => Promise<void>;
  createIsolatedMarginPosition: ({ asset, side, leverage }: { asset: string; side: PositionSide; leverage: number }) => Promise<void>;
  checkIfHyperliquidAccountExists: () => Promise<boolean>;
  markFilledOrdersAsSeen: (orderIds: number[]) => void;
  // derivative state
  getTotalUnrealizedPnl: () => string;
  getTotalPositionsValue: () => string;
};

type HyperliquidAccountStore = HyperliquidAccountStoreState & HyperliquidAccountStoreActions;

type HyperliquidAccountParams = {
  address: Address | string | null;
};

type FetchHyperliquidAccountResponse = {
  positions: Position[];
  filledOrders: FilledOrder[];
  balance: string;
};

async function fetchHyperliquidAccount({ address }: HyperliquidAccountParams): Promise<FetchHyperliquidAccountResponse> {
  if (!address) throw new RainbowError('[HyperliquidAccountStore] Address is required');

  const accountClient = getHyperliquidAccountClient(address);
  const [account, filledOrders] = await Promise.all([accountClient.getPerpAccount(), accountClient.getFilledOrders()]);

  return {
    positions: account.positions,
    filledOrders,
    balance: account.balance,
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
        filledOrders: data.filledOrders,
        balance: data.balance,
      });
    },
    cacheTime: time.days(1),
    params: {
      address: $ => $(userAssetsStoreManager).address,
    },
    staleTime: time.minutes(1),
  },
  (set, get) => ({
    positions: [],
    filledOrders: [],
    balance: '0',
    seenFilledOrders: new Set<string>(),
    deposit: async ({ asset, amount }) => {},
    withdraw: async ({ asset, amount }) => {},
    createIsolatedMarginPosition: async ({ asset, side, leverage }) => {
      // TODO: how to get the address from the params?
      // const exchangeClient = await getHyperliquidExchangeClient();
    },
    checkIfHyperliquidAccountExists: async () => {
      // TODO: this is one way to get it, and it in theory should be the same as the address in the params, but doesn't feel right
      const address = userAssetsStoreManager.getState().address;
      if (!address) throw new RainbowError('[HyperliquidAccountStore] Address is required');

      const accountClient = await getHyperliquidAccountClient(address);
      return await accountClient.hasAccount();
    },
    markFilledOrdersAsSeen: orderIds => {
      orderIds.forEach(id => get().seenFilledOrders.add(id.toString()));
    },
    getTotalUnrealizedPnl: () => {
      return get().positions.reduce((acc, position) => {
        return add(acc, position.unrealizedPnl);
      }, '0');
    },
    getTotalPositionsValue: () => {
      return get().positions.reduce((acc, position) => {
        return add(acc, position.value);
      }, '0');
    },
  })
);
