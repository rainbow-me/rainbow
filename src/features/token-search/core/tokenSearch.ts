import { type Address } from 'viem';

import { type AddressOrEth } from '@/__swaps__/types/assets';
import { type SearchAsset } from '@/__swaps__/types/search';
import { getUniqueId } from '@/entities/assetId';
import { ChainId } from '@/features/network/types/backendNetworks';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

// The subset of the gateway contract (protobuf-registry, external/tokensearch/search.proto) the app reads. Its JSON
// omits zero values (proto3), so an absent field is its zero value: an absent `decimals` is 0.

export type TokenSearchCategory = 'CATEGORY_ALL' | 'CATEGORY_TOKENS';

type SectionType = 'SECTION_TYPE_TOP' | 'SECTION_TYPE_TOKENS';

type VerificationStatus =
  | 'VERIFICATION_STATUS_VERIFIED'
  | 'VERIFICATION_STATUS_UNVERIFIED'
  | 'VERIFICATION_STATUS_INCONCLUSIVE'
  | 'VERIFICATION_STATUS_SCAM';

type RiskLevel = 'RISK_LEVEL_NONE' | 'RISK_LEVEL_CAUTION' | 'RISK_LEVEL_HIGH';

export type TokenSearchInstance = {
  /** CAIP-19 asset id, e.g. `eip155:1/erc20:0xa0b8…eb48` or `eip155:1/native:eth`. */
  assetId: string;
  decimals?: number;
};

export type TokenSearchToken = {
  name?: string;
  symbol?: string;
  iconUrl?: string;
  colors?: { primary?: string; fallback?: string };
  verification?: VerificationStatus;
  risk?: { level?: RiskLevel };
  instances?: TokenSearchInstance[];
};

export type TokenSearchItem = {
  id: string;
  token?: TokenSearchToken;
};

export type TokenSearchSection = {
  type: SectionType;
  items?: TokenSearchItem[];
};

export type TokenSearchResult = {
  sections?: TokenSearchSection[];
};

/**
 * The native coin of every chain the app supports, keyed by chain, as `getChainsNativeAsset()` returns it. A chain
 * missing here is unsupported.
 */
export type NativeAssetByChain = Partial<Record<ChainId, { address: AddressOrEth; decimals: number }>>;

export type ChainSearchResults = {
  verified: SearchAsset[];
  unverified: SearchAsset[];
};

type ParsedInstance = { address: AddressOrEth; chainId: ChainId; decimals: number };

const ASSET_ID_PATTERN = /^eip155:([1-9]\d*)\/(erc20|native):(.+)$/;
const CONTRACT_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
// Decimals are an unsigned 8-bit integer on EVM tokens
const MAX_DECIMALS = 255;

const SECTION_TYPES = new Set<string>(['SECTION_TYPE_TOP', 'SECTION_TYPE_TOKENS'] satisfies SectionType[]);

function isSupportedChain(chainId: number, nativeAssetByChain: NativeAssetByChain): chainId is ChainId {
  return chainId in nativeAssetByChain;
}

/**
 * Parses an instance, keeping it only when it is a deployment the app can open: an ERC-20 contract, or the native coin
 * at the app's own native address for that chain.
 */
function parseInstance(instance: TokenSearchInstance, nativeAssetByChain: NativeAssetByChain): ParsedInstance | null {
  const match = ASSET_ID_PATTERN.exec(instance.assetId);
  if (!match) return null;

  const chainId = Number(match[1]);
  if (!isSupportedChain(chainId, nativeAssetByChain)) return null;
  const nativeAsset = nativeAssetByChain[chainId];
  if (nativeAsset === undefined) return null;
  const nativeAddress = nativeAsset.address;

  const decimals = instance.decimals ?? 0;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) return null;

  const [, , namespace, address] = match;
  if (namespace === 'native') {
    // The app's own decimals, as the backend reports unknown decimals as 0
    return isLowerCaseMatch(address, nativeAddress) ? { address: nativeAddress, chainId, decimals: nativeAsset.decimals } : null;
  }

  const isContract =
    CONTRACT_ADDRESS_PATTERN.test(address) && !isLowerCaseMatch(address, ZERO_ADDRESS) && !isLowerCaseMatch(address, nativeAddress);
  return isContract ? { address: address.toLowerCase() as Address, chainId, decimals } : null;
}

