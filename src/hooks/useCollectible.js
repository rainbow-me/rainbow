import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
import { useAdditionalRecyclerAssetListData } from '../components/asset-list/RecyclerAssetList2/core/Contexts';

export default function useCollectible(asset) {
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
    return queryClient.getQueryData(['unique-tokens', address]) || [];
  }, [queryClient, address]);

  // Use the appropriate tokens based on if the user is viewing the
  // current accounts tokens, or external tokens (e.g. ProfileSheet)
  const uniqueTokens = useMemo(
    () => (address ? externalUniqueTokens : selfUniqueTokens),
    [address, externalUniqueTokens, selfUniqueTokens]
  );

  return useMemo(() => {
    let matched = find(
      uniqueTokens,
      matchesProperty('uniqueId', asset?.uniqueId)
    );
    return matched || asset;
  }, [asset, uniqueTokens]);
}
