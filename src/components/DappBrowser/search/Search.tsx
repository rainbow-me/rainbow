import React, { useState } from 'react';
import { SearchResults } from './results/SearchResults';
import { SearchBar } from './bar/SearchBar';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { TextInput } from 'react-native';
import { SearchContextProvider } from './SearchContext';

export const Search = () => (
  <SearchContextProvider>
    <SearchResults />
    <SearchBar />
  </SearchContextProvider>
);
