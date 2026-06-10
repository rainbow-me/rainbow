import React, { memo, useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Platform, ScrollView, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useDiscoverScreenContext, type DiscoverSectionScrollViewRef } from '@/components/Discover/DiscoverScreenContext';
import { DEFAULT_SCROLL_FADE_DISTANCE } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { Skeleton } from '@/components/Skeleton';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Box } from '@/design-system';
import { DiscoverRefreshControl } from '@/features/discover/components/DiscoverRefreshControl';
import { DiscoverSections } from '@/features/discover/components/DiscoverSection';
import {
  DiscoverSectionNavigation,
  useDiscoverNavigationStore,
  type DiscoverSection,
} from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSurface, type DiscoverTab } from '@/features/discover/stores/discoverSurfaceStore';
import { type SurfaceId } from '@/features/placements/surfaces/types';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { useListen } from '@/state/internal/hooks/useListen';
import { clamp } from '@/worklets/numbers';

type DiscoverSectionsPagerProps = {
  scrollOffset: SharedValue<number>;
};

type SectionScrollOffsets = Partial<Record<DiscoverSection, number>>;

const FALLBACK_SECTION_COUNT = 3;
const FALLBACK_TILE_COUNT = 2;

export const DiscoverSectionsPager = memo(function DiscoverSectionsPager({ scrollOffset }: DiscoverSectionsPagerProps) {
  const discover = useDiscoverSurface();
  const tabs = useMemo(() => discover?.tabs ?? [], [discover]);
  const activeSectionId = useDiscoverNavigationStore(state => state.activeSection);
  const { ref, goToPage } = usePagerNavigation<DiscoverSection>();
  const initialSection = getInitialSection(tabs, activeSectionId);
  const sectionScrollOffsets = useRef<SectionScrollOffsets>({});
  const pagerKey = tabs.map(tab => tab.id).join('|');

  useListen(
    useDiscoverNavigationStore,
    state => state.activeSection,
    section => {
      scrollOffset.value = sectionScrollOffsets.current[section] ?? 0;
      goToPage(section);
    }
  );

  const handlePagerIndexChange = useCallback(
    (index: number) => {
      const section = tabs[index]?.id;
      if (section) DiscoverSectionNavigation.navigate(section);
    },
    [tabs]
  );

  useEffect(() => {
    const firstTab = tabs[0];
    if (discover && firstTab && !tabs.some(tab => tab.id === activeSectionId)) {
      DiscoverSectionNavigation.navigate(firstTab.id);
    }
  }, [activeSectionId, discover, tabs]);

  if (!discover || !tabs.length) {
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
        fillHeight
        initialPage={initialSection}
        key={pagerKey}
        onNewIndex={handlePagerIndexChange}
        ref={ref}
        scaleTo={1}
        springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
        verticalPageAlignment="top"
      >
        {tabs.map((tab, index) => (
          <SmoothPager.Page
            component={
              <DiscoverSectionScrollView
                discoverId={discover.id}
                isActive={tab.id === activeSectionId}
                scrollOffset={scrollOffset}
                tab={tab}
                sectionIndex={index}
                sectionScrollOffsets={sectionScrollOffsets}
              />
            }
            id={tab.id}
            key={tab.id}
            lazy
          />
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
  discoverId,
  isActive,
  scrollOffset,
  tab,
  sectionIndex,
  sectionScrollOffsets,
}: {
  discoverId: SurfaceId;
  isActive: boolean;
  scrollOffset: SharedValue<number>;
  tab: DiscoverTab;
  sectionIndex: number;
  sectionScrollOffsets: MutableRefObject<SectionScrollOffsets>;
}) {
  const { registerSectionScrollView } = useDiscoverScreenContext();
  const tabBarOffset = useTabBarOffset();
  const bottomInset = tabBarOffset + 12;
  const storedScrollOffset = useSharedValue(sectionScrollOffsets.current[tab.id] ?? 0);

  const setScrollViewRef = useCallback(
    (scrollView: DiscoverSectionScrollViewRef | null) => {
      registerSectionScrollView(tab.id, scrollView);
    },
    [registerSectionScrollView, tab]
  );

  const updateSectionScrollOffset = useCallback(
    (nextOffset: number) => {
      sectionScrollOffsets.current[tab.id] = nextOffset;
    },
    [tab.id, sectionScrollOffsets]
  );

  const onAndroidScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const clampedPosition = clamp(event.nativeEvent.contentOffset.y, 0, DEFAULT_SCROLL_FADE_DISTANCE);

      if (storedScrollOffset.value !== clampedPosition) {
        storedScrollOffset.value = clampedPosition;
        updateSectionScrollOffset(clampedPosition);
      }

      if (!isActive || scrollOffset.value === clampedPosition) return;
      scrollOffset.value = clampedPosition;
    },
    [isActive, scrollOffset, storedScrollOffset, updateSectionScrollOffset]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const clampedPosition = clamp(event.contentOffset.y, 0, DEFAULT_SCROLL_FADE_DISTANCE);

      if (storedScrollOffset.value !== clampedPosition) {
        storedScrollOffset.value = clampedPosition;
        runOnJS(updateSectionScrollOffset)(clampedPosition);
      }

      if (!isActive || scrollOffset.value === clampedPosition) return;
      scrollOffset.value = clampedPosition;
    },
  });

  const SectionScrollView = Platform.OS === 'android' ? ScrollView : Animated.ScrollView;
  const sectionScrollHandler = Platform.OS === 'android' ? onAndroidScroll : onScroll;

  return (
    <SectionScrollView
      automaticallyAdjustsScrollIndicatorInsets={false}
      contentContainerStyle={[styles.scrollContent, Platform.OS === 'android' && { paddingBottom: bottomInset }]}
      onScroll={sectionScrollHandler}
      pointerEvents={isActive ? 'auto' : 'none'}
      ref={setScrollViewRef}
      refreshControl={<DiscoverRefreshControl />}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentInset={{ bottom: bottomInset }}
      style={styles.scrollView}
      testID={`discover-section-page-${sectionIndex + 1}`}
    >
      <Box testID={`discover-section-${tab.id}`}>
        <DiscoverSections items={tab.items} surfaceId={discoverId} />
      </Box>
    </SectionScrollView>
  );
});

function getInitialSection(tabs: DiscoverTab[], activeSectionId: string): string {
  return tabs.some(tab => tab.id === activeSectionId) ? activeSectionId : (tabs[0]?.id ?? activeSectionId);
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
