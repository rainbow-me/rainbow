import React, { createContext, useState } from 'react';
import { SectionList } from 'react-native';

export const SectionListScrollToTopContext = createContext<{
  scrollToTop: () => void;
  setScrollToTopRef: (ref: SectionList | null) => void;
}>({
  scrollToTop: () => {},
  setScrollToTopRef: () => {},
});

type ScrollToTopProviderProps = {
  children: React.ReactNode;
};

const SectionListScrollToTopProvider: React.FC<ScrollToTopProviderProps> = ({ children }) => {
  const [scrollToTopRef, setScrollToTopRef] = useState<SectionList | null>(null);

  const scrollToTop = () => {
    scrollToTopRef?.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
    });
  };

  return (
    <SectionListScrollToTopContext.Provider value={{ scrollToTop, setScrollToTopRef }}>{children}</SectionListScrollToTopContext.Provider>
  );
};

export const useSectionListScrollToTopContext = () => React.useContext(SectionListScrollToTopContext);

export default SectionListScrollToTopProvider;
