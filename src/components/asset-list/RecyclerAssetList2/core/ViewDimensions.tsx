import { CoinDividerContainerHeight } from '../../../coin-divider';
import { CoinRowHeight, SavingsCoinRowHeight } from '../../../coin-row';
import { SavingsListHeader } from '../../../savings';
import { TokenFamilyHeaderHeight } from '../../../token-family';
import { UniqueTokenRow } from '../../../unique-token';
import { AssetListHeaderHeight } from '../../AssetListHeader';
import { AssetListItemSkeletonHeight } from '../../AssetListItemSkeleton';
import { CellType } from './ViewTypes';
import { deviceUtils } from '@rainbow-me/utils';

type Dim = {
  width?: number;
  height: number;
};
const ViewDimensions: Record<CellType, Dim> = {
  [CellType.ASSETS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.ASSETS_HEADER_SPACE_AFTER]: { height: 6 },
  [CellType.COIN]: { height: CoinRowHeight },
  [CellType.COIN_DIVIDER]: { height: CoinDividerContainerHeight },
  [CellType.SAVINGS_HEADER_SPACE_BEFORE]: { height: 7 },
  [CellType.SAVINGS_HEADER]: { height: SavingsListHeader.height },
  [CellType.SAVINGS]: { height: SavingsCoinRowHeight },
  [CellType.POOLS_HEADER]: { height: SavingsListHeader.height },
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
