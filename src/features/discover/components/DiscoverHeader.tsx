import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { trackDiscoverSurfaceTabPress } from '@/features/discover/components/marketPress/marketPressContext';
import {
  DiscoverSectionNavigation,
  useDiscoverNavigationStore,
  type DiscoverSection,
} from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSurface } from '@/features/placements/surfaces/hooks/useSurface';
import { type Surface } from '@/features/placements/surfaces/types';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

export const DISCOVER_HEADER_HEIGHT = 80;
const SEARCH_BUTTON_RIGHT_INSET = 19;
const SEARCH_BUTTON_SIZE = 36;
const CONTENT_TOP_INSET = 40;
const RIGHT_FADE_WIDTH = SEARCH_BUTTON_RIGHT_INSET + 100;
const SELECTED_TAB_RIGHT_INSET = SEARCH_BUTTON_RIGHT_INSET + SEARCH_BUTTON_SIZE + 12;
const SCREEN_BACKGROUND_COLOR = {
  light: '#FBFCFD',
  dark: '#000000',
};

export function DiscoverHeader() {
  const separatorColor = useForegroundColor('separator');
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      height={DISCOVER_HEADER_HEIGHT}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: separatorColor,
      }}
    >
      <DiscoverCategorySelector />
      <DiscoverSearchButton />
    </Box>
  );
}

function DiscoverSearchButton() {
  const { onTapSearch } = useDiscoverScreenContext();
  const { isDarkMode } = useColorMode();
  return (
    <View style={{ position: 'absolute', top: 28, right: SEARCH_BUTTON_RIGHT_INSET }}>
      <ButtonPressAnimation onPress={onTapSearch} scaleTo={0.8} testID="discover-search-icon">
        <Box
          backgroundColor={isDarkMode ? '#1D1E1F' : '#F5F5F7'}
          width={SEARCH_BUTTON_SIZE}
          height={SEARCH_BUTTON_SIZE}
          borderRadius={18}
          alignItems="center"
          justifyContent="center"
          borderWidth={THICK_BORDER_WIDTH}
          borderColor="buttonStroke"
        >
          <TextIcon size="icon 16px" color="label" weight="heavy" containerSize={36}>
            {'􀊫'}
          </TextIcon>
        </Box>
      </ButtonPressAnimation>
    </View>
  );
}

function DiscoverCategorySelector() {
  const activeSection = useDiscoverNavigationStore(state => state.activeSection);
  const surface = useDiscoverSurface();
  const tabs = surface?.items !== undefined ? surface.items : [];
  const { scrollToSectionTop } = useDiscoverScreenContext();
  const { isDarkMode, colorMode } = useColorMode();
  const screenBackgroundColor = getValueForColorMode(SCREEN_BACKGROUND_COLOR, colorMode);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewWidthRef = useRef(0);
  const tabLayoutsRef = useRef<Partial<Record<DiscoverSection, { width: number; x: number }>>>({});

  const unselectedColor = isDarkMode ? { custom: '#4D4D4D' } : { custom: '#999999' };

  const scrollSelectedTabIntoView = useCallback((section: DiscoverSection, animated = true) => {
    const tabLayout = tabLayoutsRef.current[section];
    const scrollViewWidth = scrollViewWidthRef.current;
    if (!tabLayout || !scrollViewWidth) return;

    const visibleWidth = scrollViewWidth - SELECTED_TAB_RIGHT_INSET;
    const leftEdge = scrollOffsetRef.current;
    const rightEdge = leftEdge + visibleWidth;
    const tabLeft = tabLayout.x;
    const tabRight = tabLayout.x + tabLayout.width;

    if (tabLeft < leftEdge) {
      const nextOffset = Math.max(0, tabLeft - 24);
      scrollOffsetRef.current = nextOffset;
      scrollViewRef.current?.scrollTo({ animated, x: nextOffset });
      return;
    }

    if (tabRight > rightEdge) {
      const nextOffset = Math.max(0, tabRight - visibleWidth + 16);
      scrollOffsetRef.current = nextOffset;
      scrollViewRef.current?.scrollTo({ animated, x: nextOffset });
    }
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => scrollSelectedTabIntoView(activeSection));
  }, [activeSection, scrollSelectedTabIntoView]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
  }, []);

  const handleScrollViewLayout = useCallback(
    (event: LayoutChangeEvent) => {
      scrollViewWidthRef.current = event.nativeEvent.layout.width;
      scrollSelectedTabIntoView(activeSection, false);
    },
    [activeSection, scrollSelectedTabIntoView]
  );

  const handlePress = useCallback(
    (section: Surface) => {
      const wasActive = DiscoverSectionNavigation.isSectionActive(section.id);
      const sectionTitle = section.label || section.id;
      trackDiscoverSurfaceTabPress({
        sectionId: section.id,
        sectionTitle,
        surfaceId: surface?.id ?? 'discover',
        wasActive,
      });

      if (wasActive) {
        scrollToSectionTop(section.id);
      } else {
        DiscoverSectionNavigation.navigate(section.id);
      }
    },
    [scrollToSectionTop, surface?.id]
  );

  if (!tabs.length) return null;

  return (
    <Box width="full" height="full">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        contentContainerStyle={{
          height: '100%',
          gap: 16,
          paddingTop: CONTENT_TOP_INSET,
          paddingLeft: 24,
          paddingRight: SELECTED_TAB_RIGHT_INSET + 32,
        }}
        style={{ height: '100%' }}
        onLayout={handleScrollViewLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {tabs.map(section => {
          const isSelected = section.id === activeSection;
          const sectionLabel = section.label || section.id;
          return (
            <View
              key={section.id}
              onLayout={event => {
                tabLayoutsRef.current[section.id] = event.nativeEvent.layout;
                if (section.id === activeSection) scrollSelectedTabIntoView(section.id, false);
              }}
            >
              <ButtonPressAnimation
                hitSlop={4}
                onPress={() => handlePress(section)}
                scaleTo={0.92}
                testID={`discover-section-tab-${section.id}`}
              >
                <Text color={isSelected ? 'label' : unselectedColor} size="22pt" weight="heavy">
                  {sectionLabel}
                </Text>
              </ButtonPressAnimation>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row' }} pointerEvents="none">
        <EasingGradient
          startColor={screenBackgroundColor}
          endColor={screenBackgroundColor}
          startPosition="right"
          endPosition="left"
          startOpacity={1}
          endOpacity={0}
          style={{ width: RIGHT_FADE_WIDTH }}
        />
        <View
          style={{
            height: '100%',
            width: SEARCH_BUTTON_RIGHT_INSET,
            backgroundColor: screenBackgroundColor,
          }}
        />
      </View>
    </Box>
  );
}
