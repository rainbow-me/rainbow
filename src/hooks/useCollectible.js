import { find, matchesProperty } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useAdditionalRecyclerAssetListData } from '../components/asset-list/RecyclerAssetList2/core/Contexts';
import useAccountSettings from './useAccountSettings';
import { uniqueTokensQueryKey } from './useFetchUniqueTokens';
import { revalidateUniqueToken } from '@rainbow-me/redux/uniqueTokens';

export default function useCollectible(
  initialAsset,
  { revalidateInBackground = false } = {}
) {
  // Retrieve the unique tokens belonging to the current account address.
  const selfUniqueTokens = useSelector(
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );
  const { accountAddress } = useAccountSettings();
  // Retrieve the unique tokens belonging to the targeted asset list account
  // (e.g. viewing another persons ENS profile via `ProfileSheet`)
  // "External" unique tokens are tokens that belong to another address (not the current account address).
  const { externalAddress } = useAdditionalRecyclerAssetListData(0);
  const queryClient = useQueryClient();
  const externalUniqueTokens = useMemo(() => {
    return (
      queryClient.getQueryData(
        uniqueTokensQueryKey({ address: externalAddress })
      ) || []
    );
  }, [queryClient, externalAddress]);
  const isExternal =
    Boolean(externalAddress) && externalAddress !== accountAddress;
  // Use the appropriate tokens based on if the user is viewing the
  // current accounts tokens, or external tokens (e.g. ProfileSheet)
  const uniqueTokens = useMemo(
    () => (isExternal ? externalUniqueTokens : selfUniqueTokens),
    [externalUniqueTokens, isExternal, selfUniqueTokens]
  );

  const asset = useMemo(() => {
    let matched = find(
      uniqueTokens,
      matchesProperty('uniqueId', initialAsset?.uniqueId)
    );
    return matched || asset;
  }, [initialAsset, uniqueTokens]);

  useRevalidateInBackground({
    contractAddress: asset?.asset_contract?.address,
    enabled: revalidateInBackground && !isExternal,
    isExternal,
    tokenId: asset?.id,
  });

  return { ...asset, isExternal };
}

function useRevalidateInBackground({
  contractAddress,
  tokenId,
  isExternal,
  enabled,
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
