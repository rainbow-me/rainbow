import { isSolanaAddress } from './address';
import { SOLANA_CHAIN_ID, SOLANA_MAINNET_CHAIN } from './chainId';

/** Preserve preferences saved by the earlier internal build using CAIP asset IDs. */
export function migrateSolanaAssetId(id: string): string {
  for (const namespace of ['native', 'token']) {
    const prefix = `${SOLANA_MAINNET_CHAIN}/${namespace}:`;
    if (!id.startsWith(prefix)) continue;
    const address = id.slice(prefix.length);
    if (isSolanaAddress(address)) return `${address}_${SOLANA_CHAIN_ID}`;
  }
  return id;
}

export function migrateSolanaPinnedAssets(coins: Record<string, boolean>): Record<string, boolean> {
  if (!Object.keys(coins).some(id => id.startsWith(`${SOLANA_MAINNET_CHAIN}/`))) return coins;
  return Object.fromEntries(Object.entries(coins).map(([id, pinned]) => [migrateSolanaAssetId(id), pinned]));
}
