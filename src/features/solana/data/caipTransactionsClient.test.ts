import { TransactionDirection, TransactionStatus } from '@/entities/transactions';

import { SOLANA_LOCAL_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID, SOLANA_NATIVE_ASSET_ID } from '../constants';
import {
  CAIP_TRANSACTIONS_PATH,
  fetchCaipTransactions,
  toCaipTransactionsResult,
  type CaipTransaction,
  type CaipTransactionsResponse,
} from './caipTransactionsClient';

// `getUniqueId` is a one-line template that reaches the redux store through its
// module's imports, which no jest environment can construct. Mocked with its real
// body, exactly as `src/state/assets/utils.test.ts` already does for the asset path.
jest.mock('@/utils/ethereumUtils', () => ({ getUniqueId: (address: string, chainId: number) => `${address}_${chainId}` }));

const SOLANA_ADDRESS = '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj';
const COUNTERPARTY = '418dAeQCJwi5GBkNqSsDvjB6i12ZPea6SbRWnQS3XS4t';
const FEE_PAYER = '2Citexzs8kdM97acpUyBQhHL1iD1Jvi9zgf2BGSJR5Dg';
const SIGNATURE = 'V7DBXs4hs85GQwVyjwQac2PcNEVQbsqdLQGRabZAng2fKnmsbHBsm2X9K4sFYSU9sPScNiXAAMEwnVGQVcu85HY';
const USDC_SOLANA_ASSET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const SOLANA_FEE_ASSET = { decimals: 9, symbol: 'SOL' };

/**
 * A Solana transaction in the specified wire shape: CAIP-2 chain id, CAIP-19
 * asset id, `identifier` rather than `hash`, and execution detail in the `solana`
 * branch of the `oneof`. Its values are the ones a captured mainnet payment
 * actually carries.
 */
const SOLANA_TRANSACTION: CaipTransaction = {
  changes: [
    {
      addressFrom: COUNTERPARTY,
      addressTo: SOLANA_ADDRESS,
      asset: {
        assetId: USDC_SOLANA_ASSET,
        chainId: SOLANA_MAINNET_CHAIN_ID,
        colors: { primary: '#2775CA' },
        decimals: 6,
        name: 'USD Coin',
        network: 'solana',
        price: { value: 1 },
        symbol: 'USDC',
        type: 'spl-token',
      },
      direction: 'in',
      price: '1',
      quantity: '98915946',
      value: '98.915946',
    },
  ],
  chainId: SOLANA_MAINNET_CHAIN_ID,
  direction: 'in',
  fee: { price: '180.25', value: '22414' },
  identifier: SIGNATURE,
  meta: { action: 'Received', type: 'receive' },
  minedAt: '2026-08-04T09:31:29Z',
  solana: {
    commitment: 'finalized',
    computeUnitsConsumed: '29148',
    feePayer: FEE_PAYER,
    prioritizationFee: '7414',
    slot: '437155477',
  },
  status: 'confirmed',
  type: 'receive',
};

const EVM_TRANSACTION: CaipTransaction = {
  changes: [
    {
      asset: {
        assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
        chainId: 'eip155:1',
        decimals: 18,
        name: 'Dai',
        network: 'mainnet',
        symbol: 'DAI',
        type: 'erc20',
      },
      direction: 'out',
      quantity: '1000000000000000000',
      value: '1',
    },
  ],
  chainId: 'eip155:1',
  evm: { addressFrom: '0x1111111111111111111111111111111111111111', blockConfirmations: 12, blockNumber: '19000000', nonce: 42 },
  identifier: '0xabc',
  meta: { type: 'send' },
  minedAt: '2026-08-04T09:00:00Z',
  status: 'confirmed',
};

function result(response: CaipTransactionsResponse) {
  return toCaipTransactionsResult(response, SOLANA_FEE_ASSET, 'USD');
}

