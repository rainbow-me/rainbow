import { useQuery } from '@tanstack/react-query';
import { QueryConfigWithSelect, QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import { BackendNetwork } from '@/chains/types';

// ///////////////////////////////////////////////
// Query Types

export interface BackendNetworksResponse {
  networks: BackendNetwork[];
}

// ///////////////////////////////////////////////
// Query Key

export const backendNetworksQueryKey = () => createQueryKey('backendNetworks', {}, { persisterVersion: 1 });

export type BackendNetworksQueryKey = ReturnType<typeof backendNetworksQueryKey>;

// ///////////////////////////////////////////////
// Query Function

export async function fetchBackendNetworks(): Promise<BackendNetworksResponse> {
  const graphqlQuery = `
    query getNetworks($device: Device!, $includeTestnets: Boolean!) {
      networks(device: $device, includeTestnets: $includeTestnets) {
        id
        name
        label
        icons {
          badgeURL
        }
        testnet
        opStack
        defaultExplorer {
          url
          label
          transactionURL
          tokenURL
        }
        defaultRPC {
          enabledDevices
          url
        }
        gasUnits {
          basic {
            approval
            swap
            swapPermit
            eoaTransfer
            tokenTransfer
          }
          wrapped {
            wrap
            unwrap
          }
        }
        nativeAsset {
          address
          name
          symbol
          decimals
          iconURL
          colors {
            primary
            fallback
            shadow
          }
        }
        nativeWrappedAsset {
          address
          name
          symbol
          decimals
          iconURL
          colors {
            primary
            fallback
            shadow
          }
        }
        enabledServices {
          meteorology {
            enabled
          }
          swap {
            enabled
          }
          addys {
            approvals
            transactions
            assets
            positions
          }
          tokenSearch {
            enabled
          }
          nftProxy {
            enabled
          }
        }
      }
    }
  `;

  const response = await fetch('https://metadata.p.rainbow.me/v1/graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { device: 'APP', includeTestnets: true },
    }),
  });

  const { data } = await response.json();

  return data as BackendNetworksResponse;
}

export async function backendNetworksQueryFunction({
  queryKey: [_key],
}: QueryFunctionArgs<typeof backendNetworksQueryKey>): Promise<BackendNetworksResponse> {
  return await fetchBackendNetworks();
}

// ///////////////////////////////////////////////
// Query Hook

export function useBackendNetworks(
  config: QueryConfigWithSelect<BackendNetworksResponse, Error, BackendNetworksResponse, BackendNetworksQueryKey> = {}
) {
  return useQuery(backendNetworksQueryKey(), backendNetworksQueryFunction, {
    ...config,
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// ///////////////////////////////////////////////
// Prefetch Function

export async function prefetchBackendNetworks() {
  await queryClient.prefetchQuery(backendNetworksQueryKey(), backendNetworksQueryFunction);
}
