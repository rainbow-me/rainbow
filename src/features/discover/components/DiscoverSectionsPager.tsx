import React, { memo, useCallback, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { useListen } from '@storesjs/stores';
import Animated, { runOnUI, useAnimatedScrollHandler, type SharedValue } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useDiscoverScreenContext, type DiscoverSectionScrollViewRef } from '@/components/Discover/DiscoverScreenContext';
import { DEFAULT_SCROLL_FADE_DISTANCE } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { Skeleton } from '@/components/Skeleton';
import { SmoothPager } from '@/components/SmoothPager/SmoothPager';
import { Box } from '@/design-system';
import { DiscoverRefreshControl } from '@/features/discover/components/DiscoverRefreshControl';
import { DiscoverSections } from '@/features/discover/components/DiscoverSection';
import {
  DiscoverPagerNavigation,
  DiscoverSectionNavigation,
  useDiscoverNavigationStore,
  type DiscoverSection,
} from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSurface } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type DiscoverTab } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { type SurfaceId } from '@/features/placements/surfaces/types';
import { useStableValue } from '@/hooks/useStableValue';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { clamp } from '@/worklets/numbers';

type SectionFadeState = { readonly __workletContextObject: true; activeIndex: number; inactiveOffsets: number[] };

const FALLBACK_SECTION_COUNT = 3;
const FALLBACK_TILE_COUNT = 2;
const EMPTY_TABS: DiscoverTab[] = [];

export const DiscoverSectionsPager = memo(function DiscoverSectionsPager({ scrollOffset }: { scrollOffset: SharedValue<number> }) {
  const surface = useDiscoverSurface();
  const tabs = surface?.tabs ?? EMPTY_TABS;
  const pagerKey = surface?.tabsKey ?? '';

  const sectionFadeState = useStableValue<SectionFadeState>(() => ({
    __workletContextObject: true,
    activeIndex: 0,
    inactiveOffsets: [],
  }));

  const activateSectionFade = useMemo(
    () =>
      runOnUI((index: number) => {
        const previousIndex = sectionFadeState.activeIndex;
        if (previousIndex === index) return;

        const nextOffset = sectionFadeState.inactiveOffsets[index] ?? 0;

        sectionFadeState.inactiveOffsets[previousIndex] = scrollOffset.value;
        sectionFadeState.activeIndex = index;
        scrollOffset.value = nextOffset;
      }),
    [scrollOffset, sectionFadeState]
  );

  const resetSectionFadeState = useMemo(
    () =>
      runOnUI((activeIndex: number) => {
        sectionFadeState.activeIndex = activeIndex;
        sectionFadeState.inactiveOffsets.length = 0;
        scrollOffset.value = 0;
      }),
    [scrollOffset, sectionFadeState]
  );

  useListen(
    useDiscoverNavigationStore,
    s => s.activeSection,
    section => {
      const tabs = useDiscoverSurface.getState()?.tabs;
      if (!tabs) return;

      const sectionIndex = getSectionIndex(tabs, section);
      if (sectionIndex === -1) return;

      activateSectionFade(sectionIndex);
    }
  );

  useListen(
    useDiscoverSurface,
    s => s?.tabsKey,
    () => {
      const tabs = useDiscoverSurface.getState()?.tabs ?? EMPTY_TABS;
      const sectionIndex = getSectionIndex(tabs, DiscoverSectionNavigation.getActiveSection());
      const isActiveSectionGone = sectionIndex === -1;

      resetSectionFadeState(isActiveSectionGone ? 0 : sectionIndex);

      const firstTab = tabs[0];
      if (firstTab && isActiveSectionGone) DiscoverSectionNavigation.navigate(firstTab.id);
    },
    { fireImmediately: true }
  );

  if (!surface || !tabs.length) {
    return (
      <Box style={styles.container} testID="discover-sections-pager">
        <DiscoverSectionsFallback />
      </Box>
    );
  }

  return (
    <Box style={styles.container} testID="discover-sections-pager">
      <SmoothPager
        enableSwipeToGoBack={false}
        enableSwipeToGoForward={false}
        fallbackPage={tabs[0].id}
        fillHeight
        key={pagerKey}
        lazy
        navigation={DiscoverPagerNavigation}
        scaleTo={1}
        springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
        verticalPageAlignment="top"
      >
        {tabs.map((section, index) => (
          <SmoothPager.Page id={section.id} key={section.id}>
            <DiscoverSectionScrollView
              scrollOffset={scrollOffset}
              section={section}
              sectionFadeState={sectionFadeState}
              sectionIndex={index}
              surfaceId={surface.id}
            />
          </SmoothPager.Page>
        ))}
      </SmoothPager>
    </Box>
  );
});

