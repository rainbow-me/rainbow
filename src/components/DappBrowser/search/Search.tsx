import React from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './search-results/SearchResults';

export const Search = () => {
  return (
    <>
      <SearchResults />
      <SearchBar />
    </>
  );
};
