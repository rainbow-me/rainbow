import { RecyclerListViewRef } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import React, { createContext, useState } from 'react';

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

const RecyclerListViewScrollToTopProvider: React.FC<ScrollToTopProviderProps> = ({
  children,
}) => {
  const [
    scrollToTopRef,
    setScrollToTopRef,
  ] = useState<RecyclerListViewRef | null>(null);

  const scrollToTop = () => {
    scrollToTopRef?.scrollToTop(true);
  };

  return (
    <RecyclerListViewScrollToTopContext.Provider
      value={{ scrollToTop, setScrollToTopRef }}
    >
      {children}
    </RecyclerListViewScrollToTopContext.Provider>
  );
};

export const useRecyclerListViewScrollToTopContext = () =>
  React.useContext(RecyclerListViewScrollToTopContext);

export default RecyclerListViewScrollToTopProvider;
