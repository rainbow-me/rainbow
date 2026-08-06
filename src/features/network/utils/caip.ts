import { isSolanaAddress } from '@/features/solana/address';
import { RainbowError } from '@/logger';

/**
 * CAIP-2, CAIP-10 and CAIP-19 identifiers, as Rainbow's backend services define
 * them. The grammars, the supported namespaces, the chain-native address rules and
 * the eip155 lowercasing below mirror those definitions; every rule here has a
 * counterpart there,
 * because a client that validates differently from the service it talks to turns
 * a rejected request into a silent mismatch.
 *
 * Chain identity is this module's subject, which is why it sits with `ChainId`,
 * `Network` and `BackendNetwork` rather than in `framework/`: a parser for
 * Rainbow's chain namespaces is domain code, not app-agnostic infrastructure.
 * `isNamespaceNativeAddress` delegates each namespace's address rule to the
 * module that owns that chain family.
 */

export const CAIP_NAMESPACE_EIP155 = 'eip155';
export const CAIP_NAMESPACE_SOLANA = 'solana';

/** The only chain namespaces Rainbow's CAIP implementation supports. */
export type CaipNamespace = typeof CAIP_NAMESPACE_EIP155 | typeof CAIP_NAMESPACE_SOLANA;

export type CaipChainId = `${CaipNamespace}:${string}`;
export type CaipAccountId = `${CaipNamespace}:${string}:${string}`;
export type CaipAssetId = `${CaipNamespace}:${string}/${string}:${string}`;

export type ParsedCaipChainId = {
  namespace: CaipNamespace;
  reference: string;
};

export type ParsedCaipAccountId = ParsedCaipChainId & {
  chainId: CaipChainId;
  address: string;
};

export type ParsedCaipAssetId = ParsedCaipChainId & {
  chainId: CaipChainId;
  assetNamespace: string;
  assetReference: string;
  tokenId?: string;
};

const NAMESPACE_PATTERN = /^[-a-z0-9]{3,8}$/;
const REFERENCE_PATTERN = /^[-_a-zA-Z0-9]{1,32}$/;
const ACCOUNT_ADDRESS_PATTERN = /^[-.%a-zA-Z0-9]{1,128}$/;
const TOKEN_ID_PATTERN = /^[-.%a-zA-Z0-9]{1,78}$/;
const HEX_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

/** The `eth` shorthand the eip155 namespace accepts for the native currency. */
const NATIVE_ETH_ALIAS = 'eth';

const SUPPORTED_NAMESPACES: readonly string[] = [CAIP_NAMESPACE_EIP155, CAIP_NAMESPACE_SOLANA];

function asSupportedNamespace(value: string): CaipNamespace | null {
  if (!NAMESPACE_PATTERN.test(value)) return null;
  return SUPPORTED_NAMESPACES.includes(value) ? (value as CaipNamespace) : null;
}

/**
 * Whether the address is well formed for its namespace: a stricter check than the
 * CAIP grammar, which only bounds charset and length.
 */
export function isNamespaceNativeAddress(namespace: CaipNamespace, address: string): boolean {
  if (namespace === CAIP_NAMESPACE_EIP155) {
    return address === NATIVE_ETH_ALIAS || HEX_ADDRESS_PATTERN.test(address);
  }
  return isSolanaAddress(address);
}

/**
 * Lowercases eip155 addresses and references, where hex casing is display-only,
 * and returns everything else verbatim: Solana base58 is case-sensitive.
 */
export function normalizeForNamespace(namespace: CaipNamespace, value: string): string {
  return namespace === CAIP_NAMESPACE_EIP155 ? value.toLowerCase() : value;
}

export function toCaipChainId(namespace: CaipNamespace, reference: string): CaipChainId | null {
  if (!REFERENCE_PATTERN.test(reference)) return null;
  return `${namespace}:${reference}`;
}

export function parseCaipChainId(value: string): ParsedCaipChainId | null {
  const separator = value.indexOf(':');
  if (separator === -1) return null;

  const namespace = asSupportedNamespace(value.slice(0, separator));
  if (!namespace) return null;

  const reference = value.slice(separator + 1);
  if (!REFERENCE_PATTERN.test(reference)) return null;

  return { namespace, reference };
}

export function toCaipAccountId(chainId: CaipChainId, address: string): CaipAccountId | null {
  const chain = parseCaipChainId(chainId);
  if (!chain) return null;

  const normalized = normalizeForNamespace(chain.namespace, address);
  if (!ACCOUNT_ADDRESS_PATTERN.test(normalized) || !isNamespaceNativeAddress(chain.namespace, normalized)) return null;

  return `${chain.namespace}:${chain.reference}:${normalized}`;
}

export function parseCaipAccountId(value: string): ParsedCaipAccountId | null {
  const separator = value.lastIndexOf(':');
  if (separator === -1) return null;

  const chain = parseCaipChainId(value.slice(0, separator));
  if (!chain) return null;

  const address = value.slice(separator + 1);
  if (!ACCOUNT_ADDRESS_PATTERN.test(address) || !isNamespaceNativeAddress(chain.namespace, address)) return null;

  const chainId = toCaipChainId(chain.namespace, chain.reference);
  if (!chainId) return null;

  return { ...chain, chainId, address: normalizeForNamespace(chain.namespace, address) };
}

export function parseCaipAssetId(value: string): ParsedCaipAssetId | null {
  const separator = value.indexOf('/');
  if (separator === -1) return null;

  const chain = parseCaipChainId(value.slice(0, separator));
  if (!chain) return null;

  const [assetPart, tokenId, ...rest] = value.slice(separator + 1).split('/');
  if (rest.length > 0) return null;
  if (tokenId !== undefined && !TOKEN_ID_PATTERN.test(tokenId)) return null;

  const assetSeparator = assetPart.indexOf(':');
  if (assetSeparator === -1) return null;

  const assetNamespace = assetPart.slice(0, assetSeparator);
  const assetReference = assetPart.slice(assetSeparator + 1);
  if (!NAMESPACE_PATTERN.test(assetNamespace) || !ACCOUNT_ADDRESS_PATTERN.test(assetReference)) return null;

  const chainId = toCaipChainId(chain.namespace, chain.reference);
  if (!chainId) return null;

  return {
    ...chain,
    chainId,
    assetNamespace,
    assetReference: normalizeForNamespace(chain.namespace, assetReference),
    ...(tokenId === undefined ? {} : { tokenId }),
  };
}

/**
 * Returns a validated `CaipAccountId` or throws an error with the provided message.
 */
export function requireCaipAccountId(chainId: CaipChainId, address: string, errorMessage: string): CaipAccountId {
  const accountId = toCaipAccountId(chainId, address);
  if (!accountId) throw new RainbowError(errorMessage);
  return accountId;
}

/**
 * The decimal chain id an eip155 chain is known by throughout this app, or `null`
 * for any other namespace. A numeric form exists for eip155 by definition, because
 * the CAIP-2 reference *is* the decimal id; for every other namespace the number is
 * an app-side invention with no canonical value, so callers supply their own.
 */
export function toLegacyEvmChainId(chainId: CaipChainId): number | null {
  const chain = parseCaipChainId(chainId);
  if (!chain || chain.namespace !== CAIP_NAMESPACE_EIP155) return null;

  const parsed = Number(chain.reference);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function fromLegacyEvmChainId(chainId: number): CaipChainId | null {
  return Number.isSafeInteger(chainId) && chainId > 0 ? toCaipChainId(CAIP_NAMESPACE_EIP155, String(chainId)) : null;
}
