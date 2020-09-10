import { filter, keys } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import NetworkTypes from '../helpers/networkTypes';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

const uniswapPairsSelector = state => state.uniswap.pairs;
const uniswapAllTokensSelector = state => state.uniswap.allTokens;
const networkSelector = state => state.settings.network;

const filterUniswapAssetsByAvailability = uniswapAssetAddresses => ({
  address,
}) => uniswapAssetAddresses.includes(address);

const withUniswapAssetsInWallet = (
  network,
  assetData,
  uniswapPairs,
  uniswapAllPairs
) => {
  const uniswapCuratedAndGlobalPairs = {
    ...uniswapPairs,
    ...uniswapAllPairs,
  };

  const { allAssets } = assetData;
  const uniswapAssetsInWallet =
    network === NetworkTypes.mainnet
      ? filter(
          allAssets,
          filterUniswapAssetsByAvailability(keys(uniswapCuratedAndGlobalPairs))
        )
      : allAssets;

  return { uniswapAssetsInWallet };
};

const withUniswapAssetsInWalletSelector = createSelector(
  [
    networkSelector,
    sortAssetsByNativeAmountSelector,
    uniswapPairsSelector,
    uniswapAllTokensSelector,
  ],
  withUniswapAssetsInWallet
);

export default function useUniswapAssetsInWallet() {
  return useSelector(withUniswapAssetsInWalletSelector);
}
