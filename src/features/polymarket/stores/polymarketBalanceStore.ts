import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { POLYGON_USDC_ADDRESS } from '@/features/polymarket/constants';
import { erc20ABI } from '@/references';
import { getProvider } from '@/handlers/web3';
import { ChainId } from '@rainbow-me/swaps';
import { BigNumber, ethers } from 'ethers';

type PolymarketBalanceStoreActions = {
  getBalance: () => string;
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
    fetcher: fetchPolymarketBalance,
    params: { address: $ => $(usePolymarketProxyAddress).proxyAddress },
  },

  (_, get) => ({
    getBalance: () => get().getData()?.balance ?? '0',
  })
);

async function fetchPolymarketBalance({ address }: PolymarketBalanceParams): Promise<FetchPolymarketBalanceResponse> {
  if (!address) throw new RainbowError('[PolymarketBalanceStore] Address is required');

  const usdcContract = new ethers.Contract(POLYGON_USDC_ADDRESS, erc20ABI, getProvider({ chainId: ChainId.polygon }));

  const rawBalance = (await usdcContract.balanceOf(address)) as BigNumber;
  const balance = ethers.utils.formatUnits(rawBalance, 6);

  return {
    balance,
  };
}
