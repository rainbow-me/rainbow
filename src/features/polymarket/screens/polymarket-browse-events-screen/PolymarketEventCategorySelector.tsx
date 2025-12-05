import React, { memo, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useColorMode, Box, TextShadow } from '@/design-system';
import { CATEGORIES, Category } from '@/features/polymarket/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';

const CONTAINER_HEIGHT = 40;
const CATEGORY_ITEMS = Object.values(CATEGORIES);

export const PolymarketEventCategorySelector = memo(function PolymarketEventCategorySelector() {
  const selectedCategoryTagId = usePolymarketEventsStore(state => state.tagId);

  const onPress = useCallback((category: Category) => {
    usePolymarketEventsStore.getState().setTagId(category.tagId);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContentContainer}>
        {CATEGORY_ITEMS.map(category => (
          <CategoryItem key={category.tagId} category={category} onPress={onPress} isSelected={selectedCategoryTagId === category.tagId} />
        ))}
      </ScrollView>
    </View>
  );
});

type CategoryItemProps = {
  category: Category;
  onPress: (category: Category) => void;
  isSelected: boolean;
};

const CategoryItem = memo(function CategoryItem({ category, onPress, isSelected }: CategoryItemProps) {
  const { isDarkMode } = useColorMode();

  const accentColors = useMemo(() => {
    const selectedColor = isDarkMode ? category.color.dark : category.color.light;
    return {
      opacity4: opacityWorklet(selectedColor, 0.04),
      opacity8: opacityWorklet(selectedColor, 0.08),
      opacity28: opacityWorklet(selectedColor, 0.28),
      opacity100: selectedColor,
    };
  }, [category.color, isDarkMode]);

  const iconColor = isSelected ? { custom: accentColors.opacity100 } : 'label';

  return (
    <ButtonPressAnimation scaleTo={0.92} onPress={() => onPress(category)}>
      <Box
        borderRadius={CONTAINER_HEIGHT / 2}
        borderWidth={THICKER_BORDER_WIDTH}
        borderColor={{ custom: isSelected ? accentColors.opacity4 : 'transparent' }}
        style={[styles.itemContainer, isSelected && { backgroundColor: accentColors.opacity8 }]}
      >
        <InnerShadow
          borderRadius={CONTAINER_HEIGHT / 2}
          color={isSelected ? accentColors.opacity28 : 'transparent'}
          blur={16}
          dx={0}
          dy={8}
        />
        <View style={styles.iconContainer}>
          <TextShadow blur={7} shadowOpacity={isSelected ? 0.4 : 0}>
            <Text color={iconColor} size="icon 17px" weight="heavy">
              {category.icon}
            </Text>
          </TextShadow>
        </View>
        <Text size="17pt" weight="heavy" color="label">
          {category.label}
        </Text>
      </Box>
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
