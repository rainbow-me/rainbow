import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { PerpPositionSide, PerpsPosition, OrderType } from '../types';
import { getHyperliquidAccountClient, getHyperliquidExchangeClient } from '../services';
import { RainbowError } from '@/logger';
import { add, divide } from '@/helpers/utilities';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { OrderResponse } from '@nktkas/hyperliquid';

type HyperliquidAccountStoreState = {
  positions: Record<string, PerpsPosition>;
  balance: string;
};

type HyperliquidAccountStoreActions = {
  withdraw: (amount: string) => Promise<void>;
  createIsolatedMarginPosition: ({
    assetId,
    side,
    leverage,
    amount,
    assetPrice,
    decimals,
  }: {
    assetId: number;
    side: PerpPositionSide;
    leverage: number;
    amount: string;
    assetPrice: string;
    decimals: number;
  }) => Promise<OrderResponse>;
  checkIfHyperliquidAccountExists: () => Promise<boolean>;
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
  positions: Record<string, PerpsPosition>;
  balance: string;
};

async function fetchHyperliquidAccount({ address }: HyperliquidAccountParams): Promise<FetchHyperliquidAccountResponse> {
  if (!address) throw new RainbowError('[HyperliquidAccountStore] Address is required');

  const accountClient = getHyperliquidAccountClient(address);

  const account = await accountClient.getPerpAccount();

  return {
    positions: account.positions,
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
    positions: {},
    balance: '0',
    withdraw: async (amount: string) => {
      const address = useWalletsStore.getState().accountAddress;
      const exchangeClient = await getHyperliquidExchangeClient(address);
      await exchangeClient.withdraw(amount);
    },
    getPosition: symbol => get().positions[symbol],
    createIsolatedMarginPosition: async ({ assetId, side, leverage, amount, assetPrice, decimals }) => {
      const address = useWalletsStore.getState().accountAddress;
      const exchangeClient = await getHyperliquidExchangeClient(address);
      return await exchangeClient.openIsolatedMarginPosition({
        assetId,
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
    getTotalUnrealizedPnl: () => {
      const positions = Object.values(get().positions);
      return positions.reduce((acc, position) => {
        return add(acc, position.unrealizedPnl);
      }, '0');
    },
    getTotalPositionsInfo: () => {
      const positions = Object.values(get().positions);
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
