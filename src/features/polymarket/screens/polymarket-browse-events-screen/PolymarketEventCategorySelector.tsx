import React, { memo, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Text, useColorMode, Border, AnimatedText, useForegroundColor } from '@/design-system';
import { CATEGORIES, Category } from '@/features/polymarket/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';
import Animated, { runOnJS, SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';

const CONTAINER_HEIGHT = 40;
const CATEGORY_ITEMS = Object.values(CATEGORIES);

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
      runOnJS(usePolymarketEventsStore.getState().setTagId)(category.tagId);
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
  const isSelected = useDerivedValue<boolean>(() => selectedCategoryTagId.value === category.tagId);

  const accentColors = useMemo(() => {
    const selectedColor = isDarkMode ? category.color.dark : category.color.light;
    return {
      opacity4: opacityWorklet(selectedColor, 0.04),
      opacity8: opacityWorklet(selectedColor, 0.08),
      opacity28: opacityWorklet(selectedColor, 0.28),
      opacity100: selectedColor,
    };
  }, [category.color, isDarkMode]);

  const itemStyle = useAnimatedStyle(() => ({
    backgroundColor: isSelected.value ? accentColors.opacity8 : 'transparent',
    borderRadius: CONTAINER_HEIGHT / 2,
  }));

  const borderContainerStyle = useAnimatedStyle(() => ({
    opacity: isSelected.value ? 1 : 0,
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: isSelected.value ? accentColors.opacity100 : labelColor,
  }));

  return (
    <ButtonPressAnimation scaleTo={0.92} onPress={() => onPress(category)}>
      <Animated.View style={[itemStyle, styles.itemContainer]}>
        <Animated.View style={[borderContainerStyle, StyleSheet.absoluteFill]}>
          <Border borderRadius={CONTAINER_HEIGHT / 2} borderWidth={THICKER_BORDER_WIDTH} borderColor={{ custom: accentColors.opacity4 }} />
          <InnerShadow borderRadius={CONTAINER_HEIGHT / 2} color={accentColors.opacity28} blur={16} dx={0} dy={8} />
        </Animated.View>
        <View style={styles.iconContainer}>
          {/* <TextShadow blur={7} shadowOpacity={isSelected ? 0.4 : 0}> */}
          <AnimatedText color={'label'} size="icon 17px" weight="heavy" style={textStyle}>
            {category.icon}
          </AnimatedText>
          {/* </TextShadow> */}
        </View>
        <Text size="17pt" weight="heavy" color="label">
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
