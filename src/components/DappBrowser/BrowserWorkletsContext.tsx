import React, { createContext, useCallback, useContext } from 'react';
import { runOnJS, useAnimatedReaction, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { deepEqualWorklet } from '@/worklets/comparisons';
import { useBrowserContext, useBrowserTabBarContext } from './BrowserContext';
import { RAINBOW_HOME } from './constants';
import { BrowserWorkletsContextType, ScreenshotType, TabOperation, TabViewGestureStates } from './types';
import { generateUniqueIdWorklet, normalizeUrlWorklet } from './utils';

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
    loadProgress,
    shouldToggleAfterTabSwitch,
    tabViewGestureState,
    tabViewVisible,
  } = useBrowserContext();

  const { tabViewProgress } = useBrowserTabBarContext();

  const shouldBlockOperationQueue = useSharedValue(false);
  const tabOperationQueue = useSharedValue<TabOperation[]>([]);

  const goToPage = useBrowserStore(state => state.goToPage);
  const setActiveTabIndex = useBrowserStore(state => state.setActiveTabIndex);
  const silentlySetPersistedTabUrls = useBrowserStore(state => state.silentlySetPersistedTabUrls);

  const requestTabOperationsWorklet = useCallback(
    (operations: TabOperation | TabOperation[]) => {
      'worklet';
      tabOperationQueue.modify(currentQueue => {
        Array.isArray(operations) ? currentQueue.push(...operations) : currentQueue.push(operations);
        return currentQueue;
      });
    },
    [tabOperationQueue]
  );

  const toggleTabViewWorklet = useCallback(
    (activeIndex?: number) => {
      'worklet';
      if (tabViewGestureState.value !== TabViewGestureStates.INACTIVE) {
        shouldToggleAfterTabSwitch.value = activeIndex ?? true;
        return;
      }

      const willTabViewBecomeVisible = !tabViewVisible.value;
      const tabIndexProvided = activeIndex !== undefined;
      const indexToMakeActive = Math.abs(tabIndexProvided ? activeIndex : animatedActiveTabIndex.value);
      const isNewIndexValid = !!currentlyOpenTabIds.value[indexToMakeActive];

      if (!willTabViewBecomeVisible) {
        if (isNewIndexValid) {
          runOnJS(setActiveTabIndex)(indexToMakeActive);
          animatedActiveTabIndex.value = indexToMakeActive;
        } else {
          const fallbackIndex = currentlyOpenTabIds.value.length - 1;
          runOnJS(setActiveTabIndex)(fallbackIndex);
          animatedActiveTabIndex.value = fallbackIndex;
        }
      }

      tabViewProgress.value = willTabViewBecomeVisible
        ? withSpring(100, SPRING_CONFIGS.browserTabTransition)
        : withSpring(0, SPRING_CONFIGS.browserTabTransition);

      tabViewVisible.value = willTabViewBecomeVisible;
    },
    [
      animatedActiveTabIndex,
      currentlyOpenTabIds,
      setActiveTabIndex,
      shouldToggleAfterTabSwitch,
      tabViewGestureState,
      tabViewProgress,
      tabViewVisible,
    ]
  );

  const updateTabUrlWorklet = useCallback(
    ({ tabId, url }: { tabId: string; url: string }) => {
      'worklet';
      animatedTabUrls.modify(urls => ({ ...urls, [tabId]: normalizeUrlWorklet(url) }));
    },
    [animatedTabUrls]
  );

  const newTabWorklet = useCallback(
    ({ newTabId, newTabUrl }: { newTabId?: string; newTabUrl?: string } = {}) => {
      'worklet';
      if (newTabUrl || tabViewVisible.value || currentlyOpenTabIds.value.length === 0) {
        const tabId = newTabId || generateUniqueIdWorklet();

        currentlyOpenTabIds.modify(value => {
          value.push(tabId);
          return value;
        });

        const newActiveIndex = currentlyOpenTabIds.value.indexOf(tabId);

        if (newTabUrl) updateTabUrlWorklet({ tabId, url: newTabUrl });
        requestTabOperationsWorklet({ type: 'newTab', tabId, newActiveIndex, newTabUrl });
      }
    },
    [currentlyOpenTabIds, requestTabOperationsWorklet, tabViewVisible, updateTabUrlWorklet]
  );

  const closeTabWorklet = useCallback(
    ({ tabId, tabIndex }: { tabId: string; tabIndex: number }) => {
      'worklet';
      // Note: The closed tab is removed from currentlyOpenTabIds ahead of time in BrowserTab as soon
      // as the tab is swiped away, so that any operations applied between the time the swipe gesture
      // is released and the time the tab is actually closed are aware of the pending deletion of the
      // tab. The logic below assumes that the tab has already been removed from currentlyOpenTabIds.

      const currentActiveIndex = Math.abs(animatedActiveTabIndex.value);
      const remainingTabsCount = currentlyOpenTabIds.value.length;

      if (remainingTabsCount === 0) {
        requestTabOperationsWorklet({ type: 'closeTab', tabId, newActiveIndex: 0 });
        newTabWorklet();
        return;
      }

      let newActiveIndex = currentActiveIndex;

      if (tabIndex === currentActiveIndex) {
        // If the closed tab was active, select the next available tab or the last tab
        newActiveIndex = Math.min(tabIndex, remainingTabsCount - 1);
      } else if (tabIndex < currentActiveIndex) {
        // If the closed tab was before the active tab, decrement the active index
        newActiveIndex -= 1;
      }

      // To avoid unfreezing a WebView every time a tab is closed, we set the active tab index to the
      // negative index of the tab that should become active if the tab view is exited via the "Done"
      // button. Then in toggleTabViewWorklet(), if no new active index is provided and the active tab
      // index is negative, we handle using the negative index to set the correct active tab index.
      if (tabViewVisible.value && (tabIndex === currentActiveIndex || tabIndex < currentActiveIndex) && Math.abs(newActiveIndex) !== 0) {
        newActiveIndex = -Math.abs(newActiveIndex);
      }

      requestTabOperationsWorklet({ type: 'closeTab', tabId, newActiveIndex });
    },
    [animatedActiveTabIndex, currentlyOpenTabIds, newTabWorklet, requestTabOperationsWorklet, tabViewVisible]
  );

  const closeAllTabsWorklet = useCallback(() => {
    'worklet';
    const activeTabId = currentlyOpenTabIds.value[Math.abs(animatedActiveTabIndex.value)];
    runOnJS(goToPage)(RAINBOW_HOME, activeTabId);
    updateTabUrlWorklet({ tabId: activeTabId, url: RAINBOW_HOME });

    if (currentlyOpenTabIds.value.length > 1) {
      const tabCloseOperations: TabOperation[] = currentlyOpenTabIds.value
        .filter(tabId => tabId !== activeTabId)
        .map(tabId => ({ type: 'closeTab', tabId, newActiveIndex: undefined }));
      currentlyOpenTabIds.modify(value => {
        value.splice(0, value.length, activeTabId);
        return value;
      });
      requestTabOperationsWorklet(tabCloseOperations);
    }

    loadProgress.value = 0;
  }, [animatedActiveTabIndex, currentlyOpenTabIds, goToPage, loadProgress, requestTabOperationsWorklet, updateTabUrlWorklet]);

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
          if (operation.newActiveIndex === undefined || !tabViewVisible.value) {
            newActiveIndex = undefined;
          } else {
            const requestedNewActiveIndex = Math.abs(operation.newActiveIndex);
            const isRequestedIndexValid = requestedNewActiveIndex < currentlyOpenTabIds.value.length;
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
        }
      }

      // Ensure a valid active index is set
      if (newActiveIndex === undefined) {
        const currentActiveIndex =
          tabViewVisible.value || shouldToggleTabView ? Math.abs(animatedActiveTabIndex.value) : animatedActiveTabIndex.value;
        const isCurrentIndexValid = currentActiveIndex >= 0 && currentActiveIndex < currentlyOpenTabIds.value.length;
        const indexToSet = isCurrentIndexValid ? animatedActiveTabIndex.value : currentlyOpenTabIds.value.length - 1;
        newActiveIndex = indexToSet;
      }

      // Return the remaining queue after processing, which should be empty
      return currentQueue;
    });

    if (shouldToggleTabView) {
      toggleTabViewWorklet(newActiveIndex);
    } else {
      runOnJS(setActiveTabIndex)(newActiveIndex);
      animatedActiveTabIndex.value = newActiveIndex;
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
    },
    []
  );

  useAnimatedReaction(
    () => ({
      operations: tabOperationQueue.value,
      shouldBlock:
        shouldBlockOperationQueue.value ||
        currentlyBeingClosedTabIds.value.length > 0 ||
        tabViewGestureState.value === TabViewGestureStates.DRAG_END_ENTERING,
    }),
    (current, previous) => {
      if (previous && !current.shouldBlock && current.operations.length > 0) {
        processOperationQueueWorklet();
      }
    },
    []
  );

  useAnimatedReaction(
    () => ({ isSwitching: tabViewGestureState.value !== TabViewGestureStates.INACTIVE, shouldToggle: shouldToggleAfterTabSwitch.value }),
    (current, prev) => {
      if (!current.isSwitching && prev && (prev.isSwitching || current.shouldToggle !== false)) {
        if (current.shouldToggle !== false) {
          const indexToMakeActive = typeof current.shouldToggle === 'number' ? current.shouldToggle : undefined;
          shouldToggleAfterTabSwitch.value = false;
          toggleTabViewWorklet(indexToMakeActive);
        }
      }
    },
    []
  );

  return (
    <BrowserWorkletsContext.Provider
      value={{
        closeAllTabsWorklet,
        closeTabWorklet,
        newTabWorklet,
        setScreenshotDataWorklet,
        toggleTabViewWorklet,
        updateTabUrlWorklet,
      }}
    >
      {children}
    </BrowserWorkletsContext.Provider>
  );
};
