import React, { useContext } from 'react';
import { Animated as RNAnimated } from 'react-native';

import { useDeepCompareMemo } from 'use-deep-compare';
import { CellTypes } from './ViewTypes';
import { UniqueAsset } from '@rainbow-me/entities';

export const RecyclerAssetListContext = React.createContext<{
  additionalData: Record<string, CellTypes>;
  address?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
}>({ additionalData: {}, onPressUniqueToken: undefined });

export const RecyclerAssetListScrollPositionContext = React.createContext<
  RNAnimated.Value | undefined
>(undefined);

export function useAdditionalRecyclerAssetListData(uid: string) {
  const { additionalData, address, onPressUniqueToken } = useContext(
    RecyclerAssetListContext
  );
  return useDeepCompareMemo(
    () => ({ ...additionalData[uid], address, onPressUniqueToken }),
    [additionalData[uid], address, onPressUniqueToken]
  );
}

export function useRecyclerAssetListPosition() {
  return useContext(RecyclerAssetListScrollPositionContext);
}
