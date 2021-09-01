import { filter } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';
import NetworkTypes from '@rainbow-me/networkTypes';

const uniswapAllTokensSelector = state => state.uniswap.allTokens;
const networkSelector = state => state.settings.network;

const withUniswapAssetsInWallet = (network, assetData, uniswapAllPairs) => {
  const { allAssets } = assetData;
  return network === NetworkTypes.mainnet
    ? filter(allAssets, ({ address }) => uniswapAllPairs[address])
    : allAssets;
};

const withUniswapAssetsInWalletSelector = createSelector(
  [networkSelector, sortAssetsByNativeAmountSelector, uniswapAllTokensSelector],
  withUniswapAssetsInWallet
);

export default function useUniswapAssetsInWallet() {
  return useSelector(withUniswapAssetsInWalletSelector);
}
