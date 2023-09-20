import { RecyclerListView, RecyclerListViewProps } from 'recyclerlistview';
import { RecyclerListViewState } from 'recyclerlistview/dist/reactnative/core/RecyclerListView';
import { UniqueAsset } from '@/entities';

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
  NFTS_HEADER_SPACE_BEFORE = 'NFTS_HEADER_SPACE_BEFORE',
  NFTS_HEADER_SPACE_AFTER = 'NFTS_HEADER_SPACE_AFTER',
  FAMILY_HEADER = 'FAMILY_HEADER',
  NFT = 'NFT',
  NFT_SPACE_AFTER = 'NFT_SPACE_AFTER',

  POSITIONS_SPACE_BEFORE = 'POSITIONS_SPACE_BEFORE',
  POSITIONS_HEADER = 'POSITIONS_HEADER',
  POSITION = 'POSITION',
  POSITIONS_SPACE_AFTER = 'POSITIONS_SPACE_AFTER',

  LOADING_ASSETS = 'LOADING_ASSETS',
  RECEIVE_CARD = 'RECEIVE_CARD',
  ETH_CARD = 'ETH_CARD',
  LEARN_CARD = 'LEARN_CARD',
  DISCOVER_MORE_BUTTON = 'DISCOVER_MORE_BUTTON',
  EMPTY_WALLET_SPACER = 'EMPTY_WALLET_SPACER',
  BIG_EMPTY_WALLET_SPACER = 'BIG_EMPTY_WALLET_SPACER',
  EMPTY_ROW = 'EMPTY_ROW',
}
export type RecyclerListViewRef = RecyclerListView<
  RecyclerListViewProps,
  RecyclerListViewState
>;

export type BaseCellType = { type: CellType; uid: string; hidden?: boolean };

export type CoinDividerExtraData = {
  type: CellType.COIN_DIVIDER;
  value: number;
  defaultToEditButton: boolean;
};
export type AssetsHeaderExtraData = {
  type: CellType.PROFILE_STICKY_HEADER;
  value: string;
};
export type CoinExtraData = { type: CellType.COIN; uniqueId: string };
export type NFTExtraData = {
  type: CellType.NFT;
  index: number;
  uniqueId: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
};
export type PositionExtraData = {
  uniqueId: string;
  index: number;
};
export type PositionHeaderExtraData = {
  total: string;
};
export type NFTFamilyExtraData = {
  type: CellType.FAMILY_HEADER;
  name: string;
  total?: number;
  image?: string;
};

export type CellExtraData =
  | { type: CellType.NFTS_HEADER }
  | { type: CellType.LOADING_ASSETS }
  | NFTFamilyExtraData
  | CoinDividerExtraData
  | CoinExtraData
  | NFTExtraData
  | AssetsHeaderExtraData
  | PositionExtraData
  | PositionHeaderExtraData;

export type CellTypes = BaseCellType & CellExtraData;
