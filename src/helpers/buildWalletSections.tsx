import lang from 'i18n-js';
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
import Routes from '@/navigation/routesNames';

const CONTENT_PLACEHOLDER = [
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-1' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-2' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-3' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-4' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-5' },
];

const EMPTY_WALLET_CONTENT = [
  {
    type: 'RECEIVE_CARD',
    uid: 'receive_card',
  },
  { type: 'EMPTY_WALLET_SPACER', uid: 'empty-wallet-spacer-1' },
  { type: 'ETH_CARD', uid: 'eth-card' },
  { type: 'EMPTY_WALLET_SPACER', uid: 'empty-wallet-spacer-2' },
  {
    type: 'LEARN_CARD',
    uid: 'learn-card',
  },
  { type: 'BIG_EMPTY_WALLET_SPACER', uid: 'big-empty-wallet-spacer-2' },
  {
    type: 'DISCOVER_MORE_BUTTON',
    uid: 'discover-home-button',
  },
];

const ONLY_NFTS_CONTENT = [{ type: 'ETH_CARD', uid: 'eth-card' }];

const sortedAssetsSelector = (state: any) => state.sortedAssets;
const sortedAssetsCountSelector = (state: any) => state.sortedAssetsCount;
const assetsTotalSelector = (state: any) => state.assetsTotal;
const hiddenCoinsSelector = (state: any) => state.hiddenCoins;
const isBalancesSectionEmptySelector = (state: any) =>
  state.isBalancesSectionEmpty;
const isCoinListEditedSelector = (state: any) => state.isCoinListEdited;
const isLoadingAssetsSelector = (state: any) => state.isLoadingAssets;
const isReadOnlyWalletSelector = (state: any) => state.isReadOnlyWallet;
const languageSelector = (state: any) => state.language;
const networkSelector = (state: any) => state.network;
const nativeCurrencySelector = (state: any) => state.nativeCurrency;
const pinnedCoinsSelector = (state: any) => state.pinnedCoins;
const savingsSelector = (state: any) => state.savings;
const sellingTokensSelector = (state: any) => state.sellingTokens;
const showcaseTokensSelector = (state: any) => state.showcaseTokens;
const hiddenTokensSelector = (state: any) => state.hiddenTokens;
const uniqueTokensSelector = (state: any) => state.uniqueTokens;
const uniswapSelector = (state: any) => state.uniswap;
const uniswapTotalSelector = (state: any) => state.uniswapTotal;
const listTypeSelector = (state: any) => state.listType;

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
  <AssetListItemSkeleton animated descendingOpacity={false} {...item} />
);

const balancesRenderItem = (item: any) => (
  <TokenItem {...item} assetType="token" />
);

export const tokenFamilyItem = (item: any) => (
  <CollectibleTokenFamily {...item} uniqueId={item.uniqueId} />
);
const uniswapRenderItem = (item: any) => (
  <UniswapInvestmentRow {...item} assetType="uniswap" isCollapsible />
);

