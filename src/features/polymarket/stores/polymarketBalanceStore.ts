import { createQueryStore } from '@storesjs/stores';
import { ethers } from 'ethers';
import { type Address } from 'viem';

import { USD_DECIMALS } from '@/features/perps/constants';
import {
  POLYGON_USDC_ADDRESS,
  POLYGON_USDC_DECIMALS,
  POLYMARKET_PUSD_ADDRESS,
  POLYMARKET_PUSD_DECIMALS,
} from '@/features/polymarket/constants';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { truncateToDecimals } from '@/framework/core/safeMath';
import { getErc20Balance } from '@/framework/data/evm/erc20Read';
import { getProvider } from '@/handlers/web3';
import { add } from '@/helpers/utilities';
import { RainbowError } from '@/logger';
import { time } from '@/utils/time';
import { ChainId } from '@rainbow-me/swaps';

type PolymarketBalanceStoreActions = {
  getBalance: () => string;
  getPusdBalance: () => string;
  getUsdcBalance: () => string;
  isBalanceZero: () => boolean;
};

type PolymarketBalanceParams = {
  address: Address | null;
};

type FetchPolymarketBalanceResponse = {
  balance: string;
  pusdBalance: string;
  usdcBalance: string;
};

const EMPTY_BALANCES: FetchPolymarketBalanceResponse = {
  balance: '0',
  pusdBalance: '0',
  usdcBalance: '0',
};

export const usePolymarketBalanceStore = createQueryStore<
  FetchPolymarketBalanceResponse,
  PolymarketBalanceParams,
  PolymarketBalanceStoreActions
>(
  {
    cacheTime: time.days(2),
    fetcher: fetchPolymarketBalance,
    enabled: $ => $(usePolymarketClients, state => state.proxyAddress !== null),
    params: { address: $ => $(usePolymarketClients).proxyAddress },
    staleTime: time.seconds(10),
  },

  (_, get) => ({
    getBalance: () => get().getData()?.balance ?? EMPTY_BALANCES.balance,
    getPusdBalance: () => get().getData()?.pusdBalance ?? EMPTY_BALANCES.pusdBalance,
    getUsdcBalance: () => get().getData()?.usdcBalance ?? EMPTY_BALANCES.usdcBalance,
    isBalanceZero: () => Number(get().getData()?.balance ?? EMPTY_BALANCES.balance) === 0,
  }),

  { storageKey: 'polymarketBalanceStore' }
);

async function fetchPolymarketBalance({ address }: PolymarketBalanceParams): Promise<FetchPolymarketBalanceResponse> {
  if (!address) throw new RainbowError('[PolymarketBalanceStore] Address is required');

  const provider = getProvider({ chainId: ChainId.polygon });
  const [rawUsdcBalance, rawPusdBalance] = await Promise.all([
    getErc20Balance({ owner: address, provider, tokenAddress: POLYGON_USDC_ADDRESS }),
    getErc20Balance({ owner: address, provider, tokenAddress: POLYMARKET_PUSD_ADDRESS }),
  ]);

  const usdcBalance = ethers.utils.formatUnits(rawUsdcBalance, POLYGON_USDC_DECIMALS);
  const pusdBalance = ethers.utils.formatUnits(rawPusdBalance, POLYMARKET_PUSD_DECIMALS);
  const balance = add(usdcBalance, pusdBalance);

  return {
    balance: truncateToDecimals(balance, USD_DECIMALS),
    pusdBalance: truncateToDecimals(pusdBalance, POLYMARKET_PUSD_DECIMALS),
    usdcBalance: truncateToDecimals(usdcBalance, POLYGON_USDC_DECIMALS),
  };
}
