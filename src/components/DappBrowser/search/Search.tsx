import React, { useState } from 'react';
import { SearchResults } from './results/SearchResults';
import { SearchBar } from './bar/SearchBar';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { TextInput } from 'react-native';

export const Search = () => {
  const searchQuery = useSharedValue<string>('');
  const inputRef = useAnimatedRef<TextInput>();
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return (
    <>
      <SearchResults inputRef={inputRef} searchQuery={searchQuery} isFocused={isFocused} />
      <SearchBar inputRef={inputRef} searchQuery={searchQuery} isFocused={isFocused} setIsFocused={setIsFocused} />
    </>
  );
};
