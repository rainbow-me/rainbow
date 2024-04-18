import React, { useState } from 'react';
import { SearchResults } from './results/SearchResults';
import { SearchBar } from './bar/SearchBar';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { TextInput } from 'react-native';

export const Search = () => {
  const searchQuery = useSharedValue<string>('');
  const inputRef = useAnimatedRef<TextInput>();

  return (
    <>
      <SearchResults inputRef={inputRef} searchQuery={searchQuery} />
      <SearchBar inputRef={inputRef} searchQuery={searchQuery} />
    </>
  );
};
