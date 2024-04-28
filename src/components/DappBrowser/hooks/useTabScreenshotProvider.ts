import { useMemo } from 'react';
import { AnimatedStyle, useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserContext } from '../BrowserContext';
import { findTabScreenshot } from '../screenshots';

export function useTabScreenshotProvider({ tabId }: { tabId: string }) {
  const { activeTabInfo, animatedScreenshotData, animatedTabUrls, tabViewProgress, tabViewVisible } = useBrowserContext();

  const isActiveTab = useBrowserStore(state => state.isTabActive(tabId));
  const initialScreenshotData = useMemo(() => findTabScreenshot(tabId, useBrowserStore.getState().getTabData(tabId)?.url), [tabId]);

  const screenshotData = useDerivedValue(() => {
    const screenshotData = animatedScreenshotData.value[tabId];
    return screenshotData ? screenshotData : initialScreenshotData || undefined;
  });

  const animatedScreenshotStyle: AnimatedStyle = useAnimatedStyle(() => {
    const screenshotExists = !!screenshotData.value?.uri;
    const screenshotMatchesTabIdAndUrl = screenshotData.value?.id === tabId && screenshotData.value?.url === animatedTabUrls.value[tabId];
    const animatedIsActiveTab = activeTabInfo.value.tabId === tabId && isActiveTab;

    // This is to handle the case where a WebView that wasn't previously the active tab
    // is made active from the tab view. Because its freeze state is driven by JS state,
    // it doesn't unfreeze immediately, so this condition allows some time for the tab to
    // become unfrozen before the screenshot is hidden, in most cases hiding the flash of
    // the frozen empty WebView that occurs if the screenshot is hidden immediately.
    const isActiveTabButMaybeStillFrozen = !isActiveTab && tabViewProgress.value > 75 && !tabViewVisible.value;

    const oneMinuteAgo = Date.now() - 1000 * 60;
    const isScreenshotStale = !!(screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo);
    const shouldWaitForNewScreenshot = isScreenshotStale && tabViewVisible.value && activeTabInfo.value.tabId === tabId;

    const shouldDisplay =
      screenshotExists &&
      screenshotMatchesTabIdAndUrl &&
      (!animatedIsActiveTab || ((tabViewVisible.value || isActiveTabButMaybeStillFrozen) && !shouldWaitForNewScreenshot));

    return {
      opacity: withSpring(shouldDisplay ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
    };
  });

  return {
    animatedScreenshotStyle,
    screenshotData,
  };
}
