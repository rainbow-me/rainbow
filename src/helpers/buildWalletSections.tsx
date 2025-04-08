import { createSelector } from 'reselect';
import { buildBriefCoinsList, buildBriefUniqueTokenList } from './assets';
import { NativeCurrencyKey, ParsedAddressAsset, UniqueAsset } from '@/entities';
import { CellType, CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { DEFI_POSITIONS, CLAIMABLES } from '@/config/experimental';
import { RainbowPositions } from '@/resources/defi/types';
import { RainbowConfig } from '@/model/remoteConfig';
import { UniqueId } from '@/__swaps__/types/assets';
import { Language } from '@/languages';
import { Network } from '@/state/backendNetworks/types';
import { NftCollectionSortCriterion } from '@/graphql/__generated__/arc';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { useExperimentalConfig } from '@/config/experimentalHooks';
import { ClaimablesStore } from '@/state/claimables/claimables';
import { AssetListType } from '@/components/asset-list/RecyclerAssetList2';
import { UniqueAssetFamily } from '@/entities/uniqueAssets';

const CONTENT_PLACEHOLDER: CellTypes[] = [
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-1' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-2' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-3' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-4' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-5' },
];

const EMPTY_WALLET_CONTENT: CellTypes[] = [
  {
    type: CellType.RECEIVE_CARD,
    uid: 'receive_card',
  },
  { type: CellType.EMPTY_WALLET_SPACER, uid: 'empty-wallet-spacer-1' },
  { type: CellType.ETH_CARD, uid: 'eth-card' },
  { type: CellType.EMPTY_WALLET_SPACER, uid: 'empty-wallet-spacer-2' },
  {
    type: CellType.LEARN_CARD,
    uid: 'learn-card',
  },
  { type: CellType.BIG_EMPTY_WALLET_SPACER, uid: 'big-empty-wallet-spacer-2' },
  {
    type: CellType.DISCOVER_MORE_BUTTON,
    uid: 'discover-home-button',
  },
];

const ONLY_NFTS_CONTENT: CellTypes[] = [{ type: CellType.ETH_CARD, uid: 'eth-card' }];

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
  listType?: AssetListType;
  language: Language;
  network: Network;
  nativeCurrency: NativeCurrencyKey;
  pinnedCoins: BooleanMap;
  sellingTokens?: UniqueAsset[];
  remoteConfig: RainbowConfig;
  experimentalConfig: ReturnType<typeof useExperimentalConfig>;
  showcaseTokens: string[];
  uniqueTokens: UniqueAsset[];
  isFetchingNfts: boolean;
  positions: RainbowPositions | null;
  claimables: ClaimablesStore | null;
  nftSort: NftCollectionSortCriterion;
  remoteCards: string[];
  uniqueTokenFamilies: UniqueAssetFamily[];
};

const sortedAssetsSelector = (state: WalletSectionsState) => state.sortedAssets;
const accountBalanceDisplaySelector = (state: WalletSectionsState) => state.accountBalanceDisplay;
const hiddenAssetsSelector = (state: WalletSectionsState) => state.hiddenAssets;
const isCoinListEditedSelector = (state: WalletSectionsState) => state.isCoinListEdited;
const isLoadingUserAssetsSelector = (state: WalletSectionsState) => state.isLoadingUserAssets;
const isLoadingBalanceSelector = (state: WalletSectionsState) => state.isLoadingBalance;
const isReadOnlyWalletSelector = (state: WalletSectionsState) => state.isReadOnlyWallet;
const nativeCurrencySelector = (state: WalletSectionsState) => state.nativeCurrency;
const pinnedCoinsSelector = (state: WalletSectionsState) => state.pinnedCoins;
const sellingTokensSelector = (state: WalletSectionsState) => state.sellingTokens;
const showcaseTokensSelector = (state: WalletSectionsState) => state.showcaseTokens;
const hiddenTokensSelector = (state: WalletSectionsState) => state.hiddenTokens;
const uniqueTokensSelector = (state: WalletSectionsState) => state.uniqueTokens;
const isFetchingNftsSelector = (state: WalletSectionsState) => state.isFetchingNfts;
const listTypeSelector = (state: WalletSectionsState) => state.listType;
const positionsSelector = (state: WalletSectionsState) => state.positions;
const claimablesSelector = (state: WalletSectionsState) => state.claimables;
const nftSortSelector = (state: WalletSectionsState) => state.nftSort;
const remoteCardsSelector = (state: WalletSectionsState) => state.remoteCards;
const uniqueTokenFamiliesSelector = (state: WalletSectionsState) => state.uniqueTokenFamilies;

interface BalanceSectionData {
  balanceSection: CellTypes[];
  isEmpty: boolean;
  isLoadingUserAssets: boolean;
}

interface BriefWalletSectionsResult {
  briefSectionsData: CellTypes[];
  isEmpty: boolean;
}

interface BalanceSectionResult {
  balanceSection: CellTypes[];
  isLoadingUserAssets: boolean;
  isEmpty: boolean;
}

export interface BriefCoinsListResult {
  briefAssets: CellTypes[];
  totalBalancesValue: string | number;
}

