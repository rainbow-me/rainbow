import { analytics } from '@/analytics';
import React, { createContext, Dispatch, SetStateAction, RefObject, useState, useRef, useCallback } from 'react';
import { SectionList, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTrackDiscoverScreenTime } from './useTrackDiscoverScreenTime';

type DiscoverScreenContextType = {
  scrollViewRef: RefObject<Animated.ScrollView>;
  sectionListRef: RefObject<SectionList>;
  searchInputRef: RefObject<TextInput>;
  isSearching: boolean;
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isFetchingEns: boolean;
  setIsFetchingEns: Dispatch<SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  cancelSearch: () => void;
  scrollToTop: () => number | null;
  onTapSearch: () => void;
};

const DiscoverScreenContext = createContext<DiscoverScreenContextType | null>(null);

const sendQueryAnalytics = (query: string) => {
  if (query.length > 1) {
    analytics.track('Search Query', {
      category: 'discover',
      length: query.length,
      query: query,
    });
  }
};

const DiscoverScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSearching, setIsSearching] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEns, setIsFetchingEns] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const sectionListRef = useRef<SectionList>(null);

  const scrollToTop = useCallback(() => {
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

    return null;
  }, [isSearching]);

  const onTapSearch = useCallback(() => {
    if (isSearching) {
      scrollToTop();
      searchInputRef.current?.focus();
    } else {
      setIsSearching(true);
      analytics.track('Tapped Search', {
        category: 'discover',
      });
    }
  }, [isSearching, scrollToTop]);

  const cancelSearch = useCallback(() => {
    searchInputRef.current?.blur();
    sendQueryAnalytics(searchQuery.trim());
    setIsLoading(false);
    setSearchQuery('');
    setIsSearching(false);
  }, [searchQuery]);

  useTrackDiscoverScreenTime();

  return (
    <DiscoverScreenContext.Provider
      value={{
        scrollViewRef,
        sectionListRef,
        searchInputRef,
        isSearching,
        setIsSearching,
        isLoading,
        setIsLoading,
        isFetchingEns,
        setIsFetchingEns,
        searchQuery,
        setSearchQuery,
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
