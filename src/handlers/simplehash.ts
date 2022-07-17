import { captureException } from '@sentry/react-native';
// @ts-expect-error
import { SIMPLEHASH_API_KEY } from 'react-native-dotenv';
import { RainbowFetchClient } from '../rainbow-fetch';
import { parseSimplehashNfts } from '@rainbow-me/parsers';
import { logger } from '@rainbow-me/utils';

const chains = {
  arbitrum: 'arbitrum',
  ethereum: 'ethereum',
  optimism: 'optimism',
  polygon: 'polygon',
} as const;
type SimpleHashChain = keyof typeof chains;

const simplehashApi = new RainbowFetchClient({
  baseURL: 'https://api.simplehash.com/api',
});

export async function getNFTByTokenId({
  chain = chains.ethereum,
  contractAddress,
  tokenId,
}: {
  chain?: SimpleHashChain;
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

export async function getNftsByWalletAddress(walletAddress: string) {
  try {
    const chainParam: string = `${chains.arbitrum},${chains.optimism}`;
    const response = await simplehashApi.get(`/v0/nfts/owners`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': SIMPLEHASH_API_KEY,
      },
      params: {
        chains: chainParam,
        wallet_addresses: walletAddress,
      },
    });
    return parseSimplehashNfts(response.data.nfts);
  } catch (error) {
    logger.sentry(
      `Error fetching simplehash NFTs for wallet address: ${walletAddress} - ${error}`
    );
    captureException(error);
  }
}
