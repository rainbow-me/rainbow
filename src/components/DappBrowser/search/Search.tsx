import React from 'react';
import { SearchResults } from './results/SearchResults';
import { SearchBar } from './bar/SearchBar';
import { SearchContextProvider } from './SearchContext';
import { DappsContextProvider } from '@/resources/metadata/dapps';

export const Search = () => (
  <SearchContextProvider>
    <DappsContextProvider>
      <SearchResults />
    </DappsContextProvider>
    <SearchBar />
  </SearchContextProvider>
);
