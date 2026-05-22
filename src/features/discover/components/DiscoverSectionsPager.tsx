import React, { memo, useCallback, type ReactElement } from 'react';
import { Platform, StyleSheet, type RefreshControlProps } from 'react-native';

import Animated, { useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { DEFAULT_SCROLL_FADE_DISTANCE } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Box } from '@/design-system';
import { CryptoPage } from '@/features/discover/components/pages/CryptoPage';
import { ForYouPage } from '@/features/discover/components/pages/ForYouPage';
import { MarketsPage } from '@/features/discover/components/pages/MarketsPage';
import { SportsSection } from '@/features/discover/components/pages/SportsPage';
import {
  DISCOVER_SECTION_ORDER,
  DiscoverSectionNavigation,
  getDiscoverSectionForIndex,
  useDiscoverNavigationStore,
  type DiscoverSection,
} from '@/features/discover/stores/discoverNavigationStore';
import { useStableValue } from '@/hooks/useStableValue';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { useListen } from '@/state/internal/hooks/useListen';
import { clamp } from '@/worklets/numbers';

type DiscoverSectionsPagerProps = {
  renderRefreshControl?: () => ReactElement<RefreshControlProps>;
  scrollOffset: SharedValue<number>;
};

type SectionScrollOffsets = Record<DiscoverSection, number>;

const INITIAL_SECTION_SCROLL_OFFSETS: SectionScrollOffsets = {
  crypto: 0,
  markets: 0,
  forYou: 0,
  sports: 0,
};

const EAGER_MOUNTED_SECTIONS = new Set<DiscoverSection>(['forYou', 'crypto', 'sports']);

export const DiscoverSectionsPager = memo(function DiscoverSectionsPager({
  renderRefreshControl,
  scrollOffset,
}: DiscoverSectionsPagerProps) {
  const { ref, goToPage } = usePagerNavigation<DiscoverSection>();
  const activeSection = useSharedValue<DiscoverSection>(useDiscoverNavigationStore.getState().activeSection);
  const sectionScrollOffsets = useSharedValue<SectionScrollOffsets>({ ...INITIAL_SECTION_SCROLL_OFFSETS });

  useListen(
    useDiscoverNavigationStore,
    state => state.activeSection,
    section => {
      activeSection.value = section;
      scrollOffset.value = sectionScrollOffsets.value[section] ?? 0;
      goToPage(section);
    }
  );

  const handlePagerIndexChange = useCallback((index: number) => {
    const section = getDiscoverSectionForIndex(index);
    if (section) DiscoverSectionNavigation.navigate(section);
  }, []);

  return (
    <Box style={styles.container} testID="discover-sections-pager">
      {useStableValue(() => (
        <SmoothPager
          enableSwipeToGoBack={false}
          enableSwipeToGoForward={false}
          fillHeight
          initialPage={useDiscoverNavigationStore.getState().activeSection}
          onNewIndex={handlePagerIndexChange}
          ref={ref}
          scaleTo={1}
          springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
          verticalPageAlignment="top"
        >
          {DISCOVER_SECTION_ORDER.map(section => (
            <SmoothPager.Page
              component={
                <DiscoverSectionScrollView
                  activeSection={activeSection}
                  renderRefreshControl={renderRefreshControl}
                  scrollOffset={scrollOffset}
                  section={section}
                  sectionScrollOffsets={sectionScrollOffsets}
                />
              }
              id={section}
              key={section}
              lazy={!EAGER_MOUNTED_SECTIONS.has(section)}
            />
          ))}
        </SmoothPager>
      ))}
    </Box>
  );
});

const DiscoverSectionScrollView = memo(function DiscoverSectionScrollView({
  activeSection,
  renderRefreshControl,
  scrollOffset,
  section,
  sectionScrollOffsets,
}: {
  activeSection: SharedValue<DiscoverSection>;
  renderRefreshControl?: () => ReactElement<RefreshControlProps>;
  scrollOffset: SharedValue<number>;
  section: DiscoverSection;
  sectionScrollOffsets: SharedValue<SectionScrollOffsets>;
}) {
  const { registerSectionScrollView } = useDiscoverScreenContext();
  const tabBarOffset = useTabBarOffset();
  const bottomInset = tabBarOffset + 12;

  const setScrollViewRef = useCallback(
    (scrollView: Animated.ScrollView | null) => {
      registerSectionScrollView(section, scrollView);
    },
    [registerSectionScrollView, section]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const clampedPosition = clamp(event.contentOffset.y, 0, DEFAULT_SCROLL_FADE_DISTANCE);

      if (sectionScrollOffsets.value[section] !== clampedPosition) {
        sectionScrollOffsets.modify(value => {
          value[section] = clampedPosition;
          return value;
        });
      }

      if (activeSection.value !== section || scrollOffset.value === clampedPosition) return;
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
      testID={`discover-section-${section}`}
    >
      <DiscoverSectionContent section={section} />
    </Animated.ScrollView>
  );
});

const DiscoverSectionContent = memo(function DiscoverSectionContent({ section }: { section: DiscoverSection }) {
  switch (section) {
    case 'forYou':
      return <ForYouPage />;
    case 'crypto':
      return <CryptoPage />;
    case 'markets':
      return <MarketsPage />;
    case 'sports':
      return <SportsSection />;
  }
});

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
