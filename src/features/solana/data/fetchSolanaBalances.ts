import { PLATFORM_API_KEY, PLATFORM_BASE_URL } from 'react-native-dotenv';

import { parseSolanaBalances, solanaBalanceAccountId } from '@/features/solana/core/balances';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';

// Independent of the existing v1 client and its production consumers.
const client = new RainbowFetchClient({
  baseURL: `${PLATFORM_BASE_URL}/v2`,
  headers: { Authorization: `Bearer ${PLATFORM_API_KEY}` },
});

export async function fetchSolanaBalances(address: string, currency: string, abortController: AbortController | null) {
  const { data } = await client.post<unknown>(
    '/balances/GetBalances',
    {
      accounts: [solanaBalanceAccountId(address)],
      currency,
    },
    { abortController }
  );
  return parseSolanaBalances(data, address, currency);
}
