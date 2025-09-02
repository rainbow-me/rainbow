import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { PerpPositionSide, PerpsPosition, FilledOrder, OrderType } from '../types';
import { getHyperliquidAccountClient, getHyperliquidExchangeClient } from '../services';
import { RainbowError } from '@/logger';
import { add, divide } from '@/helpers/utilities';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { OrderResponse } from '@nktkas/hyperliquid';

type HyperliquidAccountStoreState = {
  positions: PerpsPosition[];
  filledOrders: FilledOrder[];
  balance: string;
  // TODO: better as unseen
  seenFilledOrders: Set<string>;
};

type HyperliquidAccountStoreActions = {
  deposit: ({ asset, amount }: { asset: string; amount: string }) => Promise<void>;
  withdraw: ({ asset, amount }: { asset: string; amount: string }) => Promise<void>;
  createIsolatedMarginPosition: ({
    symbol,
    side,
    leverage,
    amount,
    assetPrice,
    decimals,
  }: {
    symbol: string;
    side: PerpPositionSide;
    leverage: number;
    amount: string;
    assetPrice: string;
    decimals: number;
  }) => Promise<OrderResponse>;
  checkIfHyperliquidAccountExists: () => Promise<boolean>;
  markFilledOrdersAsSeen: (orderIds: number[]) => void;
  // derivative state
  getTotalPositionsInfo: () => {
    value: string;
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
  positions: PerpsPosition[];
  filledOrders: FilledOrder[];
  balance: string;
};

async function fetchHyperliquidAccount({ address }: HyperliquidAccountParams): Promise<FetchHyperliquidAccountResponse> {
  if (!address) throw new RainbowError('[HyperliquidAccountStore] Address is required');

  const accountClient = getHyperliquidAccountClient(address);

  // TODO (kane): userFillsByTime for past 1 month is better, some users might have thousands
  const [account, filledOrders] = await Promise.all([accountClient.getPerpAccount(), accountClient.getFilledOrders()]);
  return {
    // TODO (kane): better as a record
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
      address: $ => $(useWalletsStore).accountAddress,
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
    getPosition: symbol => get().positions.find(p => p.symbol === symbol),
    createIsolatedMarginPosition: async ({ symbol, side, leverage, amount, assetPrice, decimals }) => {
      const address = useWalletsStore.getState().accountAddress;
      const exchangeClient = await getHyperliquidExchangeClient(address);
      return await exchangeClient.openIsolatedMarginPosition({
        symbol,
        side,
        marginAmount: amount,
        assetPrice,
        leverage,
        decimals,
        orderType: OrderType.MARKET,
      });
    },
    checkIfHyperliquidAccountExists: async () => {
      // This is fine
      // save to state, address -> exists and don't check if true
      const address = useWalletsStore.getState().accountAddress;
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
    getTotalPositionsInfo: () => {
      const { positions } = get();
      let totalPositionsValue = '0';
      let totalPositionsPnl = '0';

      positions.forEach(position => {
        totalPositionsValue = add(totalPositionsValue, position.value);
        totalPositionsPnl = add(totalPositionsPnl, position.unrealizedPnl);
      });

      return {
        value: totalPositionsValue,
        unrealizedPnl: totalPositionsPnl,
        unrealizedPnlPercent: totalPositionsValue === '0' ? '0' : divide(totalPositionsPnl, totalPositionsValue),
      };
    },
  })
);

export const hyperliquidAccountStoreActions = createStoreActions(useHyperliquidAccountStore);

// const useCachedUserAssetsStore = createDerivedStore<UserAssetsStoreType>(
//   $ => {
//     const address = $(useWalletsStore).accountAddress;
//     return createUserAssetsStore(address);
//   },
//   { fastMode: true }
// );
