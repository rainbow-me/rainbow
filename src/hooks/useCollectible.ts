import { useMemo } from 'react';
import { useAccountSettings } from '.';
import { useNftsStore } from '@/state/nfts';

export default function useCollectible(uniqueId: string, externalAddress?: string) {
  const { accountAddress } = useAccountSettings();

  const isExternal = Boolean(externalAddress);
  const address = isExternal ? externalAddress ?? '' : accountAddress;

  const nftsStore = useNftsStore(address, !isExternal);
  const asset = nftsStore(state => state.getNft(uniqueId));

  return useMemo(() => ({ ...asset, isExternal }), [asset, isExternal]);
}
