import { useMemo } from 'react';
import { ParsedAddressAsset } from '@/entities';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useCollectible(
  initialAsset: Partial<ParsedAddressAsset>,
  externalAddress?: string
) {
  const { accountAddress } = useAccountSettings();
  const {
    data: { nftsMap: selfNFTsMap },
  } = useLegacyNFTs({ address: accountAddress });
  const {
    data: { nftsMap: externalNFTsMap },
  } = useLegacyNFTs({
    address: externalAddress ?? '',
  });
  const isExternal = Boolean(externalAddress);
  // Use the appropriate tokens based on if the user is viewing the
  // current accounts tokens, or external tokens (e.g. ProfileSheet)
  const uniqueTokensMap = useMemo(
    () => (isExternal ? externalNFTsMap : selfNFTsMap),
    [externalNFTsMap, isExternal, selfNFTsMap]
  );

  const asset = initialAsset?.uniqueId
    ? uniqueTokensMap[initialAsset.uniqueId] || initialAsset
    : initialAsset;

  return { ...asset, isExternal };
}
