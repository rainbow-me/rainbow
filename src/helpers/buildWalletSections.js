import lang from 'i18n-js';
import { get } from 'lodash';
import { createSelector } from 'reselect';
import { buildUniqueTokenList } from './assets';

const allAssetsSelector = state => state.allAssets;
const allAssetsCountSelector = state => state.allAssetsCount;
const assetsSelector = state => state.assets;
const assetsTotalSelector = state => state.assetsTotal;
const fetchingAssetsSelector = state => state.fetchingAssets;
const fetchingUniqueTokensSelector = state => state.fetchingUniqueTokens;
const languageSelector = state => state.language;
const nativeCurrencySelector = state => state.nativeCurrency;
const onToggleShowShitcoinsSelector = state => state.onToggleShowShitcoins;
const setIsWalletEmptySelector = state => state.setIsWalletEmpty;
const shitcoinsCountSelector = state => state.shitcoinsCount;
const showShitcoinsSelector = state => state.showShitcoins;
const uniqueTokensSelector = state => state.uniqueTokens;

const filterWalletSections = sections => Object.values(sections).filter(({ totalItems }) => totalItems);

const buildWalletSections = (
  allAssets,
  allAssetsCount,
  assets,
  assetsTotal,
  fetchingAssets,
  fetchingUniqueTokens,
  language,
  nativeCurrency,
  onToggleShowShitcoins,
  setIsWalletEmpty,
  shitcoinsCount,
  showShitcoins,
  uniqueTokens,
) => {
  const sections = {
    balances: {
      data: showShitcoins ? allAssets : assets,
      title: lang.t('account.tab_balances'),
      totalItems: allAssetsCount,
      totalValue: get(assetsTotal, 'display', ''),
    },
    collectibles: {
      data: buildUniqueTokenList(uniqueTokens),
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
    languageSelector,
    nativeCurrencySelector,
    onToggleShowShitcoinsSelector,
    setIsWalletEmptySelector,
    shitcoinsCountSelector,
    showShitcoinsSelector,
    uniqueTokensSelector,
  ],
  buildWalletSections,
);
