import { Network } from '@/helpers/networkTypes';
import { SimplehashChain } from '@/resources/nfts/simplehash/types';

export function getSimplehashChainFromNetwork(
  network: Omit<Network, Network.goerli>
): SimplehashChain | undefined {
  switch (network) {
    case Network.mainnet:
      return SimplehashChain.Ethereum;
    case Network.polygon:
      return SimplehashChain.Polygon;
    case Network.arbitrum:
      return SimplehashChain.Arbitrum;
    case Network.optimism:
      return SimplehashChain.Optimism;
    case Network.bsc:
      return SimplehashChain.Bsc;
    default:
      return undefined;
  }
}

export function getNetworkFromSimplehashChain(
  chain: SimplehashChain
): Omit<Network, Network.goerli> | undefined {
  switch (chain) {
    case SimplehashChain.Ethereum:
    case SimplehashChain.Gnosis:
      return Network.mainnet;
    case SimplehashChain.Polygon:
      return Network.polygon;
    case SimplehashChain.Arbitrum:
      return Network.arbitrum;
    case SimplehashChain.Optimism:
      return Network.optimism;
    case SimplehashChain.Bsc:
      return Network.bsc;
    default:
      return undefined;
  }
}
