import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import { useListen } from '@storesjs/stores';
import Animated, { makeMutable, runOnUI, useAnimatedScrollHandler, type SharedValue } from 'react-native-reanimated';

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

type DiscoverSectionsPagerProps = {
  scrollOffset: SharedValue<number>;
};

type SectionScrollOffsets = Map<DiscoverSection, SharedValue<number>>;

const FALLBACK_SECTION_COUNT = 3;
const FALLBACK_TILE_COUNT = 2;
const EMPTY_TABS: DiscoverTab[] = [];

export const DiscoverSectionsPager = memo(function DiscoverSectionsPager({ scrollOffset }: DiscoverSectionsPagerProps) {
  const surface = useDiscoverSurface();
  const tabs = surface?.tabs ?? EMPTY_TABS;

  const { activeSectionIndex, sectionScrollOffsets } = useStableValue(() => {
    const initialSectionIndex = getSectionIndex(tabs, DiscoverSectionNavigation.getActiveSection());
    return {
      activeSectionIndex: makeMutable(initialSectionIndex === -1 && tabs.length ? 0 : initialSectionIndex),
      sectionScrollOffsets: new Map<DiscoverSection, SharedValue<number>>(),
    };
  });
  const pagerKey = surface?.tabsKey ?? '';

  const activateSection = useMemo(
    () =>
      runOnUI((index: number, sectionOffset: SharedValue<number>) => {
        if (index !== -1) activeSectionIndex.value = index;
        scrollOffset.value = sectionOffset.value;
      }),
    [activeSectionIndex, scrollOffset]
  );

  useListen(
    useDiscoverNavigationStore,
    state => state.activeSection,
    section => {
      activateSection(getSectionIndex(tabs, section), getSectionScrollOffset(sectionScrollOffsets, section));
    }
  );

  useEffect(() => {
    const firstTab = tabs[0];
    if (!firstTab) return;

    const currentSections = new Set(tabs.map(tab => tab.id));
    for (const section of sectionScrollOffsets.keys()) {
      if (!currentSections.has(section)) {
        sectionScrollOffsets.delete(section);
      }
    }

    const activeSection = DiscoverSectionNavigation.getActiveSection();
    const sectionIndex = getSectionIndex(tabs, activeSection);
    if (sectionIndex === -1) {
      DiscoverSectionNavigation.navigate(firstTab.id);
      return;
    }

    activateSection(sectionIndex, getSectionScrollOffset(sectionScrollOffsets, activeSection));
  }, [activateSection, sectionScrollOffsets, tabs]);

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
              activeSectionIndex={activeSectionIndex}
              scrollOffset={scrollOffset}
              section={section}
              sectionIndex={index}
              storedScrollOffset={getSectionScrollOffset(sectionScrollOffsets, section.id)}
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
  activeSectionIndex,
  scrollOffset,
  section,
  sectionIndex,
  storedScrollOffset,
  surfaceId,
}: {
  activeSectionIndex: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  section: DiscoverTab;
  sectionIndex: number;
  storedScrollOffset: SharedValue<number>;
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
      const clampedPosition = clamp(event.contentOffset.y, 0, DEFAULT_SCROLL_FADE_DISTANCE);

      if (storedScrollOffset.value !== clampedPosition) storedScrollOffset.value = clampedPosition;

      if (activeSectionIndex.value !== sectionIndex || scrollOffset.value === clampedPosition) return;
      scrollOffset.value = clampedPosition;
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

function getSectionScrollOffset(offsets: SectionScrollOffsets, section: DiscoverSection): SharedValue<number> {
  const existing = offsets.get(section);
  if (existing) return existing;

  const offset = makeMutable(0);
  offsets.set(section, offset);
  return offset;
}

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
