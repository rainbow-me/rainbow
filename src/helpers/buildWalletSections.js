import lang from 'i18n-js';
import { compact, flattenDeep, get, groupBy, property } from 'lodash';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import { createSelector } from 'reselect';
import { AssetListItemSkeleton } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import { UniswapInvestmentCard } from '../components/investment-cards';
import { TokenFamilyWrap } from '../components/token-family';
import { buildUniqueTokenList, buildCoinsList } from './assets';
import { chartExpandedAvailable } from '../experimentalConfig';

const allAssetsSelector = state => state.allAssets;
const allAssetsCountSelector = state => state.allAssetsCount;
const assetsTotalSelector = state => state.assetsTotal;
const isBalancesSectionEmptySelector = state => state.isBalancesSectionEmpty;
const isWalletEthZeroSelector = state => state.isWalletEthZero;
const languageSelector = state => state.language;
const nativeCurrencySelector = state => state.nativeCurrency;
const setIsWalletEmptySelector = state => state.setIsWalletEmpty;
const uniqueTokensSelector = state => state.uniqueTokens;
const uniswapSelector = state => state.uniswap;
const uniswapTotalSelector = state => state.uniswapTotal;

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => item => {
      navigation.navigate('ExpandedAssetScreen', {
        asset: item,
        type: assetType,
      });
    },
    onPressSend: ({ navigation }) => asset => {
      navigation.navigate('SendSheet', { asset });
    },
  })
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);
const UniswapCardItem = enhanceRenderItem(UniswapInvestmentCard);

const balancesSkeletonRenderItem = item => (
  <AssetListItemSkeleton animated descendingOpacity={false} {...item} />
);
const balancesRenderItem = item => (
  <TokenItem
    {...item}
    assetType={item.item.price && chartExpandedAvailable ? 'chart' : 'token'}
  />
);
const tokenFamilyItem = item => (
  <TokenFamilyWrap {...item} uniqueId={item.uniqueId} />
);
const uniswapRenderItem = item => (
  <UniswapCardItem {...item} assetType="uniswap" isCollapsible />
);

const filterWalletSections = sections =>
  sections.filter(({ data, header }) =>
    data ? get(header, 'totalItems') : true
  );

const buildWalletSections = (
  balanceSection,
  setIsWalletEmpty,
  uniqueTokenFamiliesSection,
  uniswapSection
) => {
  const sections = [balanceSection, uniswapSection, uniqueTokenFamiliesSection];

  const filteredSections = filterWalletSections(sections);
  const isEmpty = !filteredSections.length;
  setIsWalletEmpty(isEmpty);

  return {
    isEmpty,
    sections: filteredSections,
  };
};

const withUniswapSection = (
  language,
  nativeCurrency,
  uniswap,
  uniswapTotal
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
  assetsTotal,
  isBalancesSectionEmpty,
  isWalletEthZero,
  language,
  nativeCurrency,
  showShitcoins
) => {
  let balanceSectionData = buildCoinsList(allAssets);
  const isLoadingBalances = !isWalletEthZero && isBalancesSectionEmpty;
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
        const isMedium =
          rowIndex > largeFamilyThreshold && rowIndex <= jumboFamilyThreshold;
        priority = FastImage.priority[isMedium ? 'normal' : 'low'];
      } else {
        priority = FastImage.priority.normal;
      }
    }

    const images = token.map(({ image_preview_url, uniqueId }) => {
      if (!image_preview_url) return null;
      return {
        id: uniqueId,
        priority,
        uri: image_preview_url,
      };
    });

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

const withUniqueTokenFamiliesSection = (language, uniqueTokens, data) => {
  // TODO preload elsewhere?
  if (!isPreloadComplete) {
    const imagesToPreload = sortImagesToPreload(
      data.map(buildImagesToPreloadArray)
    );
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
  buildUniqueTokenList
);

const balanceSectionSelector = createSelector(
  [
    allAssetsSelector,
    allAssetsCountSelector,
    assetsTotalSelector,
    isBalancesSectionEmptySelector,
    isWalletEthZeroSelector,
    languageSelector,
    nativeCurrencySelector,
  ],
  withBalanceSection
);

const uniswapSectionSelector = createSelector(
  [
    languageSelector,
    nativeCurrencySelector,
    uniswapSelector,
    uniswapTotalSelector,
  ],
  withUniswapSection
);

const uniqueTokenFamiliesSelector = createSelector(
  [languageSelector, uniqueTokensSelector, uniqueTokenDataSelector],
  withUniqueTokenFamiliesSection
);

export default createSelector(
  [
    balanceSectionSelector,
    setIsWalletEmptySelector,
    uniqueTokenFamiliesSelector,
    uniswapSectionSelector,
  ],
  buildWalletSections
);
