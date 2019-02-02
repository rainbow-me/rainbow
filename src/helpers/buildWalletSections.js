import lang from 'i18n-js';
import { get } from 'lodash';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import { createSelector } from 'reselect';
import { BalanceCoinRow } from '../components/coin-row';
import { UniqueTokenRow } from '../components/unique-token';
import { buildUniqueTokenList } from './assets';

const allAssetsSelector = state => state.allAssets;
const allAssetsCountSelector = state => state.allAssetsCount;
const assetsSelector = state => state.assets;
const assetsTotalSelector = state => state.assetsTotal;
const fetchingAssetsSelector = state => state.fetchingAssets;
const fetchingUniqueTokensSelector = state => state.fetchingUniqueTokens;
const onToggleShowShitcoinsSelector = state => state.onToggleShowShitcoins;
const setIsWalletEmptySelector = state => state.setIsWalletEmpty;
const shitcoinsCountSelector = state => state.shitcoinsCount;
const showShitcoinsSelector = state => state.showShitcoins;
const uniqueTokensSelector = state => state.uniqueTokens;

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => (item) => {
      navigation.navigate('ExpandedAssetScreen', {
        asset: item,
        type: assetType,
      });
    },
  }),
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);
const UniqueTokenItem = enhanceRenderItem(UniqueTokenRow);

const balancesRenderItem = item => <TokenItem {...item} assetType="token" />;
const collectiblesRenderItem = item => <UniqueTokenItem {...item} assetType="unique_token" />;

const filterWalletSections = sections => Object.values(sections).filter(({ totalItems }) => totalItems);

const buildWalletSections = (
  allAssets,
  allAssetsCount,
  assets,
  assetsTotal,
  fetchingAssets,
  fetchingUniqueTokens,
  onToggleShowShitcoins,
  setIsWalletEmpty,
  shitcoinsCount,
  showShitcoins,
  uniqueTokens,
) => {
  const sections = {
    balances: {
      data: showShitcoins ? allAssets : assets,
      renderItem: balancesRenderItem,
      title: lang.t('account.tab_balances'),
      totalItems: allAssetsCount,
      totalValue: get(assetsTotal, 'display', ''),
    },
    collectibles: {
      data: buildUniqueTokenList(uniqueTokens),
      renderItem: collectiblesRenderItem,
      title: lang.t('account.tab_collectibles'),
      totalItems: uniqueTokens.length,
      totalValue: '',
    },
  };

  if (shitcoinsCount) {
    // 99 is an arbitrarily high number used to disable the 'destructiveButton' option
    const destructiveButtonIndex = showShitcoins ? 0 : 99;

    sections.balances.contextMenuOptions = {
      cancelButtonIndex: 1,
      destructiveButtonIndex,
      onPressActionSheet: onToggleShowShitcoins,
      options: [
        `${lang.t(`account.${showShitcoins ? 'hide' : 'show'}`)} ${lang.t('wallet.assets.no_price')}`,
        lang.t('wallet.action.cancel'),
      ],
    };
  }

  const filteredSections = filterWalletSections(sections);
  const isEmpty = !filteredSections.length;

  // Save wallet empty status to state
  setIsWalletEmpty(isEmpty);

  return {
    isEmpty,
    sections: filteredSections,
  };
};

export default createSelector(
  [
    allAssetsSelector,
    allAssetsCountSelector,
    assetsSelector,
    assetsTotalSelector,
    fetchingAssetsSelector,
    fetchingUniqueTokensSelector,
    onToggleShowShitcoinsSelector,
    setIsWalletEmptySelector,
    shitcoinsCountSelector,
    showShitcoinsSelector,
    uniqueTokensSelector,
  ],
  buildWalletSections,
);
