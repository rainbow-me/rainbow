import { noop } from 'lodash';
import React, { createContext, useRef } from 'react';
import { SectionList } from 'react-native';

export const SectionListScrollToTopContext = createContext<{
  scrollToTop: () => void;
  scrollToTopRef: React.MutableRefObject<SectionList | null>;
}>({
  scrollToTop: noop,
  scrollToTopRef: { current: null },
});

type ScrollToTopProviderProps = {
  children: React.ReactNode;
};

const SectionListScrollToTopProvider: React.FC<ScrollToTopProviderProps> = ({ children }) => {
  const scrollToTopRef = useRef<SectionList | null>(null);

  const scrollToTop = () => {
    // NOTE: Hacky way to see if the SectionList is not empty..
    if (scrollToTopRef?.current?.props.sections?.[0]?.data?.length) {
      scrollToTopRef?.current?.scrollToLocation({
        animated: true,
        itemIndex: 0,
        sectionIndex: 0,
      });
    }
  };

  return (
    <SectionListScrollToTopContext.Provider value={{ scrollToTop, scrollToTopRef }}>{children}</SectionListScrollToTopContext.Provider>
  );
};

export const useSectionListScrollToTopContext = () => React.useContext(SectionListScrollToTopContext);

export default SectionListScrollToTopProvider;
