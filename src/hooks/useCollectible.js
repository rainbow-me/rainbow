import { find, matchesProperty } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useAdditionalRecyclerAssetListData } from '../components/asset-list/RecyclerAssetList2/core/Contexts';
import { uniqueTokensQueryKey } from './useFetchUniqueTokens';
import { fetchUniqueToken } from '@rainbow-me/redux/uniqueTokens';

export default function useCollectible(
  initialAsset,
  { forceUpdate = false } = {}
) {
  // Retrieve the unique tokens belonging to the current account address.
  const selfUniqueTokens = useSelector(
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );

  // Retrieve the unique tokens belonging to the targeted asset list account
  // (e.g. viewing another persons ENS profile via `ProfileSheet`)
  // "External" unique tokens are tokens that belong to another address.
  const { address } = useAdditionalRecyclerAssetListData(0);
  const queryClient = useQueryClient();
  const externalUniqueTokens = useMemo(() => {
    return queryClient.getQueryData(uniqueTokensQueryKey({ address })) || [];
  }, [queryClient, address]);

  const isExternal = Boolean(address);
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

  useForceUpdateInBackground({ asset, forceUpdate, isExternal });

  return asset;
}

function useForceUpdateInBackground({ asset, isExternal, forceUpdate }) {
  const dispatch = useDispatch();
  useEffect(() => {
    // If `forceUpdate` is truthy, we want to force refresh the metadata from OpenSea &
    // update in the background. Useful for refreshing ENS metadata to resolve "Unknown ENS name".
    if (asset?.asset_contract?.address && !isExternal && forceUpdate) {
      // Fetch for the updated asset & update the `uniqueTokens` cache.
      dispatch(
        fetchUniqueToken(asset?.asset_contract?.address, asset?.id, {
          forceUpdate,
        })
      );
    }
  }, [
    asset?.asset_contract?.address,
    asset?.id,
    dispatch,
    forceUpdate,
    isExternal,
  ]);
}
