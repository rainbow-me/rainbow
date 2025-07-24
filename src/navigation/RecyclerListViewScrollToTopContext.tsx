import React, { createContext, useContext, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecyclerListViewRef } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';

export const RecyclerListViewScrollToTopContext = createContext<{
  scrollToTop: () => void;
  setScrollToTopRef: (ref: RecyclerListViewRef | null) => void;
}>({
  scrollToTop: () => {
    return;
  },
  setScrollToTopRef: () => {
    return;
  },
});

type ScrollToTopProviderProps = {
  children: React.ReactNode;
};

export function RecyclerListViewScrollToTopProvider({ children }: ScrollToTopProviderProps) {
  const insets = useSafeAreaInsets();
  const scrollToTopRef = useRef<RecyclerListViewRef | null>(null);

  const scrollToTop = () => {
    scrollToTopRef?.current?.scrollToOffset(0, -insets.top, true);
  };

  const setScrollToTopRef = (ref: RecyclerListViewRef | null) => {
    scrollToTopRef.current = ref;
  };

  return (
    <RecyclerListViewScrollToTopContext.Provider value={{ scrollToTop, setScrollToTopRef }}>
      {children}
    </RecyclerListViewScrollToTopContext.Provider>
  );
}

export const useRecyclerListViewScrollToTopContext = () => useContext(RecyclerListViewScrollToTopContext);
