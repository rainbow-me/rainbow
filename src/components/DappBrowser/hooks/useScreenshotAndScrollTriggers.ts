import { useCallback } from 'react';
import { dispatchCommand, runOnJS, runOnUI, useAnimatedReaction } from 'react-native-reanimated';
import { IS_IOS } from '@/env';
import { RainbowError, logger } from '@/logger';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { RAINBOW_HOME } from '../constants';
import { saveScreenshot } from '../screenshots';
import { calculateScrollPositionToCenterTab } from '../utils/layoutUtils';

/**
 * ### `useScreenshotAndScrollTriggers`:
 * This hook coordinates with the browser context to:
 * - Capture screenshots of the active tab upon entering the tab view.
 * - Automatically adjust the scroll position of the tab view to vertically center the active
 *   tab once the tab view is fully closed.
 */
export function useScreenshotAndScrollTriggers() {
  const {
    animatedActiveTabIndex,
    animatedScreenshotData,
    animatedTabUrls,
    currentlyBeingClosedTabIds,
    currentlyOpenTabIds,
    loadProgress,
    screenshotCaptureRef,
    scrollViewOffset,
    scrollViewRef,
    tabSwitchGestureX,
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
            logger.error(new RainbowError('[DappBrowser]: Failed to capture tab screenshot'), {
              error: error.message,
            });
          });
      }
    },
    [saveScreenshotToFileSystem, screenshotCaptureRef]
  );

  // 💡 Note that the enterTabViewAnimationIsComplete condition assumes that the tab animation will overshoot and rebound.
  // If the browserTabTransition animation config is changed, it's possible the screenshot condition will no longer be met.

  return useAnimatedReaction(
    () => ({
      tabSwitchGestureX: tabSwitchGestureX.value,
      tabViewProgress: tabViewProgress.value,
    }),
    (current, previous) => {
      const changesDetected =
        previous !== null &&
        (current.tabSwitchGestureX !== previous.tabSwitchGestureX || current.tabViewProgress !== previous.tabViewProgress);
      const isTabBeingClosed = currentlyBeingClosedTabIds.value.length > 0;

      if (!changesDetected || isTabBeingClosed) return;

      const didBeginSwitchingTabs = current.tabSwitchGestureX !== 0 && previous.tabSwitchGestureX === 0;
      const didFinishSwitchingTabs =
        IS_IOS &&
        current.tabSwitchGestureX === 0 &&
        previous.tabSwitchGestureX !== 0 &&
        !tabViewVisible.value &&
        current.tabViewProgress <= 1;

      const enterTabViewAnimationIsComplete = tabViewVisible.value && previous.tabViewProgress > 100 && current.tabViewProgress <= 100;
      const exitTabViewAnimationIsComplete = !tabViewVisible.value && current.tabViewProgress === 0 && previous.tabViewProgress !== 0;

      const shouldAttemptScreenshot = didBeginSwitchingTabs || enterTabViewAnimationIsComplete;
      const shouldAttemptScroll = didFinishSwitchingTabs || exitTabViewAnimationIsComplete;

      // 📸 Trigger screenshot capture within the active tab once the tab view is fully entered, if necessary
      if (shouldAttemptScreenshot) {
        const tabId = currentlyOpenTabIds.value[animatedActiveTabIndex.value];
        const tabUrl = animatedTabUrls.value[tabId] || RAINBOW_HOME;
        const isHomepage = tabUrl === RAINBOW_HOME;
        const isPageLoaded = loadProgress.value === 0 || loadProgress.value === 1;

        if (tabId && !isHomepage && isPageLoaded) {
          const screenshotData = animatedScreenshotData.value[tabId];
          const previousScreenshotExists = !!screenshotData?.uri;
          const urlChanged = screenshotData?.url !== tabUrl;
          const oneMinuteAgo = Date.now() - 1000 * 60;
          const isScreenshotStale = !!screenshotData && screenshotData.timestamp < oneMinuteAgo;

          const shouldCaptureScreenshot = !previousScreenshotExists || urlChanged || isScreenshotStale;

          if (shouldCaptureScreenshot) {
            runOnJS(captureAndSaveScreenshot)(tabUrl, tabId);
          }
        }
      }
      // 📸 END screenshot capture logic

      // 🪄 Invisibly scroll the tab view to vertically center the active tab once the tab view is fully exited
      if (shouldAttemptScroll) {
        const isScrollable = currentlyOpenTabIds.value.length > 4;
        if (!isScrollable) return;

        const scrollTo = calculateScrollPositionToCenterTab(animatedActiveTabIndex.value, currentlyOpenTabIds.value.length);
        if (scrollTo === scrollViewOffset.value) return;

        dispatchCommand(scrollViewRef, 'scrollTo', [0, scrollTo, false]);
      }
      // 🪄 END scroll logic
    },
    []
  );
}
