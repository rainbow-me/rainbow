import React, { createContext, useContext } from 'react';
import { TextInput } from 'react-native';
import { AnimatedRef, SharedValue, useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { getDefaultKeyboardHeight } from '@/redux/keyboardHeight';
import { Dapp } from '@/resources/metadata/dapps';

interface SearchContextType {
  inputRef: AnimatedRef<TextInput>;
  isFocused: SharedValue<boolean>;
  keyboardHeight: SharedValue<number>;
  searchQuery: SharedValue<string>;
  searchResults: SharedValue<Dapp[]>;
  shouldShowGoogleSearch: SharedValue<boolean>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchContextProvider');
  }
  return context;
};

export const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
  const inputRef = useAnimatedRef<TextInput>();
  const isFocused = useSharedValue<boolean>(false);
  const keyboardHeight = useSharedValue<number>(getDefaultKeyboardHeight());
  const searchQuery = useSharedValue<string>('');
  const searchResults = useSharedValue<Dapp[]>([]);
  const shouldShowGoogleSearch = useSharedValue(true);

  return (
    <SearchContext.Provider
      value={{
        inputRef,
        isFocused,
        keyboardHeight,
        searchQuery,
        searchResults,
        shouldShowGoogleSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
