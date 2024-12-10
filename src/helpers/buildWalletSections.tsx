import { createSelector } from 'reselect';
import { buildBriefCoinsList, buildBriefUniqueTokenList } from './assets';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';
import store from '@/redux/store';
import { ClaimableExtraData, PositionExtraData } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { DEFI_POSITIONS, CLAIMABLES, ExperimentalValue, ETH_REWARDS } from '@/config/experimental';
import { RainbowPositions } from '@/resources/defi/types';
import { Claimable } from '@/resources/addys/claimables/types';
import { add, convertAmountToNativeDisplay, greaterThan, lessThan } from './utilities';
import { RainbowConfig } from '@/model/remoteConfig';
import { IS_TEST } from '@/env';
import { UniqueId } from '@/__swaps__/types/assets';

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
const accountBalanceDisplaySelector = (state: any) => state.accountBalanceDisplay;
const hiddenAssetsSelector = (state: any) => state.hiddenAssets;
const isCoinListEditedSelector = (state: any) => state.isCoinListEdited;
const isLoadingUserAssetsSelector = (state: any) => state.isLoadingUserAssets;
const isLoadingBalanceSelector = (state: any) => state.isLoadingBalance;
const isReadOnlyWalletSelector = (state: any) => state.isReadOnlyWallet;
const nativeCurrencySelector = (state: any) => state.nativeCurrency;
const pinnedCoinsSelector = (state: any) => state.pinnedCoins;
const sellingTokensSelector = (state: any) => state.sellingTokens;
const showcaseTokensSelector = (state: any) => state.showcaseTokens;
const hiddenTokensSelector = (state: any) => state.hiddenTokens;
const uniqueTokensSelector = (state: any) => state.uniqueTokens;
const nftSortSelector = (state: any) => state.nftSort;
const isFetchingNftsSelector = (state: any) => state.isFetchingNfts;
const listTypeSelector = (state: any) => state.listType;
const remoteConfigSelector = (state: any) => state.remoteConfig;
const experimentalConfigSelector = (state: any) => state.experimentalConfig;
const positionsSelector = (state: any) => state.positions;
const claimablesSelector = (state: any) => state.claimables;
const claimableETHRewardsNativeAmountSelector = (state: any) => state.claimableETHRewardsNativeAmount;

const buildBriefWalletSections = (
  balanceSectionData: any,
  uniqueTokenFamiliesSection: any,
  remoteConfig: RainbowConfig,
  experimentalConfig: Record<string, ExperimentalValue>,
  positions: RainbowPositions | undefined,
  claimables: Claimable[] | undefined,
  claimableETHRewardsNativeAmount: string | undefined
) => {
  const { balanceSection, isEmpty, isLoadingUserAssets } = balanceSectionData;

  const positionsEnabled = experimentalConfig[DEFI_POSITIONS] && !IS_TEST;
  const claimablesEnabled = (remoteConfig.claimables || experimentalConfig[CLAIMABLES]) && !IS_TEST;
  const ethRewardsEnabled = (remoteConfig.rewards_enabled || experimentalConfig[ETH_REWARDS]) && !IS_TEST;

  const positionSection = positionsEnabled ? withPositionsSection(positions, isLoadingUserAssets) : [];
  const claimablesSection = claimablesEnabled
    ? withClaimablesSection(claimables, ethRewardsEnabled, claimableETHRewardsNativeAmount, isLoadingUserAssets)
    : [];
  const sections = [balanceSection, claimablesSection, positionSection, uniqueTokenFamiliesSection];

  const filteredSections = sections.filter(section => section.length !== 0).flat(1);

  return {
    briefSectionsData: filteredSections,
    isEmpty,
  };
};

