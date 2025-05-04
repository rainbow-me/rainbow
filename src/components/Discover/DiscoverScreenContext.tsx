import { analytics } from '@/analytics';
import React, { createContext, RefObject, useRef, useCallback, useEffect } from 'react';
import { SectionList, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { useTrackDiscoverScreenTime } from './useTrackDiscoverScreenTime';

export let discoverScrollToTopFnRef: () => number | null = () => null;
export let discoverOpenSearchFnRef: () => void = () => null;

type DiscoverScreenContextType = {
  scrollViewRef: RefObject<Animated.ScrollView>;
  sectionListRef: RefObject<SectionList>;
  searchInputRef: RefObject<TextInput>;
  cancelSearch: () => void;
  scrollToTop: () => number | null;
  onTapSearch: () => void;
};

const DiscoverScreenContext = createContext<DiscoverScreenContextType | null>(null);

const DiscoverScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  const searchInputRef = useRef<TextInput>(null);

  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const sectionListRef = useRef<SectionList>(null);

  const scrollToTop = useCallback(() => {
    try {
      if (isSearching) {
        sectionListRef.current?.scrollToLocation({
          itemIndex: 0,
          sectionIndex: 0,
          animated: true,
        });
      } else {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        });
      }
    } catch (ex) {
      // Scrolling to top may fail if the list is empty.
    }

    return null;
  }, [isSearching]);

  const onTapSearch = useCallback(() => {
    if (isSearching) {
      scrollToTop();
      searchInputRef.current?.focus();
    } else {
      useDiscoverSearchQueryStore.setState({ isSearching: true });
      analytics.track(analytics.event.discoverTapSearch, {
        category: 'discover',
      });
    }
  }, [isSearching, scrollToTop]);

  useEffect(() => {
    discoverScrollToTopFnRef = scrollToTop;
  }, [scrollToTop]);

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
        scrollViewRef,
        sectionListRef,
        searchInputRef,
        cancelSearch,
        scrollToTop,
        onTapSearch,
      }}
    >
      {children}
    </DiscoverScreenContext.Provider>
  );
};

export default DiscoverScreenProvider;

export const useDiscoverScreenContext = () => {
  const context = React.useContext(DiscoverScreenContext);
  if (!context) {
    throw new Error('useDiscoverScreenContext must be used within a DiscoverScreenProvider');
  }
  return context;
};
