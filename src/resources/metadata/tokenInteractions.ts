import { useQuery } from '@tanstack/react-query';
import { metadataClient } from '@/graphql';
import { QueryTokenInteractionsArgs, TokenInteraction } from '@/graphql/__generated__/metadata';
import { QueryFunctionArgs, createQueryKey } from '@/react-query';

import { logger, RainbowError } from '@/logger';

// ///////////////////////////////////////////////
// Query Key

const TokenInteractionsQueryKey = ({ chainID, address, tokenAddress, currency }: QueryTokenInteractionsArgs) =>
  createQueryKey('tokenInteractions', { chainID, address, tokenAddress, currency }, { persisterVersion: 1 });

type TokenInteractionsQueryKey = ReturnType<typeof TokenInteractionsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

const STABLE_INTERACTIONS_ARRAY: TokenInteraction[] = [];

export async function fetchTokenInteractions({ chainID, address, tokenAddress, currency }: QueryTokenInteractionsArgs) {
  try {
    const response = await metadataClient.interactionsWithToken({
      chainID,
      address,
      tokenAddress,
      currency,
    });

    if (!response.tokenInteractions?.length) return STABLE_INTERACTIONS_ARRAY;

    return response.tokenInteractions.filter(Boolean) as TokenInteraction[];
  } catch (error) {
    logger.error(new RainbowError(`[TokenInteractions] Error fetching token interactions`), {
      error,
      chainID,
      address,
      tokenAddress,
      currency,
    });
    return STABLE_INTERACTIONS_ARRAY;
  }
}

export async function tokenInteractionsQueryFunction({
  queryKey: [{ chainID, address, tokenAddress, currency }],
}: QueryFunctionArgs<typeof TokenInteractionsQueryKey>): Promise<TokenInteraction[]> {
  return await fetchTokenInteractions({ chainID, address, tokenAddress, currency });
}

// ///////////////////////////////////////////////
// Query Hook

export function useTokenInteractions({ chainID, address, tokenAddress, currency }: QueryTokenInteractionsArgs) {
  return useQuery(TokenInteractionsQueryKey({ chainID, address, tokenAddress, currency }), tokenInteractionsQueryFunction, {
    cacheTime: 1000 * 60 * 60 * 24,
    enabled: !!chainID && !!address && !!tokenAddress && !!currency,
  });
}
