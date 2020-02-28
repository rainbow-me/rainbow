import { filter, get, keys, map, toLower } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortAssetsByNativeAmountSelector } from '../hoc/assetSelectors';

const uniswapPairsSelector = state => state.uniswap.pairs;

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

const withUniswapAssetsInWallet = (assetData, uniswapPairs) => {
  const { allAssets } = assetData;
  const availableAssets = filter(
    allAssets,
    filterUniswapAssetsByAvailability(keys(uniswapPairs))
  );
  const uniswapAssetsInWallet = map(
    availableAssets,
    includeExchangeAddress(uniswapPairs)
  );
  return { uniswapAssetsInWallet };
};

const withUniswapAssetsInWalletSelector = createSelector(
  [sortAssetsByNativeAmountSelector, uniswapPairsSelector],
  withUniswapAssetsInWallet
);

export default function useUniswapAssetsInWallet() {
  return useSelector(withUniswapAssetsInWalletSelector);
}
