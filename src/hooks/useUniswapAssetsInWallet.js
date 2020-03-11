import { filter, get, keys, map, toLower } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

const uniswapPairsSelector = state => state.uniswap.pairs;
const uniswapAllPairsSelector = state => state.uniswap.allPairs;

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
  assetData,
  uniswapPairs,
  uniswapAllPairs
) => {
  const uniswapCuratedAndGlobalPairs = {
    ...uniswapPairs,
    ...uniswapAllPairs,
  };
  const { allAssets } = assetData;
  const availableAssets = filter(
    allAssets,
    filterUniswapAssetsByAvailability(keys(uniswapCuratedAndGlobalPairs))
  );
  const uniswapAssetsInWallet = map(
    availableAssets,
    includeExchangeAddress(uniswapCuratedAndGlobalPairs)
  );
  return { uniswapAssetsInWallet };
};

const withUniswapAssetsInWalletSelector = createSelector(
  [
    sortAssetsByNativeAmountSelector,
    uniswapPairsSelector,
    uniswapAllPairsSelector,
  ],
  withUniswapAssetsInWallet
);

export default function useUniswapAssetsInWallet() {
  return useSelector(withUniswapAssetsInWalletSelector);
}
