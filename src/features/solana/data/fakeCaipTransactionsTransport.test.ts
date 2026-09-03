import { SOLANA_MAINNET_CHAIN_ID } from '../constants';
import { type CaipTransactionsResponse } from './caipTransactionsClient';
import { FAKE_MARKER, FAKE_SOLANA_ACCOUNT_ADDRESS } from './fakeCaipBalancesTransport';
import { createFakeCaipTransactionsTransport } from './fakeCaipTransactionsTransport';

/**
 * The fake's two obligations: it is unmistakable in the app, and it answers the
 * request rather than a constant. Both are invariants of the fake policy here,
 * not conveniences.
 */

const SOLANA_ACCOUNT = `${SOLANA_MAINNET_CHAIN_ID}:${FAKE_SOLANA_ACCOUNT_ADDRESS}` as const;

async function post(body: unknown): Promise<CaipTransactionsResponse> {
  const response = await createFakeCaipTransactionsTransport().post<CaipTransactionsResponse>('/transactions/ListTransactions', body);
  return response.data;
}

describe('createFakeCaipTransactionsTransport', () => {
  it('marks every transaction it produces as fake, visibly', async () => {
    const { result } = await post({ accounts: [SOLANA_ACCOUNT], currency: 'USD', limit: 30 });

    expect(result).toHaveLength(2);
    for (const transaction of result ?? []) {
      // The row renders the change asset's name as its description for a send or a
      // receive, so this marker is what reaches the screen.
      expect(transaction.changes?.[0]?.asset?.name).toContain(FAKE_MARKER);
    }
  });

  it('answers the account the request named, not a fixed address', async () => {
    const otherAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    const { result } = await post({ accounts: [`${SOLANA_MAINNET_CHAIN_ID}:${otherAddress}`], currency: 'USD', limit: 30 });

    const addresses = (result ?? []).flatMap(transaction => [
      transaction.changes?.[0]?.addressFrom ?? '',
      transaction.changes?.[0]?.addressTo ?? '',
    ]);
    expect(addresses).toContain(otherAddress);
    expect(addresses).not.toContain(FAKE_SOLANA_ACCOUNT_ADDRESS);
  });

  it('answers an account on another namespace with no history at all', async () => {
    const { result } = await post({ accounts: ['eip155:1:0x1234567890123456789012345678901234567890'], currency: 'USD', limit: 30 });

    expect(result).toEqual([]);
  });

  it('serves one page, and a cursor request comes back empty rather than repeating', async () => {
    const first = await post({ accounts: [SOLANA_ACCOUNT], currency: 'USD', limit: 30 });
    expect(first.pagination?.cursor).toBeUndefined();

    const second = await post({ accounts: [SOLANA_ACCOUNT], currency: 'USD', cursor: 'anything', limit: 30 });
    expect(second.result).toEqual([]);
  });

  it('reports no failed queries, which is the property it does not model', async () => {
    const { failedQueries } = await post({ accounts: [SOLANA_ACCOUNT], currency: 'USD', limit: 30 });

    expect(failedQueries).toEqual([]);
  });

  it('carries the captured mainnet values rather than invented ones', async () => {
    const { result } = await post({ accounts: [SOLANA_ACCOUNT], currency: 'USD', limit: 30 });
    const payment = result?.find(transaction => transaction.type === 'receive');

    // From the captured mainnet payment: slot 437155477, fee 22414 lamports,
    // 29148 compute units consumed, and a 7414-lamport prioritization fee.
    expect(payment?.solana?.slot).toBe('437155477');
    expect(payment?.fee?.value).toBe('22414');
    expect(payment?.solana?.computeUnitsConsumed).toBe('29148');
    expect(payment?.solana?.prioritizationFee).toBe('7414');
    expect(payment?.solana?.commitment).toBe('finalized');
  });

  it('leaves the EVM branch of the oneof unset on every transaction', async () => {
    const { result } = await post({ accounts: [SOLANA_ACCOUNT], currency: 'USD', limit: 30 });

    for (const transaction of result ?? []) {
      expect(transaction.evm).toBeUndefined();
      expect(transaction.solana).toBeDefined();
    }
  });
});
