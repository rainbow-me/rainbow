import { RecyclerListViewRef } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import React, { createContext, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const RecyclerListViewScrollToTopContext = createContext<{
  scrollToTop: () => void;
  setScrollToTopRef: (ref: RecyclerListViewRef | null) => void;
}>({
  scrollToTop: () => {},
  setScrollToTopRef: () => {},
});

type ScrollToTopProviderProps = {
  children: React.ReactNode;
};

const RecyclerListViewScrollToTopProvider: React.FC<ScrollToTopProviderProps> = ({ children }) => {
  const insets = useSafeAreaInsets();

  const [scrollToTopRef, setScrollToTopRef] = useState<RecyclerListViewRef | null>(null);

  const memoizedValue = useMemo(() => {
    const scrollToTop = () => {
      scrollToTopRef?.scrollToOffset(0, -insets.top, true);
    };

    return { scrollToTop, setScrollToTopRef };
  }, [scrollToTopRef]);

  return <RecyclerListViewScrollToTopContext.Provider value={memoizedValue}>{children}</RecyclerListViewScrollToTopContext.Provider>;
};

export const useRecyclerListViewScrollToTopContext = () => React.useContext(RecyclerListViewScrollToTopContext);

export default RecyclerListViewScrollToTopProvider;
