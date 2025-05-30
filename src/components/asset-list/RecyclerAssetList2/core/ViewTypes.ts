import { RecyclerListView, RecyclerListViewProps } from 'recyclerlistview';
import { RecyclerListViewState } from 'recyclerlistview/dist/reactnative/core/RecyclerListView';
import { UniqueAsset } from '@/entities';
import { NftCollectionSortCriterion } from '@/graphql/__generated__/arc';
import { Claimable } from '@/resources/addys/claimables/types';
import { RainbowPosition } from '@/resources/defi/types';
export enum CellType {
  ASSETS_HEADER_SPACE_AFTER = 'ASSETS_HEADER_SPACE_AFTER',
  COIN = 'COIN',
  COIN_DIVIDER = 'COIN_DIVIDER',
  PROFILE_ACTION_BUTTONS_ROW = 'PROFILE_ACTION_BUTTONS_ROW',
  PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER = 'PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER',
  PROFILE_AVATAR_ROW = 'PROFILE_AVATAR_ROW',
  PROFILE_AVATAR_ROW_SPACE_BEFORE = 'PROFILE_AVATAR_ROW_SPACE_BEFORE',
  PROFILE_AVATAR_ROW_SPACE_AFTER = 'PROFILE_AVATAR_ROW_SPACE_AFTER',
  PROFILE_BALANCE_ROW = 'PROFILE_BALANCE_ROW',
  PROFILE_BALANCE_ROW_SPACE_AFTER = 'PROFILE_BALANCE_ROW_SPACE_AFTER',
  PROFILE_NAME_ROW = 'PROFILE_NAME_ROW',
  PROFILE_NAME_ROW_SPACE_AFTER = 'PROFILE_NAME_ROW_SPACE_AFTER',
  PROFILE_STICKY_HEADER = 'PROFILE_STICKY_HEADER',
  NFTS_HEADER = 'NFTS_HEADER',
  NFTS_LOADING = 'NFTS_LOADING',
  NFTS_EMPTY = 'NFTS_EMPTY',
  NFTS_HEADER_SPACE_BEFORE = 'NFTS_HEADER_SPACE_BEFORE',
  NFTS_HEADER_SPACE_AFTER = 'NFTS_HEADER_SPACE_AFTER',
  FAMILY_HEADER = 'FAMILY_HEADER',
  NFT = 'NFT',
  NFT_SPACE_AFTER = 'NFT_SPACE_AFTER',

  POSITIONS_SPACE_BEFORE = 'POSITIONS_SPACE_BEFORE',
  POSITIONS_HEADER = 'POSITIONS_HEADER',
  POSITION = 'POSITION',
  POSITIONS_SPACE_AFTER = 'POSITIONS_SPACE_AFTER',

  CLAIMABLES_SPACE_BEFORE = 'CLAIMABLES_SPACE_BEFORE',
  CLAIMABLES_HEADER = 'CLAIMABLES_HEADER',
  CLAIMABLE = 'CLAIMABLE',
  CLAIMABLES_SPACE_AFTER = 'CLAIMABLES_SPACE_AFTER',

  LOADING_ASSETS = 'LOADING_ASSETS',
  RECEIVE_CARD = 'RECEIVE_CARD',
  ETH_CARD = 'ETH_CARD',
  LEARN_CARD = 'LEARN_CARD',
  DISCOVER_MORE_BUTTON = 'DISCOVER_MORE_BUTTON',
  EMPTY_WALLET_SPACER = 'EMPTY_WALLET_SPACER',
  BIG_EMPTY_WALLET_SPACER = 'BIG_EMPTY_WALLET_SPACER',
  EMPTY_ROW = 'EMPTY_ROW',

  REMOTE_CARD_CAROUSEL = 'REMOTE_CARD_CAROUSEL',
  EMPTY_REMOTE_CARD_CAROUSEL = 'EMPTY_REMOTE_CARD_CAROUSEL',
}
export type RecyclerListViewRef = RecyclerListView<RecyclerListViewProps, RecyclerListViewState>;

export type BaseCellType = { type: CellType; uid: string; hidden?: boolean };

export type CoinDividerExtraData = {
  type: CellType.COIN_DIVIDER;
  value: number;
  defaultToEditButton: boolean;
};

export type NFTsHeaderExtraData = {
  type: CellType.NFTS_HEADER;
  nftSort: NftCollectionSortCriterion;
};

export type NFTsOtherData = {
  type: CellType.NFTS_HEADER_SPACE_AFTER | CellType.NFT_SPACE_AFTER | CellType.NFTS_EMPTY | CellType.NFTS_LOADING;
};

export type AssetsHeaderExtraData = {
  type: CellType.PROFILE_BALANCE_ROW;
  value: string;
  isLoadingBalance: boolean;
};
export type CoinExtraData = { type: CellType.COIN; uniqueId: string };
export type NFTExtraData = {
  type: CellType.NFT;
  index: number;
  uniqueId?: string;
  collectionId: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
};

export type PositionExtraData = {
  type: CellType.POSITION;
  position: RainbowPosition;
  index: number;
};
export type PositionHeaderExtraData = {
  total: string;
};
export type ClaimableExtraData = {
  type: CellType.CLAIMABLE;
  claimable: Claimable;
};
export type ClaimablesHeaderExtraData = {
  total: string;
};
export type NFTFamilyExtraData = {
  type: CellType.FAMILY_HEADER;
  name: string;
  total?: number;
  image?: string;
  uid: string;
};

export type ProfileActionButtonsRowExtraData = {
  type: CellType.PROFILE_ACTION_BUTTONS_ROW | CellType.PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER;
  value: string | undefined;
};

export type LoadingAssetsSection = {
  type: CellType.LOADING_ASSETS;
};

export type CellExtraData =
  | LoadingAssetsSection
  | NFTFamilyExtraData
  | CoinDividerExtraData
  | CoinExtraData
  | NFTExtraData
  | NFTsHeaderExtraData
  | NFTsOtherData
  | AssetsHeaderExtraData
  | PositionExtraData
  | PositionHeaderExtraData
  | ClaimableExtraData
  | ClaimablesHeaderExtraData
  | ProfileActionButtonsRowExtraData;

export type CellTypes = BaseCellType | (CellExtraData & BaseCellType);
