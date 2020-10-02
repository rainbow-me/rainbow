import { filter, get, keys, map, toLower } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import NetworkTypes from '../helpers/networkTypes';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

const uniswapPairsSelector = state => state.uniswap.pairs;
const uniswapAllPairsSelector = state => state.uniswap.allPairs;
const networkSelector = state => state.settings.network;

const filterUniswapAssetsByAvailability = uniswapAssetAddresses => ({
  address,
}) => uniswapAssetAddresses.includes(address);

const includeExchangeAddress = uniswapPairs => asset => ({
  ...asset,
  exchangeAddress: get(
    uniswapPairs,
    `[${toLower(asset.address)}].exchangeAddress`
  ),
});

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
  const availableAssets =
    network === NetworkTypes.mainnet
      ? filter(
          allAssets,
          filterUniswapAssetsByAvailability(keys(uniswapCuratedAndGlobalPairs))
        )
      : allAssets;

  const uniswapAssetsInWallet = map(
    availableAssets,
    includeExchangeAddress(uniswapCuratedAndGlobalPairs)
  );
  return { uniswapAssetsInWallet };
};

const withUniswapAssetsInWalletSelector = createSelector(
  [
    networkSelector,
    sortAssetsByNativeAmountSelector,
    uniswapPairsSelector,
    uniswapAllPairsSelector,
  ],
  withUniswapAssetsInWallet
);

export default function useUniswapAssetsInWallet() {
  return useSelector(withUniswapAssetsInWalletSelector);
}
