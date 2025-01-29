import { useMemo } from 'react';
import { useAccountSettings } from '.';
import { useNftCollection } from '@/state/nfts';
import { parseUniqueAssetUniqueId } from '@/resources/nfts/simplehash/utils';

type UseCollectibleParams = {
  uniqueId: string;
  externalAddress?: string;
};

export default function useCollectible({ uniqueId, externalAddress }: UseCollectibleParams) {
  const { accountAddress } = useAccountSettings();
  const isExternal = Boolean(externalAddress);
  const address = isExternal ? externalAddress ?? '' : accountAddress;
  const { collectionId } = parseUniqueAssetUniqueId(uniqueId);
  const nft = useNftCollection(address, collectionId, state => state.getData()?.nfts.get(uniqueId));
  return useMemo(() => ({ ...nft, isExternal }), [nft, isExternal]);
}
