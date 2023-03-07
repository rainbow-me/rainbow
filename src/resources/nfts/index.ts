import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryFunctionArgs } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { UniqueAsset } from '@/entities/uniqueAssets';

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

export function useNFT(tokenId: string): NFT {
  // normal react query where we get new NFT formatted data
  // @ts-ignore TODO implement
  return {};
}

export function useLegacyNFTs(): UniqueAsset[] {
  // normal react query where we get UniqueAsset formatted data as an interim step
  return [];
}

export function useLegacyNFT(): UniqueAsset {
  // normal react query where we get UniqueAsset formatted data as an interim step
  // @ts-ignore TODO implement
  return {};
}
