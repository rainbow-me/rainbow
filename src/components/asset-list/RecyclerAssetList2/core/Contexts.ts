import React, { useContext } from 'react';
import { Animated as RNAnimated } from 'react-native';

import { useDeepCompareMemo } from 'use-deep-compare';
import { CellTypes } from './ViewTypes';

export const RecyclerAssetListContext = React.createContext<
  Record<string, CellTypes>
>({});

export const RecyclerAssetListScrollPositionContext = React.createContext<
  RNAnimated.Value | undefined
>(undefined);

export function useAdditionalRecyclerAssetListData(uid: string) {
  const context = useContext(RecyclerAssetListContext)[uid];
  return useDeepCompareMemo(() => context, [context]);
}

export function useRecyclerAssetListPosition() {
  return useContext(RecyclerAssetListScrollPositionContext);
}
