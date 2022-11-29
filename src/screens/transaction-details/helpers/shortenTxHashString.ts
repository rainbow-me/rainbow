export function shortenTxHashString(hash: string): string {
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
}
