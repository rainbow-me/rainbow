import { useMemo } from 'react';
import { externalNftsStore, useUserNftsStore } from '@/state/nfts';

export default function useCollectible(uniqueId: string, externalAddress?: string) {
  const isExternal = Boolean(externalAddress);
  const asset = useUserNftsStore.getState().getNft(uniqueId);
  const externalAsset = externalNftsStore.getState().getNft(uniqueId);
  const uniqueToken = isExternal ? externalAsset : asset;
  return useMemo(() => ({ ...uniqueToken, isExternal }), [uniqueToken, isExternal]);
}
