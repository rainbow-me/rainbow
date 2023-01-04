export function shortenTxHashString(hash?: string) {
  if (!hash) {
    return;
  }
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
}
