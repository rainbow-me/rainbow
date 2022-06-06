import { captureException } from '@sentry/react-native';
// @ts-expect-error
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';
import { RainbowFetchClient } from '../rainbow-fetch';
import { logger } from '@rainbow-me/utils';

const chains = {
  ethereum: 'ethereum',
} as const;
type Chain = keyof typeof chains;

const simplehashApi = new RainbowFetchClient({
  baseURL: 'https://api.simplehash.com/api',
});

export async function getNFTByTokenId({
  chain = chains.ethereum,
  contractAddress,
  tokenId,
}: {
  chain?: Chain;
  contractAddress: string;
  tokenId: string;
}) {
  try {
    const response = await simplehashApi.get(
      `/v0/nfts/${chain}/${contractAddress}/${tokenId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': SIMPLEHASH_API_KEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    logger.sentry(`Error fetching simplehash NFT: ${error}`);
    captureException(error);
  }
}