type ParsedToken = { token: TokenSearchToken; symbol: string; instances: ParsedInstance[] };

/**
 * Parses a search item, keeping one deployment per chain, the first listed. Returns `null` for anything the app must not
 * show: an item that isn't a token, a scam or high-risk token (such as a spoof of a protected symbol), a token with no
 * symbol, or a token with no deployment the app can open.
 */
function parseToken(item: TokenSearchItem, nativeAssetByChain: NativeAssetByChain): ParsedToken | null {
  const { token } = item;
  if (!token?.symbol || token.verification === 'VERIFICATION_STATUS_SCAM' || token.risk?.level === 'RISK_LEVEL_HIGH') return null;

  const instances: ParsedInstance[] = [];
  for (const instance of token.instances ?? []) {
    const parsed = parseInstance(instance, nativeAssetByChain);
    if (parsed && !instances.some(({ chainId }) => chainId === parsed.chainId)) instances.push(parsed);
  }
  return instances.length ? { token, symbol: token.symbol, instances } : null;
}

function toDeploymentAsset(
  { token, symbol, instances }: ParsedToken,
  selected: ParsedInstance,
  nativeAssetByChain: NativeAssetByChain
): SearchAsset {
  const networks: SearchAsset['networks'] = {};
  for (const instance of instances) {
    networks[instance.chainId] = { address: instance.address as Address, decimals: instance.decimals };
  }

  return {
    address: selected.address,
    chainId: selected.chainId,
    colors: token.colors,
    decimals: selected.decimals,
    highLiquidity: false,
    icon_url: token.iconUrl,
    isNativeAsset: selected.address === nativeAssetByChain[selected.chainId]?.address,
    isRainbowCurated: false,
    isVerified: token.verification === 'VERIFICATION_STATUS_VERIFIED',
    mainnetAddress: networks[ChainId.mainnet]?.address ?? ('' as Address),
    name: token.name || symbol,
    networks,
    symbol,
    uniqueId: getUniqueId(selected.address, selected.chainId),
  };
}

/**
 * Maps a search item to a `SearchAsset` on `chainId` when the asset is deployed there, otherwise on its first instance,
 * the chain the backend opens. Returns `null` for anything the app must not show (see `parseToken`).
 */
export function toSearchAsset(item: TokenSearchItem, nativeAssetByChain: NativeAssetByChain, chainId?: ChainId): SearchAsset | null {
  const parsed = parseToken(item, nativeAssetByChain);
  if (!parsed) return null;
  const selected = parsed.instances.find(instance => instance.chainId === chainId) ?? parsed.instances[0];
  return toDeploymentAsset(parsed, selected, nativeAssetByChain);
}

/** Every result in display order, `top` first. Unknown section types are skipped, as the contract requires. */
function toSearchItems(result: TokenSearchResult): TokenSearchItem[] {
  return (result.sections ?? []).flatMap(section => (SECTION_TYPES.has(section.type) ? (section.items ?? []) : []));
}

/** Maps every result in display order, each opened on `chainId` when deployed there. */
export function toSearchAssets(result: TokenSearchResult, nativeAssetByChain: NativeAssetByChain, chainId?: ChainId): SearchAsset[] {
  const assets: SearchAsset[] = [];
  for (const item of toSearchItems(result)) {
    const asset = toSearchAsset(item, nativeAssetByChain, chainId);
    if (asset) assets.push(asset);
  }
  return assets;
}

/**
 * Maps every deployment of every result to its own `SearchAsset`, opened on that deployment's chain: one row per chain,
 * like the legacy search. Results keep their display order, and each one's deployments the order the backend lists them.
 */
