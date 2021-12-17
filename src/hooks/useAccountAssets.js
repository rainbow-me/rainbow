import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useDeepCompareMemo } from 'use-deep-compare';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';

function useAccountAssetsMaster() {
  const assets = useSelector(sortAssetsByNativeAmountSelector);
  const collectibles = useSelector(
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );

  return useDeepCompareMemo(
    () => ({
      ...assets,
      collectibles,
    }),
    [assets, collectibles]
  );
}

const Context = React.createContext();

export function AccountAssetManager({ children }) {
  const value = useAccountAssetsMaster();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export default function useAccountAssets() {
  return useContext(Context);
}
