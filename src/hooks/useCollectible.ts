import { useEffect, useMemo } from 'react';
import { ParsedAddressAsset, UniqueAsset } from '@/entities';
import { nftsQueryKey, useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';
import { fetchSimpleHashNFT } from '@/resources/nfts/simplehash';
import { queryClient } from '@/react-query';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';

export default function useCollectible(
  initialAsset: Partial<ParsedAddressAsset>,
  { revalidateInBackground = false } = {},
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

  useRevalidateInBackground({
    contractAddress: asset?.asset_contract?.address,
    enabled: revalidateInBackground && !isExternal,
    tokenId: asset?.id!,
  });

  return { ...asset, isExternal };
}

function useRevalidateInBackground({
  contractAddress,
  tokenId,
  enabled,
}: {
  contractAddress: string | undefined;
  tokenId: string;
  enabled: boolean;
}) {
  const { accountAddress } = useAccountSettings();
  useEffect(() => {
    const updateNFT = async () => {
      const simplehashNFT = await fetchSimpleHashNFT(contractAddress!, tokenId);
      const updatedNFT =
        simplehashNFT && simpleHashNFTToUniqueAsset(simplehashNFT);

      if (updatedNFT) {
        queryClient.setQueryData(
          nftsQueryKey({ address: accountAddress }),
          (data: any) => ({
            ...data,
            pages: data.pages.map((page: any) =>
              page.map((nft: UniqueAsset) =>
                nft.uniqueId === updatedNFT.uniqueId ? updatedNFT : nft
              )
            ),
          })
        );
      }
    };
    // If `revalidateInBackground` is truthy, we want to force refresh the metadata from OpenSea &
    // update in the background. Useful for refreshing ENS metadata to resolve "Unknown ENS name".
    if (enabled && contractAddress && tokenId) {
      // Revalidate the updated asset in the background & update the `uniqueTokens` cache.
      updateNFT();
    }
  }, [accountAddress, contractAddress, enabled, tokenId]);
}
