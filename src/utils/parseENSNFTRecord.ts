// Converts the ENS NFT record string to a unique token metadata object
export default function parseENSNFTRecord(record: string) {
  const [standard, contractAddress, tokenId] = record
    .replace('eip155:1/', '')
    .split(/[:/]+/);
  return {
    contractAddress,
    standard,
    tokenId,
  };
}
