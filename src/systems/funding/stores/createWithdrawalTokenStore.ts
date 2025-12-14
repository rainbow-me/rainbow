import { Token } from '@/graphql/__generated__/metadata';
import { metadataClient } from '@/graphql';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { WithdrawalTokenData, WithdrawalTokenStoreType } from '../types';

// ============ Types ========================================================== //

type TokenParams = {
  address: string;
  chainId: ChainId;
};

type ExternalToken = Pick<Token, 'iconUrl' | 'networks' | 'symbol'>;

type NetworkInfo = {
  address: string;
  decimals: number;
};

// ============ Store Factory ================================================== //

export function createTokenNetworksStore({ address, chainId }: TokenParams): WithdrawalTokenStoreType {
  return createQueryStore<WithdrawalTokenData | null, TokenParams>({
    cacheTime: time.hours(1),
    fetcher: tokenNetworksQueryFunction,
    params: { address, chainId },
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
  const record = value as Record<string, unknown>;
  const address = record.address;
  const decimals = record.decimals;
  if (typeof address !== 'string') return null;
  if (typeof decimals !== 'number') return null;
  return { address, decimals };
}
