import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, ScrollViewProps, StyleProp, StyleSheet, ViewStyle, View } from 'react-native';
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
import { opacity } from '@/data/opacity';

// ============ Constants ====================================================== //

const DEFAULT_PILL_HEIGHT = 34;
const DEFAULT_PILL_GAP = 3;
const DEFAULT_PADDING_HORIZONTAL = 12;
const DEFAULT_PADDING_VERTICAL = 0;
const DEFAULT_MAX_VISIBLE_ITEMS = 4;
const DEFAULT_CONTAINER_BORDER_RADIUS = 28;
const DEFAULT_HIGHLIGHT_BORDER_RADIUS = 17;

// ============ Types ========================================================== //

export type Item = {
  value: string;
  label: string;
};

export type RenderItemProps = {
  item: Item;
  index: number;
  selectedIndex: SharedValue<number>;
  accentColor: string;
  buttonWidth: number;
  buttonHeight: number;
};

export type ItemSelectorProps = {
  items: Item[];
  selectedValue: string;
  onSelect: (value: string) => void;

  // Colors
  accentColor: string;
  backgroundColor: string;

  // Dimensions
  containerWidth: number;
  pillHeight?: number;
  pillWidth?: number;
  pillGap?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  maxVisibleItems?: number;

  // Styling
  containerStyle?: StyleProp<ViewStyle>;
  containerBorderRadius?: number;
  highlightBorderRadius?: number;
  showBorder?: boolean;

  // Separators (centered within pillGap between each item)
  separatorWidth?: number;
  SeparatorComponent?: React.ComponentType<{ width: number; height: number }>;

  // Custom item rendering
  renderItem?: (props: RenderItemProps) => React.ReactNode;
};

// ============ Main Component ================================================= //

export const ItemSelector = memo(function ItemSelector({
  items,
  selectedValue,
  onSelect,
  accentColor,
  backgroundColor,
  containerWidth,
  pillHeight = DEFAULT_PILL_HEIGHT,
  pillWidth,
  pillGap = DEFAULT_PILL_GAP,
  paddingHorizontal = DEFAULT_PADDING_HORIZONTAL,
  paddingVertical = DEFAULT_PADDING_VERTICAL,
  maxVisibleItems = DEFAULT_MAX_VISIBLE_ITEMS,
  containerStyle,
  containerBorderRadius = DEFAULT_CONTAINER_BORDER_RADIUS,
  highlightBorderRadius = DEFAULT_HIGHLIGHT_BORDER_RADIUS,
  showBorder = true,
  separatorWidth,
  SeparatorComponent,
  renderItem,
}: ItemSelectorProps) {
  const itemCount = items.length;
  const effectiveItemCount = Math.min(itemCount, maxVisibleItems);

  const buttonWidth = useMemo(() => {
    if (pillWidth) return pillWidth;
    return (containerWidth - paddingHorizontal * 2 - pillGap * (effectiveItemCount - 1)) / effectiveItemCount;
  }, [pillWidth, containerWidth, pillGap, paddingHorizontal, effectiveItemCount]);

  const scrollEnabled = itemCount > maxVisibleItems;

  const scrollViewRef = useRef<ScrollView>(null);
  const selectedIndex = useSharedValue(items.findIndex(item => item.value === selectedValue));
  const scrollViewProps = getScrollViewProps({
    paddingHorizontal,
    valueCount: itemCount,
    pillGap,
    pillWidth: buttonWidth,
  });

  useEffect(() => {
    const index = items.findIndex(item => item.value === selectedValue);
    if (index !== -1) {
      selectedIndex.value = index;
    }
  }, [selectedValue, items, selectedIndex]);

  const onPress = useCallback(
    (value: string) => {
      'worklet';
      const index = items.findIndex(item => item.value === value);
      if (index !== -1) {
        selectedIndex.value = index;
      }
      runOnJS(onSelect)(value);
    },
    [onSelect, selectedIndex, items]
  );

  const containerStyles = useMemo(
    () => [styles.container, { borderRadius: containerBorderRadius }, containerStyle],
    [containerBorderRadius, containerStyle]
  );

  return (
    <Box
      style={containerStyles}
      borderWidth={showBorder ? 4 / 3 : 0}
      borderColor={showBorder ? 'separatorSecondary' : undefined}
      borderRadius={containerBorderRadius}
    >
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
          accentColor={accentColor}
          pillGap={pillGap}
          selectedIndex={selectedIndex}
          borderRadius={highlightBorderRadius}
        />
        {separatorWidth !== undefined && (
          <Separators
            itemCount={itemCount}
            buttonWidth={buttonWidth}
            buttonHeight={pillHeight}
            pillGap={pillGap}
            paddingHorizontal={paddingHorizontal}
            separatorWidth={separatorWidth}
            SeparatorComponent={SeparatorComponent}
          />
        )}
        <ItemButtons
          items={items}
          buttonWidth={buttonWidth}
          buttonHeight={pillHeight}
          accentColor={accentColor}
          onPress={onPress}
          selectedIndex={selectedIndex}
          renderItem={renderItem}
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
  accentColor,
  pillGap,
  selectedIndex,
  paddingHorizontal,
  borderRadius,
}: {
  buttonHeight: number;
  buttonWidth: DerivedValue<number>;
  accentColor: string;
  pillGap: number;
  selectedIndex: SharedValue<number>;
  paddingHorizontal: number;
  borderRadius: number;
}) {
  const { isDarkMode } = useColorMode();
  const highlightBackgroundColor = opacity(accentColor, 0.06);
  const borderColor = isDarkMode ? highlightBackgroundColor : opacity(accentColor, 0.03);

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
        { backgroundColor: highlightBackgroundColor, borderColor, height: buttonHeight, borderRadius },
        translateX,
        width,
      ]}
    />
  );
});

