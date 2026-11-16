import React from 'react';
import { Animated } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecyclerAssetListScrollPositionContext } from '@/components/asset-list/RecyclerAssetList2/core/Contexts';
import { createListData } from '@/components/asset-list/RecyclerAssetList2/core/createListData';
import { RawMemoRecyclerAssetList } from '@/components/asset-list/RecyclerAssetList2/core/RawRecyclerList';
import { StickyHeaderManager } from '@/components/asset-list/RecyclerAssetList2/core/StickyHeaders';
import { type NftCell } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { navbarHeight } from '@/components/navbar/Navbar';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { useStableValue } from '@/hooks/useStableValue';
import { useTheme } from '@/theme/ThemeContext';

import { useNftsEnabled } from '../data/nftsEnabledStore';
import { renderNftRow } from './renderNftRow';

/**
 * Displays prepared NFT rows in an ENS profile or avatar picker.
 */
export function NftAssetList({
  rows,
  type,
  externalAddress,
  onPressUniqueToken,
  onEndReached,
}: {
  rows: NftCell[];
  type: 'ens-profile' | 'select-nft';
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  onEndReached?: () => void;
}) {
  const theme = useTheme();
  const nftsEnabled = useNftsEnabled();
  const insets = useSafeAreaInsets();
  const position = useStableValue(() => new Animated.Value(0));
  const listData = createListData(rows, false, nftsEnabled);

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      <StickyHeaderManager yOffset={navbarHeight + insets.top - 8}>
        <RawMemoRecyclerAssetList
          listData={listData}
          extendedState={theme}
          rowRenderer={(_type, data: NftCell) => (nftsEnabled ? renderNftRow(data, theme, onPressUniqueToken, externalAddress) : null)}
          disablePullDownToRefresh={type === 'select-nft'}
          onEndReached={onEndReached}
          scrollIndicatorInsets={{ bottom: insets.bottom + 14, top: 132 }}
          type={type}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}
