import { useQuery } from '@tanstack/react-query';

import { time } from '@/framework/core/utils/time';
import { metadataClient } from '@/graphql';
import { createQueryKey } from '@/react-query/createQueryKey';

import ensIntroMarqueeNames from '../references/ens-intro-marquee-names.json';

const queryKey = createQueryKey('ensMarquee', {}, { persisterVersion: 1 });
const initialData = {
  ensMarquee: {
    accounts: ensIntroMarqueeNames.map(name => ({
      name,
      avatar: `https://metadata.ens.domains/mainnet/avatar/${name}?v=1.0`,
      address: '',
    })),
  },
};

/**
 * Provides the intro's ENS marquee accounts, with a bundled fallback.
 */
export function useEnsMarquee() {
  return useQuery(queryKey, () => metadataClient.getEnsMarquee(), {
    staleTime: time.minutes(20),
    cacheTime: Infinity,
    initialData,
    select: data => data.ensMarquee?.accounts ?? initialData.ensMarquee.accounts,
  });
}
