import {
  fromLegacyEvmChainId,
  isNamespaceNativeAddress,
  parseCaipAssetId,
  toCaipAccountId,
  toLegacyEvmChainId,
  type CaipAccountId,
  type CaipAssetId,
  type CaipChainId,
} from '@/features/network/utils/caip';
import { SOLANA_LOCAL_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID } from '@/features/solana/constants';
import { type RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformV2Client } from '@/resources/platform/client';
import { type Asset, type UserAsset } from '@/state/assets/types';

/**
 * Client for the chain-agnostic balances contract, whose accounts and assets are
 * CAIP identifiers rather than a single hex address and a numeric chain id.
 *
 * The request and response types below are hand-written from the contract's own
 * schema, which generates Go only, so there is no generated client to import. Two
 * properties of that wire format shape every type here: grpc-gateway marshals field
 * names to lowerCamelCase, which is why the existing v1 platform types read
 * `iconUrl` where the schema says `icon_url`; and proto3 JSON omits fields holding
 * their zero value, which is why almost everything is optional and defaulted at the
 * boundary.
 *
 * No client-facing route serves this contract today. `CAIP_BALANCES_PATH` mirrors
 * the contract's own HTTP binding rather than inventing a path.
 */

export const CAIP_BALANCES_PATH = '/balances/GetBalances';

export type CaipBalancesRequest = {
  accounts: CaipAccountId[];
  currency: string;
  forcedTokens?: CaipAssetId[];
};

export type CaipAssetPrice = {
  changedAt?: string;
  relativeChange24h?: number;
  value?: number;
};

export type CaipAssetNetworkInfo = {
  assetId?: string;
  decimals?: number;
};

export type CaipAsset = {
  assetId?: string;
  chainId?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  type?: string;
  iconUrl?: string;
  network?: string;
  canonicalAssetId?: string;
  verified?: boolean;
  transferable?: boolean;
  creationDate?: string;
  colors?: { primary?: string; fallback?: string };
  price?: CaipAssetPrice;
  networks?: Record<string, CaipAssetNetworkInfo>;
  bridging?: { bridgeable?: boolean; networks?: Record<string, { bridgeable?: boolean }> };
};

export type CaipBalance = {
  asset?: CaipAsset;
  updatedAt?: string;
  quantity?: string;
  value?: string;
  isSmallBalance?: boolean;
  accountId?: string;
};

export type CaipFailedQuery = {
  accountId: string;
  code: string;
  message?: string;
};

export type CaipBalancesResponse = {
  balances?: CaipBalance[];
  failedQueries?: CaipFailedQuery[];
};

/** Why a returned balance could not be represented as a `UserAsset`. */
export type DroppedBalanceReason = 'missing-asset-id' | 'malformed-asset-id' | 'unsupported-chain' | 'malformed-address';

export type DroppedBalance = {
  assetId: string | undefined;
  reason: DroppedBalanceReason;
};

export type CaipBalancesResult = {
  userAssets: UserAsset[];
  /**
   * Accounts whose balances are unknown rather than zero. One entry per (chain,
   * address) pair, so one chain failing for one address never empties another's
   * rows.
   */
  failedAccounts: CaipFailedQuery[];
  /** Rows the response carried that this app cannot hold. Never silently discarded. */
  dropped: DroppedBalance[];
};

/**
 * The number this app uses for a CAIP-2 chain wherever a `ChainId` is structurally
 * required. Defined for eip155 by the CAIP-2 reference itself, and app-local for
 * Solana; every other namespace has no number and its rows are dropped rather than
 * guessed at.
 */
export function toLocalChainId(chainId: CaipChainId | string): number | null {
  if (chainId === SOLANA_MAINNET_CHAIN_ID) return SOLANA_LOCAL_CHAIN_ID;
  return toLegacyEvmChainId(chainId as CaipChainId);
}

function toLocalNetworks(networks: Record<string, CaipAssetNetworkInfo> | undefined): Asset['networks'] {
  const localNetworks: Asset['networks'] = {};
  if (!networks) return localNetworks;

  for (const [caipChainId, info] of Object.entries(networks)) {
    const localChainId = toLocalChainId(caipChainId);
    const parsed = info.assetId ? parseCaipAssetId(info.assetId) : null;
    if (localChainId === null || !parsed) continue;

    localNetworks[localChainId] = { address: parsed.assetReference, decimals: info.decimals ?? 0 };
  }
  return localNetworks;
}

function toLocalBridgingNetworks(networks: Record<string, { bridgeable?: boolean }> | undefined): Asset['bridging']['networks'] {
  const localNetworks: Asset['bridging']['networks'] = {};
  if (!networks) return localNetworks;

  for (const [caipChainId, info] of Object.entries(networks)) {
    const localChainId = toLocalChainId(caipChainId);
    if (localChainId === null) continue;

    localNetworks[localChainId] = { bridgeable: info.bridgeable ?? false };
  }
  return localNetworks;
}

