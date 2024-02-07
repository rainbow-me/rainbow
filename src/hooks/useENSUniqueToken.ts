import { UniqueAsset } from '@/entities';
import { isENSNFTRecord, parseENSNFTRecord } from '@/utils';

/** @description Retrieves the unique token corresponding to an ENS NFT record. */
export default function useENSUniqueToken({ uniqueTokens, value }: { uniqueTokens?: UniqueAsset[]; value?: string }) {
  if (!value || !isENSNFTRecord(value)) return undefined;
  const { contractAddress, tokenId } = parseENSNFTRecord(value);
  const uniqueToken = uniqueTokens?.find(token => {
    return (
      token.asset_contract.address?.toLowerCase() === contractAddress?.toLowerCase() && token.id?.toLowerCase() === tokenId?.toLowerCase()
    );
  });
  return uniqueToken;
}
