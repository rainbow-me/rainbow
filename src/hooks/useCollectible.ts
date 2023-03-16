import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ParsedAddressAsset, UniqueAsset } from '@/entities';
import { AppState } from '@/redux/store';
import { revalidateUniqueToken } from '@/redux/uniqueTokens';
import { useLegacyNFTs } from '@/resources/nfts';

export default function useCollectible(
  initialAsset: Partial<ParsedAddressAsset>,
  { revalidateInBackground = false } = {},
  externalAddress?: string
) {
  // Retrieve the unique tokens belonging to the current account address.
  const selfUniqueTokens = useSelector(
    ({ uniqueTokens: { uniqueTokens } }: AppState) => uniqueTokens
  );
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
    isExternal,
    tokenId: asset?.id!,
  });

  return { ...asset, isExternal };
}

function useRevalidateInBackground({
  contractAddress,
  tokenId,
  isExternal,
  enabled,
}: {
  contractAddress: string | undefined;
  tokenId: string;
  isExternal: boolean;
  enabled: boolean;
}) {
  const dispatch = useDispatch();
  useEffect(() => {
    // If `forceUpdate` is truthy, we want to force refresh the metadata from OpenSea &
    // update in the background. Useful for refreshing ENS metadata to resolve "Unknown ENS name".
    if (enabled && contractAddress) {
      // Revalidate the updated asset in the background & update the `uniqueTokens` cache.
      dispatch(
        revalidateUniqueToken(contractAddress, tokenId, {
          forceUpdate: true,
        })
      );
    }
  }, [contractAddress, dispatch, enabled, isExternal, tokenId]);
}
