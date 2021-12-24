import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

const genericAssetsSelector = state => state.data.genericAssets;
const addressSelector = (_, address) => address;

const makeGenericAssetSelector = () =>
  createSelector(
    genericAssetsSelector,
    addressSelector,
    (genericAssets, address) => genericAssets?.[address]
  );

export default function useGenericAsset(address) {
  const selectGenericAsset = useMemo(makeGenericAssetSelector, []);
  const asset = useSelector(state => selectGenericAsset(state, address));
  return asset;
}
