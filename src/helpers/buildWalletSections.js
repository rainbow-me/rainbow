import lang from 'i18n-js';
import {
  compact,
  flattenDeep,
  get,
  groupBy,
  isEmpty,
  map,
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
import { CollectibleTokenFamily } from '../components/token-family';
import { chartExpandedAvailable } from '../config/experimental';
import {
  add,
  multiply,
  convertAmountToNativeDisplay,
} from '../helpers/utilities';
import { ethereumUtils } from '../utils';
import { buildUniqueTokenList, buildCoinsList } from './assets';
import networkTypes from './networkTypes';

const allAssetsCountSelector = state => state.allAssetsCount;
const allAssetsSelector = state => state.allAssets;
const assetsTotalSelector = state => state.assetsTotal;
const savingsSelector = state => state.savings;
const isBalancesSectionEmptySelector = state => state.isBalancesSectionEmpty;
const isWalletEthZeroSelector = state => state.isWalletEthZero;
const languageSelector = state => state.language;
const networkSelector = state => state.network;
const nativeCurrencySelector = state => state.nativeCurrency;
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
  <CollectibleTokenFamily {...item} uniqueId={item.uniqueId} />
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
  uniqueTokenFamiliesSection,
  uniswapSection
) => {
  const sections = [balanceSection, uniswapSection, uniqueTokenFamiliesSection];

  const filteredSections = filterWalletSections(sections);
  const isEmpty = !filteredSections.length;

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

const withEthPrice = allAssets => {
  const ethAsset = ethereumUtils.getAsset(allAssets);
  return get(ethAsset, 'native.price.amount', null);
};

const withBalanceSavingsSection = (savings, priceOfEther) => {
  let savingsAssets = savings;
  let totalUnderlyingNativeValue = 0;
  if (priceOfEther) {
    savingsAssets = map(savings, asset => {
      const {
        supplyBalanceUnderlying,
        underlyingPrice,
        lifetimeSupplyInterestAccrued,
      } = asset;
      const underlyingNativePrice = multiply(underlyingPrice, priceOfEther);
      const underlyingBalanceNativeValue = supplyBalanceUnderlying
        ? multiply(supplyBalanceUnderlying, underlyingNativePrice)
        : 0;
      totalUnderlyingNativeValue = add(
        totalUnderlyingNativeValue,
        underlyingBalanceNativeValue
      );
      const lifetimeSupplyInterestAccruedNative = lifetimeSupplyInterestAccrued
        ? multiply(lifetimeSupplyInterestAccrued, underlyingNativePrice)
        : 0;

      return {
        ...asset,
        lifetimeSupplyInterestAccruedNative,
        underlyingBalanceNativeValue,
      };
    });
  }

  const savingsSection = {
    assets: savingsAssets,
    savingsContainer: true,
    totalValue: totalUnderlyingNativeValue,
  };
  return savingsSection;
};

const withBalanceSection = (
  allAssets,
  allAssetsCount,
  assetsTotal,
  savingsSection,
  isBalancesSectionEmpty,
  isWalletEthZero,
  language,
  nativeCurrency,
  network
) => {
  const totalSavingsValue = !isEmpty(savingsSection)
    ? savingsSection.totalValue
    : 0;
  const totalAssetsValue = get(assetsTotal, 'amount', 0);
  const totalBalancesValue = add(totalAssetsValue, totalSavingsValue);
  const totalValue = convertAmountToNativeDisplay(
    totalBalancesValue,
    nativeCurrency
  );

  let balanceSectionData = [...buildCoinsList(allAssets, nativeCurrency)];

  if (networkTypes.mainnet === network) {
    balanceSectionData.push(savingsSection);
  }

  const isLoadingBalances = !isWalletEthZero && isBalancesSectionEmpty;
  if (isLoadingBalances) {
    balanceSectionData = [{ item: { uniqueId: 'skeleton0' } }];
  }

  return {
    balances: true,
    data: balanceSectionData,
    header: {
      title: lang.t('account.tab_balances'),
      totalItems: isLoadingBalances ? 1 : allAssetsCount,
      totalValue: totalValue,
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

const ethPriceSelector = createSelector([allAssetsSelector], withEthPrice);

const balanceSavingsSectionSelector = createSelector(
  [savingsSelector, ethPriceSelector],
  withBalanceSavingsSection
);

const balanceSectionSelector = createSelector(
  [
    allAssetsSelector,
    allAssetsCountSelector,
    assetsTotalSelector,
    balanceSavingsSectionSelector,
    isBalancesSectionEmptySelector,
    isWalletEthZeroSelector,
    languageSelector,
    nativeCurrencySelector,
    networkSelector,
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

export const buildWalletSectionsSelector = createSelector(
  [balanceSectionSelector, uniqueTokenFamiliesSelector, uniswapSectionSelector],
  buildWalletSections
);
