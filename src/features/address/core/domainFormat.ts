const supportedUnstoppableDomains = ['888', 'bitcoin', 'blockchain', 'coin', 'crypto', 'dao', 'nft', 'wallet', 'x', 'zil'];

export function isENSAddressFormat(address: string | undefined): boolean {
  'worklet';
  const parts = address?.split('.');
  if (!parts || parts.length === 1) return false;

  const topLevelDomain = parts[parts.length - 1]?.toLowerCase();
  return topLevelDomain === 'eth';
}

export function isUnstoppableAddressFormat(address: string | undefined): boolean {
  'worklet';
  const parts = address?.split('.');
  if (!parts || parts.length === 1) return false;

  const topLevelDomain = parts[parts.length - 1]?.toLowerCase();
  return topLevelDomain !== undefined && supportedUnstoppableDomains.includes(topLevelDomain);
}

/**
 * BankrNS (`.bankr`) names, resolved on Base by the BankrNS UniversalResolver.
 * https://www.bankrns.store
 */
export function isBankrAddressFormat(address: string | undefined): boolean {
  'worklet';
  const parts = address?.split('.');
  if (!parts || parts.length === 1) return false;

  const topLevelDomain = parts[parts.length - 1]?.toLowerCase();
  return topLevelDomain === 'bankr' && parts.every(part => part.length > 0);
}

export function isValidDomainFormat(domain: string): boolean {
  'worklet';
  return isUnstoppableAddressFormat(domain) || isENSAddressFormat(domain) || isBankrAddressFormat(domain);
}
