import { CoinDividerContainerHeight } from '../../../coin-divider';
import { CoinRowHeight, SavingsCoinRowHeight } from '../../../coin-row';
import { SavingsListHeader } from '../../../savings';
import { TokenFamilyHeaderHeight } from '../../../token-family';
import { UniqueTokenRow } from '../../../unique-token';
import { AssetListHeaderHeight } from '../../AssetListHeader';
import { AssetListItemSkeletonHeight } from '../../AssetListItemSkeleton';
import {
  AssetListProfileActionButtonsHeight,
  AssetListProfileAvatarHeight,
  AssetListProfileBalanceHeight,
  AssetListProfileHeaderHeight,
  AssetListProfileNameHeight,
} from '../../AssetListProfileHeader';
import { CellType } from './ViewTypes';
import { deviceUtils } from '@/utils';

type Dim = {
  width?: number;
  height: number;
};
const ViewDimensions: Record<CellType, Dim> = {
  [CellType.PROFILE_HEADER_COMPACT]: { height: 52 },
  [CellType.ASSETS_HEADER_SPACE_AFTER]: { height: 16 },
  [CellType.COIN]: { height: CoinRowHeight },
  [CellType.COIN_DIVIDER]: { height: CoinDividerContainerHeight },
  [CellType.SAVINGS_HEADER_SPACE_BEFORE]: { height: 7 },
  [CellType.SAVINGS_HEADER]: { height: SavingsListHeader.height },
  [CellType.SAVINGS]: { height: SavingsCoinRowHeight },
  [CellType.POOLS_HEADER]: { height: SavingsListHeader.height },
  [CellType.PROFILE_HEADER_ACTION_BUTTONS]: {
    height: AssetListProfileActionButtonsHeight - 19,
  },
  [CellType.PROFILE_HEADER_ACTION_BUTTONS_SPACE_AFTER]: { height: 15 },
  [CellType.PROFILE_HEADER_AVATAR]: { height: AssetListProfileAvatarHeight },
  [CellType.PROFILE_HEADER_AVATAR_SPACE_AFTER]: { height: 15 },
  [CellType.PROFILE_HEADER_NAME]: { height: AssetListProfileNameHeight },
  [CellType.PROFILE_HEADER_NAME_SPACE_AFTER]: { height: 19 },
  [CellType.PROFILE_HEADER_BALANCE]: { height: AssetListProfileBalanceHeight },
  [CellType.PROFILE_HEADER_BALANCE_SPACE_AFTER]: { height: 24 },
  [CellType.UNISWAP_POOL]: { height: CoinRowHeight },
  [CellType.NFTS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.NFTS_HEADER_SPACE_BEFORE]: { height: 24 },
  [CellType.NFTS_HEADER_SPACE_AFTER]: { height: 6 },
  [CellType.FAMILY_HEADER]: { height: TokenFamilyHeaderHeight },
  [CellType.NFT]: {
    // @ts-expect-error
    height: UniqueTokenRow.cardSize + UniqueTokenRow.cardMargin,
    width: deviceUtils.dimensions.width / 2 - 0.1,
  },
  [CellType.NFT_SPACE_AFTER]: { height: 5 },
  [CellType.LOADING_ASSETS]: { height: AssetListItemSkeletonHeight },
};

export default ViewDimensions;
