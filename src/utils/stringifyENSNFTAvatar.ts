// Converts an unique token/NFT to a format that is compatible with
// ENS NFT avatars via the `avatar` record
export default function stringifyENSNFTAvatar({
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
