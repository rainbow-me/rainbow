import { useMemo } from 'react';
import { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserContext } from '../BrowserContext';
import { findTabScreenshot } from '../screenshots';

export function useTabScreenshotProvider({ tabId }: { tabId: string }) {
  const { activeTabInfo, animatedScreenshotData, animatedTabUrls, tabViewVisible } = useBrowserContext();

  const isActiveTab = useBrowserStore(state => state.isTabActive(tabId));
  const initialScreenshotData = useMemo(() => findTabScreenshot(tabId, useBrowserStore.getState().getTabData(tabId)?.url), [tabId]);

  const screenshotData = useDerivedValue(() => {
    const screenshotData = animatedScreenshotData.value[tabId];
    return screenshotData ? screenshotData : initialScreenshotData || undefined;
  });

  const animatedScreenshotStyle = useAnimatedStyle(() => {
    const screenshotExists = !!screenshotData.value?.uri;
    const screenshotMatchesTabIdAndUrl = screenshotData.value?.id === tabId && screenshotData.value?.url === animatedTabUrls.value[tabId];
    const animatedIsActiveTab = activeTabInfo.value.tabId === tabId;
    const isTabFrozen = !animatedIsActiveTab || !isActiveTab;

    const oneMinuteAgo = Date.now() - 1000 * 60;
    const isScreenshotStale = !!(screenshotData.value && screenshotData.value?.timestamp < oneMinuteAgo);
    const shouldWaitForNewScreenshot = animatedIsActiveTab && isScreenshotStale;

    const shouldDisplay =
      screenshotExists && screenshotMatchesTabIdAndUrl && (isTabFrozen || (tabViewVisible.value && !shouldWaitForNewScreenshot));

    return {
      opacity: shouldDisplay && isScreenshotStale ? 1 : withSpring(shouldDisplay ? 1 : 0, SPRING_CONFIGS.snappierSpringConfig),
    };
  });

  return {
    animatedScreenshotStyle,
    screenshotData,
  };
}
