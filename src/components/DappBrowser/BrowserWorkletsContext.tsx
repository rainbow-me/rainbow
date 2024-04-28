import React, { createContext, useCallback, useContext } from 'react';
import { runOnJS, useAnimatedReaction, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserContext, useBrowserTabViewProgressContext } from './BrowserContext';
import { ScreenshotType, TabOperation } from './types';
import { generateUniqueIdWorklet, normalizeUrlWorklet } from './utils';
import { deepEqualWorklet } from '@/worklets/comparisons';

interface BrowserWorkletsContextType {
  closeAllTabsWorklet: () => void;
  closeTabWorklet: (tabId: string, tabIndex: number) => void;
  newTabWorklet: (newTabUrl?: string) => void;
  setScreenshotDataWorklet: (screenshotData: ScreenshotType) => void;
  toggleTabViewWorklet: (activeIndex?: number) => void;
  updateTabUrlWorklet: (url: string, tabId?: string) => void;
}

export const BrowserWorkletsContext = createContext<BrowserWorkletsContextType | undefined>(undefined);

export const useBrowserWorkletsContext = () => {
  const context = useContext(BrowserWorkletsContext);
  if (!context) {
    throw new Error('useBrowserWorkletsContext must be used within DappBrowser');
  }
  return context;
};

