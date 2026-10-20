import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';

import { getPlatformClient } from './client';

type CodexResponse<T> = { data?: T; errors?: { message: string }[] };

/** Codex network ids are EVM chain ids. */
export function getCodexTokenId(address: string, chainId: ChainId): string {
  return `${address}:${chainId}`;
}

/** Runs a GraphQL query against Codex through the platform proxy, rejecting on GraphQL errors. */
export async function postCodex<T>(query: string, variables: Record<string, unknown>, abortController: AbortController | null): Promise<T> {
  const { data } = await getPlatformClient().post<CodexResponse<T>>(
    '/proxy/codex',
    { query, variables },
    // A signal, so the request timeout cannot abort the caller's controller: an aborted controller means the caller cancelled
    { signal: abortController?.signal, timeout: time.seconds(15) }
  );
  if (data.errors?.length || !data.data) throw new Error(data.errors?.[0]?.message ?? 'Missing data');
  return data.data;
}
