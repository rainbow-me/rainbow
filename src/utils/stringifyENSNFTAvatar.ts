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
