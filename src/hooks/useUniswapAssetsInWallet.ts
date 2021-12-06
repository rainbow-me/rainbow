import { filter } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assetSelec... Remove this comment to see the full error message
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/networkTypes' or i... Remove this comment to see the full error message
import NetworkTypes from '@rainbow-me/networkTypes';

const uniswapAllTokensSelector = (state: any) => state.uniswap.allTokens;
const networkSelector = (state: any) => state.settings.network;

const withUniswapAssetsInWallet = (
  network: any,
  assetData: any,
  uniswapAllPairs: any
) => {
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
