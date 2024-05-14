import { useCallback } from 'react';
import { dispatchCommand, runOnJS, runOnUI, useAnimatedReaction } from 'react-native-reanimated';
import { IS_IOS } from '@/env';
import { RainbowError, logger } from '@/logger';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { TAB_VIEW_ROW_HEIGHT } from '../Dimensions';
import { RAINBOW_HOME } from '../constants';
import { saveScreenshot } from '../screenshots';

/**
 * ### `useScreenshotAndScrollTriggers`:
 * This hook coordinates with the browser context to:
 * - Capture screenshots of the active tab upon entering the tab view.
 * - Automatically adjust the scroll position of the tab view to vertically center the active
 *   tab once the tab view is fully closed.
 */
export function useScreenshotAndScrollTriggers() {
  const {
    activeTabInfo,
    animatedActiveTabIndex,
    animatedScreenshotData,
    animatedTabUrls,
    currentlyOpenTabIds,
    loadProgress,
    screenshotCaptureRef,
    scrollViewRef,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();
  const { setScreenshotDataWorklet } = useBrowserWorkletsContext();

  const saveScreenshotToFileSystem = useCallback(
    async (tempUri: string, tabId: string, timestamp: number, url: string) => {
      const screenshotWithRNFSPath = await saveScreenshot(tempUri, tabId, timestamp, url);
      if (!screenshotWithRNFSPath) return;
      runOnUI(setScreenshotDataWorklet)(screenshotWithRNFSPath);
    },
    [setScreenshotDataWorklet]
  );

  const captureAndSaveScreenshot = useCallback(
    (pageUrl: string, tabId: string) => {
      if (screenshotCaptureRef.current?.capture) {
        screenshotCaptureRef.current
          .capture()
          .then(uri => {
            const timestamp = Date.now();
            saveScreenshotToFileSystem(uri, tabId, timestamp, pageUrl);
          })
          .catch(error => {
            logger.error(new RainbowError('Failed to capture tab screenshot'), {
              error: error.message,
            });
          });
      }
    },
    [saveScreenshotToFileSystem, screenshotCaptureRef]
  );

  // ⚠️ TODO: Need to rewrite the enterTabViewAnimationIsComplete condition, because it assumes the
  // tab animation will overshoot and rebound. If the animation config is changed, it's possible the
  // screenshot condition won't be met.

  return useAnimatedReaction(
    () => tabViewProgress.value,
    (current, previous) => {
      const changesDetected = previous && current !== previous;
      const isTabBeingClosed = currentlyOpenTabIds.value.indexOf(activeTabInfo.value.tabId) === -1;

      if (changesDetected && !isTabBeingClosed) {
        // 📸 Trigger screenshot capture within the active tab once the tab view is fully entered, if necessary
        const tabId = activeTabInfo.value.tabId;
        const tabUrl = animatedTabUrls.value[tabId] || RAINBOW_HOME;
        const isHomepage = tabUrl === RAINBOW_HOME || !tabUrl;

        if (!isHomepage) {
          const screenshotData = animatedScreenshotData.value[tabId];
          const enterTabViewAnimationIsComplete = tabViewVisible.value === true && previous > 100 && current <= 100;
          const isPageLoaded = loadProgress.value > 0.2;

          if (enterTabViewAnimationIsComplete && !isHomepage && isPageLoaded && tabUrl) {
            const previousScreenshotExists = !!screenshotData?.uri;
            const urlChanged = screenshotData?.url !== tabUrl;
            const oneMinuteAgo = Date.now() - 1000 * 60;
            const isScreenshotStale = screenshotData && screenshotData?.timestamp < oneMinuteAgo;

            const shouldCaptureScreenshot = !previousScreenshotExists || urlChanged || isScreenshotStale;

            if (shouldCaptureScreenshot) {
              runOnJS(captureAndSaveScreenshot)(tabUrl, tabId);
            }
          }
        }
        // 📸 END screenshot capture logic

        // 🪄 Invisibly scroll the tab view to vertically center the active tab once the tab view is fully exited
        if (IS_IOS) {
          const isScrollViewScrollable = currentlyOpenTabIds.value.length > 4;
          const exitTabViewAnimationIsComplete =
            isScrollViewScrollable && tabViewVisible.value === false && current === 0 && previous && previous !== 0;

          if (isScrollViewScrollable && exitTabViewAnimationIsComplete) {
            const scrollTo = calculateScrollPositionToCenterTab(animatedActiveTabIndex.value, currentlyOpenTabIds.value.length);
            dispatchCommand(scrollViewRef, 'scrollTo', [0, scrollTo, false]);
          }
        }
        // 🪄 END scroll logic
      }
    },
    [tabViewProgress]
  );
}

const SCREEN_HEIGHT = DEVICE_HEIGHT;
const HALF_SCREEN_HEIGHT = DEVICE_HEIGHT / 2;

export function calculateScrollPositionToCenterTab(activeTabIndex: number, numberOfOpenTabs: number): number {
  'worklet';

  const scrollViewHeight =
    Math.ceil(numberOfOpenTabs / 2) * TAB_VIEW_ROW_HEIGHT + safeAreaInsetValues.bottom + 165 + 28 + (IS_IOS ? 0 : 35);

  if (scrollViewHeight <= SCREEN_HEIGHT) {
    // No need to scroll if all tabs fit on the screen
    return 0;
  }

  const currentTabRow = Math.floor(activeTabIndex / 2);
  const tabCenterPosition = currentTabRow * TAB_VIEW_ROW_HEIGHT + (currentTabRow - 1) * 28 + TAB_VIEW_ROW_HEIGHT / 2 + 37;

  if (tabCenterPosition <= HALF_SCREEN_HEIGHT) {
    // Scroll to top if the tab is too near to the top of the scroll view to be centered
    return 0;
  } else if (tabCenterPosition + HALF_SCREEN_HEIGHT >= scrollViewHeight) {
    // Scroll to bottom if the tab is too near to the end of the scroll view to be centered
    return scrollViewHeight - SCREEN_HEIGHT;
  } else {
    // Otherwise, vertically center the tab on the screen
    return tabCenterPosition - HALF_SCREEN_HEIGHT;
  }
}
