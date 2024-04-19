import React, { createContext, useContext } from 'react';
import { TextInput } from 'react-native';
import { AnimatedRef, SharedValue, useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { Dapp } from '@/resources/metadata/dapps';

interface SearchContextType {
  searchQuery: SharedValue<string> | undefined;
  searchResults: SharedValue<Dapp[]> | undefined;
  inputRef: AnimatedRef<TextInput>;
  isFocused: SharedValue<boolean> | undefined;
}

const DEFAULT_SEARCH_CONTEXT: SearchContextType = {
  searchQuery: undefined,
  searchResults: undefined,
  // @ts-expect-error Explicitly allowing null/undefined on the AnimatedRef causes type issues
  inputRef: { current: null },
  isFocused: undefined,
};

const SearchContext = createContext<SearchContextType>(DEFAULT_SEARCH_CONTEXT);

export const useSearchContext = () => useContext(SearchContext);

export const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
  const searchQuery = useSharedValue<string>('');
  const searchResults = useSharedValue<Dapp[]>([]);
  const inputRef = useAnimatedRef<TextInput>();
  const isFocused = useSharedValue<boolean>(false);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        searchResults,
        inputRef,
        isFocused,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
