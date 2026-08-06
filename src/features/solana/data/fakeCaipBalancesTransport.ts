import { type CaipBalance, type CaipBalancesRequest, type CaipBalancesResponse } from '@/features/network/api/caipBalancesClient';
import { type RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { logger } from '@/logger';

import { SOLANA_MAINNET_CHAIN_ID, SOLANA_NATIVE_ASSET_ID } from '../constants';

/**
 * ⚠️ FAKE. Stands in for the client-facing route that serves the CAIP-native
 * balances contract, which no client-facing route serves today. This fake
 * replaces the transport and nothing else — the request it answers is built by the
 * real client, the response it returns is parsed by the real translation, and every
 * value below is a documented example from the contract it mirrors.
 *
 * It is deliberately visible. Every asset name carries `FAKE_MARKER`, so a row
 * sourced from here is unmistakable on the screen, and every call logs a warning
 * naming the accounts it was asked about.
 *
 * What it does NOT model, recorded here because the recommendation is priced on
 * these assumptions rather than on measurements:
 *
 * - **Latency.** Answers in the same tick. Nothing in the question this fake exists
 *   to answer, whether a base58-addressed row survives the render path, turns on
 *   how long the answer takes.
 * - **Failure modes.** Always succeeds with an empty `failedQueries`. The contract's
 *   per-account failure channel is exercised against its real shape by
 *   `caipBalancesClient.test.ts`, which is the right place for it: a fake failing on
 *   command would demonstrate only that the fake can fail.
 * - **Holdings.** Two assets, fixed. It is not a Solana account's real portfolio and
 *   must never grow into one; the balances and pricing contracts are readable, so a
 *   guessed fake of either would be strictly worse than reading them.
 */

/** Visible in the app on every row this fake produced. */
export const FAKE_MARKER = '(FAKE)';

/**
 * ⚠️ FAKE. The Solana address the flag-gated path asks about. A Rainbow account
 * holds no Solana address today, so this is a stand-in, not a derived address, and
 * nothing reads a keychain to produce it.
 */
export const FAKE_SOLANA_ACCOUNT_ADDRESS = '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj';

const USDC_SOLANA_ASSET_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const SOL_ICON_URL =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

const USDC_ICON_URL =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png';

function fakeBalances(accountId: string): CaipBalance[] {
  return [
    {
      accountId,
      asset: {
        assetId: SOLANA_NATIVE_ASSET_ID,
        chainId: SOLANA_MAINNET_CHAIN_ID,
        colors: { primary: '#14F195', fallback: '#9945FF' },
        decimals: 9,
        iconUrl: SOL_ICON_URL,
        name: `Solana ${FAKE_MARKER}`,
        network: 'solana',
        price: { changedAt: '2026-08-03T10:00:00Z', relativeChange24h: 1.5, value: 180.25 },
        symbol: 'SOL',
        type: 'native',
        verified: true,
      },
      isSmallBalance: false,
      quantity: '2500000000',
      updatedAt: '2026-08-03T10:05:00Z',
      value: '450.62',
    },
    {
      accountId,
      asset: {
        assetId: USDC_SOLANA_ASSET_ID,
        chainId: SOLANA_MAINNET_CHAIN_ID,
        colors: { primary: '#2775CA', fallback: '#2775CA' },
        decimals: 6,
        iconUrl: USDC_ICON_URL,
        name: `USD Coin ${FAKE_MARKER}`,
        network: 'solana',
        price: { changedAt: '2026-08-03T10:00:00Z', relativeChange24h: 0.01, value: 1 },
        symbol: 'USDC',
        type: 'spl-token',
        verified: true,
      },
      isSmallBalance: false,
      quantity: '42000000',
      updatedAt: '2026-08-03T10:05:00Z',
      value: '42.00',
    },
  ];
}

/**
 * ⚠️ FAKE transport, shaped as the one method the real client calls. Returns one
 * set of holdings per Solana account the request names, so the response is a
 * function of the request rather than a constant; an account on any other namespace
 * comes back with nothing, which is what the contract says an empty account looks
 * like.
 */
export function createFakeCaipBalancesTransport(): Pick<RainbowFetchClient, 'post'> {
  return {
    post: <TData = unknown>(path?: RequestInfo, body?: unknown) => {
      const accounts = (body as CaipBalancesRequest | undefined)?.accounts ?? [];
      const solanaAccounts = accounts.filter(account => account.startsWith(`${SOLANA_MAINNET_CHAIN_ID}:`));

      logger.warn('[⚠️ FAKE CAIP balances transport] answering a request no real route serves', {
        path: String(path),
        requestedAccounts: accounts.length,
        answeredSolanaAccounts: solanaAccounts.length,
      });

      const data: CaipBalancesResponse = {
        balances: solanaAccounts.flatMap(fakeBalances),
        failedQueries: [],
      };

      return Promise.resolve({ data: data as TData, headers: new Headers(), status: 200 });
    },
  };
}
