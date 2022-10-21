import { CoinDividerContainerHeight } from '../../../coin-divider';
import { CoinRowHeight, SavingsCoinRowHeight } from '../../../coin-row';
import { SavingsListHeader } from '../../../savings';
import { TokenFamilyHeaderHeight } from '../../../token-family';
import { UniqueTokenRow } from '../../../unique-token';
import { AssetListHeaderHeight } from '../../AssetListHeader';
import { AssetListItemSkeletonHeight } from '../../AssetListItemSkeleton';
import { CellType } from './ViewTypes';
import { deviceUtils } from '@/utils';
import { ProfileActionButtonsRowHeight } from '../profile-header/ProfileActionButtonsRow';
import {
  ProfileAvatarRowHeight,
  ProfileAvatarRowTopInset,
} from '../profile-header/ProfileAvatarRow';
import { ProfileNameRowHeight } from '../profile-header/ProfileNameRow';
import { ProfileBalanceRowHeight } from '../profile-header/ProfileBalanceRow';
import { ProfileStickyHeaderHeight } from '../profile-header/ProfileStickyHeader';
import { ReceiveCardHeight } from '@/components/cards/ReceiveAssetsCard';
import { AssetCardHeight } from '@/components/cards/AssetCard';

type Dim = {
  width?: number;
  height: number;
};
const ViewDimensions: Record<CellType, Dim> = {
  [CellType.DISCOVER_MORE_BUTTON]: { height: 40 },
  [CellType.RECEIVE_CARD]: { height: ReceiveCardHeight },
  [CellType.BUY_ETH_CARD]: { height: AssetCardHeight },
  [CellType.GET_STARTED_CARD]: { height: 159 },
  [CellType.EMPTY_WALLET_SPACER]: { height: 20 },
  [CellType.PROFILE_STICKY_HEADER]: { height: ProfileStickyHeaderHeight },
  [CellType.ASSETS_HEADER_SPACE_AFTER]: { height: 16 },
  [CellType.COIN]: { height: CoinRowHeight },
  [CellType.COIN_DIVIDER]: { height: CoinDividerContainerHeight },
  [CellType.SAVINGS_HEADER_SPACE_BEFORE]: { height: 7 },
  [CellType.SAVINGS_HEADER]: { height: SavingsListHeader.height },
  [CellType.SAVINGS]: { height: SavingsCoinRowHeight },
  [CellType.POOLS_HEADER]: { height: SavingsListHeader.height },
  [CellType.PROFILE_ACTION_BUTTONS_ROW]: {
    height: ProfileActionButtonsRowHeight - ProfileStickyHeaderHeight,
  },
  [CellType.PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER]: { height: 24 },
  [CellType.PROFILE_AVATAR_ROW]: { height: ProfileAvatarRowHeight },
  [CellType.PROFILE_AVATAR_ROW_SPACE_BEFORE]: {
    height: ios ? ProfileAvatarRowTopInset : 0,
  },
  [CellType.PROFILE_AVATAR_ROW_SPACE_AFTER]: { height: 15 },
  [CellType.PROFILE_NAME_ROW]: { height: ProfileNameRowHeight },
  [CellType.PROFILE_NAME_ROW_SPACE_AFTER]: { height: 19 },
  [CellType.PROFILE_BALANCE_ROW]: { height: ProfileBalanceRowHeight },
  [CellType.PROFILE_BALANCE_ROW_SPACE_AFTER]: { height: 24 },
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
