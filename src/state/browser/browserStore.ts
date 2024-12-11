import { debounce } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { PersistStorage, StorageValue, persist, subscribeWithSelector } from 'zustand/middleware';
import { RAINBOW_HOME } from '@/components/DappBrowser/constants';
import { TabData, TabId } from '@/components/DappBrowser/types';
import { generateUniqueIdWorklet, normalizeUrlWorklet } from '@/components/DappBrowser/utils';
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
      logger.error(new RainbowError(`[browserStore]: Failed to serialize persisted browser data`), { error });
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
    logger.error(new RainbowError(`[browserStore]: Failed to serialize state for browser storage`), { error });
    throw error;
  }
}

function deserializeBrowserState(serializedState: string): { state: BrowserState; version: number } {
  let parsedState: { state: BrowserState; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError(`[browserStore]: Failed to parse serialized state from browser storage`), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let tabsData: Map<TabId, TabData>;
  try {
    tabsData = new Map(state.tabsData);
  } catch (error) {
    logger.error(new RainbowError(`[browserStore]: Failed to convert tabsData from browser storage`), { error });
    throw error;
  }

  const originalTabIds = state.tabIds;
  const activeTabId = originalTabIds[Math.abs(state.activeTabIndex)];

  // Filter out inactive homepage tabs
  const tabIds = originalTabIds.filter(tabId => tabsData.get(tabId)?.url !== RAINBOW_HOME || tabId === activeTabId);

  // Remove entries from tabsData that don't have a corresponding tabId in tabIds
  const tabIdsSet = new Set(tabIds);
  for (const tabId of tabsData.keys()) {
    if (!tabIdsSet.has(tabId)) {
      tabsData.delete(tabId);
    } else {
      // Reset canGoBack and canGoForward for each restored tab
      tabsData.set(tabId, { ...tabsData.get(tabId), canGoBack: false, canGoForward: false });
    }
  }

  // Restore persisted tab URLs and prune URL entries for non-existent tabs
  const persistedTabUrls = state.persistedTabUrls;
  for (const [tabId, persistedUrl] of Object.entries(persistedTabUrls)) {
    if (tabIdsSet.has(tabId)) {
      const tabData = tabsData.get(tabId);
      if (tabData) {
        tabData.url = persistedUrl;
      } else {
        logger.warn(`[browserStore]: No tabData found for tabId ${tabId} during URL restoration`);
      }
    } else {
      delete persistedTabUrls[tabId];
    }
  }

  return {
    state: {
      ...state,
      activeTabIndex: tabIds.includes(activeTabId) ? tabIds.indexOf(activeTabId) : tabIds.length - 1,
      persistedTabUrls,
      tabsData,
      tabIds,
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
const INITIAL_TAB_IDS = [generateUniqueIdWorklet()];
const INITIAL_TABS_DATA = new Map([[INITIAL_TAB_IDS[0], { canGoBack: false, canGoForward: false, url: RAINBOW_HOME }]]);
const INITIAL_PERSISTED_TAB_URLS: Record<TabId, string> = { [INITIAL_TAB_IDS[0]]: RAINBOW_HOME };

export interface BrowserStore {
  activeTabIndex: number;
  persistedTabUrls: Record<TabId, string>;
  tabIds: TabId[];
  tabsData: Map<TabId, TabData>;
  getActiveTabId: () => TabId;
  getActiveTabLogo: () => string | undefined;
  getActiveTabNavState: () => { canGoBack: boolean; canGoForward: boolean };
  getActiveTabTitle: () => string | undefined;
  getActiveTabUrl: () => string | undefined;
  getTabData: (tabId: TabId) => TabData | undefined;
  getTabUrl: (tabId: TabId) => string | undefined;
  goToPage: (url: string, tabId?: TabId) => void;
  isOnHomepage: () => boolean;
  isTabActive: (tabId: TabId) => boolean;
  setActiveTabIndex: (index: number) => void;
  setLogo: (logoUrl: string | undefined, tabId: TabId) => void;
  setNavState: (navState: { canGoBack: boolean; canGoForward: boolean }, tabId: TabId) => void;
  setTabIds: (tabIds: TabId[]) => void;
  setTitle: (title: string | undefined, tabId: TabId) => void;
  silentlySetPersistedTabUrls: (persistedTabUrls: Record<TabId, string>) => void;
}

type BrowserState = Pick<BrowserStore, 'activeTabIndex' | 'persistedTabUrls' | 'tabIds' | 'tabsData'>;

export const useBrowserStore = create<BrowserStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        activeTabIndex: INITIAL_ACTIVE_TAB_INDEX,
        persistedTabUrls: INITIAL_PERSISTED_TAB_URLS,
        tabIds: INITIAL_TAB_IDS,
        tabsData: INITIAL_TABS_DATA,

        getActiveTabId: () => get().tabIds[get().activeTabIndex] || '',

        getActiveTabLogo: () => get().getTabData(get().getActiveTabId())?.logoUrl,

        getActiveTabNavState: () => {
          const tabData = get().getTabData(get().getActiveTabId());
          return { canGoBack: tabData?.canGoBack || false, canGoForward: tabData?.canGoForward || false };
        },

        getActiveTabTitle: () => get().getTabData(get().getActiveTabId())?.title,

        getActiveTabUrl: () => get().persistedTabUrls[get().getActiveTabId()],

        getTabData: tabId => get().tabsData.get(tabId) || { canGoBack: false, canGoForward: false, url: RAINBOW_HOME },

        getTabUrl: tabId => get().persistedTabUrls[tabId],

        goToPage: (url, tabId) =>
          set(state => {
            const tabIdToUse = tabId || state.getActiveTabId();
            const existingTabData = state.getTabData(tabIdToUse);

            const isGoingHome = existingTabData?.url && url === RAINBOW_HOME;
            const canGoBack = isGoingHome ? false : existingTabData?.canGoBack || false;
            const canGoForward = isGoingHome ? false : existingTabData?.canGoForward || false;
            const newTabsData = new Map(state.tabsData);

            const existingUrl = existingTabData?.url || '';
            const persistedUrl = state.persistedTabUrls[tabIdToUse] || '';
            const urlToSet = normalizeUrlWorklet(url);
            const shouldForceUrlUpdate = !isGoingHome && existingUrl === urlToSet && persistedUrl !== existingUrl;

            /**
             * In cases like the following, we need to force a URL update:
             *
             * - User opens a new tab and goes to URL X, which sets the tab's URL state (the WebView's source prop) to URL X.
             * - User then navigates to a new page from within the WebView, making the true internal URL of the WebView URL Y.
             * - At this point the WebView's source prop remains set to URL X, despite the WebView's internal URL being URL Y.
             * - If the user then manually attempts to go back to URL X from the search bar, the WebView won't detect a change
             *   in its source prop and thus won't navigate to URL X, so we first re-sync the URL state and then set URL X.
             */
            if (shouldForceUrlUpdate) {
              newTabsData.set(tabIdToUse, {
                ...existingTabData,
                url: persistedUrl,
              });

              scheduleTabUrlUpdate(urlToSet, tabIdToUse);
              return { tabsData: newTabsData };
            }

            newTabsData.set(tabIdToUse, {
              ...existingTabData,
              canGoBack,
              canGoForward,
              url: urlToSet,
            });

            return { tabsData: newTabsData };
          }),

        isOnHomepage: () => (get().getActiveTabUrl() || RAINBOW_HOME) === RAINBOW_HOME,

        isTabActive: tabId => get().getActiveTabId() === tabId,

        setActiveTabIndex: index =>
          set(state => {
            if (state.activeTabIndex !== index) {
              return { activeTabIndex: index };
            }
            return state;
          }),

        setNavState: (navState, tabId) =>
          set(state => {
            const existingTabData = state.getTabData(tabId);
            if (existingTabData?.canGoBack !== navState.canGoBack || existingTabData?.canGoForward !== navState.canGoForward) {
              const updatedTabData = { ...existingTabData, ...navState };
              const newTabsData = new Map(state.tabsData);
              newTabsData.set(tabId, updatedTabData);
              return { tabsData: newTabsData };
            }
            return state;
          }),

        setLogo: (logoUrl, tabId) =>
          set(state => {
            const existingTabData = state.getTabData(tabId);
            if (existingTabData?.logoUrl !== logoUrl) {
              const updatedTabData = { ...existingTabData, logoUrl };
              const newTabsData = new Map(state.tabsData);
              newTabsData.set(tabId, updatedTabData);
              return { tabsData: newTabsData };
            }
            return state;
          }),

        setTabIds: newTabIds =>
          set(state => {
            const existingTabIds = state.tabIds.filter(id => newTabIds.includes(id));
            const addedTabIds = newTabIds.filter(id => !state.tabIds.includes(id));
            const newTabsData = new Map(state.tabsData);
            addedTabIds.forEach(id => newTabsData.set(id, { url: state.persistedTabUrls[id] || RAINBOW_HOME }));
            return { tabIds: [...existingTabIds, ...addedTabIds], tabsData: newTabsData };
          }),

        setTitle: (title, tabId) =>
          set(state => {
            const existingTabData = state.getTabData(tabId);
            if (existingTabData?.title !== title) {
              const updatedTabData = { ...existingTabData, title };
              const newTabsData = new Map(state.tabsData);
              newTabsData.set(tabId, updatedTabData);
              return { tabsData: newTabsData };
            }
            return state;
          }),

        silentlySetPersistedTabUrls: persistedTabUrls => set(() => ({ persistedTabUrls })),
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

function scheduleTabUrlUpdate(url: string, tabId: TabId) {
  setTimeout(() => {
    useBrowserStore.getState().goToPage(url, tabId);
  }, 0);
}