export const BrowserWorkletsContextProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    animatedActiveTabIndex,
    animatedScreenshotData,
    animatedTabUrls,
    currentlyBeingClosedTabIds,
    currentlyOpenTabIds,
    tabViewVisible,
  } = useBrowserContext();
  const { tabViewProgress } = useBrowserTabViewProgressContext();

  const shouldBlockOperationQueue = useSharedValue(false);
  const tabOperationQueue = useSharedValue<TabOperation[]>([]);

  const setActiveTabIndex = useBrowserStore(state => state.setActiveTabIndex);
  const silentlySetPersistedTabUrls = useBrowserStore(state => state.silentlySetPersistedTabUrls);

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
      if (newTabUrl || tabViewVisible.value || currentlyOpenTabIds.value.length === 0) {
        const tabIdForNewTab = generateUniqueIdWorklet();
        const newActiveIndex = currentlyOpenTabIds.value.length - 1;

        currentlyOpenTabIds.modify(value => {
          value.push(tabIdForNewTab);
          return value;
        });
        requestTabOperationsWorklet({ type: 'newTab', tabId: tabIdForNewTab, newActiveIndex, newTabUrl });
      }
    },
    [currentlyOpenTabIds, requestTabOperationsWorklet, tabViewVisible]
  );

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

      if (tabViewVisible.value) {
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
    [animatedActiveTabIndex, currentlyOpenTabIds, newTabWorklet, requestTabOperationsWorklet, tabViewVisible]
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

      tabViewProgress.value = willTabViewBecomeVisible
        ? withSpring(100, SPRING_CONFIGS.browserTabTransition)
        : withSpring(0, SPRING_CONFIGS.browserTabTransition);

      tabViewVisible.value = willTabViewBecomeVisible;
    },
    [animatedActiveTabIndex, currentlyOpenTabIds, setActiveTabIndex, tabViewProgress, tabViewVisible]
  );

  // ⚠️ TODO: This function is no longer responsible for orchestrating the creation or deletion of tabs.
  // Its scope is now limited to a): ensuring the setting of a valid active tab index, particularly when
  // many tabs are closed or opened in quick succession, and b): ensuring the tab view is exited after
  // new tabs are created. This logic can be simplified and consolidated due to useSyncSharedValue now
  // handling the creation and deletion of tabs. For details, see DappBrowser.tsx -> TabViewContent.
  const processOperationQueueWorklet = useCallback(() => {
    'worklet';
    if (shouldBlockOperationQueue.value || tabOperationQueue.value.length === 0) {
      return;
    }

    shouldBlockOperationQueue.value = true;

    let shouldToggleTabView = false;
    let newActiveIndex: number | undefined = animatedActiveTabIndex.value;

    tabOperationQueue.modify(currentQueue => {
      // Process closeTab operations from oldest to newest
      for (let i = 0; i < currentQueue.length; i++) {
        const operation = currentQueue[i];
        if (operation.type === 'closeTab') {
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
          // Remove the operation from the queue after processing
          currentQueue.splice(i, 1);
          // // Shift the index because we removed an item from the queue
          // i = i - 1;
        }
      }
      // Then process newTab operations from oldest to newest
      for (let i = 0; i < currentQueue.length; i++) {
        const operation = currentQueue[i];
        if (operation.type === 'newTab') {
          const indexForNewTab = currentlyOpenTabIds.value.findIndex(tabId => tabId === operation.tabId);
          if (indexForNewTab !== -1) {
            if (tabViewVisible.value) shouldToggleTabView = true;
            newActiveIndex = indexForNewTab;
          }
          // Remove the operation from the queue after processing
          currentQueue.splice(i, 1);
          // // Shift the index because we removed an item from the queue
          // i = i - 1;
        }
      }

      // Double check to ensure the newActiveIndex is valid
      if (newActiveIndex !== undefined && (tabViewVisible.value || newActiveIndex >= 0)) {
        animatedActiveTabIndex.value = newActiveIndex;
      } else {
        const currentActiveIndex = tabViewVisible.value ? Math.abs(animatedActiveTabIndex.value) : animatedActiveTabIndex.value;
        const isCurrentIndexValid = currentActiveIndex >= 0 && currentActiveIndex < currentlyOpenTabIds.value.length;
        const indexToSet = isCurrentIndexValid ? animatedActiveTabIndex.value : currentlyOpenTabIds.value.length - 1;
        newActiveIndex = indexToSet;
        animatedActiveTabIndex.value = indexToSet;
      }

      // Return the remaining queue after processing, which should be empty
      return currentQueue;
    });

    if (shouldToggleTabView) {
      toggleTabViewWorklet(newActiveIndex);
    } else if (newActiveIndex !== undefined) {
      runOnJS(setActiveTabIndex)(newActiveIndex);
    }

    shouldBlockOperationQueue.value = false;
  }, [
    animatedActiveTabIndex,
    currentlyOpenTabIds,
    setActiveTabIndex,
    shouldBlockOperationQueue,
    tabOperationQueue,
    tabViewVisible,
    toggleTabViewWorklet,
  ]);

  const setScreenshotDataWorklet = useCallback(
    (screenshotData: ScreenshotType) => {
      'worklet';
      animatedScreenshotData.modify(existingData => ({ ...existingData, [screenshotData.id]: screenshotData }));
    },
    [animatedScreenshotData]
  );

  const updateTabUrlWorklet = useCallback(
    (url: string, tabId?: string) => {
      'worklet';
      const tabIdToUse = tabId || currentlyOpenTabIds.value[animatedActiveTabIndex.value];
      animatedTabUrls.modify(urls => ({ ...urls, [tabIdToUse]: normalizeUrlWorklet(url) }));
    },
    [animatedActiveTabIndex, animatedTabUrls, currentlyOpenTabIds]
  );

  useAnimatedReaction(
    () => animatedTabUrls.value,
    (current, previous) => {
      if (previous && !deepEqualWorklet(current, previous)) {
        // Prune any URLs belonging to tabs that have been closed
        animatedTabUrls.modify(urls => {
          Object.keys(urls).forEach(tabId => {
            if (!currentlyOpenTabIds.value.includes(tabId)) {
              delete urls[tabId];
            }
          });
          return urls;
        });
        // Ensures the most up-to-date tab URLs are persisted without triggering any side effects
        runOnJS(silentlySetPersistedTabUrls)(animatedTabUrls.value);
      }
    }
  );

  useAnimatedReaction(
    () => ({
      areTabCloseAnimationsRunning: currentlyBeingClosedTabIds.value.length > 0,
      operations: tabOperationQueue.value,
      shouldBlock: shouldBlockOperationQueue.value,
    }),
    (current, previous) => {
      if (previous && current !== previous && current.operations.length > 0 && !current.areTabCloseAnimationsRunning) {
        processOperationQueueWorklet();
      }
    }
  );

  return (
    <BrowserWorkletsContext.Provider
      value={{ closeAllTabsWorklet, closeTabWorklet, newTabWorklet, setScreenshotDataWorklet, toggleTabViewWorklet, updateTabUrlWorklet }}
    >
      {children}
    </BrowserWorkletsContext.Provider>
  );
};
