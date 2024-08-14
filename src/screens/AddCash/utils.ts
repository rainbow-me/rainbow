import { ChainId } from '@/__swaps__/types/chains';
import { Network as APINetwork } from '@/screens/AddCash/types';

export function convertAPINetworkToInternalChainIds(network: APINetwork): ChainId | undefined {
  const networkMap = {
    [APINetwork.Ethereum]: ChainId.mainnet,
    [APINetwork.Arbitrum]: ChainId.arbitrum,
    [APINetwork.Optimism]: ChainId.optimism,
    [APINetwork.Polygon]: ChainId.polygon,
    [APINetwork.Base]: ChainId.base,
    [APINetwork.BSC]: ChainId.bsc,
  };

  // @ts-ignore
  return networkMap[network] ?? undefined;
}
