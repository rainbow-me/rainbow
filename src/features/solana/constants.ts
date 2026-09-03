import { CAIP_NAMESPACE_SOLANA, type CaipAssetId, type CaipChainId } from '@/features/network/utils/caip';

/**
 * The CAIP-2 reference for Solana mainnet: the first 32 characters of the genesis
 * hash, matching the reference Rainbow's backend services use. It is not an address
 * and does not decode to 32 bytes.
 */
export const SOLANA_MAINNET_CAIP2_REFERENCE = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

export const SOLANA_MAINNET_CHAIN_ID: CaipChainId = `${CAIP_NAMESPACE_SOLANA}:${SOLANA_MAINNET_CAIP2_REFERENCE}`;

/** The native SOL asset reference Rainbow's backend services use. */
export const SOLANA_NATIVE_ASSET_REFERENCE = 'So11111111111111111111111111111111111111111';

export const SOLANA_NATIVE_ASSET_ID: CaipAssetId = `${SOLANA_MAINNET_CHAIN_ID}/native:${SOLANA_NATIVE_ASSET_REFERENCE}`;

/**
 * The number this app uses for Solana wherever a `ChainId` is structurally
 * required — the user-assets store's per-chain maps, `getUniqueId`, the chain
 * filter. It is app-local: nothing sends it over the wire, because the CAIP-native
 * contract carries `SOLANA_MAINNET_CHAIN_ID` instead, and no Rainbow service
 * publishes a numeric id for Solana. The value is the one other tooling in the
 * ecosystem has converged on, so any surface that has already seen a number for
 * Solana sees the same one; that shared value is a convenience, not a
 * commitment, and changing it costs a persisted-store migration and nothing beyond
 * this device.
 */
export const SOLANA_LOCAL_CHAIN_ID = 1399811149;
