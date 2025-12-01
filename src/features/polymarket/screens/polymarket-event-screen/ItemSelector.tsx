import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import Animated, {
  DerivedValue,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, easing } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { AnimatedText, Box, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { opacity } from '@/__swaps__/utils/swaps';

// ============ Constants ====================================================== //

const MAX_ITEM_COUNT = 4;

// ============ Types ========================================================== //

type Items = Record<string, { value: string; label: string; index: number }>;

type ItemSelectorProps = {
  backgroundColor: string;
  color: string;
  selectedItem: string;
  onSelectItem: (item: string) => void;
  items: Items;
  pillHeight: number;
  pillWidth?: number;
  pillGap: number;
  containerWidth: number;
  paddingHorizontal: number;
  paddingVertical: number;
};

type ItemButtonProps = {
  buttonWidth: number;
  buttonHeight: number;
  color: string;
  index: number;
  label: string;
  onPress: (value: string) => void;
  selectedIndex: SharedValue<number>;
  value: string;
};

// ============ Main Component ================================================= //

export const ItemSelector = memo(function ItemSelector({
  backgroundColor,
  color,
  selectedItem,
  onSelectItem,
  items,
  pillHeight,
  pillWidth,
  pillGap,
  containerWidth,
  paddingHorizontal = 0,
  paddingVertical = 0,
}: ItemSelectorProps) {
  const itemCount = useMemo(() => Object.keys(items).length, [items]);
  const effectiveItemCount = useMemo(() => Math.min(itemCount, MAX_ITEM_COUNT), [itemCount]);

  const buttonWidth = useMemo(() => {
    if (pillWidth) return pillWidth;
    return (containerWidth - paddingHorizontal * 2 - pillGap * (effectiveItemCount - 1)) / effectiveItemCount;
  }, [pillWidth, containerWidth, pillGap, paddingHorizontal, effectiveItemCount]);

  const scrollEnabled = useMemo(() => itemCount > MAX_ITEM_COUNT, [itemCount]);

  const scrollViewRef = useRef<ScrollView>(null);
  const selectedIndex = useSharedValue(items[selectedItem].index);
  const scrollViewProps = getScrollViewProps({
    paddingHorizontal,
    valueCount: itemCount,
    pillGap,
    pillWidth: buttonWidth,
  });

  // Sync selectedIndex when prop changes externally
  useEffect(() => {
    selectedIndex.value = items[selectedItem].index;
  }, [selectedItem, items, selectedIndex]);

  const onPress = useCallback(
    (item: string) => {
      'worklet';
      selectedIndex.value = items[item].index;
      runOnJS(onSelectItem)(item);
    },
    [onSelectItem, selectedIndex, items]
  );

  return (
    <Box style={styles.container} borderWidth={4 / 3} borderColor="separatorSecondary" borderRadius={28}>
      <ScrollView
        contentContainerStyle={[scrollViewProps.contentContainerStyle, { paddingVertical }]}
        horizontal
        maintainVisibleContentPosition={scrollViewProps.maintainVisibleContentPosition}
        ref={scrollViewRef}
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        style={scrollViewProps.style}
      >
        <SelectedHighlight
          paddingHorizontal={paddingHorizontal}
          buttonWidth={useDerivedValue(() => buttonWidth)}
          buttonHeight={pillHeight}
          color={color}
          pillGap={pillGap}
          selectedIndex={selectedIndex}
        />
        <ItemButtons
          buttonWidth={buttonWidth}
          buttonHeight={pillHeight}
          color={color}
          onPress={onPress}
          selectedIndex={selectedIndex}
          items={items}
        />
      </ScrollView>

      <EasingGradient
        easing={easing.in.sin}
        endColor={backgroundColor}
        endPosition="left"
        startColor={backgroundColor}
        startPosition="right"
        steps={8}
        style={[styles.leftFade, { width: paddingHorizontal }]}
      />

      <EasingGradient
        easing={easing.in.sin}
        endColor={backgroundColor}
        endPosition="right"
        startColor={backgroundColor}
        startPosition="left"
        steps={8}
        style={[styles.rightFade, { width: paddingHorizontal }]}
      />
    </Box>
  );
});

// ============ SelectedHighlight ============================================== //

const SelectedHighlight = memo(function SelectedHighlight({
  buttonHeight,
  buttonWidth,
  color,
  pillGap,
  selectedIndex,
  paddingHorizontal,
}: {
  buttonHeight: number;
  buttonWidth: DerivedValue<number>;
  color: string;
  pillGap: number;
  selectedIndex: SharedValue<number>;
  paddingHorizontal: number;
}) {
  const { isDarkMode } = useColorMode();
  const highlightBackgroundColor = opacity(color, 0.06);
  const borderColor = isDarkMode ? highlightBackgroundColor : opacity(color, 0.03);

  const translateX = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          selectedIndex.value * (buttonWidth.value + pillGap) + paddingHorizontal,
          SPRING_CONFIGS.snappyMediumSpringConfig
        ),
      },
    ],
  }));

  const width = useAnimatedStyle(() => ({
    width: withSpring(buttonWidth.value, SPRING_CONFIGS.snappyMediumSpringConfig),
  }));

  return (
    <Animated.View
      style={[
        styles.selectedHighlight,
        { backgroundColor: highlightBackgroundColor, borderColor, height: buttonHeight },
        translateX,
        width,
      ]}
    />
  );
});

