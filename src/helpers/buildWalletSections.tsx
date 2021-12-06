import lang from 'i18n-js';
import {
  compact,
  find,
  flattenDeep,
  get,
  groupBy,
  map,
  property,
} from 'lodash';
import React from 'react';
import { LayoutAnimation } from 'react-native';
import { createSelector } from 'reselect';
import { AssetListItemSkeleton } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import { UniswapInvestmentRow } from '../components/investment-cards';
import { CollectibleTokenFamily } from '../components/token-family';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/Navigation' was resolved to ... Remove this comment to see the full error message
import { withNavigation } from '../navigation/Navigation';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../utils/recompactAdapters' was resolved t... Remove this comment to see the full error message
import { compose, withHandlers } from '../utils/recompactAdapters';
import { buildCoinsList, buildUniqueTokenList } from './assets';
import networkTypes from './networkTypes';
import { add, convertAmountToNativeDisplay, multiply } from './utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/editOptions'... Remove this comment to see the full error message
import { setIsCoinListEdited } from '@rainbow-me/redux/editOptions';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/openStateSet... Remove this comment to see the full error message
import { setOpenSmallBalances } from '@rainbow-me/redux/openStateSettings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import store from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

const allAssetsSelector = (state: any) => state.allAssets;
const allAssetsCountSelector = (state: any) => state.allAssetsCount;
const assetsTotalSelector = (state: any) => state.assetsTotal;
const currentActionSelector = (state: any) => state.currentAction;
const hiddenCoinsSelector = (state: any) => state.hiddenCoins;
const isBalancesSectionEmptySelector = (state: any) =>
  state.isBalancesSectionEmpty;
const isCoinListEditedSelector = (state: any) => state.isCoinListEdited;
const isLoadingAssetsSelector = (state: any) => state.isLoadingAssets;
const languageSelector = (state: any) => state.language;
const networkSelector = (state: any) => state.network;
const nativeCurrencySelector = (state: any) => state.nativeCurrency;
const pinnedCoinsSelector = (state: any) => state.pinnedCoins;
const savingsSelector = (state: any) => state.savings;
const showcaseTokensSelector = (state: any) => state.showcaseTokens;
const uniqueTokensSelector = (state: any) => state.uniqueTokens;
const uniswapSelector = (state: any) => state.uniswap;
const uniswapTotalSelector = (state: any) => state.uniswapTotal;

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }: any) => (item: any, params: any) => {
      navigation.navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: item,
        type: assetType,
        ...params,
      });
    },
  })
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);

const balancesSkeletonRenderItem = (item: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <AssetListItemSkeleton animated descendingOpacity={false} {...item} />
);

const balancesRenderItem = (item: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <TokenItem {...item} assetType="token" />
);

export const tokenFamilyItem = (item: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <CollectibleTokenFamily {...item} uniqueId={item.uniqueId} />
);
const uniswapRenderItem = (item: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <UniswapInvestmentRow {...item} assetType="uniswap" isCollapsible />
);

const filterWalletSections = (sections: any) =>
  sections.filter(({ data, header }: any) =>
    data ? get(header, 'totalItems') : true
  );

const buildWalletSections = (
  balanceSection: any,
  uniqueTokenFamiliesSection: any,
  uniswapSection: any
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
  language: any,
  nativeCurrency: any,
  uniswap: any,
  uniswapTotal: any
) => {
  return {
    data: uniswap,
    header: {
      title: 'Pools',
      totalItems: uniswap.length,
      totalValue: convertAmountToNativeDisplay(uniswapTotal, nativeCurrency),
    },
    name: 'pools',
    pools: true,
    renderItem: uniswapRenderItem,
  };
};

const withBalanceSavingsSection = (savings: any) => {
  let totalUnderlyingNativeValue = '0';
  const savingsAssets = map(savings, asset => {
    const {
      lifetimeSupplyInterestAccrued,
      underlyingBalanceNativeValue,
      underlyingPrice,
    } = asset;
    totalUnderlyingNativeValue = add(
      totalUnderlyingNativeValue,
      underlyingBalanceNativeValue || 0
    );
    const lifetimeSupplyInterestAccruedNative = lifetimeSupplyInterestAccrued
      ? multiply(lifetimeSupplyInterestAccrued, underlyingPrice)
      : 0;

    return {
      ...asset,
      lifetimeSupplyInterestAccruedNative,
      underlyingBalanceNativeValue,
    };
  });

  const savingsSection = {
    assets: savingsAssets,
    savingsContainer: true,
    totalValue: totalUnderlyingNativeValue,
  };
  return savingsSection;
};

const coinEditContextMenu = (
  allAssets: any,
  balanceSectionData: any,
  isCoinListEdited: any,
  currentAction: any,
  isLoadingAssets: any,
  allAssetsCount: any,
  totalValue: any,
  addedEth: any
) => {
  const noSmallBalances = !find(balanceSectionData, 'smallBalancesContainer');

  return {
    contextMenuOptions:
      allAssets.length > 0 && noSmallBalances
        ? {
            cancelButtonIndex: 0,
            dynamicOptions: () => {
              return ['Cancel', 'Edit'];
            },
            onPressActionSheet: async (index: any) => {
              if (index === 1) {
                store.dispatch(setIsCoinListEdited(!isCoinListEdited));
                store.dispatch(setOpenSmallBalances(true));
                LayoutAnimation.configureNext(
                  LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
                );
              }
            },
          }
        : undefined,
    title: null,
    totalItems: isLoadingAssets ? 1 : (addedEth ? 1 : 0) + allAssetsCount,
    totalValue: totalValue,
  };
};

