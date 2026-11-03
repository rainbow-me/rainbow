import { vi } from 'vitest';

import type { NativeCurrencyKey } from '@/features/currency/types';
import type { ChainId } from '@/features/network/types/backendNetworks';

import { getExternalTokenType } from '../testing/mockExternalTokenTypes';

type ExternalTokenArgs = { address: string; chainId: ChainId; currency: NativeCurrencyKey };

export const EXTERNAL_TOKEN_CACHE_TIME = 1000 * 60 * 60 * 24;
export const EXTERNAL_TOKEN_STALE_TIME = 1000 * 60;

export const externalTokenQueryKey = (args: ExternalTokenArgs) => ['externalToken', args] as const;

export const externalTokenQueryFunction = vi.fn(
  async ({ queryKey: [, { address }] }: { queryKey: ReturnType<typeof externalTokenQueryKey> }) => ({
    type: await getExternalTokenType(address),
  })
);
