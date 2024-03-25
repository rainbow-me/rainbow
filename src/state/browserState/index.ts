import create from 'zustand';

export interface Site {
  name: string;
  url: string;
  image: string;
  timestamp: number; // Assuming timestamp is a Unix timestamp for simplicity
}

export interface Tab {
  history: Site[];
  name: string;
  screenshot: string; // Assuming this is a URL or base64 encoded image
  isActive: boolean;
}

interface BrowserState {
  tabs: Tab[];
  addTab: (tab: Tab) => void;
  deleteTab: (tabIndex: number) => void;
  editTab: (tabIndex: number, newTabData: Partial<Tab>) => void;
  setActiveTab: (tabIndex: number) => void;
  getActiveTab: () => Tab | undefined;
  getActiveTabIndex: () => number;
}

export const useBrowserStateStore = create<BrowserState>((set, get) => ({
  tabs: [], // Initial state of tabs is an empty array for now

  addTab: tab =>
    set(state => ({
      tabs: [...state.tabs, { ...tab, isActive: false }],
    })),

  deleteTab: tabIndex =>
    set(state => {
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

  editTab: (tabIndex, newTabData) => {
    set(state => ({
      tabs: state.tabs.map((tab, index) => (index === tabIndex ? { ...tab, ...newTabData, timestamp: Date.now() } : tab)),
    }));
  },

  setActiveTab: tabIndex =>
    set(state => ({
      tabs: state.tabs.map((tab, index) => ({
        ...tab,
        isActive: index === tabIndex,
      })),
    })),

  getActiveTab: () => get().tabs.find(tab => tab.isActive),
  getActiveTabIndex: () => get().tabs.findIndex(tab => tab.isActive),
}));
