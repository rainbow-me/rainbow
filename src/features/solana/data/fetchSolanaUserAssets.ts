import { SOLANA_BALANCES } from '@/features/config/constants/experimental';
import { getExperimentalFlag } from '@/features/config/stores/experimentalConfigStore';
import { fetchCaipBalances, toBalanceAccountIds } from '@/features/network/api/caipBalancesClient';
import { logger, RainbowError } from '@/logger';
import { type UserAsset } from '@/state/assets/types';

import { createFakeCaipBalancesTransport, FAKE_SOLANA_ACCOUNT_ADDRESS } from './fakeCaipBalancesTransport';

/**
 * The Solana half of a wallet's asset list, fetched over the CAIP-native balances
 * contract and translated into the same `UserAsset` shape the EVM half arrives in,
 * so the two merge into one interleaved list rather than one list and a section.
 *
 * Three properties of this function are load-bearing for the caller.
 *
 * It never throws and never returns null. A Solana failure must not empty the EVM
 * rows, and the store's setter replaces the whole asset map, so the only shape that
 * cannot lose rows is "extra rows or none".
 *
 * It is gated on the Solana balances flag, off by default. With the flag off it
 * returns an empty array without reading a store, building a request or logging.
 *
 * And it runs against a fake transport, because no client-facing route serves this
 * contract. `createFakeCaipBalancesTransport` documents what the fake does and does
 * not model; the client, the request, the CAIP validation and the translation are
 * all the real ones.
 */
export async function fetchSolanaUserAssets({
  abortController,
  currency,
}: {
  abortController: AbortController | null;
  currency: string;
}): Promise<UserAsset[]> {
  if (!getExperimentalFlag(SOLANA_BALANCES)) return [];

  try {
    const accounts = toBalanceAccountIds({ evmChainIds: [], solanaAddress: FAKE_SOLANA_ACCOUNT_ADDRESS });
    if (accounts.length === 0) {
      logger.warn('[fetchSolanaUserAssets] no well-formed Solana account to request');
      return [];
    }

    const { dropped, failedAccounts, userAssets } = await fetchCaipBalances(
      { accounts, currency },
      { abortController, client: createFakeCaipBalancesTransport() }
    );

    // Both of these are silence-shaped failures, so neither is allowed to be silent:
    // a dropped row is a holding the app cannot represent, and a failed account is a
    // balance that is unknown rather than zero.
    if (dropped.length > 0) logger.warn('[fetchSolanaUserAssets] dropped balances the app cannot represent', { dropped });
    if (failedAccounts.length > 0) logger.warn('[fetchSolanaUserAssets] accounts whose balances are unknown', { failedAccounts });

    return userAssets;
  } catch (e) {
    logger.error(new RainbowError('[fetchSolanaUserAssets] failed to fetch Solana balances', e));
    return [];
  }
}
