import { ChainId } from '@rainbow-me/swaps';
import { BigNumber, ethers } from 'ethers';
import { USD_DECIMALS } from '@/features/perps/constants';
import { POLYGON_USDC_ADDRESS } from '@/features/polymarket/constants';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { erc20ABI } from '@/references';
import { truncateToDecimals } from '@/safe-math/SafeMath';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type PolymarketBalanceStoreActions = {
  getBalance: () => string;
  isBalanceZero: () => boolean;
};

type PolymarketBalanceParams = {
  address: string | null;
};

type FetchPolymarketBalanceResponse = {
  balance: string;
};

export const usePolymarketBalanceStore = createQueryStore<
  FetchPolymarketBalanceResponse,
  PolymarketBalanceParams,
  PolymarketBalanceStoreActions
>(
  {
    cacheTime: time.days(2),
    fetcher: fetchPolymarketBalance,
    params: { address: $ => $(usePolymarketClients).proxyAddress },
    staleTime: time.seconds(10),
  },

  (_, get) => ({
    getBalance: () => get().getData()?.balance ?? '0',
    isBalanceZero: () => Number(get().getData()?.balance) === 0,
  })
);

async function fetchPolymarketBalance({ address }: PolymarketBalanceParams): Promise<FetchPolymarketBalanceResponse> {
  if (!address) throw new RainbowError('[PolymarketBalanceStore] Address is required');

  const usdcContract = new ethers.Contract(POLYGON_USDC_ADDRESS, erc20ABI, getProvider({ chainId: ChainId.polygon }));

  const rawBalance = (await usdcContract.balanceOf(address)) as BigNumber;
  const balance = ethers.utils.formatUnits(rawBalance, 6);
  const truncatedBalance = truncateToDecimals(balance, USD_DECIMALS);

  return {
    balance: truncatedBalance,
  };
}
