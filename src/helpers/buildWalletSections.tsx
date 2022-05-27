import lang from 'i18n-js';
import { compact, flattenDeep, get, groupBy, map, property } from 'lodash';
import React from 'react';
import { LayoutAnimation } from 'react-native';
import { createSelector } from 'reselect';
import { AssetListItemSkeleton } from '../components/asset-list';
import { BalanceCoinRow } from '../components/coin-row';
import { UniswapInvestmentRow } from '../components/investment-cards';
import { CollectibleTokenFamily } from '../components/token-family';
import { withNavigation } from '../navigation/Navigation';
import { compose, withHandlers } from '../utils/recompactAdapters';
import {
  buildBriefCoinsList,
  buildBriefUniqueTokenList,
  buildCoinsList,
  buildUniqueTokenList,
} from './assets';
import networkTypes from './networkTypes';
import { add, convertAmountToNativeDisplay, multiply } from './utilities';
import { Network } from '.';
import { ImgixImage } from '@rainbow-me/images';
import Routes from '@rainbow-me/routes';

const LOADING_ASSETS_PLACEHOLDER = [
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-1' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-2' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-3' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-4' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-5' },
];

const sortedAssetsSelector = state => state.sortedAssets;
const sortedAssetsCountSelector = state => state.sortedAssetsCount;
const assetsTotalSelector = state => state.assetsTotal;
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
      navigation.navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: item,
        type: assetType,
        ...params,
      });
    },
  })
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);

const balancesSkeletonRenderItem = item => (
  <AssetListItemSkeleton animated descendingOpacity={false} {...item} />
);

const balancesRenderItem = item => <TokenItem {...item} assetType="token" />;

