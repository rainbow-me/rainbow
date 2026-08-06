import { type CaipAsset } from '@/features/network/api/caipBalancesClient';
import { type RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { logger } from '@/logger';

import { SOLANA_MAINNET_CHAIN_ID, SOLANA_NATIVE_ASSET_ID } from '../constants';
import { type CaipTransaction, type CaipTransactionsRequest, type CaipTransactionsResponse } from './caipTransactionsClient';
import { FAKE_MARKER } from './fakeCaipBalancesTransport';

/**
 * ⚠️ FAKE. Stands in for the client-facing route that would serve the CAIP-native
 * transaction-history contract, which does not exist and is not being built: the
 * service that would own it carries no CAIP and no Solana concept at all,
 * re-confirmed at the same commit twenty-one days apart. Faking here is a necessity
 * rather than a choice, so the fake replaces the transport and nothing else — the
 * request it answers is built by the real client, and the response it returns is
 * translated by the real translation.
 *
 * It is deliberately visible. Every asset name carries `FAKE_MARKER`, which the
 * activity row renders as its description for a send or a receive, and every call
 * logs a warning naming the accounts it was asked about.
 *
 * **Every value below is real, captured from Solana mainnet rather than invented.**
 * Substrate that exists should be used real, and the Solana ecosystem exists, so two
 * finalized mainnet transactions were captured and the fixtures are shaped from them:
 * a sponsored USDC payment in slot 437155477 and a swap in slot 437155352. The
 * signatures, slots, fees, prioritization fees, compute units, program ids and token
 * amounts are all theirs. What is substituted is the receiving party, which is a
 * stand-in Solana account, because a Rainbow account holds no Solana address.
 *
 * What it does NOT model, recorded here because the recommendation is priced on
 * these assumptions rather than on measurements:
 *
 * - **Latency.** Answers in the same tick.
 * - **Failure modes.** Always succeeds with an empty `failedQueries`. The contract's
 *   per-account failure channel is exercised against its real shape by
 *   `caipTransactionsClient.test.ts`, which is the right place for it.
 * - **Pagination.** One page, and `pagination.cursor` is never set, so nothing here
 *   exercises a second page. This is where the partial-failure hazard lives: history
 *   is appended page by page, so a source that fails on page three produces a
 *   silently short list, and a fake with one page cannot show that.
 * - **Program-name resolution.** `programName` is set on the two programs whose names
 *   are common knowledge and left absent on the rest, which is what a real route
 *   without a program registry would return. Resolving program ids to names is a
 *   server-side data problem that is not priced here.
 * - **History.** Two transactions, fixed. It must never grow into a fake backend.
 */

/** ⚠️ FAKE. Real mainnet signatures, from the two captured transactions. */
const FAKE_PAYMENT_SIGNATURE = 'V7DBXs4hs85GQwVyjwQac2PcNEVQbsqdLQGRabZAng2fKnmsbHBsm2X9K4sFYSU9sPScNiXAAMEwnVGQVcu85HY';
const FAKE_SWAP_SIGNATURE = '2XTBKenQ3isU8U2GGbtu11KHj6GitRcN6YG5yJnJ3mjud9qMfbPyt3xmgXiVdkbDX2WKYuMFqptgR7Wb3wSC1EQk';

/** The real counterparty on the captured payment: the owner whose USDC balance went down. */
const CAPTURED_SENDER_ADDRESS = '418dAeQCJwi5GBkNqSsDvjB6i12ZPea6SbRWnQS3XS4t';

/** The real fee payer on the captured payment, who is neither sender nor recipient. */
const CAPTURED_FEE_PAYER_ADDRESS = '2Citexzs8kdM97acpUyBQhHL1iD1Jvi9zgf2BGSJR5Dg';

const USDC_SOLANA_ASSET_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const SOL_ICON_URL =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

const USDC_ICON_URL =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png';

const SOL_ASSET: CaipAsset = {
  assetId: SOLANA_NATIVE_ASSET_ID,
  chainId: SOLANA_MAINNET_CHAIN_ID,
  colors: { fallback: '#9945FF', primary: '#14F195' },
  decimals: 9,
  iconUrl: SOL_ICON_URL,
  name: `Solana ${FAKE_MARKER}`,
  network: 'solana',
  price: { changedAt: '2026-08-04T09:31:29Z', relativeChange24h: 1.5, value: 180.25 },
  symbol: 'SOL',
  type: 'native',
  verified: true,
};

const USDC_ASSET: CaipAsset = {
  assetId: USDC_SOLANA_ASSET_ID,
  chainId: SOLANA_MAINNET_CHAIN_ID,
  colors: { fallback: '#2775CA', primary: '#2775CA' },
  decimals: 6,
  iconUrl: USDC_ICON_URL,
  name: `USD Coin ${FAKE_MARKER}`,
  network: 'solana',
  price: { changedAt: '2026-08-04T09:31:29Z', relativeChange24h: 0.01, value: 1 },
  symbol: 'USDC',
  type: 'spl-token',
  verified: true,
};

/**
 * ⚠️ FAKE. The sponsored USDC payment from the capture,
 * with the stand-in account as the recipient. The 98915946 received and the 22414
 * lamport fee are the captured values; the fee decomposes as 5000 × 3 signatures
 * plus a 7414 prioritization fee, which the capture confirms exactly.
 */
function fakeReceivedPayment(accountAddress: string): CaipTransaction {
  return {
    changes: [
      {
        addressFrom: CAPTURED_SENDER_ADDRESS,
        addressTo: accountAddress,
        asset: USDC_ASSET,
        direction: 'in',
        price: '1',
        quantity: '98915946',
        value: '98.915946',
      },
    ],
    chainId: SOLANA_MAINNET_CHAIN_ID,
    direction: 'in',
    fee: { price: '180.25', value: '22414' },
    id: FAKE_PAYMENT_SIGNATURE,
    identifier: FAKE_PAYMENT_SIGNATURE,
    meta: {
      action: 'Received',
      explorerLabel: 'Solscan',
      explorerUrl: `https://solscan.io/tx/${FAKE_PAYMENT_SIGNATURE}`,
      type: 'receive',
    },
    minedAt: '2026-08-04T09:31:29Z',
    solana: {
      commitment: 'finalized',
      computeUnitsConsumed: '29148',
      feePayer: CAPTURED_FEE_PAYER_ADDRESS,
      instructions: [
        { programId: 'ComputeBudget111111111111111111111111111111', programName: 'Compute Budget' },
        { programId: 'ComputeBudget111111111111111111111111111111', programName: 'Compute Budget' },
        { discriminator: 'createIdempotent', programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' },
        { discriminator: 'transfer', programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', programName: 'SPL Token' },
        { discriminator: 'transfer', programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', programName: 'SPL Token' },
        { discriminator: 'transfer', programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', programName: 'SPL Token' },
        { programId: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' },
      ],
      prioritizationFee: '7414',
      slot: '437155477',
    },
    status: 'confirmed',
    type: 'receive',
  };
}

/**
 * ⚠️ FAKE. A native SOL send, shaped from the swap capture: its
 * 605000-lamport fee, its 300000 requested
 * compute-unit limit against 165202 consumed, its slot and its signature are real,
 * and the 56178568-lamport quantity is the wrapped-SOL delta the swap actually
 * moved. It is presented as a plain send because a send is the row shape a user
 * meets first, and because the swap row type reads two changes and would test the
 * row rather than the route.
 */
function fakeSentSol(accountAddress: string): CaipTransaction {
  return {
    changes: [
      {
        addressFrom: accountAddress,
        addressTo: CAPTURED_SENDER_ADDRESS,
        asset: SOL_ASSET,
        direction: 'out',
        price: '180.25',
        quantity: '56178568',
        value: '10.126',
      },
    ],
    chainId: SOLANA_MAINNET_CHAIN_ID,
    direction: 'out',
    fee: { price: '180.25', value: '605000' },
    id: FAKE_SWAP_SIGNATURE,
    identifier: FAKE_SWAP_SIGNATURE,
    meta: {
      action: 'Sent',
      explorerLabel: 'Solscan',
      explorerUrl: `https://solscan.io/tx/${FAKE_SWAP_SIGNATURE}`,
      type: 'send',
    },
    minedAt: '2026-08-04T08:50:36Z',
    solana: {
      commitment: 'finalized',
      computeUnitsConsumed: '165202',
      feePayer: accountAddress,
      instructions: [
        { programId: 'ComputeBudget111111111111111111111111111111', programName: 'Compute Budget' },
        { programId: 'ComputeBudget111111111111111111111111111111', programName: 'Compute Budget' },
        { discriminator: 'transfer', programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', programName: 'SPL Token' },
        { programId: '6Vo3245eszAb5wuqEMw8mGdbfRUdKbHhDHP5LcaGuTAB' },
      ],
      prioritizationFee: '600000',
      slot: '437155352',
    },
    status: 'confirmed',
    type: 'send',
  };
}

/**
 * ⚠️ FAKE transport, shaped as the one method the real client calls. Returns history
 * for each Solana account the request names, so the response is a function of the
 * request rather than a constant; an account on any other namespace comes back with
 * nothing, which is what the contract says an account with no history looks like.
 *
 * A request carrying a cursor comes back empty rather than repeating the fixtures,
 * because the alternative is an infinite activity list. That is the one-page limit
 * the header records as unmodelled, made explicit here rather than left to the
 * caller.
 */
export function createFakeCaipTransactionsTransport(): Pick<RainbowFetchClient, 'post'> {
  return {
    post: <TData = unknown>(path?: RequestInfo, body?: unknown) => {
      const request = body as CaipTransactionsRequest | undefined;
      const accounts = request?.accounts ?? [];
      const solanaAccounts = accounts.filter(account => account.startsWith(`${SOLANA_MAINNET_CHAIN_ID}:`));

      logger.warn('[⚠️ FAKE CAIP transactions transport] answering a request no real route serves', {
        answeredSolanaAccounts: solanaAccounts.length,
        hasCursor: !!request?.cursor,
        path: String(path),
        requestedAccounts: accounts.length,
      });

      const data: CaipTransactionsResponse = {
        failedQueries: [],
        result: request?.cursor
          ? []
          : solanaAccounts.flatMap(account => {
              const address = account.slice(`${SOLANA_MAINNET_CHAIN_ID}:`.length);
              return [fakeReceivedPayment(address), fakeSentSol(address)];
            }),
      };

      return Promise.resolve({ data: data as TData, headers: new Headers(), status: 200 });
    },
  };
}
