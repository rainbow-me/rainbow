import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withTiming, type SharedValue } from 'react-native-reanimated';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Border, globalColors, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { CATEGORIES, type Category, type CategoryKey } from '@/features/polymarket/constants';
import { useHorizontalSelectorStoreSync } from '@/features/polymarket/hooks/useHorizontalSelectorStoreSync';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { deepFreeze } from '@/utils/deepFreeze';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette } from '@/worklets/colors';

type CategoryWithKey = Category & { key: CategoryKey };

const VERTICAL_PADDING = 0;
const CONTAINER_HEIGHT = 40 + VERTICAL_PADDING * 2;
const HORIZONTAL_PADDING = 16;
const CATEGORY_ITEMS: CategoryWithKey[] = Object.entries(CATEGORIES).map<CategoryWithKey>(([key, category]) => ({
  ...category,
  key: key as CategoryKey,
}));
const PALETTE_OPACITIES = deepFreeze([6, 8, 28]);

// ============ Category Selector ============================================== //

export const PolymarketEventCategorySelector = memo(function PolymarketEventCategorySelector() {
  const { categorySelectorRef } = usePolymarketContext();
  const {
    onItemLayout,
    onPress,
    selectedKey: selectedCategoryKey,
  } = useHorizontalSelectorStoreSync({
    containerWidth: DEVICE_WIDTH,
    getItemKey: getCategoryKey,
    horizontalPadding: HORIZONTAL_PADDING,
    items: CATEGORY_ITEMS,
    scrollViewRef: categorySelectorRef,
    selectStoreKey: state => state.tagId,
    setStoreKey: setCategoryKey,
    store: usePolymarketCategoryStore,
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContentContainer}
        horizontal
        ref={categorySelectorRef}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {CATEGORY_ITEMS.map((category, index) => (
          <View key={category.key} onLayout={event => onItemLayout(event, index)}>
            <CategoryItem category={category} onPress={onPress} selectedCategoryKey={selectedCategoryKey} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

// ============ Category Item ================================================== //

type CategoryItemProps = {
  category: CategoryWithKey;
  onPress: (category: CategoryWithKey) => void;
  selectedCategoryKey: SharedValue<CategoryKey>;
};

const CategoryItem = memo(function CategoryItem({ category, onPress, selectedCategoryKey }: CategoryItemProps) {
  const { isDarkMode } = useColorMode();
  const labelColor = useForegroundColor('label');
  const selectedColor = isDarkMode ? category.color.dark : category.color.light;
  const unselectedIconColor = isDarkMode ? labelColor : selectedColor;

  const categoryKey = category.key;
  const accentColors = useMemo(() => createOpacityPalette(selectedColor, PALETTE_OPACITIES), [selectedColor]);

  const backgroundFillStyle = useMemo(
    () => ({
      backgroundColor: isDarkMode ? accentColors.opacity6 : opacity(globalColors.white100, 0.6),
      borderRadius: CONTAINER_HEIGHT / 2,
    }),
    [isDarkMode, accentColors]
  );

  const borderContainerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(selectedCategoryKey.value === categoryKey ? 1 : 0, TIMING_CONFIGS.buttonPressConfig),
  }));

  const selectedIconStyle = useAnimatedStyle(() => ({
    opacity: withTiming(selectedCategoryKey.value === categoryKey ? 1 : 0, TIMING_CONFIGS.buttonPressConfig),
  }));

  const unselectedIconStyle = useAnimatedStyle(() => ({
    opacity: withTiming(selectedCategoryKey.value === categoryKey ? 0 : 1, TIMING_CONFIGS.buttonPressConfig),
  }));

  return (
    <ButtonPressAnimation onPress={() => onPress(category)} scaleTo={0.88}>
      <Animated.View style={styles.itemContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, borderContainerStyle]}>
          <Border borderColor={{ custom: accentColors.opacity6 }} borderRadius={CONTAINER_HEIGHT / 2} borderWidth={THICKER_BORDER_WIDTH} />
          <View style={[StyleSheet.absoluteFill, backgroundFillStyle]} />
          {isDarkMode && <InnerShadow blur={16} borderRadius={CONTAINER_HEIGHT / 2} color={accentColors.opacity28} dx={0} dy={8} />}
        </Animated.View>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.iconLayer, unselectedIconStyle]}>
            <TextIcon align="center" color={{ custom: unselectedIconColor }} size="icon 16px" weight="heavy">
              {category.icon}
            </TextIcon>
          </Animated.View>
          <Animated.View style={[styles.iconLayer, selectedIconStyle]}>
            <TextIcon align="center" color={{ custom: selectedColor }} size="icon 16px" weight="heavy">
              {category.icon}
            </TextIcon>
          </Animated.View>
        </View>
        <Text align="center" color="label" size="17pt" weight="heavy">
          {category.label}
        </Text>
      </Animated.View>
    </ButtonPressAnimation>
  );
});

// ============ Utilities ====================================================== //

function getCategoryKey(category: CategoryWithKey): CategoryKey {
  return category.key;
}

function setCategoryKey(key: CategoryKey): void {
  usePolymarketCategoryStore.getState().setTagId(key);
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    width: DEVICE_WIDTH,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 24,
  },
  iconLayer: {
    position: 'absolute',
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 16,
  },
  scrollView: {
    height: CONTAINER_HEIGHT,
    width: DEVICE_WIDTH,
  },
  scrollViewContentContainer: {
    gap: 2,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: VERTICAL_PADDING,
  },
});
