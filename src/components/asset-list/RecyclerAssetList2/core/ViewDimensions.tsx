import { CoinDividerHeight } from '../../../coin-divider';
import { CoinRowHeight } from '../../../coin-row';
import { UniqueTokenRow } from '../../../unique-token';
import { AssetListHeaderHeight } from '../../AssetListHeader';
import { CellType } from './ViewTypes';
import { deviceUtils } from '@rainbow-me/utils';

type Dim = {
  width?: number;
  height: number;
};
const ViewDimensions: Record<CellType, Dim> = {
  [CellType.ASSETS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.COIN]: { height: CoinRowHeight },
  [CellType.COIN_DIVIDER]: { height: CoinDividerHeight },
  [CellType.SAVINGS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.SAVINGS]: { height: CoinRowHeight },
  [CellType.POOLS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.UNISWAP_POOL]: { height: CoinRowHeight },
  [CellType.NFTS_HEADER]: { height: AssetListHeaderHeight },
  [CellType.FAMILY_HEADER]: { height: AssetListHeaderHeight },
  [CellType.NFT]: {
    // @ts-ignore
    height: UniqueTokenRow.cardSize + UniqueTokenRow.cardMargin,
    width: deviceUtils.dimensions.width / 2 - 0.1,
  },
  [CellType.LOADING_ASSETS]: { height: AssetListHeaderHeight },
};

export default ViewDimensions;
