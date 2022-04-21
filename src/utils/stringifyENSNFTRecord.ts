// Converts an unique token/NFT to a format that is compatible with
// ENS NFT images
export default function stringifyENSNFTRecord({
  contractAddress,
  tokenId,
  standard,
}: {
  contractAddress: string;
  tokenId: string;
  standard: string;
}) {
  return `eip155:1/${standard.toLowerCase()}:${contractAddress}/${tokenId}`;
}
