import { type CaipBalancesResponse } from '@/features/network/api/caipBalancesClient';

import { SOLANA_MAINNET_CHAIN_ID } from '../constants';
import { createFakeCaipBalancesTransport, FAKE_MARKER, FAKE_SOLANA_ACCOUNT_ADDRESS } from './fakeCaipBalancesTransport';

/**
 * The fake is allowed to be simple. It is not allowed to be invisible, and it is not
 * allowed to answer a question it was not asked: a fake whose response ignores its
 * request teaches nothing about the client that built the request.
 */

const SOLANA_ACCOUNT = `${SOLANA_MAINNET_CHAIN_ID}:${FAKE_SOLANA_ACCOUNT_ADDRESS}` as const;

async function post(accounts: string[]): Promise<CaipBalancesResponse> {
  const { data } = await createFakeCaipBalancesTransport().post<CaipBalancesResponse>('/balances/GetBalances', {
    accounts,
    currency: 'USD',
  });
  return data;
}

describe('createFakeCaipBalancesTransport', () => {
  it('marks every asset it invents, so a row sourced from it is visible in the app', async () => {
    const { balances } = await post([SOLANA_ACCOUNT]);

    expect(balances).toHaveLength(2);
    for (const balance of balances ?? []) {
      expect(balance.asset?.name).toContain(FAKE_MARKER);
    }
  });

  it('answers per Solana account asked about', async () => {
    const second = `${SOLANA_MAINNET_CHAIN_ID}:9wzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`;
    const { balances } = await post([SOLANA_ACCOUNT, second]);

    expect(balances).toHaveLength(4);
    expect(new Set((balances ?? []).map(balance => balance.accountId))).toEqual(new Set([SOLANA_ACCOUNT, second]));
  });

  it('returns nothing for an account on another namespace, which the contract reads as confirmed empty', async () => {
    const { balances, failedQueries } = await post(['eip155:1:0x1234567890123456789012345678901234567890']);

    expect(balances).toEqual([]);
    expect(failedQueries).toEqual([]);
  });

  it('stamps every balance with the account that owns it and a CAIP asset id on the Solana chain', async () => {
    const { balances } = await post([SOLANA_ACCOUNT]);

    for (const balance of balances ?? []) {
      expect(balance.accountId).toBe(SOLANA_ACCOUNT);
      expect(balance.asset?.chainId).toBe(SOLANA_MAINNET_CHAIN_ID);
      expect(balance.asset?.assetId).toMatch(new RegExp(`^${SOLANA_MAINNET_CHAIN_ID}/`));
    }
  });
});
