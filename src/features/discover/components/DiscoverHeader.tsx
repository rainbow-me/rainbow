import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useDiscoverScreenContext } from '@/components/Discover/DiscoverScreenContext';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Box, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { DISCOVER_SCREEN_BACKGROUND_COLOR } from '@/features/discover/constants';
import {
  DISCOVER_SECTION_ORDER,
  DISCOVER_SECTIONS,
  DiscoverSectionNavigation,
  useDiscoverNavigationStore,
  type DiscoverSection,
} from '@/features/discover/stores/discoverNavigationStore';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

export const DISCOVER_HEADER_HEIGHT = 80;
const SEARCH_BUTTON_RIGHT_INSET = 19;
const SEARCH_BUTTON_SIZE = 36;
const CONTENT_RIGHT_INSET = SEARCH_BUTTON_RIGHT_INSET + SEARCH_BUTTON_SIZE;
const CONTENT_TOP_INSET = 40;

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
  const { scrollToSectionTop } = useDiscoverScreenContext();
  const { isDarkMode, colorMode } = useColorMode();

  const unselectedColor = isDarkMode ? { custom: '#4D4D4D' } : { custom: '#999999' };

  const handlePress = useCallback(
    (section: DiscoverSection) => {
      if (DiscoverSectionNavigation.isSectionActive(section)) {
        scrollToSectionTop(section);
      } else {
        DiscoverSectionNavigation.navigate(section);
      }
    },
    [scrollToSectionTop]
  );

  return (
    <Box width="full" height="full">
      <ScrollView
        horizontal
        contentContainerStyle={{ height: '100%', gap: 16, paddingTop: CONTENT_TOP_INSET, paddingLeft: 24 }}
        style={{ height: '100%' }}
        contentInset={{ right: CONTENT_RIGHT_INSET + 32 }}
        showsHorizontalScrollIndicator={false}
      >
        {DISCOVER_SECTION_ORDER.map(section => {
          const category = DISCOVER_SECTIONS[section];
          const isSelected = section === activeSection;
          return (
            <ButtonPressAnimation
              hitSlop={4}
              key={section}
              onPress={() => handlePress(section)}
              scaleTo={0.92}
              testID={`discover-section-tab-${section}`}
            >
              <Text color={isSelected ? 'label' : unselectedColor} size="22pt" weight="heavy">
                {category.label}
              </Text>
            </ButtonPressAnimation>
          );
        })}
      </ScrollView>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row' }} pointerEvents="none">
        <EasingGradient
          startColor="rgba(0, 0, 0, 1)"
          endColor="rgba(0, 0, 0, 1)"
          startPosition="right"
          endPosition="left"
          startOpacity={1}
          endOpacity={0}
          style={{ width: SEARCH_BUTTON_RIGHT_INSET + 100 }}
        />
        <View
          style={{
            height: '100%',
            width: SEARCH_BUTTON_RIGHT_INSET,
            backgroundColor: getValueForColorMode(DISCOVER_SCREEN_BACKGROUND_COLOR, colorMode),
          }}
        />
      </View>
    </Box>
  );
}
