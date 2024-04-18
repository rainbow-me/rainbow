import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import isEqual from 'react-fast-compare';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import Animated, {
  AnimatedRef,
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useScrollViewOffset,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface SearchContextType {
  searchQuery: SharedValue<string> | undefined;
  inputRef: AnimatedRef<TextInput>;
  isFocused: boolean;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

const DEFAULT_SEARCH_CONTEXT: SearchContextType = {
  searchQuery: undefined,
  // @ts-expect-error Explicitly allowing null/undefined on the AnimatedRef causes type issues
  inputRef: { current: null },
  isFocused: false,
  setIsFocused: () => {
    return;
  },
};

const SearchContext = createContext<SearchContextType>(DEFAULT_SEARCH_CONTEXT);

export const useSearchContext = () => useContext(SearchContext);

export const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
  const searchQuery = useSharedValue<string>('');
  const inputRef = useAnimatedRef<TextInput>();
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        inputRef,
        isFocused,
        setIsFocused,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
