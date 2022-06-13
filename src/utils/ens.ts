import uts46 from 'idna-uts46-hx';
import { UniqueAsset } from '@rainbow-me/entities';

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
export function getENSNFTAvatarUrl(
  uniqueTokens: UniqueAsset[],
  avatar?: string
) {
  let avatarUrl;
  if (avatar) {
    const isNFTAvatar = isENSNFTRecord(avatar);
    if (isNFTAvatar) {
      const { contractAddress, tokenId } = parseENSNFTRecord(avatar);
      const uniqueToken = uniqueTokens.find(
        token =>
          token.asset_contract.address?.toLowerCase() ===
            contractAddress.toLowerCase() && token.id === tokenId
      );
      if (uniqueToken?.image_url) {
        avatarUrl = uniqueToken?.image_url;
      } else if (uniqueToken?.image_thumbnail_url) {
        avatarUrl = uniqueToken?.image_thumbnail_url;
      }
    } else if (
      avatar.startsWith('http') ||
      (avatar.startsWith('/') && !avatar.match(/^\/(ipfs|ipns)/))
    ) {
      avatarUrl = avatar;
    }
  }
  return avatarUrl;
}

export function isENSNFTRecord(avatar: string) {
  return avatar.includes('eip155:1');
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
  const [standard, contractAddress, tokenId] = record
    .replace('eip155:1/', '')
    .split(/[:/]+/);
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
  code?: typeof ERROR_CODES[keyof typeof ERROR_CODES];
} {
  const splitDomain = domain.split('.');

  if (splitDomain.length < 2) {
    return {
      code: ERROR_CODES.INVALID_DOMAIN,
      hint: 'This is an invalid domain',
      valid: false,
    };
  }

  const [tld, domainName, subDomainName] = splitDomain.reverse();

  if (!supportedTLDs.includes(tld)) {
    return {
      code: ERROR_CODES.INVALID_TLD,
      hint: 'This TLD is not supported',
      valid: false,
    };
  }

  if (!includeSubdomains && subDomainName) {
    return {
      code: ERROR_CODES.SUBDOMAINS_NOT_SUPPORTED,
      hint: 'Subdomains are not supported',
      valid: false,
    };
  }

  if (domainName.length < 3) {
    return {
      code: ERROR_CODES.INVALID_LENGTH,
      hint: 'Your name must be at least 3 characters',
      valid: false,
    };
  }

  try {
    uts46.toUnicode(domainName, { useStd3ASCII: true });
  } catch (err) {
    return {
      code: ERROR_CODES.INVALID_DOMAIN_NAME,
      hint: 'Your name cannot include special characters',
      valid: false,
    };
  }

  if (subDomainName) {
    try {
      uts46.toUnicode(subDomainName, { useStd3ASCII: true });
    } catch (err) {
      return {
        code: ERROR_CODES.INVALID_SUBDOMAIN_NAME,
        hint: 'Your subdomain cannot include special characters',
        valid: false,
      };
    }
  }

  return { valid: true };
}
