import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

const genericAssetsSelector = state => state.data.genericAssets;
const addressSelector = (_, address) => address;
const addressesSelector = (_, addresses) => addresses;

const makeGenericAssetSelector = () =>
  createSelector(
    genericAssetsSelector,
    addressSelector,
    (genericAssets, address) => genericAssets?.[address]
  );

const genericManyAssetsSelector = createSelector(
  genericAssetsSelector,
  addressesSelector,
  (genericAssets, addresses) =>
    addresses?.reduce((acc, address) => {
      acc[address] = genericAssets?.[address];
      return acc;
    }, {})
);

export default function useGenericAsset(address) {
  const selectGenericAsset = useMemo(makeGenericAssetSelector, []);
  const asset = useSelector(state => selectGenericAsset(state, address));
  return asset;
}

export function useGenericAssets(addresses) {
  const assets = useSelector(state =>
    genericManyAssetsSelector(state, addresses)
  );
  return assets;
}
