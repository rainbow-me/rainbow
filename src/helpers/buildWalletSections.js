import lang from 'i18n-js';
import { compact, flattenDeep, get, groupBy, map, property } from 'lodash';
import React from 'react';
import { LayoutAnimation } from 'react-native';
import FastImage from 'react-native-fast-image';
import { compose, withHandlers } from 'recompact';
import { createSelector } from 'reselect';
import { AssetListItemSkeleton } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import { UniswapInvestmentRow } from '../components/investment-cards';
import { CollectibleTokenFamily } from '../components/token-family';
import EditOptions from '../helpers/editOptionTypes';
import { withNavigation } from '../navigation/Navigation';
import {
  setHiddenCoins,
  setIsCoinListEdited,
  setPinnedCoins,
} from '../redux/editOptions';
import { setOpenSmallBalances } from '../redux/openStateSettings';
import store from '../redux/store';
import {
  amountOfShowedCoins,
  buildCoinsList,
  buildUniqueTokenList,
} from './assets';
import networkTypes from './networkTypes';
import { add, convertAmountToNativeDisplay, multiply } from './utilities';
import Routes from '@rainbow-me/routes';
import { ETH_ICON_URL, ethereumUtils } from '@rainbow-me/utils';

const allAssetsSelector = state => state.allAssets;
const allAssetsCountSelector = state => state.allAssetsCount;
const assetsTotalSelector = state => state.assetsTotal;
const currentActionSelector = state => state.currentAction;
const hiddenCoinsSelector = state => state.hiddenCoins;
const isBalancesSectionEmptySelector = state => state.isBalancesSectionEmpty;
const isCoinListEditedSelector = state => state.isCoinListEdited;
const isLoadingAssetsSelector = state => state.isLoadingAssets;
const languageSelector = state => state.language;
const networkSelector = state => state.network;
const nativeCurrencySelector = state => state.nativeCurrency;
const pinnedCoinsSelector = state => state.pinnedCoins;
const savingsSelector = state => state.savings;
const showcaseTokensSelector = state => state.showcaseTokens;
const uniqueTokensSelector = state => state.uniqueTokens;
const uniswapSelector = state => state.uniswap;
const uniswapTotalSelector = state => state.uniswapTotal;

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => (item, params) => {
      navigation.navigate(
        ios ? Routes.EXPANDED_ASSET_SHEET : Routes.EXPANDED_ASSET_SCREEN,
        {
          asset: item,
          type: assetType,
          ...params,
        }
      );
    },
  })
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);

const balancesSkeletonRenderItem = item => (
  <AssetListItemSkeleton animated descendingOpacity={false} {...item} />
);

const balancesRenderItem = item => <TokenItem {...item} assetType="token" />;

const tokenFamilyItem = item => (
  <CollectibleTokenFamily {...item} uniqueId={item.uniqueId} />
);
const uniswapRenderItem = item => (
  <UniswapInvestmentRow {...item} assetType="uniswap" isCollapsible />
);

const filterWalletSections = sections =>
  sections.filter(({ data, header }) =>
    data ? get(header, 'totalItems') : true
  );

const addEth = section => {
  const assets = store.getState().data.genericAssets;

  if (assets.eth) {
    const { relative_change_24h, value } = assets.eth.price;
    const zeroEthRow = {
      address: 'eth',
      balance: {
        amount: '0',
        display: '0 ETH',
      },
      color: '#29292E',
      decimals: 18,
      icon_url: ETH_ICON_URL,
      isCoin: true,
      isPinned: true,
      isPlaceholder: true,
      isSmall: false,
      name: 'Ethereum',
      native: {
        balance: {
          amount: '0',
          display: '0.00',
        },
        change: relative_change_24h ? `${relative_change_24h.toFixed(2)}%` : '',
        price: {
          amount: value,
          display: String(value),
        },
      },
      price: assets.eth.price,
      symbol: 'ETH',
      type: 'token',
      uniqueId: 'eth',
    };

    if (section.data.length === 1) {
      section.data.unshift(zeroEthRow);
    }
  }

  return section;
};

const buildWalletSections = (
  balanceSection,
  uniqueTokenFamiliesSection,
  uniswapSection
) => {
  const sections = [uniswapSection, uniqueTokenFamiliesSection];

  const filteredSections =
    filterWalletSections(sections).length > 0
      ? [addEth(balanceSection), ...filterWalletSections(sections)]
      : filterWalletSections([balanceSection]);
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

const withBalanceSavingsSection = savings => {
  const { genericAssets } = store.getState().data;
  const priceOfEther = ethereumUtils.getEthPriceUnit(genericAssets);

  let savingsAssets = savings;
  let totalUnderlyingNativeValue = '0';
  if (priceOfEther) {
    savingsAssets = map(savings, asset => {
      const {
        supplyBalanceUnderlying,
        underlyingPrice,
        lifetimeSupplyInterestAccrued,
      } = asset;
      const underlyingNativePrice =
        asset.underlying.symbol === 'ETH'
          ? priceOfEther
          : multiply(underlyingPrice, priceOfEther);
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

const coinEditContextMenu = (
  allAssets,
  balanceSectionData,
  isCoinListEdited,
  currentAction,
  isLoadingAssets,
  allAssetsCount,
  totalValue
) => {
  const noSmallBalances =
    !balanceSectionData.length ||
    !(
      balanceSectionData[balanceSectionData.length - 1]
        .smallBalancesContainer ||
      (balanceSectionData.length > 1 &&
        balanceSectionData[balanceSectionData.length - 2]
          .smallBalancesContainer)
    );
  return {
    contextMenuOptions:
      allAssets.length <= amountOfShowedCoins &&
      allAssets.length > 0 &&
      noSmallBalances
        ? {
            cancelButtonIndex: 0,
            dynamicOptions: () => {
              return isCoinListEdited && currentAction !== EditOptions.none
                ? [
                    'Cancel',
                    currentAction !== EditOptions.unpin ? 'Pin' : 'Unpin',
                    currentAction !== EditOptions.unhide ? 'Hide' : 'Unhide',
                    'Finish',
                  ]
                : ['Cancel', isCoinListEdited ? 'Finish' : 'Edit'];
            },
            onPressActionSheet: async index => {
              if (isCoinListEdited && currentAction !== EditOptions.none) {
                if (index === 3) {
                  store.dispatch(setIsCoinListEdited(!isCoinListEdited));
                } else if (index === 1) {
                  store.dispatch(setPinnedCoins());
                } else if (index === 2) {
                  store.dispatch(setHiddenCoins());
                  store.dispatch(setOpenSmallBalances(true));
                }
                LayoutAnimation.configureNext(
                  LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
                );
              } else {
                if (index === 1) {
                  store.dispatch(setIsCoinListEdited(!isCoinListEdited));
                  LayoutAnimation.configureNext(
                    LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
                  );
                }
              }
            },
          }
        : undefined,
    title: lang.t('account.tab_balances'),
    totalItems: isLoadingAssets ? 1 : allAssetsCount,
    totalValue: totalValue,
  };
};

const withBalanceSection = (
  allAssets,
  allAssetsCount,
  assetsTotal,
  savingsSection,
  isBalancesSectionEmpty,
  isLoadingAssets,
  language,
  nativeCurrency,
  network,
  isCoinListEdited,
  pinnedCoins,
  hiddenCoins,
  currentAction,
  uniswapTotal
) => {
  const { assets, totalBalancesValue } = buildCoinsList(
    allAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins,
    true
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
      totalValue
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
