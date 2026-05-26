import React, { createContext, useCallback, useEffect, useRef, type RefObject } from 'react';
import { type SectionList, type TextInput } from 'react-native';

import type Animated from 'react-native-reanimated';

import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { analytics } from '@/analytics';
import { useDiscoverNavigationStore, type DiscoverSection } from '@/features/discover/stores/discoverNavigationStore';

import { useTrackDiscoverScreenTime } from './useTrackDiscoverScreenTime';

export let discoverScrollToTopFnRef: () => number | null = () => null;
export let discoverOpenSearchFnRef: () => void = () => null;

type DiscoverScreenContextType = {
  sectionListRef: RefObject<SectionList | null>;
  searchInputRef: RefObject<TextInput | null>;
  cancelSearch: () => void;
  registerSectionScrollView: (section: DiscoverSection, scrollView: Animated.ScrollView | null) => void;
  scrollToSectionTop: (section: DiscoverSection) => number | null;
  scrollToTop: () => number | null;
  onTapSearch: () => void;
};

const DiscoverScreenContext = createContext<DiscoverScreenContextType | null>(null);

export const DiscoverScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const searchInputRef = useRef<TextInput>(null);
  const sectionScrollViewRefs = useRef<Partial<Record<DiscoverSection, Animated.ScrollView | null>>>({});
  const sectionListRef = useRef<SectionList>(null);

  const scrollToSectionTop = useCallback((section: DiscoverSection) => {
    try {
      sectionScrollViewRefs.current[section]?.scrollTo({ animated: true, y: 0 });
    } catch (e) {
      // Scrolling to top may fail if the section has not mounted yet.
    }
    return null;
  }, []);

  const scrollToTop = useCallback(() => {
    try {
      if (isSearching()) {
        sectionListRef.current?.scrollToLocation({ animated: true, itemIndex: 0, sectionIndex: 0 });
      } else {
        scrollToSectionTop(useDiscoverNavigationStore.getState().activeSection);
      }
    } catch (ex) {
      // Scrolling to top may fail if the list is empty.
    }
    return null;
  }, [scrollToSectionTop]);

  const registerSectionScrollView = useCallback((section: DiscoverSection, scrollView: Animated.ScrollView | null) => {
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

  useEffect(() => {
    discoverScrollToTopFnRef = scrollToTop;
    discoverOpenSearchFnRef = onTapSearch;
  }, [onTapSearch, scrollToTop]);

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
