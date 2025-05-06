import { useMemo } from 'react';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountAddress } from '@/state/wallets/walletsStore';

export default function useCollectible(uniqueId: string, externalAddress?: string) {
  const accountAddress = useAccountAddress();

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