const filterWalletSections = (sections: any) =>
  sections.filter(({ data, header }: any) =>
    data ? header?.totalItems : true
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

const buildBriefWalletSections = (
  balanceSection: any,
  savings: any,
  uniqueTokenFamiliesSection: any,
  uniswapSection: any
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
  language: any,
  nativeCurrency: any,
  uniswap: any,
  uniswapTotal: any,
  network: any
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
  uniswap: any,
  uniswapTotal: any,
  nativeCurrency: any,
  network: any,
  isLoadingAssets: any
) => {
  const pools = uniswap.map((pool: any) => ({
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

const withBalanceSavingsSection = (savings: any[], network: any) => {
  let totalUnderlyingNativeValue = '0';
  const savingsAssets = savings.map(asset => {
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

const withBriefBalanceSavingsSection = (
  savings: any,
  isLoadingAssets: any,
  network: any
) => {
  let totalUnderlyingNativeValue = '0';
  for (const saving of savings) {
    const { underlyingBalanceNativeValue } = saving;
    totalUnderlyingNativeValue = add(
      totalUnderlyingNativeValue,
      underlyingBalanceNativeValue || 0
    );
  }
  const addresses = savings?.map((asset: any) => asset.cToken.address);

  if (network !== Network.mainnet) {
    return [];
  }

  if (isLoadingAssets || totalUnderlyingNativeValue === '0') return [];
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
    ...addresses.map((address: any) => ({
      address,
      type: 'SAVINGS',
      uid: 'savings-' + address,
    })),
  ];
};

const coinEditContextMenu = (
  sortedAssets: any,
  balanceSectionData: any,
  isCoinListEdited: any,
  isLoadingAssets: any,
  sortedAssetsCount: any,
  totalValue: any,
  addedEth: any
) => {
  const noSmallBalances = !balanceSectionData.find(
    ({ smallBalancesContainer }: any) => smallBalancesContainer
  );

  return {
    contextMenuOptions:
      sortedAssetsCount > 0 && noSmallBalances
        ? {
            cancelButtonIndex: 0,
            dynamicOptions: () => {
              return [lang.t('button.cancel'), lang.t('button.edit')];
            },
            onPressActionSheet: async (index: any) => {
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
  sortedAssets: any,
  sortedAssetsCount: any,
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
  uniswapTotal: any,
  collectibles: any
) => {
  const { addedEth, assets, totalBalancesValue } = buildCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins,
    true,
    isLoadingAssets
  );

  let balanceSectionData = [...assets];

  const totalBalanceWithSavingsValue = add(
    totalBalancesValue,
    savingsSection?.totalValue ?? 0
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
  sortedAssets: any,
  isLoadingAssets: any,
  nativeCurrency: any,
  isCoinListEdited: any,
  pinnedCoins: any,
  hiddenCoins: any,
  collectibles: any,
  savingsSection: any,
  uniswapTotal: any,
  uniqueTokens: any
) => {
  const { briefAssets, totalBalancesValue } = buildBriefCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenCoins,
    true,
    isLoadingAssets
  );

  const savingsTotalValue = savingsSection?.find(
    (item: any) => item.uid === 'savings-header'
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

  const hasTokens = briefAssets?.length;
  const hasNFTs = collectibles?.length;

  const isEmpty = !hasTokens && !hasNFTs;
  const hasNFTsOnly = !hasTokens && hasNFTs;

  const header = [
    {
      type: 'PROFILE_STICKY_HEADER',
      uid: 'assets-profile-header-compact',
      value: totalValue,
    },
    {
      type: 'PROFILE_AVATAR_ROW_SPACE_BEFORE',
      uid: 'profile-avatar-space-before',
    },
    {
      type: 'PROFILE_AVATAR_ROW',
      uid: 'profile-avatar',
    },
    {
      type: 'PROFILE_AVATAR_ROW_SPACE_AFTER',
      uid: 'profile-avatar-space-after',
    },
    {
      type: 'PROFILE_NAME_ROW',
      uid: 'profile-name',
    },
    {
      type: 'PROFILE_NAME_ROW_SPACE_AFTER',
      uid: 'profile-name-space-after',
    },
    ...(hasTokens
      ? [
          {
            type: 'PROFILE_BALANCE_ROW',
            uid: 'profile-balance',
            value: totalValue,
          },
          {
            type: 'PROFILE_BALANCE_ROW_SPACE_AFTER',
            uid: 'profile-balance-space-after',
          },
        ]
      : []),
    {
      type: 'PROFILE_ACTION_BUTTONS_ROW',
      uid: 'profile-action-buttons',
      value: totalValue,
    },
    hasTokens
      ? {
          type: 'PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER',
          uid: 'profile-action-buttons-space-after',
          value: totalValue,
        }
      : { type: 'BIG_EMPTY_WALLET_SPACER', uid: 'big-empty-wallet-spacer-1' },
  ];

  let content = CONTENT_PLACEHOLDER;

  if (isLoadingAssets) {
    content = CONTENT_PLACEHOLDER;
  } else if (hasTokens) {
    content = briefAssets;
  } else if (hasNFTsOnly) {
    content = ONLY_NFTS_CONTENT;
  } else if (isEmpty) {
    content = EMPTY_WALLET_CONTENT;
  }

  return [...header, ...content];
};

const withUniqueTokenFamiliesSection = (uniqueTokens: any, data: any) => {
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
  [
    uniqueTokensSelector,
    showcaseTokensSelector,
    sellingTokensSelector,
    hiddenTokensSelector,
    listTypeSelector,
    isReadOnlyWalletSelector,
  ],
  buildBriefUniqueTokenList
);

const balanceSavingsSectionSelector = createSelector(
  [savingsSelector, networkSelector],
  withBalanceSavingsSection
);

const briefBalanceSavingsSectionSelector = createSelector(
  [
    savingsSelector,
    isLoadingAssetsSelector,
    networkSelector,
    uniqueTokensSelector,
  ],
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