describe('toCaipTransactionsResult', () => {
  it('translates a Solana transaction into the shape the activity row reads', () => {
    const { transactions } = result({ result: [SOLANA_TRANSACTION] });

    expect(transactions).toHaveLength(1);
    const [transaction] = transactions;

    // The seven fields FastTransactionCoinRow reads, and nothing about them is CAIP.
    expect(transaction.chainId).toBe(SOLANA_LOCAL_CHAIN_ID);
    expect(transaction.type).toBe('receive');
    expect(transaction.description).toBe('USD Coin');
    expect(transaction.hash).toBe(SIGNATURE);
    expect(transaction.asset?.symbol).toBe('USDC');
    expect(transaction.changes).toHaveLength(1);
    expect(transaction.contract).toBeUndefined();

    expect(transaction.status).toBe(TransactionStatus.confirmed);
    expect(transaction.direction).toBe(TransactionDirection.IN);
    expect(transaction.minedAt).toBe(Math.floor(Date.parse('2026-08-04T09:31:29Z') / 1000));
  });

  it('leaves the EVM execution fields undefined for a Solana transaction rather than zero', () => {
    const [transaction] = result({ result: [SOLANA_TRANSACTION] }).transactions;

    // The whole point of the `oneof`: a consumer can tell "Solana has no nonce" from
    // "the nonce is 0", which a flat message with empty fields cannot express.
    expect(transaction.nonce).toBeUndefined();
    expect(transaction.blockNumber).toBeUndefined();
    expect(transaction.confirmations).toBeUndefined();
  });

  it('reads the EVM branch when it is the one that is set', () => {
    const [transaction] = result({ result: [EVM_TRANSACTION] }).transactions;

    expect(transaction.chainId).toBe(1);
    expect(transaction.nonce).toBe(42);
    expect(transaction.blockNumber).toBe(19000000);
    expect(transaction.confirmations).toBe(12);
    expect(transaction.from).toBe('0x1111111111111111111111111111111111111111');
  });

  it('never takes a transaction’s counterparty from the Solana fee payer', () => {
    const [transaction] = result({ result: [SOLANA_TRANSACTION] }).transactions;

    // A captured mainnet transaction has a fee payer who neither sent nor received
    // the token, so a row built from `feePayer` names the wrong party.
    expect(transaction.from).not.toBe(FEE_PAYER);
    expect(transaction.to).not.toBe(FEE_PAYER);
  });

  it('carries the counterparty of a receive, which has no outgoing change', () => {
    // Observed on the device: with these null, the details sheet renders the
    // from-and-to boxes with avatars and no addresses under them.
    const [transaction] = result({ result: [SOLANA_TRANSACTION] }).transactions;

    expect(transaction.from).toBe(COUNTERPARTY);
    expect(transaction.to).toBe(SOLANA_ADDRESS);
  });

  it('prefers the outgoing change’s counterparty when a transaction has both directions', () => {
    const swap: CaipTransaction = {
      ...SOLANA_TRANSACTION,
      changes: [
        { ...SOLANA_TRANSACTION.changes?.[0], direction: 'in' },
        { ...SOLANA_TRANSACTION.changes?.[0], addressFrom: SOLANA_ADDRESS, addressTo: FEE_PAYER, direction: 'out' },
      ],
    };

    const [transaction] = result({ result: [swap] }).transactions;
    expect(transaction.from).toBe(SOLANA_ADDRESS);
    expect(transaction.to).toBe(FEE_PAYER);
  });

  it('reads isNativeAsset off the CAIP-19 namespace, never off an address comparison', () => {
    const nativeTransaction: CaipTransaction = {
      ...SOLANA_TRANSACTION,
      changes: [
        {
          ...SOLANA_TRANSACTION.changes?.[0],
          asset: { assetId: SOLANA_NATIVE_ASSET_ID, decimals: 9, name: 'Solana', network: 'solana', symbol: 'SOL', type: 'native' },
          direction: 'out',
        },
      ],
    };

    const [transaction] = result({ result: [nativeTransaction] }).transactions;
    expect(transaction.changes?.[0]?.asset.isNativeAsset).toBe(true);

    const [tokenRow] = result({ result: [SOLANA_TRANSACTION] }).transactions;
    expect(tokenRow.changes?.[0]?.asset.isNativeAsset).toBe(false);
  });

  it('keys a change’s asset by the app-local chain number, not the CAIP chain id', () => {
    const [transaction] = result({ result: [SOLANA_TRANSACTION] }).transactions;

    expect(transaction.changes?.[0]?.asset.uniqueId).toBe(`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_${SOLANA_LOCAL_CHAIN_ID}`);
    expect(transaction.changes?.[0]?.asset.chainId).toBe(SOLANA_LOCAL_CHAIN_ID);
  });

  it('denominates the fee in the native asset the caller names', () => {
    const [transaction] = result({ result: [SOLANA_TRANSACTION] }).transactions;

    // 22414 lamports at 9 decimals. The capture confirms this is 5000 per signature
    // times three signatures plus a 7414 prioritization fee.
    expect(transaction.fee?.value.amount).toBe('0.000022414');
    expect(transaction.fee?.value.display).toContain('SOL');
  });

  it('reports accounts whose history is unknown rather than empty', () => {
    const { failedAccounts, transactions } = result({
      failedQueries: [{ accountId: `${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`, code: 'UPSTREAM_UNAVAILABLE', message: 'rpc down' }],
      result: [],
    });

    expect(transactions).toEqual([]);
    expect(failedAccounts).toEqual([
      { accountId: `${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`, code: 'UPSTREAM_UNAVAILABLE', message: 'rpc down' },
    ]);
  });

  it.each([
    ['missing-chain-id', { ...SOLANA_TRANSACTION, chainId: undefined }],
    ['unsupported-chain', { ...SOLANA_TRANSACTION, chainId: 'cosmos:cosmoshub-4' }],
    ['missing-identifier', { ...SOLANA_TRANSACTION, identifier: undefined }],
    ['missing-mined-at', { ...SOLANA_TRANSACTION, minedAt: undefined }],
  ])('drops a transaction it cannot represent and says why: %s', (reason, transaction) => {
    const { dropped, transactions } = result({ result: [transaction as CaipTransaction] });

    expect(transactions).toEqual([]);
    expect(dropped).toEqual([{ identifier: transaction.identifier, reason }]);
  });

  it('carries the pagination cursor through untouched', () => {
    expect(result({ pagination: { cursor: 'opaque-cursor' }, result: [] }).nextCursor).toBe('opaque-cursor');
    expect(result({ result: [] }).nextCursor).toBeUndefined();
  });

  it('answers an absent result and an absent failure list as empty rather than throwing', () => {
    expect(result({})).toEqual({ dropped: [], failedAccounts: [], nextCursor: undefined, transactions: [] });
  });
});

describe('fetchCaipTransactions', () => {
  it('posts the request to the specified path and translates the response', async () => {
    const post = jest.fn().mockResolvedValue({ data: { result: [SOLANA_TRANSACTION] } });

    const { transactions } = await fetchCaipTransactions(
      { accounts: [`${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`], currency: 'USD', limit: 30 },
      { client: { post }, nativeAsset: SOLANA_FEE_ASSET, nativeCurrency: 'USD' }
    );

    expect(post).toHaveBeenCalledWith(
      CAIP_TRANSACTIONS_PATH,
      { accounts: [`${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`], currency: 'USD', limit: 30 },
      { abortController: undefined }
    );
    expect(transactions).toHaveLength(1);
  });
});
