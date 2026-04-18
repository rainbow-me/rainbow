import React, { useCallback, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler } from 'react-native-reanimated';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { Box, Inline, Text, TextIcon, TextShadow, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

const CAROUSEL_HORIZONTAL_PADDING = 20;
const CARD_GAP = 8;
const PEEK_WIDTH = 32;
export const CARD_WIDTH = DEVICE_WIDTH - CAROUSEL_HORIZONTAL_PADDING * 2 - PEEK_WIDTH;
export const CARD_HEIGHT = 100;

type MarketCarouselProps<T> = {
  accentColor: string;
  data: T[];
  icon: string;
  keyExtractor: (item: T) => string;
  loading?: boolean;
  onSeeAll: () => void;
  renderItem: (item: T, index: number) => ReactElement;
  title: string;
};

export function MarketCarousel<T>({ accentColor, data, icon, keyExtractor, loading, onSeeAll, renderItem, title }: MarketCarouselProps<T>) {
  const { isDarkMode } = useColorMode();
  const animatedRef = useAnimatedRef<Animated.FlatList<T>>();

  const renderFlatListItem = useCallback(
    ({ item, index }: { item: T; index: number }) => <View style={styles.cardWrapper}>{renderItem(item, index)}</View>,
    [renderItem]
  );

  // Clamp left overscroll on the UI thread — a JS-thread clamp via onScroll + scrollToOffset
  // fought iOS's native drag delta and stuttered. Right-edge bounce is intentionally preserved.
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      'worklet';
      if (event.contentOffset.x < 0) {
        scrollTo(animatedRef, 0, 0, false);
      }
    },
  });

  if (!loading && data.length === 0) return null;

  return (
    <Box gap={12}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingHorizontal="4px">
        <Inline alignVertical="bottom" space="8px">
          <TextShadow blur={12} color={accentColor} shadowOpacity={isDarkMode ? 0.6 : 0}>
            <TextIcon size="icon 20px" weight="heavy" color={{ custom: accentColor }} textStyle={{ top: 4 }}>
              {icon}
            </TextIcon>
          </TextShadow>
          <Text size="22pt" weight="heavy" color="label">
            {title}
          </Text>
        </Inline>

        <ButtonPressAnimation onPress={onSeeAll} scaleTo={0.9}>
          <Box flexDirection="row" alignItems="center" gap={4} paddingVertical="8px">
            <Text size="15pt" weight="heavy" color="labelQuaternary">
              See all
            </Text>
            <TextIcon size="icon 11px" weight="heavy" color="labelQuaternary">
              {'􀄯'}
            </TextIcon>
          </Box>
        </ButtonPressAnimation>
      </Box>

      {loading ? (
        <View style={styles.skeletonRow}>
          <CarouselSkeleton />
          <CarouselSkeleton />
        </View>
      ) : (
        <Animated.FlatList
          ref={animatedRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          style={styles.flatList}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          snapToAlignment="start"
          onScroll={scrollHandler}
          renderItem={renderFlatListItem}
          keyExtractor={keyExtractor}
        />
      )}
    </Box>
  );
}

function CarouselSkeleton() {
  const { isDarkMode } = useColorMode();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fillSecondary, 0.1);
  const skeletonColor = isDarkMode ? fillQuaternary : fillSecondary;

  return (
    <View style={[styles.skeleton, { backgroundColor: skeletonColor }]}>
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
  },
  contentContainer: {
    gap: CARD_GAP,
    paddingHorizontal: CAROUSEL_HORIZONTAL_PADDING,
  },
  flatList: {
    marginHorizontal: -CAROUSEL_HORIZONTAL_PADDING,
    overflow: 'visible',
  },
  skeleton: {
    borderRadius: 32,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: 0,
  },
});
