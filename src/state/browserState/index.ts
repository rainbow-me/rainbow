import create from 'zustand';
import { createStore } from '../internal/createStore';

export interface Site {
  title: string;
  url: string;
  image: string;
  timestamp: number; // Assuming timestamp is a Unix timestamp for simplicity
}

export interface Tab {
  history?: Site[] | undefined[];
  title: string;
  url: string;
  screenshot?: string; // Assuming this is a URL or base64 encoded image
  isActive: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface BrowserStateStore {
  tabs: Tab[];
  addTab: (tab: Tab) => void;
  deleteTab: (tabIndex: number) => void;
  updateTab: (tabIndex: number, newTabData: Partial<Tab>) => void;
  setActiveTab: (tabIndex: number) => void;
  getActiveTab: () => Tab | undefined;
  getActiveTabIndex: () => number;
}

export const browserStateStore = createStore<BrowserStateStore>(
  (set, get) => ({
    tabs: [], // Initial state of tabs is an empty array for now

    addTab: (tab: Tab) =>
      set((state: { tabs: Tab[] }) => ({
        tabs: [...state.tabs, { ...tab, isActive: false }],
      })),

    deleteTab: (tabIndex: number) =>
      set((state: { tabs: Tab[] }) => {
        const newTabs = state.tabs.filter((_, index) => index !== tabIndex);
        // If the deleted tab was active, set the next tab as active, or the previous one if it was the last tab
        if (state.tabs[tabIndex].isActive) {
          if (newTabs.length > 0) {
            if (tabIndex === 0 || tabIndex < newTabs.length) {
              newTabs[tabIndex].isActive = true;
            } else {
              newTabs[tabIndex - 1].isActive = true;
            }
          }
        }
        return { tabs: newTabs };
      }),

    updateTab: (tabIndex: number, newTabData: Partial<Tab>) => {
      set((state: { tabs: Tab[] }) => ({
        tabs: state.tabs.map((tab: Tab, index: number) => (index === tabIndex ? { ...tab, ...newTabData, timestamp: Date.now() } : tab)),
      }));
    },

    setActiveTab: (tabIndex: number) =>
      set((state: { tabs: Tab[] }) => ({
        tabs: state.tabs.map((tab: Tab, index: number) => ({
          ...tab,
          isActive: index === tabIndex,
        })),
      })),

    getActiveTab: () => get().tabs.find((tab: { isActive: boolean }) => tab.isActive),
    getActiveTabIndex: () => get().tabs.findIndex((tab: { isActive: boolean }) => tab.isActive),
  }),
  {
    persist: {
      name: 'browserState',
      version: 0,
    },
  }
);

export const useBrowserStateStore = create(browserStateStore);
