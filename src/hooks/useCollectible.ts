import { useMemo } from 'react';
import { useExternalNftsStore } from '@/state/nfts/externalNfts';
import { useUserNftsStore } from '@/state/nfts/userNfts';

export function useCollectible(uniqueId: string, externalAddress?: string) {
  const isExternal = Boolean(externalAddress);
  const asset = useUserNftsStore(s => s.getNft(uniqueId));
  const externalAsset = useExternalNftsStore(s => s.getNft(uniqueId));
  const uniqueToken = isExternal ? externalAsset : asset;
  return useMemo(() => ({ ...uniqueToken, isExternal }), [uniqueToken, isExternal]);
}
