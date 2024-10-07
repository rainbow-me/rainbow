import { TokenToBuyListItem } from '@/__swaps__/screens/Swap/components/TokenList/TokenToBuyList';
import { useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { analytics } from '@/analytics';
import { ChainId } from '@/chains/types';
import React, { createContext, Dispatch, SetStateAction, RefObject, useState, useRef, useCallback } from 'react';
import { FlatList, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';

type DiscoverScreenContextType = {
  flatListRef: RefObject<FlatList<TokenToBuyListItem>>;
  scrollViewRef: RefObject<Animated.ScrollView>;
  searchInputRef: RefObject<TextInput>;
  isSearching: boolean;
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  cancelSearch: () => void;
  scrollToTop: () => number | null;
  onTapSearch: () => void;
  setIsInputFocused: (value: boolean) => void;

  isLoading: boolean;
  sections: TokenToBuyListItem[];
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
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const { isLoading, results: sections } = useSearchCurrencyLists({
    assetToSell: null,
    selectedOutputChainId: ChainId.mainnet,
    searchQuery,
    searchProfiles: true,
  });

  const scrollToTop = useCallback(() => {
    if (isSearching) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
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
    setSearchQuery('');
    setIsSearching(false);
  }, [searchQuery]);

  return (
    <DiscoverScreenContext.Provider
      value={{
        flatListRef,
        scrollViewRef,
        searchInputRef,
        isSearching,
        setIsSearching,
        searchQuery,
        setSearchQuery,
        cancelSearch,
        scrollToTop,
        onTapSearch,
        isLoading,
        sections,
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