const DiscoverSectionsFallback = memo(function DiscoverSectionsFallback() {
  const tabBarOffset = useTabBarOffset();
  const bottomInset = tabBarOffset + 12;

  return (
    <ScrollView
      automaticallyAdjustsScrollIndicatorInsets={false}
      contentContainerStyle={[styles.fallbackContent, Platform.OS === 'android' && { paddingBottom: bottomInset }]}
      refreshControl={<DiscoverRefreshControl />}
      showsVerticalScrollIndicator={false}
      contentInset={{ bottom: bottomInset }}
      style={styles.scrollView}
      testID="discover-section-fallback"
    >
      {Array.from({ length: FALLBACK_SECTION_COUNT }, (_, sectionIndex) => (
        <Box key={sectionIndex} gap={20}>
          <Skeleton borderRadius={12} height={30} width={sectionIndex === 0 ? 96 : 148} />
          <Box flexDirection="row" gap={12}>
            {Array.from({ length: FALLBACK_TILE_COUNT }, (_, tileIndex) => (
              <Skeleton key={tileIndex} borderRadius={20} height={166} width="48%" />
            ))}
          </Box>
        </Box>
      ))}
    </ScrollView>
  );
});

const DiscoverSectionScrollView = memo(function DiscoverSectionScrollView({
  scrollOffset,
  section,
  sectionFadeState,
  sectionIndex,
  surfaceId,
}: {
  scrollOffset: SharedValue<number>;
  section: DiscoverTab;
  sectionFadeState: SectionFadeState;
  sectionIndex: number;
  surfaceId: SurfaceId;
}) {
  const { registerSectionScrollView } = useDiscoverScreenContext();
  const tabBarOffset = useTabBarOffset();
  const bottomInset = tabBarOffset + 12;
  const sectionId = section.id;

  const setScrollViewRef = useCallback(
    (scrollView: DiscoverSectionScrollViewRef | null) => {
      registerSectionScrollView(sectionId, scrollView);
    },
    [registerSectionScrollView, sectionId]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const fadeOffset = clamp(event.contentOffset.y, 0, DEFAULT_SCROLL_FADE_DISTANCE);

      if (sectionFadeState.activeIndex === sectionIndex) {
        if (scrollOffset.value !== fadeOffset) scrollOffset.value = fadeOffset;
        return;
      }

      if (sectionFadeState.inactiveOffsets[sectionIndex] === fadeOffset) return;
      sectionFadeState.inactiveOffsets[sectionIndex] = fadeOffset;
    },
  });

  return (
    <Animated.ScrollView
      automaticallyAdjustsScrollIndicatorInsets={false}
      contentContainerStyle={[styles.scrollContent, Platform.OS === 'android' && { paddingBottom: bottomInset }]}
      onScroll={onScroll}
      ref={setScrollViewRef}
      refreshControl={<DiscoverRefreshControl />}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentInset={{ bottom: bottomInset }}
      style={styles.scrollView}
      testID={`discover-section-page-${sectionIndex + 1}`}
    >
      <Box testID={`discover-section-${sectionId}`}>
        <DiscoverSections items={section.sections} surfaceId={surfaceId} />
      </Box>
    </Animated.ScrollView>
  );
});

function getSectionIndex(tabs: DiscoverTab[], section: DiscoverSection): number {
  return tabs.findIndex(tab => tab.id === section);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallbackContent: {
    flexGrow: 1,
    gap: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
});
