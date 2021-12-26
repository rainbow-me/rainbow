import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function useCollectible(asset) {
  const uniqueTokens = useSelector(
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );

  return useMemo(() => {
    let matched = find(
      uniqueTokens,
      matchesProperty('uniqueId', asset?.uniqueId)
    );
    return matched || asset;
  }, [asset, uniqueTokens]);
}