// ============ BetTypeButton ================================================== //

const ItemButton = ({ buttonWidth, buttonHeight, color, index, label, onPress, selectedIndex, value }: ItemButtonProps) => {
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const textStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.value === index;
    const textColor = isSelected ? color : labelQuaternary;
    if (!IS_IOS) return { color: textColor };
    return {
      color: textColor,
      fontWeight: isSelected ? '800' : '700',
    };
  });

  return (
    <GestureHandlerButton
      hapticTrigger="tap-end"
      hapticType="soft"
      hitSlop={4}
      onPressWorklet={() => {
        'worklet';
        onPress(value);
      }}
      style={[styles.button, { width: buttonWidth, height: buttonHeight }]}
    >
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {label}
      </AnimatedText>
    </GestureHandlerButton>
  );
};

// ============ Mapped Buttons ================================================= //

const ItemButtons = ({
  buttonWidth,
  buttonHeight,
  color,
  onPress,
  selectedIndex,
  items,
}: {
  buttonWidth: number;
  buttonHeight: number;
  color: string;
  onPress: (value: string) => void;
  selectedIndex: SharedValue<number>;
  items: Items;
}) => {
  return Object.values(items).map(({ index, label, value }) => (
    <ItemButton
      key={value}
      buttonWidth={buttonWidth}
      buttonHeight={buttonHeight}
      color={color}
      index={index}
      label={label}
      onPress={onPress}
      selectedIndex={selectedIndex}
      value={value}
    />
  ));
};

// ============ Utilities ====================================================== //

function getScrollViewProps({
  valueCount,
  pillGap,
  pillWidth,
  paddingHorizontal,
}: {
  valueCount: number;
  pillGap: number;
  pillWidth: number;
  paddingHorizontal: number;
}): Pick<ScrollViewProps, 'contentContainerStyle' | 'maintainVisibleContentPosition' | 'style'> {
  const contentWidth = IS_IOS ? undefined : valueCount * pillWidth + pillGap * (valueCount - 1) + paddingHorizontal * 2;
  return {
    contentContainerStyle: [styles.contentContainer, { width: contentWidth, gap: pillGap, paddingHorizontal }],
    maintainVisibleContentPosition: IS_IOS ? undefined : { minIndexForVisible: 0 },
    style: styles.scrollView,
  };
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
    width: '100%',
    borderRadius: 28,
  },
  contentContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  leftFade: {
    height: '100%',
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
  },
  rightFade: {
    height: '100%',
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scrollView: {
    overflow: 'hidden',
    width: '100%',
  },
  selectedHighlight: {
    borderCurve: 'continuous',
    borderRadius: 17,
    borderWidth: 2,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
  },
});
