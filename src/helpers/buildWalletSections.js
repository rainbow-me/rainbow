import lang from 'i18n-js';
import {
  compact,
  findIndex,
  flattenDeep,
  get,
  groupBy,
  property,
} from 'lodash';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import { createSelector } from 'reselect';
import { AssetListItemSkeleton } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import { UniswapInvestmentCard } from '../components/investment-cards';
import { TokenFamilyWrap } from '../components/token-family';
import { buildUniqueTokenList } from './assets';

const allAssetsSelector = state => state.allAssets;
const allAssetsCountSelector = state => state.allAssetsCount;
const assetsSelector = state => state.assets;
const assetsTotalSelector = state => state.assetsTotal;
const isBalancesSectionEmptySelector = state => state.isBalancesSectionEmpty;
const isWalletEthZeroSelector = state => state.isWalletEthZero;
const languageSelector = state => state.language;
const nativeCurrencySelector = state => state.nativeCurrency;
const onToggleShowShitcoinsSelector = state => state.onToggleShowShitcoins;
const setIsWalletEmptySelector = state => state.setIsWalletEmpty;
const shitcoinsCountSelector = state => state.shitcoinsCount;
const showShitcoinsSelector = state => state.showShitcoins;
const uniqueTokensSelector = state => state.uniqueTokens;
const uniswapSelector = state => state.uniswap;
const uniswapTotalSelector = state => state.uniswapTotal;

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => (item) => {
      navigation.navigate('ExpandedAssetScreen', {
        asset: item,
        type: assetType,
      });
    },
    onPressSend: ({ navigation }) => (asset) => {
      navigation.navigate('SendSheet', { asset });
    },
  }),
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);
const UniswapCardItem = enhanceRenderItem(UniswapInvestmentCard);

const balancesSkeletonRenderItem = item => (
  <AssetListItemSkeleton
    animated={true}
    descendingOpacity={false}
    {...item}
  />
);
const balancesRenderItem = item => <TokenItem {...item} assetType="token" />;
const tokenFamilyItem = item => <TokenFamilyWrap {...item} uniqueId={item.uniqueId} />;
const uniswapRenderItem = item => <UniswapCardItem {...item} assetType="uniswap" />;

const filterWalletSections = sections => (
  sections.filter(({ data, header }) => (
    data
      ? get(header, 'totalItems')
      : true
  ))
);

const buildWalletSections = (
  balanceSection,
  language,
  nativeCurrency,
  onToggleShowShitcoins,
  setIsWalletEmpty,
  shitcoinsCount,
  showShitcoins,
  uniqueTokenFamiliesSection,
  uniswapSection,
) => {
  const sections = [
    balanceSection,
    uniswapSection,
    uniqueTokenFamiliesSection,
  ];

  if (shitcoinsCount) {
    // 99 is an arbitrarily high number used to disable the 'destructiveButton' option
    const destructiveButtonIndex = showShitcoins ? 0 : 99;

    const index = findIndex(sections, (section) => section.balances === true);
    if (index > -1) {
      sections[index].header.contextMenuOptions = {
        cancelButtonIndex: 1,
        destructiveButtonIndex,
        onPressActionSheet: onToggleShowShitcoins,
        options: [
          `${lang.t(`account.${showShitcoins ? 'hide' : 'show'}`)} ${lang.t('wallet.assets.no_price')}`,
          lang.t('wallet.action.cancel'),
        ],
      };
    }
  }
  const filteredSections = filterWalletSections(sections);
  const isEmpty = !filteredSections.length;
  setIsWalletEmpty(isEmpty);

  // console.log('filteredSections', filteredSections)

  return {
    isEmpty,
    sections: filteredSections,
  };
};

const withUniswapSection = (
  language,
  nativeCurrency,
  uniswap,
  uniswapTotal,
) => ({
  data: uniswap,
  header: {
    title: 'Investments',
    totalItems: uniswap.length,
    totalValue: uniswapTotal,
  },
  investments: true,
  name: 'investments',
  renderItem: uniswapRenderItem,
});

