import { useMemo } from 'react';
import { ParsedAddressAsset, UniqueAsset } from '@/entities';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useCollectible(
  initialAsset: Partial<ParsedAddressAsset>,
  externalAddress?: string
) {
  const { accountAddress } = useAccountSettings();
  const { data: selfUniqueTokens } = useLegacyNFTs({ address: accountAddress });
  const { data: externalUniqueTokens } = useLegacyNFTs({
    address: externalAddress ?? '',
  });
  const isExternal = Boolean(externalAddress);
  // Use the appropriate tokens based on if the user is viewing the
  // current accounts tokens, or external tokens (e.g. ProfileSheet)
  const uniqueTokens = useMemo(
    () => (isExternal ? externalUniqueTokens : selfUniqueTokens),
    [externalUniqueTokens, isExternal, selfUniqueTokens]
  );

  const asset = useMemo(() => {
    const matched = uniqueTokens?.find(
      (uniqueToken: UniqueAsset) =>
        uniqueToken.uniqueId === initialAsset?.uniqueId
    );
    return matched || initialAsset;
  }, [initialAsset, uniqueTokens]);

  return { ...asset, isExternal };
}
