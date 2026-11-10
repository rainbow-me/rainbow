import { useQuery } from '@tanstack/react-query';

import { ensClient } from '@/graphql';

/**
 * Loads the account's indexed names for profile setup.
 */
export function useAccountENSDomains(accountAddress: string) {
  const address = accountAddress.toLowerCase();
  return useQuery(['domains', address], () => fetchAccountNames(address), {
    enabled: !!address,
  });
}

async function fetchAccountNames(address: string): Promise<readonly string[]> {
  const response = await ensClient.getDomainsByAddress({ address });
  if (!response.account) return [];

  const names = new Set<string>();
  for (const domain of response.account.domains) {
    if (domain.name) names.add(domain.name);
  }
  for (const registration of response.account.registrations ?? []) {
    const domain = registration.domain;
    if (domain.name && domain.owner.id.toLowerCase() === address) names.add(domain.name);
  }
  return [...names];
}
