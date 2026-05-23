import React, { memo, useCallback, useEffect, useMemo, type ReactElement } from 'react';
import { Platform, StyleSheet, type RefreshControlProps } from 'react-native';

import Animated, { useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { DEFAULT_SCROLL_FADE_DISTANCE } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Box } from '@/design-system';
import { DiscoverSurfaceSections } from '@/features/discover/components/DiscoverSurfaceSection';
import {
  DiscoverSectionNavigation,
  useDiscoverNavigationStore,
  type DiscoverSection,
} from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSurface } from '@/features/placements/surfaces/hooks/useSurface';
import { type Surface } from '@/features/placements/surfaces/types';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { useListen } from '@/state/internal/hooks/useListen';
import { clamp } from '@/worklets/numbers';

type DiscoverSectionsPagerProps = {
  renderRefreshControl?: () => ReactElement<RefreshControlProps>;
  scrollOffset: SharedValue<number>;
};

type SectionScrollOffsets = Partial<Record<DiscoverSection, number>>;

export const DiscoverSectionsPager = memo(function DiscoverSectionsPager({
  renderRefreshControl,
  scrollOffset,
}: DiscoverSectionsPagerProps) {
  const surface = useDiscoverSurface();
  const tabs = useMemo(() => (surface?.items !== undefined ? surface.items : []), [surface]);
  const activeSectionId = useDiscoverNavigationStore(state => state.activeSection);
  const { ref, goToPage } = usePagerNavigation<DiscoverSection>();
  const initialSection = getInitialSection(tabs, activeSectionId);
  const activeSection = useSharedValue<DiscoverSection>(initialSection);
  const sectionScrollOffsets = useSharedValue<SectionScrollOffsets>({});
  const pagerKey = tabs.map(tab => tab.id).join('|');

  useListen(
    useDiscoverNavigationStore,
    state => state.activeSection,
    section => {
      activeSection.value = section;
      scrollOffset.value = sectionScrollOffsets.value[section] ?? 0;
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
    if (surface && firstTab && !tabs.some(tab => tab.id === activeSectionId)) {
      DiscoverSectionNavigation.navigate(firstTab.id);
    }
  }, [activeSectionId, surface, tabs]);

  if (!surface || !tabs.length) return <Box style={styles.container} testID="discover-sections-pager" />;

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
        {tabs.map(section => (
          <SmoothPager.Page
            component={
              <DiscoverSectionScrollView
                activeSection={activeSection}
                renderRefreshControl={renderRefreshControl}
                scrollOffset={scrollOffset}
                section={section}
                sectionScrollOffsets={sectionScrollOffsets}
                surfaceId={surface.id}
              />
            }
            id={section.id}
            key={section.id}
            lazy
          />
        ))}
      </SmoothPager>
    </Box>
  );
});

const DiscoverSectionScrollView = memo(function DiscoverSectionScrollView({
  activeSection,
  renderRefreshControl,
  scrollOffset,
  section,
  sectionScrollOffsets,
  surfaceId,
}: {
  activeSection: SharedValue<DiscoverSection>;
  renderRefreshControl?: () => ReactElement<RefreshControlProps>;
  scrollOffset: SharedValue<number>;
  section: Surface;
  sectionScrollOffsets: SharedValue<SectionScrollOffsets>;
  surfaceId: string;
}) {
  const { registerSectionScrollView } = useDiscoverScreenContext();
  const tabBarOffset = useTabBarOffset();
  const bottomInset = tabBarOffset + 12;

  const setScrollViewRef = useCallback(
    (scrollView: Animated.ScrollView | null) => {
      registerSectionScrollView(section.id, scrollView);
    },
    [registerSectionScrollView, section]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const clampedPosition = clamp(event.contentOffset.y, 0, DEFAULT_SCROLL_FADE_DISTANCE);

      if (sectionScrollOffsets.value[section.id] !== clampedPosition) {
        sectionScrollOffsets.value = { ...sectionScrollOffsets.value, [section.id]: clampedPosition };
      }

      if (activeSection.value !== section.id || scrollOffset.value === clampedPosition) return;
      scrollOffset.value = clampedPosition;
    },
  });

  return (
    <Animated.ScrollView
      automaticallyAdjustsScrollIndicatorInsets={false}
      contentContainerStyle={styles.scrollContent}
      onScroll={onScroll}
      ref={setScrollViewRef}
      refreshControl={renderRefreshControl?.()}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentInset={{ bottom: bottomInset }}
      style={[styles.scrollView, { paddingBottom: Platform.OS === 'android' ? bottomInset : 0 }]}
      testID={`discover-section-${section.id}`}
    >
      {section.items !== undefined ? (
        <DiscoverSurfaceSections items={section.items} surfaceId={surfaceId} />
      ) : (
        <DiscoverSurfaceSections items={[section]} surfaceId={surfaceId} />
      )}
    </Animated.ScrollView>
  );
});

function getInitialSection(tabs: Surface[], activeSectionId: string): string {
  return tabs.some(tab => tab.id === activeSectionId) ? activeSectionId : (tabs[0]?.id ?? activeSectionId);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
});
