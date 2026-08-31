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

export function isValidDomainFormat(domain: string): boolean {
  'worklet';
  return isUnstoppableAddressFormat(domain) || isENSAddressFormat(domain);
}
