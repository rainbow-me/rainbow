import { createSelector } from 'reselect';
import { buildBriefCoinsList, buildBriefUniqueTokenList } from './assets';
import { add, convertAmountToNativeDisplay } from './utilities';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';
import { queryClient } from '@/react-query';
import { positionsQueryKey } from '@/resources/defi/PositionsQuery';
import store from '@/redux/store';
import { PositionExtraData } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { getExperimetalFlag, DEFI_POSITIONS } from '@/config/experimental';
import { RainbowPositions } from '@/resources/defi/types';

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
const isLoadingUserAssetsSelector = (state: any) => state.isLoadingUserAssets;
const isReadOnlyWalletSelector = (state: any) => state.isReadOnlyWallet;
const nativeCurrencySelector = (state: any) => state.nativeCurrency;
const pinnedCoinsSelector = (state: any) => state.pinnedCoins;
const sellingTokensSelector = (state: any) => state.sellingTokens;
const showcaseTokensSelector = (state: any) => state.showcaseTokens;
const hiddenTokensSelector = (state: any) => state.hiddenTokens;
const uniqueTokensSelector = (state: any) => state.uniqueTokens;
const listTypeSelector = (state: any) => state.listType;

const buildBriefWalletSections = (balanceSectionData: any, uniqueTokenFamiliesSection: any) => {
  const { balanceSection, isEmpty, isLoadingUserAssets } = balanceSectionData;
  const positionSection = withPositionsSection(isLoadingUserAssets);
  const sections = [balanceSection, positionSection, uniqueTokenFamiliesSection];

  const filteredSections = sections.filter(section => section.length !== 0).flat(1);

  return {
    briefSectionsData: filteredSections,
    isEmpty,
  };
};

const withPositionsSection = (isLoadingUserAssets: boolean) => {
  // check if the feature is enabled
  const positionsEnabled = getExperimetalFlag(DEFI_POSITIONS);
  if (!positionsEnabled) return [];

  const { accountAddress: address, nativeCurrency: currency } = store.getState().settings;
  const positionsObj: RainbowPositions | undefined = queryClient.getQueryData(positionsQueryKey({ address, currency }));

  const result: PositionExtraData[] = [];
  const sortedPositions = positionsObj?.positions?.sort((a, b) => (a.totals.totals.amount > b.totals.totals.amount ? -1 : 1));
  sortedPositions?.forEach((position, index) => {
    const listData = {
      type: 'POSITION',
      uniqueId: position.type,
      uid: `position-${position.type}`,
      index,
    };
    result.push(listData);
  });
  if (result.length && !isLoadingUserAssets) {
    const res = [
      {
        type: 'POSITIONS_SPACE_BEFORE',
        uid: 'positions-header-space-before',
      },
      {
        type: 'POSITIONS_HEADER',
        uid: 'positions-header',
        total: positionsObj?.totals.total.display,
      },
      ...result,
    ];

    return res;
  }
  return [];
};

const withBriefBalanceSection = (
  sortedAssets: ParsedAddressAsset[],
  isLoadingUserAssets: boolean,
  nativeCurrency: NativeCurrencyKey,
  isCoinListEdited: boolean,
  pinnedCoins: any,
  hiddenCoins: any,
  collectibles: any,
  nftSort: string
) => {
  const { briefAssets, totalBalancesValue } = buildBriefCoinsList(sortedAssets, nativeCurrency, isCoinListEdited, pinnedCoins, hiddenCoins);

  const { accountAddress: address } = store.getState().settings;
  const positionsObj: RainbowPositions | undefined = queryClient.getQueryData(positionsQueryKey({ address, currency: nativeCurrency }));

  const positionsTotal = positionsObj?.totals?.total?.amount || '0';

  const totalBalanceWithPositionsValue = add(totalBalancesValue, positionsTotal);

  const totalValue = convertAmountToNativeDisplay(totalBalanceWithPositionsValue, nativeCurrency);

  const hasTokens = briefAssets?.length;
  const hasNFTs = collectibles?.length;

  const isEmpty = !hasTokens && !hasNFTs;
  const hasNFTsOnly = !hasTokens && hasNFTs;

  const header = [
    {
      type: 'PROFILE_STICKY_HEADER',
      uid: 'assets-profile-header-compact',
      value: totalValue,
      isLoadingUserAssets,
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
    ...(!hasTokens && !isLoadingUserAssets
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
  } else if (isLoadingUserAssets) {
    content = CONTENT_PLACEHOLDER;
  } else if (hasNFTsOnly) {
    content = ONLY_NFTS_CONTENT;
  } else if (isEmpty) {
    content = EMPTY_WALLET_CONTENT;
  }

  return {
    balanceSection: [
      ...header,
      {
        type: 'REMOTE_CARD_CAROUSEL',
        uid: 'remote-card-carousel',
      },
      ...content,
    ],
    isLoadingUserAssets,
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
    (state: any, nftSort: string) => nftSort,
  ],
  buildBriefUniqueTokenList
);

const briefBalanceSectionSelector = createSelector(
  [
    sortedAssetsSelector,
    isLoadingUserAssetsSelector,
    nativeCurrencySelector,
    isCoinListEditedSelector,
    pinnedCoinsSelector,
    hiddenCoinsSelector,
    uniqueTokensSelector,
  ],
  withBriefBalanceSection
);

export const buildBriefWalletSectionsSelector = createSelector(
  [briefBalanceSectionSelector, (state: any, nftSort: string) => briefUniqueTokenDataSelector(state, nftSort)],
  buildBriefWalletSections
);