const withBalanceSection = (
  allAssets: any,
  allAssetsCount: any,
  assetsTotal: any,
  savingsSection: any,
  isBalancesSectionEmpty: any,
  isLoadingAssets: any,
  language: any,
  nativeCurrency: any,
  network: any,
  isCoinListEdited: any,
  pinnedCoins: any,
  hiddenCoins: any,
  currentAction: any,
  uniswapTotal: any,
  collectibles: any
) => {
  const { addedEth, assets, totalBalancesValue } = buildCoinsList(
    allAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins,
    true,
    !collectibles.length
  );
  let balanceSectionData = [...assets];

  const totalBalanceWithSavingsValue = add(
    totalBalancesValue,
    get(savingsSection, 'totalValue', 0)
  );
  const totalBalanceWithAllSectionValues = add(
    totalBalanceWithSavingsValue,
    uniswapTotal
  );

  const totalValue = convertAmountToNativeDisplay(
    totalBalanceWithAllSectionValues,
    nativeCurrency
  );

  if (networkTypes.mainnet === network) {
    balanceSectionData.push(savingsSection);
  }

  if (isLoadingAssets) {
    balanceSectionData = [{ item: { uniqueId: 'skeleton0' } }];
  }

  return {
    balances: true,
    data: balanceSectionData,
    header: coinEditContextMenu(
      allAssets,
      balanceSectionData,
      isCoinListEdited,
      currentAction,
      isLoadingAssets,
      allAssetsCount,
      totalValue,
      addedEth
    ),
    name: 'balances',
    renderItem: isLoadingAssets
      ? balancesSkeletonRenderItem
      : balancesRenderItem,
  };
};

let isPreloadComplete = false;
const largeFamilyThreshold = 4;
const jumboFamilyThreshold = largeFamilyThreshold * 2;
const minTopFoldThreshold = 10;

const buildImagesToPreloadArray = (family: any, index: any, families: any) => {
  const isLargeFamily = family.tokens.length > largeFamilyThreshold;
  const isJumboFamily = family.tokens.length >= jumboFamilyThreshold;
  const isTopFold = index < Math.max(families.length / 2, minTopFoldThreshold);

  return family.tokens.map((token: any, rowIndex: any) => {
    let priority = ImgixImage.priority[isTopFold ? 'high' : 'normal'];

    if (isTopFold && isLargeFamily) {
      if (rowIndex <= largeFamilyThreshold) {
        priority = ImgixImage.priority.high;
      } else if (isJumboFamily) {
        const isMedium =
          rowIndex > largeFamilyThreshold && rowIndex <= jumboFamilyThreshold;
        priority = ImgixImage.priority[isMedium ? 'normal' : 'low'];
      } else {
        priority = ImgixImage.priority.normal;
      }
    }

    const images = token.map(({ image_preview_url, uniqueId }: any) => {
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

const sortImagesToPreload = (images: any) => {
  const filtered = compact(flattenDeep(images));
  const grouped = groupBy(filtered, property('priority'));
  return [
    ...get(grouped, 'high', []),
    ...get(grouped, 'normal', []),
    ...get(grouped, 'low', []),
  ];
};

const withUniqueTokenFamiliesSection = (
  language: any,
  uniqueTokens: any,
  data: any
) => {
  // TODO preload elsewhere?
  if (!isPreloadComplete) {
    const imagesToPreload = sortImagesToPreload(
      data.map(buildImagesToPreloadArray)
    );
    isPreloadComplete = !!imagesToPreload.length;
    ImgixImage.preload(imagesToPreload, 200);
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
  [uniqueTokensSelector, showcaseTokensSelector],
  buildUniqueTokenList
);

const balanceSavingsSectionSelector = createSelector(
  [savingsSelector],
  withBalanceSavingsSection
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

const balanceSectionSelector = createSelector(
  [
    allAssetsSelector,
    allAssetsCountSelector,
    assetsTotalSelector,
    balanceSavingsSectionSelector,
    isBalancesSectionEmptySelector,
    isLoadingAssetsSelector,
    languageSelector,
    nativeCurrencySelector,
    networkSelector,
    isCoinListEditedSelector,
    pinnedCoinsSelector,
    hiddenCoinsSelector,
    currentActionSelector,
    uniswapTotalSelector,
    uniqueTokensSelector,
  ],
  withBalanceSection
);

const uniqueTokenFamiliesSelector = createSelector(
  [languageSelector, uniqueTokensSelector, uniqueTokenDataSelector],
  withUniqueTokenFamiliesSection
);

export const buildWalletSectionsSelector = createSelector(
  [balanceSectionSelector, uniqueTokenFamiliesSelector, uniswapSectionSelector],
  buildWalletSections
);
