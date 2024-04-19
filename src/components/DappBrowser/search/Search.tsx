import React from 'react';
import { SearchResults } from './results/SearchResults';
import { SearchBar } from './bar/SearchBar';
import { SearchContextProvider } from './SearchContext';
import { DappsContextProvider } from '@/resources/metadata/dapps';
import { SharedValue } from 'react-native-reanimated';
import { TabState } from '../types';

export const Search = ({
  activeTabIndex,
  tabStates,
  tabViewProgress,
  tabViewVisible,
  updateActiveTabState,
  getActiveTabState,
  animatedActiveTabIndex,
  toggleTabViewWorklet,
}: {
  activeTabIndex: number;
  tabViewProgress: SharedValue<number> | undefined;
  tabStates: TabState[];
  tabViewVisible: SharedValue<boolean> | undefined;
  updateActiveTabState: (newState: Partial<TabState>, tabId?: string | undefined) => void;
  getActiveTabState: () => TabState | undefined;
  animatedActiveTabIndex: SharedValue<number> | undefined;
  toggleTabViewWorklet(tabIndex?: number): void;
}) => (
  <SearchContextProvider>
    <DappsContextProvider>
      <SearchResults updateActiveTabState={updateActiveTabState} />
    </DappsContextProvider>
    <SearchBar
      activeTabIndex={activeTabIndex}
      getActiveTabState={getActiveTabState}
      animatedActiveTabIndex={animatedActiveTabIndex}
      toggleTabViewWorklet={toggleTabViewWorklet}
      tabViewVisible={tabViewVisible}
      tabViewProgress={tabViewProgress}
      tabStates={tabStates}
      updateActiveTabState={updateActiveTabState}
    />
  </SearchContextProvider>
);
