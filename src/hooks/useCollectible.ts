import { useMemo } from 'react';
import { ParsedAddressAsset, UniqueAsset } from '@/entities';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useCollectible(
  initialAsset: Partial<ParsedAddressAsset>,
  externalAddress?: string
) {
  const { accountAddress } = useAccountSettings();
  const { data: selfNFTs } = useLegacyNFTs({ address: accountAddress });
  const { data: externalNFTs } = useLegacyNFTs({
    address: externalAddress ?? '',
  });
  const isExternal = Boolean(externalAddress);
  // Use the appropriate nfts based on if the user is viewing the
  // current account's nfts, or external nfts (e.g. ProfileSheet)
  const nfts = useMemo(() => (isExternal ? externalNFTs : selfNFTs), [
    externalNFTs,
    isExternal,
    selfNFTs,
  ]);

  const asset = useMemo(() => {
    const matched = nfts?.find(
      (nft: UniqueAsset) => nft.uniqueId === initialAsset?.uniqueId
    );
    return matched || initialAsset;
  }, [initialAsset, nfts]);

  return { ...asset, isExternal };
}
