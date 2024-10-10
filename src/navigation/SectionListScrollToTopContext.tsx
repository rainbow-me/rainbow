import React, { createContext, useState } from 'react';
import { SectionList } from 'react-native';

type SectionListScrollToTopContextType<ItemT, SectionT> = {
  scrollToTop: () => void;
  setScrollToTopRef: (ref: SectionList<ItemT, SectionT> | null) => void;
};

export const SectionListScrollToTopContext = createContext<SectionListScrollToTopContextType<any, any>>({
  scrollToTop: () => {},
  setScrollToTopRef: () => {},
});

type ScrollToTopProviderProps<ItemT, SectionT> = {
  children: React.ReactNode;
};

function SectionListScrollToTopProvider<ItemT, SectionT>({ children }: ScrollToTopProviderProps<ItemT, SectionT>) {
  const [scrollToTopRef, setScrollToTopRef] = useState<SectionList<ItemT, SectionT> | null>(null);

  const scrollToTop = () => {
    if (!scrollToTopRef?.props.sections.length) return;
    scrollToTopRef?.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
    });
  };

  return (
    <SectionListScrollToTopContext.Provider value={{ scrollToTop, setScrollToTopRef }}>{children}</SectionListScrollToTopContext.Provider>
  );
}

export function useSectionListScrollToTopContext<ItemT, SectionT>() {
  return React.useContext(SectionListScrollToTopContext) as SectionListScrollToTopContextType<ItemT, SectionT>;
}

export default SectionListScrollToTopProvider;
