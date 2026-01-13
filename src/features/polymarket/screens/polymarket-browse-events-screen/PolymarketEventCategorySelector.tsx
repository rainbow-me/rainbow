import { memo, useCallback, useMemo, useRef } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { Border } from '@/design-system/components/Border/Border';
import { globalColors } from '@/design-system/color/palettes';
import { Text } from '@/design-system/components/Text/Text';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { CATEGORIES, Category } from '@/features/polymarket/constants';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { deepFreeze } from '@/utils/deepFreeze';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette } from '@/worklets/colors';
import { opacity } from '@/framework/ui/utils/opacity';

type CategoryKey = keyof typeof CATEGORIES;
type CategoryWithKey = Category & { key: CategoryKey };
type ItemLayout = { x: number; width: number };

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
  const itemLayouts = useRef<ItemLayout[]>([]);
  const didInitialScroll = useRef(false);

  const selectedCategoryKey = useSharedValue<CategoryKey>(usePolymarketCategoryStore.getState().tagId as CategoryKey);

  const scrollToSelectedCategory = useCallback(() => {
    const index = CATEGORY_ITEMS.findIndex(category => category.key === selectedCategoryKey.value);
    const scrollX = calculateCenteredScrollX(itemLayouts.current, index);
    categorySelectorRef.current?.scrollTo({ x: scrollX, y: 0, animated: false });
  }, [categorySelectorRef, selectedCategoryKey]);

  const onItemLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      itemLayouts.current[index] = { x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width };
      if (!didInitialScroll.current && allItemsMeasured(itemLayouts.current)) {
        didInitialScroll.current = true;
        scrollToSelectedCategory();
      }
    },
    [scrollToSelectedCategory]
  );

  const onPress = useCallback(
    (category: CategoryWithKey) => {
      selectedCategoryKey.value = category.key;
      usePolymarketCategoryStore.getState().setTagId(category.key);
    },
    [selectedCategoryKey]
  );

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
    opacity: selectedCategoryKey.value === categoryKey ? 1 : 0,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    color: selectedCategoryKey.value === categoryKey ? selectedColor : unselectedIconColor,
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
          <AnimatedTextIcon align="center" color="label" size="icon 16px" textStyle={iconStyle} weight="heavy">
            {category.icon}
          </AnimatedTextIcon>
        </View>
        <Text align="center" color="label" size="17pt" weight="heavy">
          {category.label}
        </Text>
      </Animated.View>
    </ButtonPressAnimation>
  );
});

// ============ Utilities ====================================================== //

function allItemsMeasured(layouts: ItemLayout[]): boolean {
  return layouts.filter(Boolean).length === CATEGORY_ITEMS.length;
}

function calculateCenteredScrollX(layouts: ItemLayout[], index: number): number {
  const layout = layouts[index];
  const lastLayout = layouts[layouts.length - 1];
  if (!layout || !lastLayout) return 0;

  const itemCenter = layout.x + layout.width / 2;
  const contentWidth = lastLayout.x + lastLayout.width + HORIZONTAL_PADDING;
  const maxScroll = Math.max(0, contentWidth - DEVICE_WIDTH);

  return Math.min(Math.max(0, itemCenter - DEVICE_WIDTH / 2), maxScroll);
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
