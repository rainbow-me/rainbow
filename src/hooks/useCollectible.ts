import { useMemo } from 'react';
import { ParsedAddressAsset } from '@/entities';
import { useNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';
import { NFT } from '@/resources/nfts/types';

export default function useCollectible(
  initialAsset: Partial<ParsedAddressAsset>,
  externalAddress?: string
) {
  const { accountAddress } = useAccountSettings();
  const { data: selfNFTs } = useNFTs({ address: accountAddress });
  const { data: externalNFTs } = useNFTs({
    address: externalAddress ?? '',
  });
  const isExternal = Boolean(externalAddress);
  // Use the appropriate tokens based on if the user is viewing the
  // current accounts tokens, or external tokens (e.g. ProfileSheet)
  const uniqueTokens = useMemo(() => (isExternal ? externalNFTs : selfNFTs), [
    externalNFTs,
    isExternal,
    selfNFTs,
  ]);

  const asset = useMemo(() => {
    const matched = uniqueTokens?.find(
      (uniqueToken: NFT) => uniqueToken.uniqueId === initialAsset?.uniqueId
    );
    return matched || initialAsset;
  }, [initialAsset, uniqueTokens]);

  return { ...asset, isExternal };
}
