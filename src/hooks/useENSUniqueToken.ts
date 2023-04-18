import { NFT } from '@/resources/nfts/types';
import { isENSNFTRecord, parseENSNFTRecord } from '@/utils';

/** @description Retrieves the unique token corresponding to an ENS NFT record. */
export default function useENSUniqueToken({
  nfts,
  value,
}: {
  nfts?: NFT[];
  value?: string;
}) {
  if (!value || !isENSNFTRecord(value)) return undefined;
  const { contractAddress, tokenId } = parseENSNFTRecord(value);
  const nft = nfts?.find(token => {
    return (
      token.asset_contract.address === contractAddress?.toLowerCase() &&
      token.tokenId === tokenId
    );
  });
  return nft;
}
