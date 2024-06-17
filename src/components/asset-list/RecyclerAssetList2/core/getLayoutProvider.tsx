import { Dimension, Layout, LayoutManager, LayoutProvider } from 'recyclerlistview';
import ViewDimensions from './ViewDimensions';
import { BaseCellType, CellType } from './ViewTypes';
import { deviceUtils } from '@/utils';
import { TrimmedCard } from '@/resources/cards/cardCollectionQuery';

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

const getLayoutProvider = (briefSectionsData: BaseCellType[], isCoinListEdited: boolean, cardIds: string[], isReadOnlyWallet: boolean) => {
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
    // @ts-ignore
    (type: CellType, dim) => {
      dim.width = deviceUtils.dimensions.width;
      if (ViewDimensions[type]) {
        dim.height = ViewDimensions[type].height;
        dim.width = ViewDimensions[type].width || dim.width;

        if ((type === CellType.REMOTE_CARD_CAROUSEL && !cardIds.length) || (type === CellType.REMOTE_CARD_CAROUSEL && isReadOnlyWallet)) {
          dim.height = 0;
        }
      }
    },
    indicesToOverride
  );
};

export default getLayoutProvider;
