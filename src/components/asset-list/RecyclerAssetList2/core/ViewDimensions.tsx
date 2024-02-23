import { CoinDividerContainerHeight } from '../../../coin-divider';
import { CoinRowHeight } from '../../../coin-row';
import { TokenFamilyHeaderHeight } from '../../../token-family';
import { UniqueTokenRow } from '../../../unique-token';
import { AssetListHeaderHeight } from '../../AssetListHeader';
import { AssetListItemSkeletonHeight } from '../../AssetListItemSkeleton';
import { CellType } from './ViewTypes';
import { deviceUtils } from '@/utils';
import { ProfileActionButtonsRowHeight } from '../profile-header/ProfileActionButtonsRow';
import { ProfileAvatarRowHeight, ProfileAvatarRowTopInset } from '../profile-header/ProfileAvatarRow';
import { ProfileNameRowHeight } from '../profile-header/ProfileNameRow';
import { ProfileBalanceRowHeight } from '../profile-header/ProfileBalanceRow';
import { ProfileStickyHeaderHeight } from '../profile-header/ProfileStickyHeader';
import { RECEIVE_CARD_HEIGHT } from '@/components/cards/ReceiveAssetsCard';
import { ETH_CARD_HEIGHT } from '@/components/cards/EthCard';
import { LEARN_CARD_HEIGHT } from '@/components/cards/RotatingLearnCard';
import { DISCOVER_MORE_BUTTON_HEIGHT } from './DiscoverMoreButton';
import { IS_IOS } from '@/env';

type Dim = {
  width?: number;
  height: number;
};
const ViewDimensions: Record<CellType, Dim> = {
  [CellType.EMPTY_ROW]: { height: 0 },
  [CellType.DISCOVER_MORE_BUTTON]: { height: DISCOVER_MORE_BUTTON_HEIGHT },
  [CellType.RECEIVE_CARD]: { height: RECEIVE_CARD_HEIGHT },
  [CellType.ETH_CARD]: { height: ETH_CARD_HEIGHT },
  [CellType.LEARN_CARD]: { height: LEARN_CARD_HEIGHT },
  [CellType.EMPTY_WALLET_SPACER]: { height: 20 },
  [CellType.BIG_EMPTY_WALLET_SPACER]: { height: 32 },
  [CellType.PROFILE_STICKY_HEADER]: { height: ProfileStickyHeaderHeight },
  [CellType.ASSETS_HEADER_SPACE_AFTER]: { height: 16 },
  [CellType.COIN]: { height: CoinRowHeight },
  [CellType.COIN_DIVIDER]: { height: CoinDividerContainerHeight },
  [CellType.PROFILE_ACTION_BUTTONS_ROW]: {
    height: ProfileActionButtonsRowHeight - ProfileStickyHeaderHeight,
  },
  [CellType.PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER]: { height: 24 },
  [CellType.PROFILE_AVATAR_ROW]: { height: ProfileAvatarRowHeight },
  [CellType.PROFILE_AVATAR_ROW_SPACE_BEFORE]: {
    height: IS_IOS ? ProfileAvatarRowTopInset : ProfileAvatarRowTopInset * 2,
  },
  [CellType.PROFILE_AVATAR_ROW_SPACE_AFTER]: { height: 15 },
  [CellType.PROFILE_NAME_ROW]: { height: ProfileNameRowHeight },
  [CellType.PROFILE_NAME_ROW_SPACE_AFTER]: { height: 19 },
  [CellType.PROFILE_BALANCE_ROW]: { height: ProfileBalanceRowHeight },
  [CellType.PROFILE_BALANCE_ROW_SPACE_AFTER]: { height: 24 },
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
  [CellType.POSITIONS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.POSITIONS_SPACE_BEFORE]: { height: 10 },
  [CellType.POSITIONS_SPACE_AFTER]: { height: 24 },
  [CellType.POSITION]: {
    height: 130,
    width: deviceUtils.dimensions.width / 2 - 0.1,
  },
  [CellType.REMOTE_CARD_CAROUSEL]: { height: 112 },
};

export default ViewDimensions;
