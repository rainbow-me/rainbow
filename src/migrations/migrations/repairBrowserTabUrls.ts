import { RAINBOW_HOME } from '@/features/dapp-browser/constants/constants';
import { useBrowserHistoryStore } from '@/features/dapp-browser/stores/browserHistoryStore';
import { flushBrowserStorePersistence, useBrowserStore } from '@/features/dapp-browser/stores/browserStore';
import { normalizeUrlWorklet } from '@/features/dapp-browser/utils/browserUtils';
import { MigrationName, type Migration } from '@/migrations/types';

export function repairBrowserTabUrls(): Migration {
  return {
    name: MigrationName.repairBrowserTabUrls,
    async migrate(): Promise<void> {
      const browserState = useBrowserStore.getState();
      const needsTabRepair = browserState.tabIds.some(tabId => {
        const url = browserState.persistedTabUrls[tabId];
        return !url || normalizeUrlWorklet(url) !== url;
      });

      useBrowserHistoryStore.setState(state => {
        const recents = state.recents.filter(recent => normalizeUrlWorklet(recent.url));
        return recents.length === state.recents.length ? state : { recents };
      });

      if (!needsTabRepair) return;

      useBrowserStore.setState(state => {
        const activeTabId = state.getActiveTabId();
        const normalizedTabUrls = Object.fromEntries(
          state.tabIds.map(tabId => [tabId, normalizeUrlWorklet(state.persistedTabUrls[tabId])])
        );

        const tabIds = state.tabIds.filter(tabId => tabId === activeTabId || normalizedTabUrls[tabId]);
        const persistedTabUrls = Object.fromEntries(tabIds.map(tabId => [tabId, normalizedTabUrls[tabId] ?? RAINBOW_HOME]));

        return {
          activeTabIndex: tabIds.indexOf(activeTabId),
          persistedTabUrls,
          tabIds,
          tabsData: new Map(tabIds.map(tabId => [tabId, { ...state.getTabData(tabId), url: persistedTabUrls[tabId] }])),
        };
      });

      flushBrowserStorePersistence();
    },
  };
}
