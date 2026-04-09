import type { UniqueAsset } from '@/entities/uniqueAssets';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

import { isENSNFTRecord, parseENSNFTRecord } from '../utils/records';

/** @description Retrieves the unique token corresponding to an ENS NFT record. */
export default function useENSUniqueToken({ uniqueTokens, value }: { uniqueTokens?: UniqueAsset[]; value?: string }) {
  if (!value || !isENSNFTRecord(value)) return undefined;
  const { contractAddress, tokenId } = parseENSNFTRecord(value);
  const uniqueToken = uniqueTokens?.find(
    token => isLowerCaseMatch(token.contractAddress, contractAddress) && isLowerCaseMatch(token.tokenId, tokenId)
  );
  return uniqueToken;
}