const buildBriefWalletSections = (
  balanceSectionData: BalanceSectionData,
  uniqueTokenFamiliesSection: CellTypes[],
  claimables: ClaimablesStore | null,
  positions: RainbowPositions | null
): BriefWalletSectionsResult => {
  const { isEmpty, balanceSection, isLoadingUserAssets } = balanceSectionData;

  const positionsSection = withPositionsSection(positions, isLoadingUserAssets);
  const claimablesSection = withClaimablesSection(claimables, isLoadingUserAssets);

  return {
    briefSectionsData: [...balanceSection, ...claimablesSection, ...positionsSection, ...uniqueTokenFamiliesSection],
    isEmpty,
  };
};

const withPositionsSection = (positions: RainbowPositions | null, isLoadingUserAssets: boolean): CellTypes[] => {
  if (isLoadingUserAssets || !DEFI_POSITIONS || !positions?.positions || Object.keys(positions.positions).length === 0) return [];

  const positionSectionItems: CellTypes[] = Object.values(positions.positions).map((position, index) => {
    return {
      type: CellType.POSITION,
      position,
      uid: `position-${position.type}`,
      index,
    };
  });

  return [
    {
      type: CellType.POSITIONS_SPACE_BEFORE,
      uid: 'positions-spacer-before',
    },
    {
      type: CellType.POSITIONS_HEADER,
      uid: 'positions-header',
      total: positions.totals?.total?.display,
    },
    ...positionSectionItems,
  ];
};

const withClaimablesSection = (claimables: ClaimablesStore | null, isLoadingUserAssets: boolean): CellTypes[] => {
  if (isLoadingUserAssets || !CLAIMABLES || !claimables?.claimables?.length) return [];

  const claimableSectionItems: CellTypes[] = claimables.claimables.map(claimable => {
    return {
      type: CellType.CLAIMABLE,
      claimable,
      uid: `claimable-${claimable.uniqueId}`,
    };
  });

  return [
    {
      type: CellType.CLAIMABLES_SPACE_BEFORE,
      uid: 'claimables-spacer-before',
    },
    {
      type: CellType.CLAIMABLES_HEADER,
      uid: 'claimables-header',
      total: claimables.totalValue,
    },
    {
      type: CellType.CLAIMABLES_SPACE_AFTER,
      uid: 'claimables-spacer-after',
    },
    ...claimableSectionItems,
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
  collectibles: UniqueAsset[],
  remoteCards: string[]
): BalanceSectionResult => {
  const { briefAssets } = buildBriefCoinsList(sortedAssets, nativeCurrency, isCoinListEdited, pinnedCoins, hiddenAssets);

  const hasTokens = briefAssets?.length;
  const hasNFTs = collectibles?.length;

  const isEmpty = !hasTokens && !hasNFTs;
  const hasNFTsOnly = !hasTokens && hasNFTs;

  let balanceSection: CellTypes[] = [];
  if (hasTokens && !isLoadingBalance) {
    balanceSection = [
      {
        type: CellType.PROFILE_BALANCE_ROW,
        uid: 'profile-balance',
        value: accountBalanceDisplay,
        isLoadingBalance,
      },
      {
        type: CellType.PROFILE_BALANCE_ROW_SPACE_AFTER,
        uid: 'profile-balance-space-after',
      },
    ];
  }

  let spacer: CellTypes[] = [];
  if (!hasTokens) {
    spacer = [
      {
        type: CellType.BIG_EMPTY_WALLET_SPACER,
        uid: 'big-empty-wallet-spacer-1',
      },
    ];
  } else {
    spacer = [
      {
        type: CellType.PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER,
        uid: 'profile-action-buttons-space-after',
        value: accountBalanceDisplay,
      },
    ];
  }

  const header: CellTypes[] = [
    {
      type: CellType.PROFILE_STICKY_HEADER,
      uid: 'assets-profile-header-compact',
    },
    {
      type: CellType.PROFILE_AVATAR_ROW_SPACE_BEFORE,
      uid: 'profile-avatar-space-before',
    },
    {
      type: CellType.PROFILE_AVATAR_ROW,
      uid: 'profile-avatar',
    },
    {
      type: CellType.PROFILE_AVATAR_ROW_SPACE_AFTER,
      uid: 'profile-avatar-space-after',
    },
    {
      type: CellType.PROFILE_NAME_ROW,
      uid: 'profile-name',
    },
    {
      type: CellType.PROFILE_NAME_ROW_SPACE_AFTER,
      uid: 'profile-name-space-after',
    },
    ...balanceSection,
    {
      type: CellType.PROFILE_ACTION_BUTTONS_ROW,
      uid: 'profile-action-buttons',
      value: accountBalanceDisplay,
    },
    ...spacer,
  ];

  let content: CellTypes[] = CONTENT_PLACEHOLDER;

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
        type: CellType.REMOTE_CARD_CAROUSEL,
        uid: 'remote-card-carousel',
      },
      ...content,
    ];
  } else {
    content = [
      {
        type: CellType.EMPTY_REMOTE_CARD_CAROUSEL,
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
    uniqueTokenFamiliesSelector,
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
    remoteCardsSelector,
  ],
  withBriefBalanceSection
);

export const buildBriefWalletSectionsSelector = createSelector(
  [briefBalanceSectionSelector, briefUniqueTokenDataSelector, claimablesSelector, positionsSelector],
  buildBriefWalletSections
);