const withBalanceSection = (
  allAssets,
  allAssetsCount,
  assets,
  assetsTotal,
  isBalancesSectionEmpty,
  isWalletEthZero,
  language,
  nativeCurrency,
  showShitcoins,
) => {
  let balanceSectionData = showShitcoins ? allAssets : assets;
  const isLoadingBalances = (!isWalletEthZero && isBalancesSectionEmpty);
  if (isLoadingBalances) {
    balanceSectionData = [{ item: { uniqueId: 'skeleton0' } }];
  }

  return {
    balances: true,
    data: balanceSectionData,
    header: {
      showShitcoins,
      title: lang.t('account.tab_balances'),
      totalItems: isLoadingBalances ? 1 : allAssetsCount,
      totalValue: get(assetsTotal, 'display', ''),
    },
    name: 'balances',
    renderItem: isLoadingBalances
      ? balancesSkeletonRenderItem
      : balancesRenderItem,
  };
};

let isPreloadComplete = false;
const largeFamilyThreshold = 4;
const jumboFamilyThreshold = largeFamilyThreshold * 2;
const minTopFoldThreshold = 10;

const buildImagesToPreloadArray = (family, index, families) => {
  const isLargeFamily = family.tokens.length > largeFamilyThreshold;
  const isJumboFamily = family.tokens.length >= jumboFamilyThreshold;
  const isTopFold = index < Math.max(families.length / 2, minTopFoldThreshold);

  return family.tokens.map((token, rowIndex) => {
    let priority = FastImage.priority[isTopFold ? 'high' : 'normal'];

    if (isTopFold && isLargeFamily) {
      if (rowIndex <= largeFamilyThreshold) {
        priority = FastImage.priority.high;
      } else if (isJumboFamily) {
        const isMedium = (rowIndex > largeFamilyThreshold) && (rowIndex <= jumboFamilyThreshold);
        priority = FastImage.priority[isMedium ? 'normal' : 'low'];
      } else {
        priority = FastImage.priority.normal;
      }
    }

    /* eslint-disable camelcase */
    const images = token.map(({ image_preview_url, uniqueId }) => {
      if (!image_preview_url) return null;
      return ({
        id: uniqueId,
        priority,
        uri: image_preview_url,
      });
    });
    /* eslint-enable camelcase */

    return images.length ? images : null;
  });
};

const sortImagesToPreload = images => {
  const filtered = compact(flattenDeep(images));
  const grouped = groupBy(filtered, property('priority'));
  return [
    ...get(grouped, 'high', []),
    ...get(grouped, 'normal', []),
    ...get(grouped, 'low', []),
  ];
};

const withUniqueTokenFamiliesSection = (
  language,
  uniqueTokens,
  data,
) => {
  // TODO preload elsewhere?
  if (!isPreloadComplete) {
    const imagesToPreload = sortImagesToPreload(data.map(buildImagesToPreloadArray));
    isPreloadComplete = !!imagesToPreload.length;
    FastImage.preload(imagesToPreload);
  }

  return {
    collectibles: true,
    data,
    header: {
      title: lang.t('account.tab_collectibles'),
      totalItems: uniqueTokens.length,
      totalValue: '',
    },
    name: 'collectibles',
    renderItem: tokenFamilyItem,
    type: 'big',
  };
};

const uniqueTokenDataSelector = createSelector(
  [uniqueTokensSelector],
  buildUniqueTokenList,
);

const balanceSectionSelector = createSelector(
  [
    allAssetsSelector,
    allAssetsCountSelector,
    assetsSelector,
    assetsTotalSelector,
    isBalancesSectionEmptySelector,
    isWalletEthZeroSelector,
    languageSelector,
    nativeCurrencySelector,
    showShitcoinsSelector,
  ],
  withBalanceSection,
);

const uniswapSectionSelector = createSelector(
  [
    languageSelector,
    nativeCurrencySelector,
    uniswapSelector,
    uniswapTotalSelector,
  ],
  withUniswapSection,
);

const uniqueTokenFamiliesSelector = createSelector(
  [
    languageSelector,
    uniqueTokensSelector,
    uniqueTokenDataSelector,
  ],
  withUniqueTokenFamiliesSection,
);

export default createSelector(
  [
    balanceSectionSelector,
    languageSelector,
    nativeCurrencySelector,
    onToggleShowShitcoinsSelector,
    setIsWalletEmptySelector,
    shitcoinsCountSelector,
    showShitcoinsSelector,
    uniqueTokenFamiliesSelector,
    uniswapSectionSelector,
  ],
  buildWalletSections,
);
