import React, { useContext } from 'react';
import { Animated as RNAnimated } from 'react-native';

export const RecyclerAssetListScrollPositionContext = React.createContext<RNAnimated.Value | undefined>(undefined);

export function useRecyclerAssetListPosition() {
  return useContext(RecyclerAssetListScrollPositionContext);
}
