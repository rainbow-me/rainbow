import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { Address } from 'viem';
import { PerpsPosition } from '../types';
import { getHyperliquidAccountClient } from '../services';
import { RainbowError } from '@/logger';
import { add, divide, multiply, subtract } from '@/helpers/utilities';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

type HyperliquidAccountStoreState = {
  positions: Record<string, PerpsPosition>;
  balance: string;
  value: string;
};

type HyperliquidAccountStoreActions = {
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

  return await accountClient.getPerpAccount();
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
    keepPreviousData: true,
    staleTime: time.seconds(5),
  },
  (_set, get) => ({
    positions: {},
    balance: '0',
    value: '0',
    getPosition: symbol => get().positions[symbol],
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
