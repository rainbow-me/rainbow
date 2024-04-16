import { useCallback, useEffect, useState } from 'react';
import { MMKV, useMMKVObject } from 'react-native-mmkv';
import { RAINBOW_HOME } from './constants';
import { generateUniqueId, generateUniqueIdWorklet } from './utils';
import isEqual from 'react-fast-compare';
import { runOnJS, runOnUI, useAnimatedReaction, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserTabViewProgressContext } from './BrowserContext';
import { TabOperation, TabState } from './types';

const tabStateStore = new MMKV();

const DEFAULT_TAB_STATE: TabState[] = [{ canGoBack: false, canGoForward: false, uniqueId: generateUniqueId(), url: RAINBOW_HOME }];

const defaultActiveTabIndex = tabStateStore.getNumber('activeTabIndex') || 0;

console.log('defaultActiveTabIndex', defaultActiveTabIndex);

export function useBrowserState() {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(defaultActiveTabIndex);
  const [tabStates = DEFAULT_TAB_STATE, setTabStates] = useMMKVObject<TabState[]>('tabStateStorage', tabStateStore);
  const tabOperationQueue = useSharedValue<TabOperation[]>([]);
  const shouldBlockOperationQueue = useSharedValue(false);
  const currentlyOpenTabIds = useSharedValue(tabStates?.map(tab => tab.uniqueId) || []);
  const tabViewVisible = useSharedValue(false);
  const animatedActiveTabIndex = useSharedValue(defaultActiveTabIndex);
  const { tabViewProgress } = useBrowserTabViewProgressContext();

  useEffect(() => {
    setTimeout(() => {
      tabStateStore.set('activeTabIndex', activeTabIndex);
      console.log('active tab index persisted', activeTabIndex);
    }, 1);
  }, [activeTabIndex]);

  const updateActiveTabState = useCallback(
    (newState: Partial<TabState>, tabId?: string) => {
      if (!tabStates) return;

      const tabIndex = tabId ? tabStates?.findIndex(tab => tab.uniqueId === tabId) : activeTabIndex;
      if (tabIndex === -1) return;

      if (isEqual(tabStates[tabIndex], newState)) return;

      const updatedTabs = [...tabStates];
      updatedTabs[tabIndex] = { ...updatedTabs[tabIndex], ...newState };

      setTabStates(updatedTabs);
    },
    [activeTabIndex, setTabStates, tabStates]
  );

  const getActiveTabState = useCallback(() => {
    if (!tabStates) return;
    return tabStates[activeTabIndex];
  }, [activeTabIndex, tabStates]);

  const requestTabOperationsWorklet = useCallback(
    (operations: TabOperation | TabOperation[]) => {
      'worklet';
      if (Array.isArray(operations)) {
        tabOperationQueue.modify(currentQueue => {
          currentQueue.push(...operations);
          return currentQueue;
        });
      } else {
        tabOperationQueue.modify(currentQueue => {
          currentQueue.push(operations);
          return currentQueue;
        });
      }
    },
    [tabOperationQueue]
  );

  const newTabWorklet = useCallback(
    (newTabUrl?: string) => {
      'worklet';
      const tabIdsInStates = new Set(tabStates?.map(state => state.uniqueId));
      const isNewTabOperationPending =
        tabOperationQueue.value.some(operation => operation.type === 'newTab') ||
        currentlyOpenTabIds.value.some(tabId => !tabIdsInStates.has(tabId));

      // The first check is mainly to guard against an edge case that happens when the new tab button is
      // pressed just after the last tab is closed, but before a new blank tab has opened programatically,
      // which results in two tabs being created when the user most certainly only wanted one.
      if (newTabUrl || (!isNewTabOperationPending && (tabViewVisible.value || currentlyOpenTabIds.value.length === 0))) {
        const tabIdForNewTab = generateUniqueIdWorklet();
        const newActiveIndex = currentlyOpenTabIds.value.length - 1;

        currentlyOpenTabIds.modify(value => {
          value.push(tabIdForNewTab);
          return value;
        });
        requestTabOperationsWorklet({ type: 'newTab', tabId: tabIdForNewTab, newActiveIndex, newTabUrl });
      }
    },
    [currentlyOpenTabIds, requestTabOperationsWorklet, tabOperationQueue.value, tabStates, tabViewVisible.value]
  );

  const closeAllTabsWorklet = useCallback(() => {
    'worklet';
    const tabsToClose: TabOperation[] = currentlyOpenTabIds.value.map(tabId => ({ type: 'closeTab', tabId, newActiveIndex: undefined }));
    currentlyOpenTabIds.modify(value => {
      value.splice(0, value.length);
      return value;
    });
    requestTabOperationsWorklet(tabsToClose);
    newTabWorklet();
  }, [currentlyOpenTabIds, newTabWorklet, requestTabOperationsWorklet]);

  const closeTabWorklet = useCallback(
    (tabId: string, tabIndex: number) => {
      'worklet';

      // Note: The closed tab is removed from currentlyOpenTabIds ahead of time in BrowserTab as soon
      // as the tab is swiped away, so that any operations applied between the time the swipe gesture
      // is released and the time the tab is actually closed are aware of the pending deletion of the
      // tab. The logic below assumes that the tab has already been removed from currentlyOpenTabIds.

      const currentActiveIndex = Math.abs(animatedActiveTabIndex.value);
      const isActiveTab = tabIndex === currentActiveIndex;
      const isLastRemainingTab = currentlyOpenTabIds.value.length === 0;
      // ⬆️ These two ⬇️ checks account for the tab already being removed from currentlyOpenTabIds
      const tabExistsAtNextIndex = tabIndex < currentlyOpenTabIds.value.length;

      let newActiveIndex: number | undefined = currentActiveIndex;

      if (isLastRemainingTab) {
        requestTabOperationsWorklet({ type: 'closeTab', tabId, newActiveIndex: 0 });
        newTabWorklet();
        return;
      } else if (isActiveTab) {
        newActiveIndex = tabExistsAtNextIndex ? tabIndex : tabIndex - 1;
      } else if (tabIndex < currentActiveIndex) {
        newActiveIndex = currentActiveIndex - 1;
      }

      const tabIdsInStates = new Set(tabStates?.map(tab => tab.uniqueId));
      const isNewTabOperationPending =
        tabOperationQueue.value.some(operation => operation.type === 'newTab') ||
        currentlyOpenTabIds.value.some(tabId => !tabIdsInStates.has(tabId));

      if (!isNewTabOperationPending && tabViewVisible.value) {
        // To avoid unfreezing a WebView every time a tab is closed, we set the active tab index to the
        // negative index of the tab that should become active if the tab view is exited via the "Done"
        // button. Then in toggleTabViewWorklet(), if no new active index is provided and the active tab
        // index is negative, we handling using the negative index to set the correct active tab index.
        newActiveIndex = -newActiveIndex;
      } else {
        newActiveIndex = undefined;
      }

      requestTabOperationsWorklet({ type: 'closeTab', tabId, newActiveIndex });
    },
    [animatedActiveTabIndex, currentlyOpenTabIds, newTabWorklet, requestTabOperationsWorklet, tabOperationQueue, tabStates, tabViewVisible]
  );

  const toggleTabViewWorklet = useCallback(
    (activeIndex?: number) => {
      'worklet';
      const willTabViewBecomeVisible = !tabViewVisible.value;
      const tabIndexProvided = activeIndex !== undefined;

      if (!willTabViewBecomeVisible && tabIndexProvided) {
        animatedActiveTabIndex.value = activeIndex;
        runOnJS(setActiveTabIndex)(activeIndex);
      } else if (!willTabViewBecomeVisible && animatedActiveTabIndex.value < 0) {
        // If the index is negative here, it indicates that a previously active tab was closed,
        // and the tab view was then exited via the "Done" button. We can identify the correct
        // tab to make active now by flipping the current index back to a positive number.
        // Note: The code that sets this negative index can be found in closeTabWorklet().
        const indexToMakeActive = Math.abs(animatedActiveTabIndex.value);

        if (indexToMakeActive < currentlyOpenTabIds.value.length) {
          animatedActiveTabIndex.value = indexToMakeActive;
          runOnJS(setActiveTabIndex)(indexToMakeActive);
        } else {
          animatedActiveTabIndex.value = currentlyOpenTabIds.value.length - 1;
          runOnJS(setActiveTabIndex)(currentlyOpenTabIds.value.length - 1);
        }
      }

      if (tabViewProgress !== undefined) {
        tabViewProgress.value = willTabViewBecomeVisible
          ? withSpring(100, SPRING_CONFIGS.browserTabTransition)
          : withSpring(0, SPRING_CONFIGS.browserTabTransition);
      }

      tabViewVisible.value = willTabViewBecomeVisible;
    },
    [animatedActiveTabIndex, currentlyOpenTabIds, tabViewProgress, tabViewVisible]
  );

  const setTabStatesThenUnblockQueue = useCallback(
    (updatedTabStates: TabState[], shouldToggleTabView?: boolean, indexToMakeActive?: number) => {
      setTabStates(updatedTabStates);

      if (shouldToggleTabView) {
        runOnUI(toggleTabViewWorklet)(indexToMakeActive);
      } else if (indexToMakeActive !== undefined) {
        setActiveTabIndex(indexToMakeActive);
      }

      shouldBlockOperationQueue.value = false;
    },
    [setTabStates, shouldBlockOperationQueue, toggleTabViewWorklet]
  );

  const processOperationQueueWorklet = useCallback(() => {
    'worklet';
    if (shouldBlockOperationQueue.value || tabOperationQueue.value.length === 0) {
      return;
    }

    shouldBlockOperationQueue.value = true;

    let shouldToggleTabView = false;
    let newActiveIndex: number | undefined = animatedActiveTabIndex.value;

    tabOperationQueue.modify(currentQueue => {
      const newTabStates = tabStates || [];
      // Process closeTab operations from oldest to newest
      for (let i = 0; i < currentQueue.length; i++) {
        const operation = currentQueue[i];
        if (operation.type === 'closeTab') {
          const indexToClose = newTabStates.findIndex(tab => tab.uniqueId === operation.tabId);
          if (indexToClose !== -1) {
            newTabStates.splice(indexToClose, 1);
            // Check to ensure we are setting a valid active tab index
            if (operation.newActiveIndex === undefined) {
              newActiveIndex = undefined;
            } else {
              const requestedNewActiveIndex = Math.abs(operation.newActiveIndex);
              const isRequestedIndexValid = requestedNewActiveIndex >= 0 && requestedNewActiveIndex < currentlyOpenTabIds.value.length;
              if (isRequestedIndexValid) {
                newActiveIndex = operation.newActiveIndex;
              } else {
                // Make the last tab active if the requested index is not found
                // (Negative to avoid immediately making the tab active - see notes in closeTabWorklet())
                newActiveIndex = -(currentlyOpenTabIds.value.length - 1);
              }
            }
          }
          // Remove the operation from the queue after processing
          currentQueue.splice(i, 1);
        }
      }
      // Then process newTab operations from oldest to newest
      for (let i = 0; i < currentQueue.length; i++) {
        const operation = currentQueue[i];
        if (operation.type === 'newTab') {
          // Check to ensure the tabId exists in currentlyOpenTabIds before creating the tab
          const indexForNewTab = currentlyOpenTabIds.value.findIndex(tabId => tabId === operation.tabId);
          if (indexForNewTab !== -1) {
            const newTab = {
              canGoBack: false,
              canGoForward: false,
              uniqueId: operation.tabId,
              url: operation.newTabUrl || RAINBOW_HOME,
            };
            newTabStates.push(newTab);
            if (tabViewVisible?.value) shouldToggleTabView = true;
            newActiveIndex = indexForNewTab;
          } else {
            // ⚠️ TODO: Add logging here to report any time a new tab operation is given a nonexistent
            // tabId (should never happen)
          }
          // Remove the operation from the queue after processing
          currentQueue.splice(i, 1);
        }
      }

      // Double check to ensure the newActiveIndex is valid
      if (newActiveIndex !== undefined && (tabViewVisible.value || newActiveIndex >= 0)) {
        animatedActiveTabIndex.value = newActiveIndex;
      } else {
        const currentActiveIndex = tabViewVisible?.value ? Math.abs(animatedActiveTabIndex.value) : animatedActiveTabIndex.value;
        const isCurrentIndexValid = currentActiveIndex >= 0 && currentActiveIndex < currentlyOpenTabIds.value.length;
        const indexToSet = isCurrentIndexValid ? animatedActiveTabIndex.value : currentlyOpenTabIds.value.length - 1;
        newActiveIndex = indexToSet;
        animatedActiveTabIndex.value = indexToSet;
      }

      // Remove any remaining tabs that exist in tabStates but not in currentlyOpenTabIds. This covers
      // cases where tabStates hasn't yet been updated between tab close operations.
      for (let i = newTabStates.length - 1; i >= 0; i--) {
        if (!currentlyOpenTabIds.value.includes(newTabStates[i].uniqueId)) {
          newTabStates.splice(i, 1);
        }
      }

      runOnJS(setTabStatesThenUnblockQueue)(
        newTabStates,
        shouldToggleTabView,
        // If a new tab was created, the new tab will be the last tab and it should be made active now.
        // We've already set the animatedActiveTabIndex to the correct index above, but the JS-side
        // activeTabIndex still needs to be set, so we pass it along to setTabStatesThenUnblockQueue().
        newActiveIndex
      );

      // Return the remaining queue after processing, which should be empty
      return currentQueue;
    });
  }, [
    animatedActiveTabIndex,
    currentlyOpenTabIds,
    setTabStatesThenUnblockQueue,
    shouldBlockOperationQueue,
    tabOperationQueue,
    tabStates,
    tabViewVisible,
  ]);

  useAnimatedReaction(
    () => ({
      operations: tabOperationQueue.value,
      shouldBlock: shouldBlockOperationQueue.value,
    }),
    (current, previous) => {
      if (previous && current !== previous && current.operations.length > 0) {
        processOperationQueueWorklet();
      }
    }
  );

  console.log('useBrowserState :: hook called', { defaultActiveTabIndex, activeTabIndex });

  return {
    activeTabIndex,
    tabViewProgress,
    animatedActiveTabIndex,
    tabViewVisible,
    currentlyOpenTabIds,
    tabStates,
    updateActiveTabState,
    getActiveTabState,
    setActiveTabIndex,
    newTabWorklet,
    closeTabWorklet,
    closeAllTabsWorklet,
    toggleTabViewWorklet,
  };
}
