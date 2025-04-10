import { useMemo } from 'react';
import { useUserNftsStore, useExternalNftsStore } from '@/state/nfts';

export default function useCollectible(uniqueId: string, externalAddress?: string) {
  const isExternal = Boolean(externalAddress);
  const asset = useUserNftsStore(s => s.getNft(uniqueId));
  const externalAsset = useExternalNftsStore(s => s.getNft(uniqueId));
  const uniqueToken = isExternal ? externalAsset : asset;
  return useMemo(() => ({ ...uniqueToken, isExternal }), [uniqueToken, isExternal]);
}
