import React, { useContext } from 'react';
import { Animated as RNAnimated } from 'react-native';

import { useDeepCompareMemo } from 'use-deep-compare';
import { CellTypes } from './ViewTypes';

export const RecyclerAssetListContext = React.createContext<{
  additionalData: Record<string, CellTypes>;
  onPressUniqueToken?: (asset: any) => void;
}>({ additionalData: {}, onPressUniqueToken: undefined });

export const RecyclerAssetListScrollPositionContext = React.createContext<
  RNAnimated.Value | undefined
>(undefined);

export function useAdditionalRecyclerAssetListData(uid: string) {
  const { additionalData, onPressUniqueToken } = useContext(
    RecyclerAssetListContext
  );
  return useDeepCompareMemo(
    () => ({ ...additionalData[uid], onPressUniqueToken }),
    [additionalData[uid], onPressUniqueToken]
  );
}

export function useRecyclerAssetListPosition() {
  return useContext(RecyclerAssetListScrollPositionContext);
}
