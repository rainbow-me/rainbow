import { CoinDividerContainerHeight } from '../../../coin-divider';
import { CoinRowHeight } from '../../../coin-row';
import { UniqueTokenRow } from '../../../unique-token';
import { AssetListHeaderHeight } from '../../AssetListHeader';
import { CellType } from './ViewTypes';
import { deviceUtils } from '@rainbow-me/utils';

// TODO: Move heights to their respective components

type Dim = {
  width?: number;
  height: number;
};
const ViewDimensions: Record<CellType, Dim> = {
  [CellType.ASSETS_HEADER]: { height: 59 },
  [CellType.COIN]: { height: CoinRowHeight },
  [CellType.COIN_DIVIDER]: { height: CoinDividerContainerHeight },
  [CellType.SAVINGS_HEADER]: { height: 44 },
  [CellType.SAVINGS]: { height: 64 },
  [CellType.POOLS_HEADER]: { height: 44 },
  [CellType.UNISWAP_POOL]: { height: CoinRowHeight },
  [CellType.NFTS_HEADER]: { height: AssetListHeaderHeight + 5 },
  [CellType.FAMILY_HEADER]: { height: 50 },
  [CellType.NFT]: {
    // @ts-ignore
    height: UniqueTokenRow.cardSize + UniqueTokenRow.cardMargin,
    width: deviceUtils.dimensions.width / 2 - 0.1,
  },
  [CellType.LOADING_ASSETS]: { height: 59 },
  [CellType.SPACE_7PX]: { height: 7 },
  [CellType.SPACE_20PX]: { height: 20 },
};

export default ViewDimensions;
