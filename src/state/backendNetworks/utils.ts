import { Chain } from 'viem';
import { base, mainnet } from 'viem/chains';
import { IS_DEV, RPC_PROXY_API_KEY } from '@/env';
import { BackendNetwork } from './types';

const proxyBackendNetworkRpcEndpoint = (endpoint: string) => {
  return `${endpoint}${RPC_PROXY_API_KEY}`;
};

const TENDERLY_BASE_RPC = 'https://virtual.base.us-east.rpc.tenderly.co/8bd88a16-7aed-467c-bfd1-34f39a2ac536';
export function transformBackendNetworkToChain(network: BackendNetwork): Chain {
  if (!network) {
    throw new Error('Invalid network data');
  }
  let defaultRpcUrl = proxyBackendNetworkRpcEndpoint(network.defaultRPC.url);
  if (Number(network.id) === base.id) {
    console.log('OVERRIDING base RPC, using', TENDERLY_BASE_RPC);
    defaultRpcUrl = TENDERLY_BASE_RPC;
  }

  return {
    id: parseInt(network.id, 10),
    name: network.label,
    testnet: network.testnet,
    nativeCurrency: {
      name: network.nativeAsset.name,
      symbol: network.nativeAsset.symbol,
      decimals: network.nativeAsset.decimals,
    },
    rpcUrls: {
      default: {
        http: [defaultRpcUrl],
      },
      public: {
        http: [defaultRpcUrl],
      },
    },
    blockExplorers: {
      default: {
        url: network.defaultExplorer.url,
        name: network.defaultExplorer.label,
      },
    },
    contracts: parseInt(network.id, 10) === mainnet.id ? mainnet.contracts : undefined,
  };
}

export function transformBackendNetworksToChains(networks?: BackendNetwork[]): Chain[] {
  if (!networks) {
    return [];
  }
  return networks.filter(network => IS_DEV || !network.internal).map(network => transformBackendNetworkToChain(network));
}
