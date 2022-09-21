import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { AppState } from '@/redux/store';

const genericAssetsSelector = (state: AppState) => state.data.genericAssets;
const addressSelector = (_: any, address: string) => address;
const addressesSelector = (_: any, addresses: string[]) => addresses;

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
    addresses?.reduce((acc: any, address: any) => {
      acc[address] = genericAssets?.[address];
      return acc;
    }, {})
);

export default function useGenericAsset(address: any) {
  const selectGenericAsset = useMemo(makeGenericAssetSelector, []);
  const asset = useSelector((state: AppState) =>
    selectGenericAsset(state, address)
  );
  return asset;
}

export function useGenericAssets(addresses: any) {
  const assets = useSelector((state: AppState) =>
    genericManyAssetsSelector(state, addresses)
  );
  return assets;
}