// ============ DefaultItemContent ============================================= //

const DefaultItemContent = memo(function DefaultItemContent({
  label,
  index,
  selectedIndex,
  accentColor,
}: {
  label: string;
  index: number;
  selectedIndex: SharedValue<number>;
  accentColor: string;
}) {
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const textStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.value === index;
    const textColor = isSelected ? accentColor : labelQuaternary;
    if (!IS_IOS) return { color: textColor };
    return {
      color: textColor,
      fontWeight: isSelected ? '800' : '700',
    };
  });

  return (
    <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
      {label}
    </AnimatedText>
  );
});

// ============ ItemButton ===================================================== //

type ItemButtonProps = {
  item: Item;
  buttonWidth: number;
  buttonHeight: number;
  accentColor: string;
  index: number;
  onPress: (value: string) => void;
  selectedIndex: SharedValue<number>;
  renderItem?: (props: RenderItemProps) => React.ReactNode;
};

const ItemButton = memo(function ItemButton({
  item,
  buttonWidth,
  buttonHeight,
  accentColor,
  index,
  onPress,
  selectedIndex,
  renderItem,
}: ItemButtonProps) {
  const content = renderItem ? (
    renderItem({ item, index, selectedIndex, accentColor, buttonWidth, buttonHeight })
  ) : (
    <DefaultItemContent label={item.label} index={index} selectedIndex={selectedIndex} accentColor={accentColor} />
  );

  return (
    <GestureHandlerButton
      hapticTrigger="tap-end"
      hapticType="soft"
      hitSlop={4}
      onPressWorklet={() => {
        'worklet';
        onPress(item.value);
      }}
      style={[styles.button, { width: buttonWidth, height: buttonHeight }]}
    >
      {content}
    </GestureHandlerButton>
  );
});

// ============ Mapped Buttons ================================================= //

const ItemButtons = memo(function ItemButtons({
  items,
  buttonWidth,
  buttonHeight,
  accentColor,
  onPress,
  selectedIndex,
  renderItem,
}: {
  items: Item[];
  buttonWidth: number;
  buttonHeight: number;
  accentColor: string;
  onPress: (value: string) => void;
  selectedIndex: SharedValue<number>;
  renderItem?: (props: RenderItemProps) => React.ReactNode;
}) {
  return items.map((item, index) => (
    <ItemButton
      key={item.value}
      item={item}
      buttonWidth={buttonWidth}
      buttonHeight={buttonHeight}
      accentColor={accentColor}
      index={index}
      onPress={onPress}
      selectedIndex={selectedIndex}
      renderItem={renderItem}
    />
  ));
});

// ============ Separators ==================================================== //

const DefaultSeparator = memo(function DefaultSeparator({ width, height }: { width: number; height: number }) {
  const separatorColor = useForegroundColor('separatorSecondary');
  return <View style={[styles.separator, { width, height: height * 0.4, backgroundColor: separatorColor }]} />;
});

const Separators = memo(function Separators({
  itemCount,
  buttonWidth,
  buttonHeight,
  pillGap,
  paddingHorizontal,
  separatorWidth,
  SeparatorComponent,
}: {
  itemCount: number;
  buttonWidth: number;
  buttonHeight: number;
  pillGap: number;
  paddingHorizontal: number;
  separatorWidth: number;
  SeparatorComponent?: React.ComponentType<{ width: number; height: number }>;
}) {
  const Separator = SeparatorComponent ?? DefaultSeparator;
  const separatorCount = itemCount - 1;

  if (separatorCount <= 0) return null;

  const separators = Array.from({ length: separatorCount });

  return (
    <>
      {separators.map((_, i) => {
        const left = paddingHorizontal + (i + 1) * buttonWidth + (i + 0.5) * pillGap - separatorWidth / 2;
        return (
          <View key={i} style={[styles.separatorContainer, { left, height: buttonHeight }]}>
            <Separator width={separatorWidth} height={buttonHeight} />
          </View>
        );
      })}
    </>
  );
});

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
    borderWidth: 2,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
  },
  separator: {
    borderRadius: 1,
  },
  separatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
});
