import React, { createContext, useContext } from 'react';
import { TextInput } from 'react-native';
import { AnimatedRef, SharedValue, useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { Dapp } from '@/resources/metadata/dapps';
import { getDefaultKeyboardHeight } from '@/redux/keyboardHeight';

interface SearchContextType {
  searchQuery: SharedValue<string>;
  searchResults: SharedValue<Dapp[]>;
  inputRef: AnimatedRef<TextInput>;
  isFocused: SharedValue<boolean>;
  keyboardHeight: SharedValue<number>;
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
  const searchQuery = useSharedValue<string>('');
  const searchResults = useSharedValue<Dapp[]>([]);
  const inputRef = useAnimatedRef<TextInput>();
  const isFocused = useSharedValue<boolean>(false);
  const keyboardHeight = useSharedValue<number>(getDefaultKeyboardHeight());

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        searchResults,
        inputRef,
        isFocused,
        keyboardHeight,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
