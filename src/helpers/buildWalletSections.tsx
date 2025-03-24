import { createSelector } from 'reselect';
import { buildBriefCoinsList, buildBriefUniqueTokenList } from './assets';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';
import { ClaimableExtraData, PositionExtraData } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { DEFI_POSITIONS, CLAIMABLES } from '@/config/experimental';
import { RainbowPositions } from '@/resources/defi/types';
import { lessThan } from './utilities';
import { RainbowConfig } from '@/model/remoteConfig';
import { IS_TEST } from '@/env';
import { UniqueId } from '@/__swaps__/types/assets';
import { Language } from '@/languages';
import { Network } from '@/state/backendNetworks/types';
import useUniqueTokens from '@/hooks/useUniqueTokens';
import { NftCollectionSortCriterion } from '@/graphql/__generated__/arc';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { useExperimentalConfig } from '@/config/experimentalHooks';
import { ClaimablesStore } from '@/resources/addys/claimables/query';

export interface BaseWalletSectionItem {
  type: string;
  uid: string;
}

export interface LoadingAssetItem extends BaseWalletSectionItem {
  type: 'LOADING_ASSETS';
}

export interface EmptyWalletSpacerItem extends BaseWalletSectionItem {
  type: 'EMPTY_WALLET_SPACER';
}

export interface BigEmptyWalletSpacerItem extends BaseWalletSectionItem {
  type: 'BIG_EMPTY_WALLET_SPACER';
}

export interface ReceiveCardItem extends BaseWalletSectionItem {
  type: 'RECEIVE_CARD';
}

export interface EthCardItem extends BaseWalletSectionItem {
  type: 'ETH_CARD';
}

export interface LearnCardItem extends BaseWalletSectionItem {
  type: 'LEARN_CARD';
}

export interface DiscoverMoreButtonItem extends BaseWalletSectionItem {
  type: 'DISCOVER_MORE_BUTTON';
}

export interface ProfileStickyHeaderItem extends BaseWalletSectionItem {
  type: 'PROFILE_STICKY_HEADER';
}

export interface ProfileAvatarRowSpaceItem extends BaseWalletSectionItem {
  type: 'PROFILE_AVATAR_ROW_SPACE_BEFORE' | 'PROFILE_AVATAR_ROW_SPACE_AFTER';
}

export interface ProfileAvatarRowItem extends BaseWalletSectionItem {
  type: 'PROFILE_AVATAR_ROW';
}

export interface ProfileNameRowItem extends BaseWalletSectionItem {
  type: 'PROFILE_NAME_ROW';
}

export interface ProfileNameRowSpaceAfterItem extends BaseWalletSectionItem {
  type: 'PROFILE_NAME_ROW_SPACE_AFTER';
}

export interface ProfileBalanceRowItem extends BaseWalletSectionItem {
  type: 'PROFILE_BALANCE_ROW';
  value: string | undefined;
  isLoadingBalance: boolean;
}

export interface ProfileBalanceRowSpaceAfterItem extends BaseWalletSectionItem {
  type: 'PROFILE_BALANCE_ROW_SPACE_AFTER';
}

export interface ProfileActionButtonsRowItem extends BaseWalletSectionItem {
  type: 'PROFILE_ACTION_BUTTONS_ROW';
  value: string | undefined;
}

export interface ProfileActionButtonsRowSpaceAfterItem extends BaseWalletSectionItem {
  type: 'PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER';
  value: string | undefined;
}

export interface RemoteCardCarouselItem extends BaseWalletSectionItem {
  type: 'REMOTE_CARD_CAROUSEL';
}

export interface PositionsSpaceBeforeItem extends BaseWalletSectionItem {
  type: 'POSITIONS_SPACE_BEFORE';
}

export interface PositionsHeaderItem extends BaseWalletSectionItem {
  type: 'POSITIONS_HEADER';
  total: string | undefined;
}

export interface ClaimablesSpaceBeforeItem extends BaseWalletSectionItem {
  type: 'CLAIMABLES_SPACE_BEFORE';
}

export interface ClaimablesHeaderItem extends BaseWalletSectionItem {
  type: 'CLAIMABLES_HEADER';
  total: string | undefined;
}

export interface ClaimablesSpaceAfterItem extends BaseWalletSectionItem {
  type: 'CLAIMABLES_SPACE_AFTER';
}

export interface NftSortItem extends BaseWalletSectionItem {
  type: 'NFT_SORT';
  sort: NftCollectionSortCriterion;
}

// Add a more generic interface to handle coin list items
export interface CoinListItem extends BaseWalletSectionItem {
  type: string;
  defaultToEditButton?: any;
  value?: any;
  uniqueId?: any;
}

