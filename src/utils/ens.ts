import lang from 'i18n-js';
import uts46 from 'idna-uts46-hx';
import { UniqueAsset } from '@/entities';

const supportedTLDs = ['eth'];

const ERROR_CODES = {
  INVALID_DOMAIN: 'invalid-domain',
  INVALID_DOMAIN_NAME: 'invalid-domain-name',
  INVALID_LENGTH: 'invalid-length',
  INVALID_SUBDOMAIN_NAME: 'invalid-subdomain-name',
  INVALID_TLD: 'invalid-tld',
  SUBDOMAINS_NOT_SUPPORTED: 'subdomains-not-supported',
} as const;

/**
 * @description Gets the ENS NFT `avatarUrl` from the record `avatar`
 */
export function getENSNFTAvatarUrl(uniqueTokens: UniqueAsset[], avatar?: string) {
  let avatarUrl;
  if (avatar) {
    const isNFTAvatar = isENSNFTRecord(avatar);
    if (isNFTAvatar) {
      const { contractAddress, tokenId } = parseENSNFTRecord(avatar);
      const uniqueToken = uniqueTokens.find(
        token => token.asset_contract.address?.toLowerCase() === contractAddress.toLowerCase() && token.id === tokenId
      );
      if (uniqueToken?.image_url) {
        avatarUrl = uniqueToken?.image_url;
      } else if (uniqueToken?.image_thumbnail_url) {
        avatarUrl = uniqueToken?.image_thumbnail_url;
      }
    } else if (avatar.startsWith('http') || (avatar.startsWith('/') && !avatar.match(/^\/(ipfs|ipns)/))) {
      avatarUrl = avatar;
    }
  }
  return avatarUrl;
}

export function isENSNFTRecord(avatar?: string) {
  return avatar?.includes('eip155:1');
}

export function normalizeENS(name: string) {
  try {
    return uts46.toUnicode(name, { useStd3ASCII: true });
  } catch (err) {
    return name;
  }
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

const SPECIAL_CHARACTERS = [`’`, '‘'];
const validateSpecialCharacters = (domainName: string) => {
  try {
    uts46.toUnicode(domainName, { useStd3ASCII: true });
  } catch (err) {
    return false;
  }
  return !SPECIAL_CHARACTERS.some(element => {
    if (domainName.includes(element)) {
      return true;
    }
    return false;
  });
};

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
      hint: lang.t('profiles.search_validation.invalid_domain'),
      valid: false,
    };
  }

  const [tld, domainName, subDomainName] = splitDomain.reverse();

  if (!supportedTLDs.includes(tld)) {
    return {
      code: ERROR_CODES.INVALID_TLD,
      hint: lang.t('profiles.search_validation.tld_not_supported'),
      valid: false,
    };
  }

  if (!includeSubdomains && (subDomainName || subDomainName === '')) {
    return {
      code: ERROR_CODES.SUBDOMAINS_NOT_SUPPORTED,
      hint: lang.t('profiles.search_validation.subdomains_not_supported'),
      valid: false,
    };
  }

  if (domainName.length < 3) {
    return {
      code: ERROR_CODES.INVALID_LENGTH,
      hint: lang.t('profiles.search_validation.invalid_length'),
      valid: false,
    };
  }

  const validDomainName = validateSpecialCharacters(domainName);

  if (!validDomainName) {
    return {
      code: ERROR_CODES.INVALID_SUBDOMAIN_NAME,
      hint: lang.t('profiles.search_validation.invalid_special_characters'),
      valid: false,
    };
  }

  if (subDomainName) {
    const validSubDomainName = validateSpecialCharacters(subDomainName);
    if (!validSubDomainName) {
      return {
        code: ERROR_CODES.INVALID_SUBDOMAIN_NAME,
        hint: lang.t('profiles.search_validation.invalid_special_characters'),
        valid: false,
      };
    }
  }

  return { valid: true };
}
