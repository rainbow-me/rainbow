import { createSelector } from 'reselect';
import { buildBriefCoinsList, buildBriefUniqueTokenList } from './assets';
import { NativeCurrencyKey, ParsedAddressAsset } from '@/entities';
import { ClaimableExtraData, PositionExtraData } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { DEFI_POSITIONS, CLAIMABLES } from '@/config/experimental';
import { RainbowPositions } from '@/resources/defi/types';
import { RainbowConfig } from '@/model/remoteConfig';
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

export interface CoinListItem extends BaseWalletSectionItem {
  type: string;
  defaultToEditButton?: unknown;
  value?: unknown;
  uniqueId?: unknown;
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
  | { type: string; uid: string; [key: string]: unknown };

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
  remoteCards: string[];
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
const remoteCardsSelector = (state: WalletSectionsState): string[] => state.remoteCards;
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
  positions: RainbowPositions | null,
  claimables: ClaimablesStore | null
): BriefWalletSectionsResult => {
  const { isEmpty, balanceSection, isLoadingUserAssets } = balanceSectionData;

  const positionsSection = withPositionsSection(positions, isLoadingUserAssets);
  const claimablesSection = withClaimablesSection(claimables, isLoadingUserAssets);

  return {
    briefSectionsData: [...balanceSection, ...positionsSection, ...claimablesSection, ...uniqueTokenFamiliesSection],
    isEmpty,
  };
};

const withPositionsSection = (positions: RainbowPositions | null, isLoadingUserAssets: boolean): WalletSectionItem[] => {
  if (isLoadingUserAssets) return [];
  if (!DEFI_POSITIONS) return [];
  if (!positions) return [];

  const positionItems = positions.positions || [];
  if (!positionItems.length) return [];

  // Convert positions to wallet section items
  const positionSectionItems: PositionExtraData[] = positionItems.map((position, index) => {
    // Extract type from position to avoid duplicate property
    const { type, ...rest } = position;
    return {
      type: 'POSITION',
      uniqueId: type,
      uid: `position-${type}`,
      index,
      positionType: type, // Save original type under different name
      ...rest,
    };
  });

  return [
    {
      type: 'POSITIONS_SPACE_BEFORE',
      uid: 'positions-spacer-before',
    },
    {
      type: 'POSITIONS_HEADER',
      uid: 'positions-header',
      total: positions.totals?.total?.display,
    },
    ...positionSectionItems,
  ];
};

const withClaimablesSection = (claimables: ClaimablesStore | null, isLoadingUserAssets: boolean): WalletSectionItem[] => {
  if (isLoadingUserAssets) return [];
  if (!CLAIMABLES) return [];
  if (!claimables) return [];

  const claimableItems = claimables.claimables || [];
  if (!claimableItems.length) return [];

  // Convert claimables to wallet section items
  const claimableSectionItems: ClaimableExtraData[] = claimableItems.map(claimable => {
    // Extract type and uniqueId from claimable to avoid duplicate properties
    const { type, uniqueId, ...rest } = claimable;
    // Generate a fallback ID if uniqueId doesn't exist
    const generatedId = uniqueId || `claimable-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return {
      type: 'CLAIMABLE',
      uniqueId: generatedId,
      uid: `claimable-${generatedId}`,
      claimableType: type, // Save original type under different name if needed
      ...rest,
    };
  });

  return [
    {
      type: 'CLAIMABLES_SPACE_BEFORE',
      uid: 'claimables-spacer-before',
    },
    {
      type: 'CLAIMABLES_HEADER',
      uid: 'claimables-header',
      total: claimables.totalValue,
    },
    ...claimableSectionItems,
    {
      type: 'CLAIMABLES_SPACE_AFTER',
      uid: 'claimables-spacer-after',
    },
  ];
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
  collectibles: ReturnType<typeof useUniqueTokens>['uniqueTokens'],
  remoteCards: string[]
): BalanceSectionResult => {
  const { briefAssets } = buildBriefCoinsList(sortedAssets, nativeCurrency, isCoinListEdited, pinnedCoins, hiddenAssets);

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

  if (remoteCards.length) {
    content = [
      {
        type: 'REMOTE_CARD_CAROUSEL',
        uid: 'remote-card-carousel',
      },
      ...content,
    ];
  } else {
    content = [
      {
        type: 'EMPTY_REMOTE_CARD_CAROUSEL',
        uid: 'empty-remote-card-carousel',
      },
      ...content,
    ];
  }

  const result = {
    balanceSection: [...header, ...content],
    isLoadingUserAssets,
    isEmpty,
  };

  return result;
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
    remoteCardsSelector,
  ],
  withBriefBalanceSection
);

export const buildBriefWalletSectionsSelector = createSelector(
  [briefBalanceSectionSelector, briefUniqueTokenDataSelector, positionsSelector, claimablesSelector],
  buildBriefWalletSections
);
