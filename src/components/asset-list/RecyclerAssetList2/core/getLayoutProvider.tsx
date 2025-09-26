import { Dimension, Layout, LayoutManager, LayoutProvider } from 'recyclerlistview';
import ViewDimensions from './ViewDimensions';
import { CellType, CellTypes } from './ViewTypes';
import { deviceUtils } from '@/utils';
import { RainbowConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED } from '@/config';
import { useContext } from 'react';
import { RainbowContextType } from '@/helpers/RainbowContext';

const getStyleOverridesForIndex = (indices: number[]) => (index: number) => {
  if (indices.includes(index)) {
    return {
      zIndex: 1000,
    };
  }
  return undefined;
};

class BetterLayoutProvider extends LayoutProvider {
  shouldRefreshWithAnchoring = false;
  private readonly indicesToOverride: number[];
  constructor(
    getLayoutTypeForIndex: (index: number) => string | number,
    setLayoutForType: (type: string | number, dim: Dimension, index: number) => void,
    indicesToOverride: number[]
  ) {
    super(getLayoutTypeForIndex, setLayoutForType);
    this.indicesToOverride = indicesToOverride;
  }
  public newLayoutManager(renderWindowSize: Dimension, isHorizontal?: boolean, cachedLayouts?: Layout[]): LayoutManager {
    const oldLayoutManager = super.newLayoutManager(renderWindowSize, isHorizontal, cachedLayouts);
    oldLayoutManager.getStyleOverridesForIndex = getStyleOverridesForIndex(this.indicesToOverride);
    return oldLayoutManager;
  }
}

const NFTS = [
  CellType.NFTS_EMPTY,
  CellType.NFTS_HEADER_SPACE_AFTER,
  CellType.NFTS_HEADER_SPACE_BEFORE,
  CellType.NFTS_HEADER,
  CellType.NFTS_LOADING,
  CellType.NFT,
  CellType.FAMILY_HEADER,
  CellType.LEGACY_FAMILY_HEADER,
  CellType.LEGACY_NFT,
];

const getLayoutProvider = ({
  briefSectionsData,
  isCoinListEdited,
  experimentalConfig,
  remoteConfig,
}: {
  briefSectionsData: CellTypes[];
  isCoinListEdited: boolean;
  experimentalConfig: ReturnType<typeof useContext<RainbowContextType>>['config'];
  remoteConfig: RainbowConfig;
}) => {
  const nftsEnabled = remoteConfig.nfts_enabled || experimentalConfig[NFTS_ENABLED];

  const indicesToOverride = [];
  for (let i = 0; i < briefSectionsData.length; i++) {
    const val = briefSectionsData[i];
    if (
      val.type === CellType.PROFILE_AVATAR_ROW ||
      val.type === CellType.PROFILE_NAME_ROW ||
      val.type === CellType.PROFILE_STICKY_HEADER ||
      val.type === CellType.NFTS_HEADER ||
      val.type === CellType.POSITIONS_HEADER ||
      (val.type === CellType.COIN_DIVIDER && isCoinListEdited)
    ) {
      indicesToOverride.push(i);
    }
  }

  return new BetterLayoutProvider(
    index => briefSectionsData[index].type,
    (type: string | number, dim: Dimension, index: number) => {
      const cellType = type as CellType;
      const cellData = briefSectionsData[index];
      dim.width = deviceUtils.dimensions.width;
      if (ViewDimensions[cellType]) {
        // For SPACER type, use the height from data if available
        if (cellType === CellType.SPACER && cellData && 'height' in cellData) {
          dim.height = cellData.height;
        } else {
          dim.height = ViewDimensions[cellType].height;
        }
        dim.width = ViewDimensions[cellType].width || dim.width;

        // If NFTs are disabled, we don't want to render the sections, so adjust the height to 0
        if (NFTS.includes(cellType) && !nftsEnabled) {
          dim.height = 0;
        }
      }
    },
    indicesToOverride
  );
};

export default getLayoutProvider;
