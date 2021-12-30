import { isNil } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import useAccountSettings from './useAccountSettings';
import { parseAssetNative } from '@rainbow-me/parsers';

const accountAssetsDataSelector = state => state.data.accountAssetsData;
const assetPricesFromUniswapSelector = state =>
  state.data.assetPricesFromUniswap;
const uniqueIdSelector = (_, uniqueId) => uniqueId;

const accountAssetDataSelector = createSelector(
  accountAssetsDataSelector,
  uniqueIdSelector,
  (accountAssetsData, uniqueId) => accountAssetsData?.[uniqueId]
);

const assetPriceFromUniswapSelector = createSelector(
  assetPricesFromUniswapSelector,
  uniqueIdSelector,
  (assetPricesFromUniswap, uniqueId) => assetPricesFromUniswap?.[uniqueId]
);

const makeAccountAssetSelector = () =>
  createSelector(
    accountAssetDataSelector,
    assetPriceFromUniswapSelector,
    (accountAsset, assetPriceFromUniswap) => {
      if (!accountAsset) return null;
      const assetUniswapPrice = assetPriceFromUniswap?.price;
      const assetUniswapRelativeChange =
        assetPriceFromUniswap?.relativePriceChange;
      if (isNil(accountAsset?.price) && assetUniswapPrice) {
        return {
          ...accountAsset,
          price: {
            relative_change_24h: assetUniswapRelativeChange,
            value: assetUniswapPrice,
          },
        };
      }
      return accountAsset;
    }
  );

// this is meant to be used for assets under balances
// NFTs are not included in this hook
export default function useAccountAsset(uniqueId) {
  const { nativeCurrency } = useAccountSettings();
  const selectAccountAsset = useMemo(makeAccountAssetSelector, []);
  const asset = useSelector(state => selectAccountAsset(state, uniqueId));
  const assetWithPrice = useMemo(
    () => parseAssetNative(asset, nativeCurrency),
    [asset, nativeCurrency]
  );
  return assetWithPrice;
}
