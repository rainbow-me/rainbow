import { RAINBOW_HOME } from '@/features/dapp-browser/constants/constants';
import { flushBrowserStorePersistence, useBrowserStore } from '@/features/dapp-browser/stores/browserStore';
import { isRestorableUrlWorklet } from '@/features/dapp-browser/utils/browserUtils';
import { MigrationName, type Migration } from '@/migrations/types';

export function repairBrowserTabUrls(): Migration {
  return {
    name: MigrationName.repairBrowserTabUrls,
    async migrate(): Promise<void> {
      const browserState = useBrowserStore.getState();
      const hasInvalidTab = browserState.tabIds.some(tabId => !isRestorableUrlWorklet(browserState.persistedTabUrls[tabId]));

      if (!hasInvalidTab) return;

      useBrowserStore.setState(state => {
        const activeTabId = state.getActiveTabId();
        const tabIds = state.tabIds.filter(tabId => tabId === activeTabId || isRestorableUrlWorklet(state.persistedTabUrls[tabId]));
        const persistedTabUrls = Object.fromEntries(
          tabIds.map(tabId => [tabId, isRestorableUrlWorklet(state.persistedTabUrls[tabId]) ? state.persistedTabUrls[tabId] : RAINBOW_HOME])
        );

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