const withPositionsSection = (positionsObj: RainbowPositions | undefined, isLoadingUserAssets: boolean) => {
  const result: PositionExtraData[] = [];
  const sortedPositions = positionsObj?.positions?.sort((a, b) => {
    return lessThan(b.totals.totals.amount, a.totals.totals.amount) ? -1 : 1;
  });

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

const withClaimablesSection = (
  claimables: Claimable[] | undefined,
  ethRewardsEnabled: boolean,
  claimableETHRewardsNativeAmount: string | undefined,
  isLoadingUserAssets: boolean
) => {
  const { nativeCurrency: currency } = store.getState().settings;

  const ethRewards = {
    value: { nativeAsset: { amount: claimableETHRewardsNativeAmount } },
    uniqueId: 'rainbow-eth-rewards',
  };

  let result: ClaimableExtraData[] = [];
  let totalNativeValue = '0';

  const sortedClaimables = [
    ...(claimables ?? []),
    ...(ethRewardsEnabled && claimableETHRewardsNativeAmount && claimableETHRewardsNativeAmount !== '0' ? [ethRewards] : []),
  ]?.sort((a, b) => (greaterThan(a.value.nativeAsset.amount ?? '0', b.value.nativeAsset.amount ?? '0') ? -1 : 1));

  sortedClaimables?.forEach(claimable => {
    totalNativeValue = add(totalNativeValue, claimable.value.nativeAsset.amount ?? '0');
    const listData = {
      type: 'CLAIMABLE',
      uniqueId: claimable.uniqueId,
      uid: `claimable-${claimable.uniqueId}`,
    };
    result.push(listData);
  });
  const totalNativeDisplay = convertAmountToNativeDisplay(totalNativeValue, currency);
  if (result.length && !isLoadingUserAssets) {
    const res = [
      {
        type: 'CLAIMABLES_SPACE_BEFORE',
        uid: 'claimables-header-space-before',
      },
      {
        type: 'CLAIMABLES_HEADER',
        uid: 'claimables-header',
        total: totalNativeDisplay,
      },
      {
        type: 'CLAIMABLES_SPACE_AFTER',
        uid: 'claimables-header-space-before',
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
  isLoadingBalance: boolean,
  accountBalanceDisplay: string | undefined,
  nativeCurrency: NativeCurrencyKey,
  isCoinListEdited: boolean,
  pinnedCoins: any,
  hiddenAssets: Set<UniqueId>,
  collectibles: any
) => {
  const { briefAssets } = buildBriefCoinsList(sortedAssets, nativeCurrency, isCoinListEdited, pinnedCoins, hiddenAssets);

  const hasTokens = briefAssets?.length;
  const hasNFTs = collectibles?.length;

  const isEmpty = !hasTokens && !hasNFTs;
  const hasNFTsOnly = !hasTokens && hasNFTs;

  const header = [
    {
      type: 'PROFILE_STICKY_HEADER',
      uid: 'assets-profile-header-compact',
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
    ...(!hasTokens && !isLoadingBalance
      ? []
      : [
          {
            type: 'PROFILE_BALANCE_ROW',
            uid: 'profile-balance',
            value: accountBalanceDisplay,
            isLoadingBalance,
          },
          {
            type: 'PROFILE_BALANCE_ROW_SPACE_AFTER',
            uid: 'profile-balance-space-after',
          },
        ]),
    {
      type: 'PROFILE_ACTION_BUTTONS_ROW',
      uid: 'profile-action-buttons',
      value: accountBalanceDisplay,
    },
    hasTokens
      ? {
          type: 'PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER',
          uid: 'profile-action-buttons-space-after',
          value: accountBalanceDisplay,
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
    nftSortSelector,
    isFetchingNftsSelector,
  ],
  buildBriefUniqueTokenList
);

const briefBalanceSectionSelector = createSelector(
  [
    sortedAssetsSelector,
    isLoadingUserAssetsSelector,
    isLoadingBalanceSelector,
    accountBalanceDisplaySelector,
    nativeCurrencySelector,
    isCoinListEditedSelector,
    pinnedCoinsSelector,
    hiddenAssetsSelector,
    uniqueTokensSelector,
  ],
  withBriefBalanceSection
);

export const buildBriefWalletSectionsSelector = createSelector(
  [
    briefBalanceSectionSelector,
    (state: any) => briefUniqueTokenDataSelector(state),
    remoteConfigSelector,
    experimentalConfigSelector,
    positionsSelector,
    claimablesSelector,
    claimableETHRewardsNativeAmountSelector,
  ],
  buildBriefWalletSections
);
