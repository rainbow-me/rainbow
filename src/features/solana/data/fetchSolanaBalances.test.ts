import { afterEach, expect, it, vi } from 'vitest';

import { fetchSolanaBalances } from './fetchSolanaBalances';

vi.mock('react-native-dotenv', () => ({
  LOG_LEVEL: 'error',
  LOG_DEBUG: '',
  PLATFORM_API_KEY: 'test-only',
  PLATFORM_BASE_URL: 'https://platform.example.invalid',
}));
afterEach(() => vi.unstubAllGlobals());

it('uses the configured platform v2 endpoint and raw-address-to-CAIP boundary', async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        metadata: { success: true, currency: 'EUR' },
        result: {},
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  );
  vi.stubGlobal('fetch', fetch);
  const controller = new AbortController();
  const address = 'EXzw16qKGtrWTaTd5gGG29FWSUDrTEDheh5ber156MNS';
  expect(await fetchSolanaBalances(address, 'EUR', controller)).toMatchObject({ address, currency: 'EUR', balances: [] });
  expect(fetch).toHaveBeenCalledWith(
    'https://platform.example.invalid/v2/balances/GetBalances',
    expect.objectContaining({
      method: 'post',
      signal: controller.signal,
      headers: expect.objectContaining({ Authorization: 'Bearer test-only' }),
      body: JSON.stringify({ accounts: [`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${address}`], currency: 'EUR' }),
    })
  );
});
