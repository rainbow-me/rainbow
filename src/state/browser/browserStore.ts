import { debounce } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { PersistStorage, StorageValue, persist, subscribeWithSelector } from 'zustand/middleware';
import { DEFAULT_TAB_URL } from '@/components/DappBrowser/constants';
import { TabId } from '@/components/DappBrowser/types';
import { generateUniqueId, normalizeUrl } from '@/components/DappBrowser/utils';
import { RainbowError, logger } from '@/logger';

const BROWSER_STORAGE_ID = 'browserStore';
const BROWSER_STORAGE_VERSION = 0;
const PERSIST_RATE_LIMIT_MS = 3000;

const browserStorage = new MMKV({ id: BROWSER_STORAGE_ID });

const lazyPersist = debounce(
  (key: string, value: StorageValue<BrowserState>) => {
    try {
      const serializedValue = serializeBrowserState(value.state, value.version ?? BROWSER_STORAGE_VERSION);
      browserStorage.set(key, serializedValue);
    } catch (error) {
      logger.error(new RainbowError('Failed to serialize persisted browser data'), { error });
    }
  },
  PERSIST_RATE_LIMIT_MS,
  { leading: false, trailing: true, maxWait: PERSIST_RATE_LIMIT_MS }
);

function serializeBrowserState(state: BrowserState, version: number): string {
  try {
    return JSON.stringify({
      state: {
        ...state,
        tabsData: state.tabsData ? Array.from(state.tabsData.entries()) : [],
      },
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for browser storage'), { error });
    throw error;
  }
}

function deserializeBrowserState(serializedState: string): { state: BrowserState; version: number } {
  let parsedState: { state: BrowserState; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from browser storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let tabsData: Map<TabId, TabData>;
  try {
    tabsData = new Map(state.tabsData);
  } catch (error) {
    logger.error(new RainbowError('Failed to convert tabsData from browser storage'), { error });
    throw error;
  }

  const persistedTabUrls = state.persistedTabUrls || {};

  // Restore persisted tab URLs if any exist
  state.tabIds.forEach((tabId: TabId) => {
    const persistedUrl = persistedTabUrls[tabId];
    if (persistedUrl) {
      const tabData = tabsData.get(tabId);
      if (tabData) {
        tabData.url = persistedUrl;
      } else {
        logger.warn(`No tabData found for tabId ${tabId} during URL restoration`);
      }
    }
  });

  return {
    state: {
      ...state,
      // The stored tab index may be negative here in the event a tab was closed and then the app was quit.
      // See BrowserWorkletsContext -> closeTabWorklet for details.
      activeTabIndex: Math.abs(state.activeTabIndex),
      tabsData,
    },
    version,
  };
}

const persistedBrowserStorage: PersistStorage<BrowserState> = {
  getItem: key => {
    const serializedValue = browserStorage.getString(key);
    if (!serializedValue) return null;
    return deserializeBrowserState(serializedValue);
  },
  setItem: (key, value) => lazyPersist(key, value),
  removeItem: key => browserStorage.delete(key),
};

const INITIAL_ACTIVE_TAB_INDEX = 0;
const INITIAL_TAB_IDS = [generateUniqueId()];
const INITIAL_TABS_DATA = new Map([[INITIAL_TAB_IDS[0], { url: DEFAULT_TAB_URL }]]);
const INITIAL_PERSISTED_TAB_URLS: Record<TabId, string> = { [INITIAL_TAB_IDS[0]]: DEFAULT_TAB_URL };

const INITIAL_STATE = {
  activeTabIndex: INITIAL_ACTIVE_TAB_INDEX,
  persistedTabUrls: INITIAL_PERSISTED_TAB_URLS,
  tabIds: INITIAL_TAB_IDS,
  tabsData: INITIAL_TABS_DATA,
};

type TabData = { logoUrl?: string; url: string };

interface BrowserStore {
  activeTabIndex: number;
  persistedTabUrls: Record<TabId, string>;
  tabIds: TabId[];
  tabsData: Map<TabId, TabData>;
  getActiveTabId: () => TabId;
  getActiveTabIndex: () => number;
  getActiveTabLogo: () => string | undefined;
  getTabData: (tabId: TabId) => TabData;
  getTabIds: () => TabId[];
  getTabsData: () => Map<TabId, TabData>;
  goToPage: (url: string, tabId?: TabId) => void;
  isTabActive: (tabId: TabId) => boolean;
  setActiveTabIndex: (index: number) => void;
  setLogo: (logoUrl: string, tabId: TabId) => void;
  setTabIds: (tabIds: TabId[]) => void;
  silentlySetPersistedTabUrls: (persistedTabUrls: Record<TabId, string>) => void;
}

type BrowserState = Pick<BrowserStore, 'activeTabIndex' | 'persistedTabUrls' | 'tabIds' | 'tabsData'>;

export const useBrowserStore = create<BrowserStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,

        getActiveTabId: () => get().tabIds[get().activeTabIndex],

        getActiveTabIndex: () => get().activeTabIndex,

        getActiveTabLogo: () => get().tabsData.get(get().tabIds[get().activeTabIndex])?.logoUrl,

        getTabData: (tabId: string) => get().tabsData.get(tabId) || { url: DEFAULT_TAB_URL },

        getTabIds: () => get().tabIds,

        getTabsData: () => get().tabsData,

        goToPage: (url: string, tabId?: string) =>
          set(state => {
            const tabIdToUse = tabId || state.tabIds[state.activeTabIndex];
            const existingTabData = state.tabsData.get(tabIdToUse);
            if (existingTabData?.url !== url) {
              const newTabsData = new Map(state.tabsData);
              newTabsData.set(tabIdToUse, { ...existingTabData, url: normalizeUrl(url) });
              return { tabsData: newTabsData };
            }
            return state;
          }),

        isTabActive: (tabId: string) => get().getActiveTabId() === tabId,

        setActiveTabIndex: (index: number) =>
          set(state => {
            if (state.activeTabIndex !== index) {
              return { activeTabIndex: index };
            }
            return state;
          }),

        setLogo: (tabId: string, logoUrl: string) =>
          set(state => {
            const existingTabData = state.tabsData.get(tabId);
            if (existingTabData && existingTabData.logoUrl !== logoUrl) {
              const updatedTabData = { ...existingTabData, logoUrl };
              const newTabsData = new Map(state.tabsData);
              newTabsData.set(tabId, updatedTabData);
              return { tabsData: newTabsData };
            }
            return state;
          }),

        setTabIds: (newTabIds: string[]) =>
          set(state => {
            const existingTabIds = state.tabIds.filter(id => newTabIds.includes(id));
            const addedTabIds = newTabIds.filter(id => !state.tabIds.includes(id));
            const newTabsData = new Map(state.tabsData);
            addedTabIds.forEach(id => newTabsData.set(id, { url: DEFAULT_TAB_URL }));
            return { tabIds: [...existingTabIds, ...addedTabIds], tabsData: newTabsData };
          }),

        silentlySetPersistedTabUrls: (persistedTabUrls: Record<TabId, string>) =>
          set(() => {
            return { persistedTabUrls: persistedTabUrls };
          }),
      }),
      {
        name: BROWSER_STORAGE_ID,
        partialize: state => ({
          activeTabIndex: state.activeTabIndex,
          persistedTabUrls: state.persistedTabUrls,
          tabIds: state.tabIds,
          tabsData: state.tabsData,
        }),
        storage: persistedBrowserStorage,
        version: BROWSER_STORAGE_VERSION,
      }
    )
  )
);
