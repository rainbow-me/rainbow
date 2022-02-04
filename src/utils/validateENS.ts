import uts46 from 'idna-uts46-hx';

const supportedTLDs = ['eth'];

const ERROR_CODES = {
  INVALID_DOMAIN: 'invalid-domain',
  INVALID_DOMAIN_NAME: 'invalid-domain-name',
  INVALID_LENGTH: 'invalid-length',
  INVALID_SUBDOMAIN_NAME: 'invalid-subdomain-name',
  INVALID_TLD: 'invalid-tld',
  SUBDOMAINS_NOT_SUPPORTED: 'subdomains-not-supported',
} as const;

export default function validateENS(
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
      hint: 'Your name can not include special characters',
      valid: false,
    };
  }

  if (subDomainName) {
    try {
      uts46.toUnicode(subDomainName, { useStd3ASCII: true });
    } catch (err) {
      return {
        code: ERROR_CODES.INVALID_SUBDOMAIN_NAME,
        hint: 'Your subdomain can not include special characters',
        valid: false,
      };
    }
  }

  return { valid: true };
}
