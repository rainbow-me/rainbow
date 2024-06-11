import { useMemo } from 'react';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useCollectible(uniqueId: string, externalAddress?: string) {
  const { accountAddress } = useAccountSettings();

  const isExternal = Boolean(externalAddress);
  const address = isExternal ? externalAddress ?? '' : accountAddress;

  const { data: asset } = useLegacyNFTs({
    address,
    config: {
      select: data => data.nftsMap[uniqueId],
    },
  });

  return useMemo(() => ({ ...asset, isExternal }), [asset, isExternal]);
}
