import React, { memo, ReactNode, RefObject, useMemo } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { DerivedValue, SharedValue, useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS, easing } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { AnimatedText, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { opacity } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

// ============ Constants ====================================================== //

export const BASE_HORIZONTAL_INSET = 28;
export const PILL = Object.freeze({ gap: 3, height: 34, width: 56 });

// ============ Types ========================================================== //

export type TimeframeOption = {
  readonly label: string;
  readonly value: string;
};

export type TimeframeSelectorCoreProps = {
  backgroundColor: string;
  color: string;
  initialScrollIndex?: number;
  layout: 'fill' | 'scrollable';
  onSelectWorklet: (value: string, index: number) => void;
  options: ReadonlyArray<TimeframeOption>;
  rightAccessory?: ReactNode;
  rightInset?: number;
  scrollViewRef?: RefObject<ScrollView | null>;
  selectedIndex: SharedValue<number>;
};

// ============ TimeframeSelectorCore ========================================== //

export const TimeframeSelectorCore = memo(function TimeframeSelectorCore({
  backgroundColor,
  color,
  initialScrollIndex = 0,
  layout,
  onSelectWorklet,
  options,
  rightAccessory = null,
  rightInset: rightInsetProp,
  scrollViewRef,
  selectedIndex,
}: TimeframeSelectorCoreProps) {
  const rightInset = rightInsetProp ?? BASE_HORIZONTAL_INSET;
  const scrollEnabled = layout === 'scrollable';

  const buttonWidth = useDerivedValue(() => {
    if (layout === 'scrollable') return PILL.width;
    const totalGaps = PILL.gap * (options.length - 1);
    const availableSpace = DEVICE_WIDTH - BASE_HORIZONTAL_INSET - rightInset - totalGaps;
    return availableSpace / options.length;
  });

  const contentContainerStyle = useMemo(
    () => getContentContainerStyle(layout, options.length, rightInset),
    [layout, options.length, rightInset]
  );

  const initialContentOffset = useMemo(
    () => (layout === 'scrollable' ? { x: getInitialScrollPosition(initialScrollIndex), y: 0 } : { x: 0, y: 0 }),
    [initialScrollIndex, layout]
  );

  const rightFadeStyle = useMemo(
    () => (rightAccessory ? [styles.rightFade, { width: rightInset }] : [styles.rightFade, styles.symmetricalRightFade]),
    [rightAccessory, rightInset]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        centerContent={!IS_IOS || layout === 'fill' || !rightAccessory}
        contentContainerStyle={contentContainerStyle}
        contentOffset={initialContentOffset}
        horizontal
        maintainVisibleContentPosition={IS_IOS ? undefined : { minIndexForVisible: 0 }}
        ref={scrollViewRef}
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <SelectedHighlight buttonWidth={buttonWidth} color={color} selectedIndex={selectedIndex} />

        {options.map((option, index) => (
          <TimeframeButton
            color={color}
            index={index}
            key={option.value}
            label={option.label}
            onSelectWorklet={onSelectWorklet}
            selectedIndex={selectedIndex}
            value={option.value}
          />
        ))}
      </ScrollView>

      {scrollEnabled ? (
        <>
          <EasingGradient
            easing={easing.in.sin}
            endColor={backgroundColor}
            endPosition="left"
            startColor={backgroundColor}
            startPosition="right"
            steps={8}
            style={styles.leftFade}
          />
          <EasingGradient
            easing={easing.in.sin}
            endColor={backgroundColor}
            endPosition="right"
            pointerEvents="auto"
            startColor={backgroundColor}
            startPosition="left"
            steps={8}
            style={rightFadeStyle}
          />
        </>
      ) : null}

      {rightAccessory}
    </View>
  );
});

// ============ SelectedHighlight ============================================== //

const SelectedHighlight = memo(function SelectedHighlight({
  buttonWidth,
  color,
  selectedIndex,
}: {
  buttonWidth: DerivedValue<number>;
  color: string;
  selectedIndex: SharedValue<number>;
}) {
  const { isDarkMode } = useColorMode();
  const backgroundColor = opacity(color, 0.06);
  const borderColor = isDarkMode ? backgroundColor : opacity(color, 0.03);

  const translateX = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          selectedIndex.value * (buttonWidth.value + PILL.gap) + BASE_HORIZONTAL_INSET,
          SPRING_CONFIGS.snappyMediumSpringConfig
        ),
      },
    ],
  }));

  const width = useAnimatedStyle(() => ({ width: withSpring(buttonWidth.value, SPRING_CONFIGS.snappyMediumSpringConfig) }));

  return <Animated.View style={[styles.selectedHighlight, { backgroundColor, borderColor }, translateX, width]} />;
});

// ============ TimeframeButton ================================================ //

const TimeframeButton = ({
  color,
  index,
  label,
  onSelectWorklet,
  selectedIndex,
  value,
}: {
  color: string;
  index: number;
  label: string;
  onSelectWorklet: (value: string, index: number) => void;
  selectedIndex: SharedValue<number>;
  value: string;
}) => {
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
        onSelectWorklet(value, index);
      }}
      style={styles.button}
    >
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {label}
      </AnimatedText>
    </GestureHandlerButton>
  );
};

// ============ Utilities ====================================================== //

function getContentContainerStyle(layout: 'fill' | 'scrollable', optionsCount: number, rightInset: number): StyleProp<ViewStyle> {
  if (layout === 'fill') {
    return [styles.contentContainer, { paddingRight: rightInset, width: DEVICE_WIDTH }];
  }
  // Scrollable mode
  const contentWidth = PILL.width * optionsCount + PILL.gap * (optionsCount - 1);
  const totalWidth = contentWidth + BASE_HORIZONTAL_INSET + rightInset;
  return [
    styles.contentContainer,
    {
      paddingRight: rightInset,
      width: IS_IOS ? undefined : totalWidth,
    },
  ];
}

function getInitialScrollPosition(buttonIndex: number): number {
  const buttonOffset = buttonIndex * (PILL.width + PILL.gap) + BASE_HORIZONTAL_INSET;
  const availableScrollWidth = DEVICE_WIDTH - BASE_HORIZONTAL_INSET * 2;
  const centerOffset = availableScrollWidth / 2;
  return Math.max(0, buttonOffset - centerOffset);
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flex: 1,
    height: PILL.height,
    justifyContent: 'center',
    width: PILL.width,
  },
  container: {
    position: 'relative',
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: PILL.gap,
    justifyContent: 'center',
    marginVertical: -12,
    paddingLeft: BASE_HORIZONTAL_INSET,
    paddingRight: BASE_HORIZONTAL_INSET,
    paddingVertical: 12,
    position: 'relative',
  },
  leftFade: {
    height: '100%',
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: BASE_HORIZONTAL_INSET,
  },
  rightFade: {
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    width: BASE_HORIZONTAL_INSET,
  },
  scrollView: {
    marginVertical: -12,
    overflow: 'hidden',
    paddingVertical: 12,
    width: '100%',
  },
  selectedHighlight: {
    borderCurve: 'continuous',
    borderRadius: PILL.height / 2,
    borderWidth: 2,
    height: PILL.height,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: PILL.width,
  },
  symmetricalRightFade: {
    pointerEvents: 'none',
    width: BASE_HORIZONTAL_INSET,
  },
});
