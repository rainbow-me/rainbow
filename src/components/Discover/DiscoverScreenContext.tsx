import React, { createContext, useCallback, useEffect, useRef, type RefObject } from 'react';
import { type SectionList, type TextInput } from 'react-native';

import { analytics } from '@/analytics';
import { useDiscoverNavigationStore, type DiscoverSection } from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSearchQueryStore } from '@/features/discover/stores/discoverSearchQueryStore';
import { useOnTabReselect } from '@/navigation/tabEvents';

import { useTrackDiscoverScreenTime } from './useTrackDiscoverScreenTime';

export let discoverOpenSearchFnRef: () => void = () => null;

export type DiscoverSectionScrollViewRef = {
  scrollTo: (options: { animated?: boolean; y?: number }) => void;
};

type DiscoverScreenContextType = {
  sectionListRef: RefObject<SectionList | null>;
  searchInputRef: RefObject<TextInput | null>;
  cancelSearch: () => void;
  registerSectionScrollView: (section: DiscoverSection, scrollView: DiscoverSectionScrollViewRef | null) => void;
  scrollToSectionTop: (section: DiscoverSection) => void;
  scrollToTop: () => void;
  onTapSearch: () => void;
};

const DiscoverScreenContext = createContext<DiscoverScreenContextType | null>(null);

export const DiscoverScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const searchInputRef = useRef<TextInput>(null);
  const sectionScrollViewRefs = useRef<Partial<Record<DiscoverSection, DiscoverSectionScrollViewRef | null>>>({});
  const sectionListRef = useRef<SectionList>(null);

  const scrollToSectionTop = useCallback((section: DiscoverSection): void => {
    sectionScrollViewRefs.current[section]?.scrollTo({ animated: true, y: 0 });
  }, []);

  const scrollToTop = useCallback((): void => {
    try {
      if (isSearching()) {
        sectionListRef.current?.scrollToLocation({ animated: true, itemIndex: 0, sectionIndex: 0 });
      } else {
        scrollToSectionTop(useDiscoverNavigationStore.getState().activeSection);
      }
    } catch (ex) {
      // Scrolling to top may fail if the list is empty.
    }
  }, [scrollToSectionTop]);

  const registerSectionScrollView = useCallback((section: DiscoverSection, scrollView: DiscoverSectionScrollViewRef | null) => {
    if (scrollView) {
      sectionScrollViewRefs.current[section] = scrollView;
    } else {
      delete sectionScrollViewRefs.current[section];
    }
  }, []);

  const onTapSearch = useCallback(() => {
    if (isSearching()) {
      scrollToTop();
      searchInputRef.current?.focus();
    } else {
      useDiscoverSearchQueryStore.setState({ isSearching: true });
      analytics.track(analytics.event.discoverTapSearch, { category: 'discover' });
    }
  }, [scrollToTop]);

  useOnTabReselect(scrollToTop);

  useEffect(() => {
    discoverOpenSearchFnRef = onTapSearch;
  }, [onTapSearch]);

  const cancelSearch = useCallback(() => {
    searchInputRef.current?.blur();
    useDiscoverSearchQueryStore.setState({ searchQuery: '', isSearching: false });
  }, []);

  useTrackDiscoverScreenTime();

  return (
    <DiscoverScreenContext.Provider
      value={{
        sectionListRef,
        searchInputRef,
        cancelSearch,
        registerSectionScrollView,
        scrollToSectionTop,
        scrollToTop,
        onTapSearch,
      }}
    >
      {children}
    </DiscoverScreenContext.Provider>
  );
};

export const useDiscoverScreenContext = () => {
  const context = React.useContext(DiscoverScreenContext);
  if (!context) {
    throw new Error('useDiscoverScreenContext must be used within a DiscoverScreenProvider');
  }
  return context;
};

function isSearching(): boolean {
  return useDiscoverSearchQueryStore.getState().isSearching;
}