// Update the WalletSectionItem type union to include all possible types
export type WalletSectionItem =
  | LoadingAssetItem
  | EmptyWalletSpacerItem
  | BigEmptyWalletSpacerItem
  | ReceiveCardItem
  | EthCardItem
  | LearnCardItem
  | DiscoverMoreButtonItem
  | ProfileStickyHeaderItem
  | ProfileAvatarRowSpaceItem
  | ProfileAvatarRowItem
  | ProfileNameRowItem
  | ProfileNameRowSpaceAfterItem
  | ProfileBalanceRowItem
  | ProfileBalanceRowSpaceAfterItem
  | ProfileActionButtonsRowItem
  | ProfileActionButtonsRowSpaceAfterItem
  | RemoteCardCarouselItem
  | PositionsSpaceBeforeItem
  | PositionsHeaderItem
  | ClaimablesSpaceBeforeItem
  | ClaimablesHeaderItem
  | ClaimablesSpaceAfterItem
  | PositionExtraData
  | ClaimableExtraData
  | CoinListItem
  | NftSortItem
  | { type: string; uid: string; [key: string]: any }; // Fallback for any other items

const CONTENT_PLACEHOLDER: LoadingAssetItem[] = [
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-1' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-2' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-3' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-4' },
  { type: 'LOADING_ASSETS', uid: 'loadings-asset-5' },
];