/** Protobuf timestamps arrive as RFC 3339 strings; the app's asset shape holds epoch milliseconds. */
function toEpochMilliseconds(timestamp: string | undefined): number {
  if (!timestamp) return 0;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Maps one CAIP balance onto the app's asset shape, or reports why it cannot be
 * mapped. The address family is asserted here rather than trusted: a base58 address
 * flowing into a hex-shaped path produces a confidently wrong row instead of an
 * error, so the boundary is the only place the mismatch is still visible.
 */
function toUserAsset(balance: CaipBalance): { userAsset: UserAsset } | { dropped: DroppedBalance } {
  const asset = balance.asset;
  if (!asset?.assetId) return { dropped: { assetId: asset?.assetId, reason: 'missing-asset-id' } };

  const parsed = parseCaipAssetId(asset.assetId);
  if (!parsed) return { dropped: { assetId: asset.assetId, reason: 'malformed-asset-id' } };

  const chainId = toLocalChainId(parsed.chainId);
  if (chainId === null) return { dropped: { assetId: asset.assetId, reason: 'unsupported-chain' } };

  const isNativeReference = parsed.assetNamespace === 'native';
  if (!isNativeReference && !isNamespaceNativeAddress(parsed.namespace, parsed.assetReference)) {
    return { dropped: { assetId: asset.assetId, reason: 'malformed-address' } };
  }

  return {
    userAsset: {
      asset: {
        address: parsed.assetReference,
        chainId,
        name: asset.name ?? '',
        symbol: asset.symbol ?? '',
        decimals: asset.decimals ?? 0,
        type: asset.type ?? parsed.assetNamespace,
        iconUrl: asset.iconUrl,
        network: asset.network ?? '',
        verified: asset.verified ?? false,
        transferable: asset.transferable ?? false,
        creationDate: asset.creationDate,
        colors: {
          primary: asset.colors?.primary ?? '',
          fallback: asset.colors?.fallback,
        },
        price: {
          value: asset.price?.value ?? 0,
          changedAt: toEpochMilliseconds(asset.price?.changedAt),
          relativeChange24h: asset.price?.relativeChange24h ?? 0,
        },
        networks: toLocalNetworks(asset.networks),
        bridging: {
          bridgeable: asset.bridging?.bridgeable ?? false,
          networks: toLocalBridgingNetworks(asset.bridging?.networks),
        },
      },
      quantity: balance.quantity ?? '0',
      updatedAt: balance.updatedAt ?? '',
      value: balance.value ?? '0',
      smallBalance: balance.isSmallBalance ?? false,
    },
  };
}

export function toCaipBalancesResult(response: CaipBalancesResponse): CaipBalancesResult {
  const userAssets: UserAsset[] = [];
  const dropped: DroppedBalance[] = [];

  for (const balance of response.balances ?? []) {
    const mapped = toUserAsset(balance);
    if ('userAsset' in mapped) userAssets.push(mapped.userAsset);
    else dropped.push(mapped.dropped);
  }

  return { userAssets, failedAccounts: response.failedQueries ?? [], dropped };
}

export async function fetchCaipBalances(
  request: CaipBalancesRequest,
  {
    abortController,
    client = getPlatformV2Client(),
  }: { abortController?: AbortController | null; client?: Pick<RainbowFetchClient, 'post'> } = {}
): Promise<CaipBalancesResult> {
  const response = await client.post<CaipBalancesResponse>(CAIP_BALANCES_PATH, request, { abortController });
  return toCaipBalancesResult(response.data);
}

/**
 * The account ids for one wallet across both chain families: one entry per (chain,
 * address) pair, which is what lets a single request carry a two-family wallet.
 * Addresses that are not well formed for their namespace are left out rather than
 * sent, because the contract reports a rejected account as unknown-balance and an
 * unknown balance is indistinguishable from a real one at the row.
 */
export function toBalanceAccountIds({
  evmAddress,
  evmChainIds,
  solanaAddress,
}: {
  evmAddress?: string;
  evmChainIds: readonly number[];
  solanaAddress?: string;
}): CaipAccountId[] {
  const accounts: CaipAccountId[] = [];

  if (evmAddress) {
    for (const chainId of evmChainIds) {
      const chain = fromLegacyEvmChainId(chainId);
      const accountId = chain && toCaipAccountId(chain, evmAddress);
      if (accountId) accounts.push(accountId);
    }
  }

  if (solanaAddress) {
    const accountId = toCaipAccountId(SOLANA_MAINNET_CHAIN_ID, solanaAddress);
    if (accountId) accounts.push(accountId);
  }

  return accounts;
}
