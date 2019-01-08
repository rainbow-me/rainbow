import lang from 'i18n-js';
import { get } from 'lodash';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import { BalanceCoinRow } from '../components/coin-row';
import { UniqueTokenRow } from '../components/unique-token';
import { buildUniqueTokenList } from '../helpers/assets';

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => (name) =>
      navigation.navigate('ExpandedAssetScreen', {
        name,
        type: assetType,
      }),
  }),
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);
const UniqueTokenItem = enhanceRenderItem(UniqueTokenRow);

const balancesRenderItem = item => <TokenItem {...item} assetType="token" />;
const collectiblesRenderItem = item => <UniqueTokenItem {...item} assetType="unique_token" />;

export default ({
  allAssets,
  allAssetsCount,
  assets,
  assetsTotal,
  onToggleShowShitcoins,
  shitcoinsCount,
  showShitcoins,
  uniqueTokens,
}) => {
  const sections = {
    balances: {
      data: showShitcoins ? allAssets : assets,
      renderItem: balancesRenderItem,
      title: lang.t('account.tab_balances'),
      totalItems: get(assetsTotal, 'amount') ? allAssetsCount : 0,
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
      onPress: onToggleShowShitcoins,
      options: [
        `${lang.t(`account.${showShitcoins ? 'hide' : 'show'}`)} ${lang.t('wallet.assets.no_price')}`,
        lang.t('wallet.action.cancel'),
      ],
    };
  }

  const filteredSections = Object.values(sections).filter(({ totalItems }) => totalItems);

  return {
    isEmpty: !filteredSections.length,
    sections: filteredSections,
  };
};