const EMPTY_WALLET_CONTENT: WalletSectionItem[] = [
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

const ONLY_NFTS_CONTENT: EthCardItem[] = [{ type: 'ETH_CARD', uid: 'eth-card' }];

export type WalletSectionsState = {
  sortedAssets: ParsedAddressAsset[];
  accountBalanceDisplay: string | undefined;
  hiddenAssets: Set<UniqueId>;
  isCoinListEdited: boolean;
  isLoadingUserAssets: boolean;
  isLoadingBalance: boolean;
  isReadOnlyWallet: boolean;
  isWalletEthZero: boolean;
  hiddenTokens: string[];
  listType?: string;
  language: Language;
  network: Network;
  nativeCurrency: NativeCurrencyKey;
  pinnedCoins: BooleanMap;
  remoteConfig: RainbowConfig;
  experimentalConfig: ReturnType<typeof useExperimentalConfig>;
  showcaseTokens: string[];
  uniqueTokens: ReturnType<typeof useUniqueTokens>['uniqueTokens'];
  isFetchingNfts: boolean;
  sendableUniqueTokens: ReturnType<typeof useUniqueTokens>['sendableUniqueTokens'];
  positions: RainbowPositions | null;
  claimables: ClaimablesStore | null;
  nftSort: NftCollectionSortCriterion;
};

const sortedAssetsSelector = (state: WalletSectionsState): ParsedAddressAsset[] => state.sortedAssets;
const accountBalanceDisplaySelector = (state: WalletSectionsState): string | undefined => state.accountBalanceDisplay;
const hiddenAssetsSelector = (state: WalletSectionsState): Set<UniqueId> => state.hiddenAssets;
const isCoinListEditedSelector = (state: WalletSectionsState): boolean => state.isCoinListEdited;
const isLoadingUserAssetsSelector = (state: WalletSectionsState): boolean => state.isLoadingUserAssets;
const isLoadingBalanceSelector = (state: WalletSectionsState): boolean => state.isLoadingBalance;
const isReadOnlyWalletSelector = (state: WalletSectionsState): boolean => state.isReadOnlyWallet;
const nativeCurrencySelector = (state: WalletSectionsState): NativeCurrencyKey => state.nativeCurrency;
const pinnedCoinsSelector = (state: WalletSectionsState): BooleanMap => state.pinnedCoins;
const showcaseTokensSelector = (state: WalletSectionsState): string[] => state.showcaseTokens;
const hiddenTokensSelector = (state: WalletSectionsState): string[] => state.hiddenTokens;
const uniqueTokensSelector = (state: WalletSectionsState): ReturnType<typeof useUniqueTokens>['uniqueTokens'] => state.uniqueTokens;
const isFetchingNftsSelector = (state: WalletSectionsState): boolean => state.isFetchingNfts;
const listTypeSelector = (state: WalletSectionsState): string | undefined => state.listType;
const remoteConfigSelector = (state: WalletSectionsState): RainbowConfig => state.remoteConfig;
const experimentalConfigSelector = (state: WalletSectionsState): ReturnType<typeof useExperimentalConfig> => state.experimentalConfig;
const positionsSelector = (state: WalletSectionsState): RainbowPositions | null => state.positions;
const claimablesSelector = (state: WalletSectionsState): ClaimablesStore | null => state.claimables;
const nftSortSelector = (state: WalletSectionsState): NftCollectionSortCriterion => state.nftSort;
interface BalanceSectionData {
  balanceSection: WalletSectionItem[];
  isEmpty: boolean;
  isLoadingUserAssets: boolean;
}

interface BriefWalletSectionsResult {
  briefSectionsData: WalletSectionItem[];
  isEmpty: boolean;
}

interface BalanceSectionResult {
  balanceSection: WalletSectionItem[];
  isLoadingUserAssets: boolean;
  isEmpty: boolean;
}

// Update the BriefCoinsListResult interface to match the actual return type
export interface BriefCoinsListResult {
  briefAssets: WalletSectionItem[];
  totalBalancesValue: string | number; // Changed from totalBalanceChange to match actual return
}

const buildBriefWalletSections = (
  balanceSectionData: BalanceSectionData,
  uniqueTokenFamiliesSection: WalletSectionItem[],
  remoteConfig: RainbowConfig,
  experimentalConfig: ReturnType<typeof useExperimentalConfig>,
  positions: RainbowPositions | null,
  claimables: ClaimablesStore | null
): BriefWalletSectionsResult => {
  const { balanceSection, isEmpty, isLoadingUserAssets } = balanceSectionData;

  const positionsEnabled = experimentalConfig[DEFI_POSITIONS] && !IS_TEST;
  const claimablesEnabled = (remoteConfig.claimables || experimentalConfig[CLAIMABLES]) && !IS_TEST;

  const positionSection = positionsEnabled ? withPositionsSection(positions, isLoadingUserAssets) : [];
  const claimablesSection = claimablesEnabled ? withClaimablesSection(claimables, isLoadingUserAssets) : [];
  const sections = [balanceSection, claimablesSection, positionSection, uniqueTokenFamiliesSection];

  const filteredSections = sections.filter(section => section.length !== 0).flat(1);

  return {
    briefSectionsData: filteredSections,
    isEmpty,
  };
};

const withPositionsSection = (positions: RainbowPositions | null, isLoadingUserAssets: boolean): WalletSectionItem[] => {
  const result: PositionExtraData[] = [];
  const sortedPositions = positions?.positions?.sort((a, b) => {
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
    const res: WalletSectionItem[] = [
      {
        type: 'POSITIONS_SPACE_BEFORE',
        uid: 'positions-header-space-before',
      },
      {
        type: 'POSITIONS_HEADER',
        uid: 'positions-header',
        total: positions?.totals.total.display,
      },
      ...result,
    ];

    return res;
  }
  return [];
};

const withClaimablesSection = (claimables: ClaimablesStore | null, isLoadingUserAssets: boolean): WalletSectionItem[] => {
  const result: ClaimableExtraData[] = [];

  claimables?.claimables.forEach(claimable => {
    const listData = {
      type: 'CLAIMABLE',
      uniqueId: claimable.uniqueId,
      uid: `claimable-${claimable.uniqueId}`,
    };
    result.push(listData);
  });
  if (result.length && !isLoadingUserAssets) {
    const res: WalletSectionItem[] = [
      {
        type: 'CLAIMABLES_SPACE_BEFORE',
        uid: 'claimables-header-space-before',
      },
      {
        type: 'CLAIMABLES_HEADER',
        uid: 'claimables-header',
        total: claimables?.totalValue,
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
  pinnedCoins: BooleanMap,
  hiddenAssets: Set<UniqueId>,
  collectibles: ReturnType<typeof useUniqueTokens>['uniqueTokens']
): BalanceSectionResult => {
  const { briefAssets } = buildBriefCoinsList(
    sortedAssets,
    nativeCurrency,
    isCoinListEdited,
    pinnedCoins,
    hiddenAssets
  ) as BriefCoinsListResult;

  const hasTokens = briefAssets?.length;
  const hasNFTs = collectibles?.length;

  const isEmpty = !hasTokens && !hasNFTs;
  const hasNFTsOnly = !hasTokens && hasNFTs;

  const header: WalletSectionItem[] = [
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
          } as ProfileBalanceRowItem,
          {
            type: 'PROFILE_BALANCE_ROW_SPACE_AFTER',
            uid: 'profile-balance-space-after',
          } as ProfileBalanceRowSpaceAfterItem,
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

  let content: WalletSectionItem[] = CONTENT_PLACEHOLDER;

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
      } as RemoteCardCarouselItem,
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
    briefUniqueTokenDataSelector,
    remoteConfigSelector,
    experimentalConfigSelector,
    positionsSelector,
    claimablesSelector,
  ],
  buildBriefWalletSections
);
