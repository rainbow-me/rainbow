import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ParsedAddressAsset, UniqueAsset } from '@/entities';
import { nftsQueryKey, useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';

export default function useCollectible(
  initialAsset: Partial<ParsedAddressAsset>,
  externalAddress?: string
) {
  const { accountAddress } = useAccountSettings();
  const { data: selfNFTs } = useLegacyNFTs({ address: accountAddress });
  const { data: externalNFTs } = useQuery<UniqueAsset[]>(
    nftsQueryKey({ address: externalAddress ?? '' }),
    // We just want to watch for changes in the query key,
    // so just supplying a noop function & staleTime of Infinity.
    async () => [],
    { staleTime: Infinity }
  );
  const isExternal = Boolean(externalAddress);
  // Use the appropriate tokens based on if the user is viewing the
  // current accounts tokens, or external tokens (e.g. ProfileSheet)
  const uniqueTokens = useMemo(() => (isExternal ? externalNFTs : selfNFTs), [
    externalNFTs,
    isExternal,
    selfNFTs,
  ]);

  const asset = useMemo(() => {
    let matched = uniqueTokens!.find(
      (uniqueToken: UniqueAsset) =>
        uniqueToken.uniqueId === initialAsset?.uniqueId
    );
    return matched || initialAsset;
  }, [initialAsset, uniqueTokens]);

  return { ...asset, isExternal };
}
