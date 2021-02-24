import { filter, keys } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';
import NetworkTypes from '@rainbow-me/networkTypes';

const uniswapAllTokensSelector = state => state.uniswap.allTokens;
const networkSelector = state => state.settings.network;

const filterUniswapAssetsByAvailability = uniswapAssetAddresses => ({
  address,
}) => uniswapAssetAddresses.includes(address);

const withUniswapAssetsInWallet = (network, assetData, uniswapAllPairs) => {
  const { allAssets } = assetData;
  const uniswapAssetsInWallet =
    network === NetworkTypes.mainnet
      ? filter(
          allAssets,
          filterUniswapAssetsByAvailability(keys(uniswapAllPairs))
        )
      : allAssets;

  return { uniswapAssetsInWallet };
};

const withUniswapAssetsInWalletSelector = createSelector(
  [networkSelector, sortAssetsByNativeAmountSelector, uniswapAllTokensSelector],
  withUniswapAssetsInWallet
);

export default function useUniswapAssetsInWallet() {
  return useSelector(withUniswapAssetsInWalletSelector);
}
