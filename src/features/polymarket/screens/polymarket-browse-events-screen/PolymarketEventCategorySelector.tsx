import React, { memo, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Text, useColorMode, Border, useForegroundColor } from '@/design-system';
import { CATEGORIES, Category } from '@/features/polymarket/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { deepFreeze } from '@/utils/deepFreeze';
import { createOpacityPalette } from '@/worklets/colors';

const CONTAINER_HEIGHT = 40;
const CATEGORY_ITEMS = Object.values(CATEGORIES);
const PALETTE_OPACITIES = deepFreeze([4, 8, 28]);

export const PolymarketEventCategorySelector = memo(function PolymarketEventCategorySelector() {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemOffsets = useRef<number[]>([]);

  const selectedCategoryTagId = useSharedValue<string | null>(usePolymarketEventsStore.getState().tagId);

  const scrollToSelectedCategory = useCallback(() => {
    const index = CATEGORY_ITEMS.findIndex(category => category.tagId === selectedCategoryTagId.value);
    const offset = itemOffsets.current[index];
    scrollViewRef.current?.scrollTo({ x: offset - 20, y: 0, animated: false });
  }, [selectedCategoryTagId, itemOffsets]);

  const onItemLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      itemOffsets.current[index] = event.nativeEvent.layout.x;
      if (itemOffsets.current.length === CATEGORY_ITEMS.length - 1) {
        scrollToSelectedCategory();
      }
    },
    [itemOffsets, scrollToSelectedCategory]
  );

  const onPress = useCallback(
    (category: Category) => {
      selectedCategoryTagId.value = category.tagId;
      usePolymarketEventsStore.getState().setTagId(category.tagId);
    },
    [selectedCategoryTagId]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContentContainer}
      >
        {CATEGORY_ITEMS.map((category, index) => (
          <View key={category.tagId} onLayout={event => onItemLayout(event, index)}>
            <CategoryItem category={category} onPress={onPress} selectedCategoryTagId={selectedCategoryTagId} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

type CategoryItemProps = {
  category: Category;
  onPress: (category: Category) => void;
  selectedCategoryTagId: SharedValue<string | null>;
};

const CategoryItem = memo(function CategoryItem({ category, onPress, selectedCategoryTagId }: CategoryItemProps) {
  const { isDarkMode } = useColorMode();
  const labelColor = useForegroundColor('label');

  const tagId = category.tagId;
  const selectedColor = isDarkMode ? category.color.dark : category.color.light;
  const accentColors = useMemo(() => createOpacityPalette(selectedColor, PALETTE_OPACITIES), [selectedColor]);

  const borderContainerStyle = useAnimatedStyle(() => ({
    opacity: selectedCategoryTagId.value === tagId ? 1 : 0,
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: selectedCategoryTagId.value === tagId ? selectedColor : labelColor,
  }));

  return (
    <ButtonPressAnimation scaleTo={0.92} onPress={() => onPress(category)}>
      <Animated.View style={styles.itemContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, borderContainerStyle]}>
          <Border borderRadius={CONTAINER_HEIGHT / 2} borderWidth={THICKER_BORDER_WIDTH} borderColor={{ custom: accentColors.opacity4 }} />
          <InnerShadow borderRadius={CONTAINER_HEIGHT / 2} color={accentColors.opacity28} blur={16} dx={0} dy={8} />
        </Animated.View>
        <View style={styles.iconContainer}>
          {/* <TextShadow blur={7} shadowOpacity={isSelected ? 0.4 : 0}> */}
          <AnimatedTextIcon align="center" color={'label'} size="icon 17px" weight="heavy" textStyle={textStyle}>
            {category.icon}
          </AnimatedTextIcon>
          {/* </TextShadow> */}
        </View>
        <Text align="center" size="17pt" weight="heavy" color="label">
          {category.label}
        </Text>
      </Animated.View>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
  },
  scrollViewContentContainer: {
    gap: 6,
    paddingHorizontal: 16,
  },
  itemContainer: {
    height: '100%',
    paddingLeft: 10,
    paddingRight: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
