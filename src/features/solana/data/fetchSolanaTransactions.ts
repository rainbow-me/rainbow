import { type RainbowTransaction } from '@/entities/transactions';
import { SOLANA_BALANCES } from '@/features/config/constants/experimental';
import { getExperimentalFlag } from '@/features/config/stores/experimentalConfigStore';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { toCaipAccountId } from '@/features/network/utils/caip';
import { logger, RainbowError } from '@/logger';

import { SOLANA_MAINNET_CHAIN_ID } from '../constants';
import { fetchCaipTransactions, type FeeNativeAsset } from './caipTransactionsClient';
import { FAKE_SOLANA_ACCOUNT_ADDRESS } from './fakeCaipBalancesTransport';
import { createFakeCaipTransactionsTransport } from './fakeCaipTransactionsTransport';

/**
 * The Solana half of a wallet's activity list, fetched over the CAIP-native
 * transaction-history contract and translated into the same `RainbowTransaction`
 * shape the EVM half arrives in, so the two land in the same time-bucketed sections
 * rather than in a Solana section.
 *
 * Four properties of this function are load-bearing for the caller.
 *
 * **It asks for its own chain, and never consults a chain-list selector.** This is
 * where the activity surface's Solana exclusion is answered. The EVM request takes
 * its chain list from `getSupportedMainnetChainIds()`, which reduces over
 * `backendChains`, and Solana is deliberately absent from that array because a viem
 * provider is built out of every entry in it. So the fix is not to widen that
 * selector: it is for the Solana request to name `solana:5eykt4…` itself, which is
 * exactly how the balance row is wired. Switching the EVM request to
 * `getTransactionsSupportedChainIds` instead looks like the intended mechanism and is
 * a trap: that selector has no production callers, so adopting it would change the
 * chain list all 29 EVM chains get on this surface in order to add one.
 *
 * **It never throws and never returns null.** A Solana failure must not cost the EVM
 * rows.
 *
 * **It is gated on the Solana balances flag**, off by default, and that is the same
 * flag the balance row uses rather than one of its own. Not a shortcut: the app-local
 * Solana network descriptor is gated on that flag, and the descriptor is what gives
 * the chain a badge and a native asset. A separate activity flag would therefore have
 * a state, activity on and descriptor off, in which a Solana row renders with no
 * badge and the fee path reads `undefined.decimals`. One flag has no such state.
 *
 * **It runs against a fake transport**, because no route serves this contract and
 * none is being built. `createFakeCaipTransactionsTransport`
 * documents what the fake does and does not model; the client, the request, the CAIP
 * validation and the translation are all the real ones.
 */
export async function fetchSolanaTransactions({
  abortController,
  currency,
  limit,
}: {
  abortController?: AbortController | null;
  currency: NativeCurrencyKey;
  limit: number;
}): Promise<RainbowTransaction[]> {
  if (!getExperimentalFlag(SOLANA_BALANCES)) return [];

  try {
    const account = toCaipAccountId(SOLANA_MAINNET_CHAIN_ID, FAKE_SOLANA_ACCOUNT_ADDRESS);
    if (!account) {
      logger.warn('[fetchSolanaTransactions] no well-formed Solana account to request');
      return [];
    }

    const { dropped, failedAccounts, transactions } = await fetchCaipTransactions(
      { accounts: [account], currency, limit },
      {
        abortController,
        client: createFakeCaipTransactionsTransport(),
        nativeAsset: SOLANA_FEE_NATIVE_ASSET,
        nativeCurrency: currency,
      }
    );

    // Both of these are silence-shaped failures, so neither is allowed to be silent:
    // a dropped row is history the app cannot represent, and a failed account is
    // history that is unknown rather than absent.
    if (dropped.length > 0) logger.warn('[fetchSolanaTransactions] dropped transactions the app cannot represent', { dropped });
    if (failedAccounts.length > 0) logger.warn('[fetchSolanaTransactions] accounts whose history is unknown', { failedAccounts });

    return transactions;
  } catch (e) {
    logger.error(new RainbowError('[fetchSolanaTransactions] failed to fetch Solana transactions', e));
    return [];
  }
}

/**
 * Solana's fee denomination. Supplied by this caller rather than read from the
 * network store inside the client, so the client stays chain-agnostic and pure: the
 * specified `Fee` message carries a raw value and a price and says nothing about what
 * unit the value is in.
 */
const SOLANA_FEE_NATIVE_ASSET: FeeNativeAsset = { decimals: 9, symbol: 'SOL' };
