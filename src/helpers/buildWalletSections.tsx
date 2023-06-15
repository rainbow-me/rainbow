import React from 'react';
import { createSelector } from 'reselect';
import { buildBriefCoinsList, buildBriefUniqueTokenList } from './assets';
import { add, convertAmountToNativeDisplay } from './utilities';
import { Network } from '.';
import { getNetworkObj } from '@/networks';

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
const hiddenCoinsSelector = (state: any) => state.hiddenCoins;
const isCoinListEditedSelector = (state: any) => state.isCoinListEdited;
const isLoadingAssetsSelector = (state: any) => state.isLoadingAssets;
const isReadOnlyWalletSelector = (state: any) => state.isReadOnlyWallet;
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

const buildBriefWalletSections = (
  balanceSectionData: any,
  savings: any,
  uniqueTokenFamiliesSection: any,
  uniswapSection: any
) => {
  const { balanceSection, isEmpty } = balanceSectionData;
  const sections = [
    balanceSection,
    savings,
    uniswapSection,
    uniqueTokenFamiliesSection,
  ];

  const filteredSections = sections
    .filter(section => section.length !== 0)
    .flat(1);

  return {
    briefSectionsData: filteredSections,
    isEmpty,
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

  if (
    pools.length > 0 &&
    getNetworkObj(network).features.pools &&
    !isLoadingAssets
  ) {
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
    hiddenCoins
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
    ...(!hasTokens && !isLoadingAssets
      ? []
      : [
          {
            type: 'PROFILE_BALANCE_ROW',
            uid: 'profile-balance',
            value: totalValue,
          },
          {
            type: 'PROFILE_BALANCE_ROW_SPACE_AFTER',
            uid: 'profile-balance-space-after',
          },
        ]),
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

  if (hasTokens) {
    content = briefAssets;
  } else if (isLoadingAssets) {
    content = CONTENT_PLACEHOLDER;
  } else if (hasNFTsOnly) {
    content = ONLY_NFTS_CONTENT;
  } else if (isEmpty) {
    content = EMPTY_WALLET_CONTENT;
  }

  return {
    balanceSection: [...header, ...content],
    isEmpty,
  };
};

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

const briefBalanceSavingsSectionSelector = createSelector(
  [
    savingsSelector,
    isLoadingAssetsSelector,
    networkSelector,
    uniqueTokensSelector,
  ],
  withBriefBalanceSavingsSection
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

export const buildBriefWalletSectionsSelector = createSelector(
  [
    briefBalanceSectionSelector,
    briefBalanceSavingsSectionSelector,
    briefUniqueTokenDataSelector,
    briefUniswapSectionSelector,
  ],
  buildBriefWalletSections
);
