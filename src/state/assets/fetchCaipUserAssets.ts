import { PRE_MERGED_BALANCES, SOLANA_BALANCES } from '@/features/config/constants/experimental';
import { getExperimentalFlag } from '@/features/config/stores/experimentalConfigStore';
import { fetchCaipBalances, toBalanceAccountIds, toLocalChainId } from '@/features/network/api/caipBalancesClient';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import type { ChainId } from '@/features/network/types/backendNetworks';
import { FAKE_SOLANA_ACCOUNT_ADDRESS } from '@/features/solana/data/fakeCaipBalancesTransport';
import { logger, RainbowError } from '@/logger';

import { type UserAsset } from './types';

/**
 * The whole of a wallet's asset list from one pre-merged request, which is the
 * boundary placement the recommendation takes: every account the wallet holds goes
 * out as a CAIP-10 id in a single request, and the server returns one list already
 * spanning both chain families.
 *
 * This is the counterpart to `fetchUserAssets`, which asks the v1 route for the EVM
 * half, asks a second route for the Solana half, and merges the two in the app. That
 * merge is scaffolding forced by having one family migrated and one not; here there
 * is nothing to merge, because the request is not per-family.
 *
 * Two things this deliberately does not do, both because they belong to the
 * arrangement rather than to the contract. It does not sort by value or drop
 * zero-quantity rows in a chain-aware way: those are the same two app-side steps the
 * v1 path already performs, kept identical so the difference between the two paths is
 * the boundary and not the presentation. And it does not read a chain list to decide
 * *whether* a family participates; a family participates when the wallet has an
 * account on it.
 *
 * No client-facing route serves this contract, so with the flag on this path reaches
 * a path that does not exist and the caller keeps the previous asset map. It is
 * written to be counted and
 * to be correct, not to render rows today; nothing here is faked, and no fixture
 * stands in for the EVM half.
 */
export async function fetchCaipUserAssets({
  abortController,
  address,
  currency,
}: {
  abortController: AbortController | null;
  address: string;
  currency: string;
}): Promise<{ chainIdsWithErrors: ChainId[] | null; userAssets: UserAsset[] } | null> {
  const evmChainIds = useBackendNetworksStore.getState().getSupportedChainIds();
  const solanaAddress = getExperimentalFlag(SOLANA_BALANCES) ? FAKE_SOLANA_ACCOUNT_ADDRESS : undefined;

  const accounts = toBalanceAccountIds({ evmAddress: address, evmChainIds, solanaAddress });
  if (accounts.length === 0) {
    logger.warn('[fetchCaipUserAssets] no well-formed account to request');
    return null;
  }

  try {
    const { dropped, failedAccounts, userAssets } = await fetchCaipBalances({ accounts, currency }, { abortController });

    // A row the app cannot represent is a holding the user has and cannot see, and an
    // account whose query failed is a balance that is unknown rather than zero. The
    // contract reports both per account; neither is allowed to be silent here.
    if (dropped.length > 0) logger.warn('[fetchCaipUserAssets] dropped balances the app cannot represent', { dropped });
    if (failedAccounts.length > 0) logger.warn('[fetchCaipUserAssets] accounts whose balances are unknown', { failedAccounts });

    return { chainIdsWithErrors: toChainIdsWithErrors(failedAccounts), userAssets };
  } catch (e) {
    logger.error(new RainbowError('[fetchCaipUserAssets] failed to fetch balances', e));
    return null;
  }
}

/**
 * The chains behind a failed-account list, in the numeric form the app's own result
 * shape is declared in. Accounts that fail on a chain the app has no number for are
 * left out rather than guessed at, which is why this can return fewer chains than
 * there were failures.
 *
 * What this does *not* do is make a per-family failure representable downstream: the
 * store's setter still replaces the whole asset map, so the caller can still express
 * only "these rows" and not "these chains are unknown". Carrying the chains this far
 * is what the contract makes possible; the remaining gap is in the store.
 */
export function toChainIdsWithErrors(failedAccounts: readonly { accountId: string }[]): ChainId[] | null {
  if (failedAccounts.length === 0) return null;

  const chainIds = new Set<ChainId>();
  for (const { accountId } of failedAccounts) {
    const chainId = toLocalChainId(accountId.slice(0, accountId.lastIndexOf(':')));
    if (chainId !== null) chainIds.add(chainId as ChainId);
  }

  return chainIds.size > 0 ? [...chainIds] : null;
}

/** Whether the pre-merged path serves this fetch, rather than the v1-plus-merge one. */
export function isPreMergedBalancesEnabled(): boolean {
  return getExperimentalFlag(PRE_MERGED_BALANCES);
}