export function toSearchAssetDeployments(result: TokenSearchResult, nativeAssetByChain: NativeAssetByChain): SearchAsset[] {
  const deployments: SearchAsset[] = [];
  for (const item of toSearchItems(result)) {
    const parsed = parseToken(item, nativeAssetByChain);
    if (!parsed) continue;
    for (const instance of parsed.instances) {
      deployments.push(toDeploymentAsset(parsed, instance, nativeAssetByChain));
    }
  }
  return deployments;
}

/** Results deployed on `chainId`, opened there and split by verification. */
export function toChainSearchResults(
  result: TokenSearchResult,
  chainId: ChainId,
  nativeAssetByChain: NativeAssetByChain
): ChainSearchResults {
  const results: ChainSearchResults = { verified: [], unverified: [] };
  for (const asset of toSearchAssets(result, nativeAssetByChain, chainId)) {
    if (asset.chainId !== chainId) continue;
    (asset.isVerified ? results.verified : results.unverified).push(asset);
  }
  return results;
}

/**
 * Verified results not deployed on `chainId` that exactly match `query`: by symbol or name, or, for an address query,
 * by the address of any of their deployments.
 */
export function toCrosschainSearchResults(
  result: TokenSearchResult,
  query: string,
  chainId: ChainId,
  nativeAssetByChain: NativeAssetByChain
): SearchAsset[] {
  // As the backend reads it: a `$TICKER` is the ticker
  const normalizedQuery = query.trim().replace(/^\$/, '').toLowerCase();
  return toSearchAssets(result, nativeAssetByChain).filter(
    asset =>
      asset.isVerified &&
      asset.networks[chainId] === undefined &&
      (asset.symbol.toLowerCase() === normalizedQuery ||
        asset.name.toLowerCase() === normalizedQuery ||
        Object.values(asset.networks).some(network => isLowerCaseMatch(normalizedQuery, network?.address)))
  );
}

export const SWAP_MAX_VERIFIED_RESULTS = 24;
export const SWAP_MAX_UNVERIFIED_RESULTS = 6;

// The backend reports unknown decimals as 0, and an amount can't be quoted in a token with no decimals. Native coins
// take the app's decimals.
const isQuotable = (asset: SearchAsset) => asset.decimals > 0;

export type SwapSearchResults = {
  verified: SearchAsset[];
  unverified: SearchAsset[];
  crosschain: SearchAsset[];
};

/**
 * Whether swap search also looks for the query on other chains: only when nothing verified that can be quoted is
 * deployed on the output chain, and the query is longer than two characters (an address always is).
 */
export function needsCrosschainSwapSearch(onChain: ChainSearchResults, query: string): boolean {
  return !onChain.verified.some(isQuotable) && query.length > 2;
}

/**
 * The swap search sections, with the legacy swap rules: a one-character query shows only verified results with an icon;
 * unverified results need a query longer than two characters, and for an address, a deployment at that address. Tokens
 * that can't be quoted are left out.
 */
export function toSwapSearchResults({
  onChain,
  crosschain,
  query,
  isAddressQuery,
}: {
  onChain: ChainSearchResults;
  crosschain: SearchAsset[];
  query: string;
  isAddressQuery: boolean;
}): SwapSearchResults {
  const verified = onChain.verified.filter(asset => isQuotable(asset) && (query.length > 1 || !!asset.icon_url));
  const unverified =
    query.length > 2
      ? onChain.unverified.filter(asset => isQuotable(asset) && (!isAddressQuery || isLowerCaseMatch(asset.address, query)))
      : [];

  return {
    verified: verified.slice(0, SWAP_MAX_VERIFIED_RESULTS),
    unverified: unverified.slice(0, SWAP_MAX_UNVERIFIED_RESULTS),
    crosschain: crosschain.filter(isQuotable).slice(0, SWAP_MAX_VERIFIED_RESULTS),
  };
}