export const tokenFamilyItem = item => (
  <CollectibleTokenFamily {...item} uniqueId={item.uniqueId} />
);
const uniswapRenderItem = item => (
  <UniswapInvestmentRow {...item} assetType="uniswap" isCollapsible />
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

const buildBriefWalletSections = (
  balanceSection,
  savings,
  uniqueTokenFamiliesSection,
  uniswapSection
) => {
  const sections = [
    balanceSection,
    savings,
    uniswapSection,
    uniqueTokenFamiliesSection,
  ];

  const filteredSections = sections
    .filter(section => section.length !== 0)
    .flat(1);
  return filteredSections;
};

const withUniswapSection = (
  language,
  nativeCurrency,
  uniswap,
  uniswapTotal,
  network
) => {
  if (network !== Network.mainnet) {
    return [];
  }
  return {
    data: uniswap,
    header: {
      title: lang.t('account.tab_investments'),
      totalItems: uniswap.length,
      totalValue: convertAmountToNativeDisplay(uniswapTotal, nativeCurrency),
    },
    name: 'pools',
    pools: true,
    renderItem: uniswapRenderItem,
  };
};

const withBriefUniswapSection = (
  uniswap,
  uniswapTotal,
  nativeCurrency,
  network,
  isLoadingAssets
) => {
  const pools = uniswap.map(pool => ({
    address: pool.address,
    type: 'UNISWAP_POOL',
    uid: 'pool-' + pool.address,
  }));

  if (pools.length > 0 && network === Network.mainnet && !isLoadingAssets) {
    return [
      {
        type: 'POOLS_HEADER',
        uid: 'pools-header',
        value: convertAmountToNativeDisplay(uniswapTotal, nativeCurrency),
      },
      ...pools,
    ];
  }
  return [];
};

const withBalanceSavingsSection = (savings, network) => {
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

    if (network !== Network.mainnet) {
      return [];
    }

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

const withBriefBalanceSavingsSection = (savings, isLoadingAssets, network) => {
  let totalUnderlyingNativeValue = '0';
  for (let saving of savings) {
    const { underlyingBalanceNativeValue } = saving;
    totalUnderlyingNativeValue = add(
      totalUnderlyingNativeValue,
      underlyingBalanceNativeValue || 0
    );
  }
  const addresses = savings?.map(asset => asset.cToken.address);

  if (network !== Network.mainnet) {
    return [];
  }

  if (isLoadingAssets) return [];
  return [
    {
      type: 'SAVINGS_HEADER_SPACE_BEFORE',
      uid: 'savings-header-space-before',
    },
    {
      type: 'SAVINGS_HEADER',
      uid: 'savings-header',
      value: totalUnderlyingNativeValue,
    },
    ...addresses.map(address => ({
      address,
      type: 'SAVINGS',
      uid: 'savings-' + address,
    })),
  ];
};

const coinEditContextMenu = (
  sortedAssets,
  balanceSectionData,
  isCoinListEdited,
  isLoadingAssets,
  sortedAssetsCount,
  totalValue,
  addedEth
) => {
  const noSmallBalances = !balanceSectionData.find(
    ({ smallBalancesContainer }) => smallBalancesContainer
  );

  return {
    contextMenuOptions:
      sortedAssetsCount > 0 && noSmallBalances
        ? {
            cancelButtonIndex: 0,
            dynamicOptions: () => {
              return [lang.t('button.cancel'), lang.t('button.edit')];
            },
            onPressActionSheet: async index => {
              if (index === 1) {
                LayoutAnimation.configureNext(
                  LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
                );
              }
            },
          }
        : undefined,
    title: null,
    totalItems: isLoadingAssets ? 1 : (addedEth ? 1 : 0) + sortedAssetsCount,
    totalValue: totalValue,
  };
};

const withBalanceSection = (
  sortedAssets,
  sortedAssetsCount,
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
  uniswapTotal,
  collectibles
) => {
  const { addedEth, assets, totalBalancesValue } = buildCoinsList(
    sortedAssets,
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
      sortedAssets,
      balanceSectionData,
      isCoinListEdited,
      isLoadingAssets,
      sortedAssetsCount,
      totalValue,
      addedEth
    ),
    name: 'balances',
    renderItem: isLoadingAssets
      ? balancesSkeletonRenderItem
      : balancesRenderItem,
  };
};

const withBriefBalanceSection = (
  sortedAssets,
  isLoadingAssets,
  nativeCurrency,
  isCoinListEdited,
  pinnedCoins,
  hiddenCoins,
  collectibles,
  savingsSection,
  uniswapTotal
) => {
  const { briefAssets, totalBalancesValue } = buildBriefCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins,
    true,
    !collectibles.length
  );

  const savingsTotalValue = savingsSection?.find(
    item => item.uid === 'savings-header'
  );

  const totalBalanceWithSavingsValue = add(
    totalBalancesValue,
    savingsTotalValue?.value ?? 0
  );

  const totalBalanceWithAllSectionValues = add(
    totalBalanceWithSavingsValue,
    uniswapTotal
  );

  const totalValue = convertAmountToNativeDisplay(
    totalBalanceWithAllSectionValues,
    nativeCurrency
  );

  return [
    {
      type: 'ASSETS_HEADER',
      value: totalValue,
    },
    {
      type: 'ASSETS_HEADER_SPACE_AFTER',
      uid: 'assets-header-space-after',
    },
    ...(isLoadingAssets ? LOADING_ASSETS_PLACEHOLDER : briefAssets),
  ];
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

    const images = token.map(({ image_url, uniqueId }) => {
      if (!image_url) return null;
      return {
        id: uniqueId,
        priority,
        uri: image_url,
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

const withUniqueTokenFamiliesSection = (uniqueTokens, data) => {
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

const briefUniqueTokenDataSelector = createSelector(
  [uniqueTokensSelector, showcaseTokensSelector],
  buildBriefUniqueTokenList
);

const balanceSavingsSectionSelector = createSelector(
  [savingsSelector, networkSelector],
  withBalanceSavingsSection
);

const briefBalanceSavingsSectionSelector = createSelector(
  [savingsSelector, isLoadingAssetsSelector, networkSelector],
  withBriefBalanceSavingsSection
);

const uniswapSectionSelector = createSelector(
  [
    languageSelector,
    nativeCurrencySelector,
    uniswapSelector,
    uniswapTotalSelector,
    networkSelector,
  ],
  withUniswapSection
);

const briefUniswapSectionSelector = createSelector(
  [
    uniswapSelector,
    uniswapTotalSelector,
    nativeCurrencySelector,
    networkSelector,
    isLoadingAssetsSelector,
  ],
  withBriefUniswapSection
);

const balanceSectionSelector = createSelector(
  [
    sortedAssetsSelector,
    sortedAssetsCountSelector,
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
    uniswapTotalSelector,
    uniqueTokensSelector,
  ],
  withBalanceSection
);

const briefBalanceSectionSelector = createSelector(
  [
    sortedAssetsSelector,
    isLoadingAssetsSelector,
    nativeCurrencySelector,
    isCoinListEditedSelector,
    pinnedCoinsSelector,
    hiddenCoinsSelector,
    uniqueTokensSelector,
    briefBalanceSavingsSectionSelector,
    uniswapTotalSelector,
  ],
  withBriefBalanceSection
);

const uniqueTokenFamiliesSelector = createSelector(
  [uniqueTokensSelector, uniqueTokenDataSelector],
  withUniqueTokenFamiliesSection
);

export const buildWalletSectionsSelector = createSelector(
  [balanceSectionSelector, uniqueTokenFamiliesSelector, uniswapSectionSelector],
  buildWalletSections
);

export const buildBriefWalletSectionsSelector = createSelector(
  [
    briefBalanceSectionSelector,
    briefBalanceSavingsSectionSelector,
    briefUniqueTokenDataSelector,
    briefUniswapSectionSelector,
  ],
  buildBriefWalletSections
);
