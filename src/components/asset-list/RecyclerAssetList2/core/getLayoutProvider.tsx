import { Dimension, Layout, LayoutManager, LayoutProvider } from 'recyclerlistview';
import ViewDimensions from './ViewDimensions';
import { BaseCellType, CellType } from './ViewTypes';
import { deviceUtils } from '@/utils';
import { RainbowConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, REMOTE_CARDS } from '@/config';
import { useContext } from 'react';
import { RainbowContextType } from '@/helpers/RainbowContext';
import { IS_TEST } from '@/env';

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

const getLayoutProvider = ({
  briefSectionsData,
  isCoinListEdited,
  cardIds,
  isReadOnlyWallet,
  experimentalConfig,
  remoteConfig,
}: {
  briefSectionsData: BaseCellType[];
  isCoinListEdited: boolean;
  cardIds: string[];
  isReadOnlyWallet: boolean;
  experimentalConfig: ReturnType<typeof useContext<RainbowContextType>>['config'];
  remoteConfig: RainbowConfig;
}) => {
  const remoteCardsEnabled = remoteConfig.remote_cards_enabled || experimentalConfig[REMOTE_CARDS];
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
    // @ts-ignore
    (type: CellType, dim) => {
      dim.width = deviceUtils.dimensions.width;
      if (ViewDimensions[type]) {
        dim.height = ViewDimensions[type].height;
        dim.width = ViewDimensions[type].width || dim.width;

        // NOTE: If NFTs are disabled, we don't want to render the NFTs section, so adjust the height to 0
        if (
          [
            CellType.NFTS_EMPTY,
            CellType.NFTS_HEADER_SPACE_AFTER,
            CellType.NFTS_HEADER_SPACE_BEFORE,
            CellType.NFTS_HEADER,
            CellType.NFTS_LOADING,
            CellType.NFT,
            CellType.FAMILY_HEADER,
          ].includes(type) &&
          !nftsEnabled
        ) {
          dim.height = 0;
        }

        // NOTE: If remote cards are disabled, we don't want to render the remote cards section, so adjust the height to 0
        if (type === CellType.REMOTE_CARD_CAROUSEL && (!remoteCardsEnabled || !cardIds.length || isReadOnlyWallet)) {
          dim.height = 0;
        }
      }
    },
    indicesToOverride
  );
};

export default getLayoutProvider;
