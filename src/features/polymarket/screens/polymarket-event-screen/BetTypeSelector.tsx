import React, { memo, useCallback, useEffect, useRef } from 'react';
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
import { AnimatedText, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { opacity } from '@/__swaps__/utils/swaps';
import { BET_TYPE, BetType } from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';

// ============ Constants ====================================================== //

const PILL = Object.freeze({ gap: 3, height: 64, width: 109 });
const BASE_HORIZONTAL_INSET = 0;

const BET_TYPES: Record<BetType, { index: number; label: string; type: BetType; icon: string }> = {
  [BET_TYPE.MONEYLINE]: { index: 0, label: 'Winner', type: BET_TYPE.MONEYLINE, icon: '􀠏' },
  [BET_TYPE.SPREADS]: { index: 1, label: 'Spreads', type: BET_TYPE.SPREADS, icon: '􀄭' },
  [BET_TYPE.TOTALS]: { index: 2, label: 'Totals', type: BET_TYPE.TOTALS, icon: '􂝔' },
  [BET_TYPE.OTHER]: { index: 3, label: 'Other', type: BET_TYPE.OTHER, icon: '􀐒' },
};

const BET_TYPE_COUNT = Object.keys(BET_TYPES).length;
const CONTENT_WIDTH = PILL.width * BET_TYPE_COUNT + PILL.gap * (BET_TYPE_COUNT - 1);

// ============ Types ========================================================== //

type BetTypeSelectorProps = {
  backgroundColor: string;
  color: string;
  selectedBetType: BetType;
  onSelectBetType: (betType: BetType) => void;
};

type BetTypeButtonProps = {
  color: string;
  icon: string;
  index: number;
  label: string;
  onPress: (betType: BetType) => void;
  selectedIndex: SharedValue<number>;
  type: BetType;
};

// ============ Main Component ================================================= //

export const BetTypeSelector = memo(function BetTypeSelector({
  backgroundColor,
  color,
  selectedBetType,
  onSelectBetType,
}: BetTypeSelectorProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const selectedIndex = useSharedValue(BET_TYPES[selectedBetType].index);
  const scrollViewProps = getScrollViewProps();

  // Sync selectedIndex when prop changes externally
  useEffect(() => {
    selectedIndex.value = BET_TYPES[selectedBetType].index;
  }, [selectedBetType, selectedIndex]);

  const buttonWidth = useDerivedValue<number>(() => PILL.width);

  const onPress = useCallback(
    (betType: BetType) => {
      'worklet';
      selectedIndex.value = BET_TYPES[betType].index;
      runOnJS(onSelectBetType)(betType);
    },
    [onSelectBetType, selectedIndex]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        centerContent
        contentContainerStyle={scrollViewProps.contentContainerStyle}
        horizontal
        maintainVisibleContentPosition={scrollViewProps.maintainVisibleContentPosition}
        ref={scrollViewRef}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        style={scrollViewProps.style}
      >
        <SelectedHighlight buttonWidth={buttonWidth} color={color} selectedIndex={selectedIndex} />
        <BetTypeButtons color={color} onPress={onPress} selectedIndex={selectedIndex} />
      </ScrollView>

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
        startColor={backgroundColor}
        startPosition="left"
        steps={8}
        style={styles.rightFade}
      />
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
  const highlightBackgroundColor = opacity(color, 0.06);
  const borderColor = isDarkMode ? highlightBackgroundColor : opacity(color, 0.03);

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

  const width = useAnimatedStyle(() => ({
    width: withSpring(buttonWidth.value, SPRING_CONFIGS.snappyMediumSpringConfig),
  }));

  return (
    <Animated.View style={[styles.selectedHighlight, { backgroundColor: highlightBackgroundColor, borderColor }, translateX, width]} />
  );
});

// ============ BetTypeButton ================================================== //

const BetTypeButton = ({ color, index, label, icon, onPress, selectedIndex, type }: BetTypeButtonProps) => {
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
        onPress(type);
      }}
      style={styles.button}
    >
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {icon}
      </AnimatedText>
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {label}
      </AnimatedText>
    </GestureHandlerButton>
  );
};

// ============ Mapped Buttons ================================================= //

const BetTypeButtons = ({
  color,
  onPress,
  selectedIndex,
}: {
  color: string;
  onPress: (betType: BetType) => void;
  selectedIndex: SharedValue<number>;
}) => {
  return Object.values(BET_TYPES).map(({ icon, index, label, type }) => (
    <BetTypeButton
      color={color}
      index={index}
      key={type}
      label={label}
      icon={icon}
      onPress={onPress}
      selectedIndex={selectedIndex}
      type={type}
    />
  ));
};

// ============ Utilities ====================================================== //

function getScrollViewProps(): Pick<ScrollViewProps, 'contentContainerStyle' | 'maintainVisibleContentPosition' | 'style'> {
  return {
    contentContainerStyle: styles.contentContainer,
    maintainVisibleContentPosition: IS_IOS ? undefined : { minIndexForVisible: 0 },
    style: styles.scrollView,
  };
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: PILL.height,
    justifyContent: 'center',
    width: PILL.width,
    gap: 10,
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
    paddingHorizontal: BASE_HORIZONTAL_INSET,
    paddingVertical: 12,
    position: 'relative',
    width: IS_IOS ? undefined : CONTENT_WIDTH + BASE_HORIZONTAL_INSET * 2,
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
    pointerEvents: 'none',
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
    borderRadius: 24,
    borderWidth: 2,
    height: PILL.height,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: PILL.width,
  },
});
