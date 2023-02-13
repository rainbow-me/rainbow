import { Network } from '@/helpers/networkTypes';
import { Network as APINetwork } from '@/screens/AddCash/types';

export function convertAPINetworkToInternalNetwork(
  network: APINetwork
): Network | undefined {
  const networkMap = {
    [APINetwork.Ethereum]: Network.mainnet,
    [APINetwork.Arbitrum]: Network.arbitrum,
    [APINetwork.Optimism]: Network.optimism,
    [APINetwork.Polygon]: Network.polygon,
  };

  // @ts-ignore
  return networkMap[network] ?? undefined;
}
