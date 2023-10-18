import React, { useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemoOne } from 'use-memo-one';
import { RecyclerAssetListScrollPositionContext } from './core/Contexts';
import RawMemoRecyclerAssetList from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';
import { UniqueAsset } from '@/entities';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';

export type AssetListType = 'wallet' | 'ens-profile' | 'select-nft';

function RecyclerAssetList({
  disablePullDownToRefresh,
  externalAddress,
  onPressUniqueToken,
  type = 'wallet',
  walletBriefSectionsData,
}: {
  disablePullDownToRefresh?: boolean;
  /** An "external address" is an address that is not the current account address. */
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  type?: AssetListType;
  walletBriefSectionsData: any[];
}) {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData({
    briefSectionsData: walletBriefSectionsData,
    externalAddress,
    type,
  });

  const insets = useSafeAreaInsets();

  const position = useMemoOne(
    () => new RNAnimated.Value(type === 'wallet' ? -insets.top : 0),
    []
  );

  const extendedState = useMemo(
    () => ({ additionalData, externalAddress, onPressUniqueToken }),
    [additionalData, externalAddress, onPressUniqueToken]
  );

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      {ios && type === 'wallet' && <NavbarOverlay position={position} />}
      <StickyHeaderManager yOffset={ios ? navbarHeight + insets.top - 8 : 0}>
        <RawMemoRecyclerAssetList
          briefSectionsData={briefSectionsData}
          disablePullDownToRefresh={!!disablePullDownToRefresh}
          extendedState={extendedState}
          type={type}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);

// //////////////////////////////////////////////////////////

function NavbarOverlay({ position }: { position: RNAnimated.Value }) {
  const insets = useSafeAreaInsets();
  const yOffset = 18;
  const animatedStyle = useMemo(
    () => ({
      opacity: position!.interpolate({
        inputRange: [0, yOffset, yOffset + 4],
        outputRange: [0, 0, 1],
      }),
    }),
    [position, yOffset]
  );

  return (
    <Box
      as={RNAnimated.View}
      background="body (Deprecated)"
      style={[
        {
          height: navbarHeight + insets.top,
          width: '100%',
          position: 'absolute',
          top: 0,
          zIndex: 1,
        },
        animatedStyle,
      ]}
    />
  );
}
