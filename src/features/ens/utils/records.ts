import * as i18n from '@/languages';

import { normalizeEnsName } from '../core/name';

const supportedTLDs = ['eth'];

const ERROR_CODES = {
  INVALID_DOMAIN: 'invalid-domain',
  INVALID_LENGTH: 'invalid-length',
  INVALID_SUBDOMAIN_NAME: 'invalid-subdomain-name',
  INVALID_TLD: 'invalid-tld',
  SUBDOMAINS_NOT_SUPPORTED: 'subdomains-not-supported',
} as const;

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
