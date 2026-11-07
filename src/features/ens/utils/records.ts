import type { UniqueAsset } from '@/entities/uniqueAssets';
import * as i18n from '@/languages';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

import { normalizeEnsName } from '../core/name';
import { isDirectImagePath } from '../core/records';

const supportedTLDs = ['eth'];

const ERROR_CODES = {
  INVALID_DOMAIN: 'invalid-domain',
  INVALID_LENGTH: 'invalid-length',
  INVALID_SUBDOMAIN_NAME: 'invalid-subdomain-name',
  INVALID_TLD: 'invalid-tld',
  SUBDOMAINS_NOT_SUPPORTED: 'subdomains-not-supported',
} as const;

/** Returns the image for a registration avatar from the wallet's NFTs or the record itself. */
export function getENSNFTAvatarUrl(uniqueTokens: UniqueAsset[], avatar?: string) {
  if (!avatar) return undefined;
  if (!isENSNFTRecord(avatar)) {
    return avatar.startsWith('http') || isDirectImagePath(avatar) ? avatar : undefined;
  }

  const { contractAddress, tokenId } = parseENSNFTRecord(avatar);
  const token = uniqueTokens.find(nft => isLowerCaseMatch(nft.contractAddress, contractAddress) && isLowerCaseMatch(nft.tokenId, tokenId));
  return token?.images?.highResUrl || token?.images?.lowResUrl || undefined;
}

export function isENSNFTRecord(avatar?: string) {
  return avatar?.includes('eip155:1');
}

/**
 * @description Converts the ENS NFT record string to a unique token metadata object
 */
export function parseENSNFTRecord(record: string) {
  const [standard, contractAddress, tokenId] = record.replace('eip155:1/', '').split(/[:/]+/);
  return {
    contractAddress,
    standard,
    tokenId,
  };
}

/**
 * @description Converts an unique token/NFT to a format that is compatible with
 * ENS NFT images
 */
export function stringifyENSNFTRecord({
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

/**
 * @description Checks if an ENS name is valid
 */
export function validateENS(
  domain: string,
  { includeSubdomains = true } = {}
): {
  valid: boolean;
  hint?: string;
  code?: (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
} {
  const splitDomain = domain.split('.');

  if (splitDomain.length < 2) {
    return {
      code: ERROR_CODES.INVALID_DOMAIN,
      hint: i18n.t(i18n.l.profiles.search_validation.invalid_domain),
      valid: false,
    };
  }

  const [tld, domainName, subDomainName] = splitDomain.reverse();

  if (!supportedTLDs.includes(tld)) {
    return {
      code: ERROR_CODES.INVALID_TLD,
      hint: i18n.t(i18n.l.profiles.search_validation.tld_not_supported),
      valid: false,
    };
  }

  if (!includeSubdomains && (subDomainName || subDomainName === '')) {
    return {
      code: ERROR_CODES.SUBDOMAINS_NOT_SUPPORTED,
      hint: i18n.t(i18n.l.profiles.search_validation.subdomains_not_supported),
      valid: false,
    };
  }

  if (Array.from(domainName).length < 3) {
    return {
      code: ERROR_CODES.INVALID_LENGTH,
      hint: i18n.t(i18n.l.profiles.search_validation.invalid_length),
      valid: false,
    };
  }

  try {
    normalizeEnsName(domain);
  } catch {
    return {
      code: ERROR_CODES.INVALID_SUBDOMAIN_NAME,
      hint: i18n.t(i18n.l.profiles.search_validation.invalid_special_characters),
      valid: false,
    };
  }

  return { valid: true };
}
