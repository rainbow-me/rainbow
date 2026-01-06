import { Token } from '@/graphql/__generated__/metadata';
import { metadataClient } from '@/graphql';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { WithdrawalTokenData, WithdrawalTokenStoreType } from '../types';

// ============ Types ========================================================== //

type ExternalToken = Pick<Token, 'iconUrl' | 'networks' | 'symbol'>;
type NetworkInfo = { address: string; decimals: number };
type TokenParams = { address: string; chainId: ChainId };

// ============ Store Factory ================================================== //

export function createTokenNetworksStore({ address, chainId }: TokenParams): WithdrawalTokenStoreType {
  return createQueryStore<WithdrawalTokenData | null, TokenParams>({
    fetcher: tokenNetworksQueryFunction,
    params: { address, chainId },
    cacheTime: time.hours(1),
    staleTime: time.minutes(5),
  });
}

// ============ Query Function ================================================= //

async function tokenNetworksQueryFunction({ address, chainId }: TokenParams): Promise<WithdrawalTokenData | null> {
  const response = await metadataClient.externalToken({
    address,
    chainId,
    currency: 'USD',
  });

  if (!response.token) return null;

  return formatTokenData(response.token);
}

// ============ Formatting ===================================================== //

function formatTokenData(token: ExternalToken): WithdrawalTokenData {
  const networks: WithdrawalTokenData['networks'] = {};

  if (token.networks) {
    for (const [chainId, rawNetworkInfo] of Object.entries(token.networks)) {
      const parsed = parseNetworkInfo(rawNetworkInfo);
      if (parsed) networks[chainId] = parsed;
    }
  }

  return {
    iconUrl: token.iconUrl ?? undefined,
    networks,
    symbol: token.symbol,
  };
}

function parseNetworkInfo(value: unknown): NetworkInfo | null {
  if (!value || typeof value !== 'object') return null;
  if (!('address' in value) || typeof value.address !== 'string') return null;
  if (!('decimals' in value) || typeof value.decimals !== 'number') return null;
  return {
    address: value.address,
    decimals: value.decimals,
  };
}
