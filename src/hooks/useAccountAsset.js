import { isNil } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import useAccountSettings from './useAccountSettings';
import useGenericAsset from './useGenericAsset';
import { AssetType } from '@rainbow-me/entities';
import { parseAssetNative } from '@rainbow-me/parsers';
import { ETH_ADDRESS, ETH_ICON_URL } from '@rainbow-me/references';

const getZeroEth = () => {
  return {
    address: ETH_ADDRESS,
    balance: {
      amount: '0',
      display: '0 ETH',
    },
    color: '#29292E',
    decimals: 18,
    icon_url: ETH_ICON_URL,
    isCoin: true,
    isPlaceholder: true,
    isSmall: false,
    name: 'Ethereum',
    symbol: 'ETH',
    type: AssetType.token,
    uniqueId: ETH_ADDRESS,
  };
};

export const accountAssetsDataSelector = state => state.data.accountAssetsData;
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
// with a fallback for generic assets
// and an ETH placeholder
// NFTs are not included in this hook
export default function useAccountAsset(uniqueId, nativeCurrency) {
  const selectAccountAsset = useMemo(makeAccountAssetSelector, []);
  const accountAsset = useSelector(state =>
    selectAccountAsset(state, uniqueId)
  );
  const genericAssetBackup = useGenericAsset(uniqueId);

  // this is temporary for FastBalanceCoinRow to make a tiny bit faster
  // we pass nativeCurrency only in that case
  // for all the other cases it will work as expected
  const nativeCurrencyToUse =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    nativeCurrency ?? useAccountSettings().nativeCurrency;

  if (accountAsset) {
    return parseAssetNative(accountAsset, nativeCurrencyToUse);
  } else if (uniqueId === ETH_ADDRESS) {
    const result = parseAssetNative(genericAssetBackup, nativeCurrencyToUse);
    const placeholderEth = {
      ...getZeroEth(),
      ...result,
    };
    return placeholderEth;
  } else {
    return genericAssetBackup;
  }
}
