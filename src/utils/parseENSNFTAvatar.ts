// Converts the ENS NFT `avatar` record string to a unique token metadata object
export default function parseENSNFTAvatar(avatar: string) {
  const [standard, contractAddress, tokenId] = avatar
    .replace('eip155:1/', '')
    .split(/[:/]+/);
  return {
    contractAddress,
    standard,
    tokenId,
  };
}
