import create from 'zustand';

import { createStore } from '../internal/createStore';
import { generateUniqueId } from '@/components/DappBrowser/utils';
import { RAINBOW_HOME } from '@/components/DappBrowser/constants';
import { isEqual } from 'lodash';

export interface Site {
  name: string;
  url: string;
  image: string;
  screenshot?: string;
  timestamp: number;
}

export interface TabState {
  canGoBack: boolean;
  canGoForward: boolean;
  uniqueId: string;
  url: string;
  logoUrl?: string | null;
}

interface BrowserStateStore {
  activeTabIndex: number;
  getActiveTabState: () => TabState | undefined;
  setActiveTabIndex: (newIndex: number) => void;
  tabStates: TabState[];
  updateTabStates: (newState: TabState[]) => void;
  updateActiveTabState: (newState: Partial<TabState>, tabId?: string) => void;
}

const DEFAULT_TAB_STATE: TabState[] = [{ canGoBack: false, canGoForward: false, uniqueId: generateUniqueId(), url: RAINBOW_HOME }];

export const browserStateStore = createStore<BrowserStateStore>((set, get) => ({
  activeTabIndex: 0,
  getActiveTabState: () => {
    const { tabStates, activeTabIndex } = get();
    if (!tabStates) return;
    return tabStates[activeTabIndex];
  },
  setActiveTabIndex: (newIndex: number) => {
    set({ activeTabIndex: newIndex });
  },
  tabStates: DEFAULT_TAB_STATE,
  updateTabStates: (newState: TabState[]) => {
    const { tabStates } = get();
    if (isEqual(tabStates, newState)) return;
    set({ tabStates: newState });
  },
  updateActiveTabState: (newState: Partial<TabState>, tabId?: string) => {
    const { tabStates, activeTabIndex } = get();
    if (!tabStates) return;

    const tabIndex = tabId ? tabStates?.findIndex(tab => tab.uniqueId === tabId) : activeTabIndex;
    if (tabIndex === -1) return;

    if (isEqual(tabStates[tabIndex], newState)) return;

    const updatedTabs = [...tabStates];
    updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], ...newState };

    set({ tabStates: updatedTabs });
  },
}));

export const useBrowserStateStore = create(browserStateStore);
