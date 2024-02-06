import { useMemo } from 'react';
import { ParsedAddressAsset } from '@/entities';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useCollectible(
  uniqueId: string,
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

  const asset = uniqueTokensMap?.[uniqueId];

  return { ...asset, isExternal };
}
