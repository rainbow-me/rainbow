import React, { memo } from 'react';
import * as i18n from '@/languages';
import { StyleSheet, View } from 'react-native';
import { AnimatedText, Border, Box, useColorMode, useForegroundColor } from '@/design-system';
import { PerpPositionSide } from '@/features/perps/types';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT, PERPS_COLORS } from '@/features/perps/constants';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { fonts } from '@/design-system/typography/typography';

export const POSITION_SIDE_SELECTOR_HEIGHT = 36;
export const POSITION_SIDE_SELECTOR_HEIGHT_WITH_PADDING = POSITION_SIDE_SELECTOR_HEIGHT + 8;

const BUTTON_HIT_SLOP = Object.freeze({ bottom: 20, top: 10 });
const HORIZONTAL_PADDING = 20;
const PROGRESS_RANGE = Object.freeze([0, 100]);
const COLOR_RANGE = Object.freeze([PERPS_COLORS.longGreen, PERPS_COLORS.shortRed]);
const SHADOW_OPACITY_RANGE = Object.freeze([0.08, 0.12]);
const TRANSLATE_X_RANGE = [0, (DEVICE_WIDTH - HORIZONTAL_PADDING * 2) / 2];

function isLong(positionSide: PerpPositionSide): boolean {
  'worklet';
  return positionSide === PerpPositionSide.LONG;
}

export const PositionSideSelector = memo(function PositionSideSelector() {
  const { isDarkMode } = useColorMode();
  const labelSecondary = useForegroundColor('labelSecondary');
  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  const positionSide = useStoreSharedValue(useHlNewPositionStore, state => state.positionSide);
  const longToShortProgress = useDerivedValue(() =>
    withSpring(isLong(positionSide.value) ? PROGRESS_RANGE[0] : PROGRESS_RANGE[1], SPRING_CONFIGS.tabSwitchConfig)
  );

  const color = useDerivedValue(() => interpolateColor(longToShortProgress.value, PROGRESS_RANGE, COLOR_RANGE, 'LAB'));

  const longTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(longToShortProgress.value, PROGRESS_RANGE, [isDarkMode ? 'black' : 'white', labelSecondary], 'LAB'),
    fontFamily: isLong(positionSide.value) ? fonts.SFProRounded.heavy.fontFamily : fonts.SFProRounded.black.fontFamily,
  }));

  const shortTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(longToShortProgress.value, PROGRESS_RANGE, [labelSecondary, 'white'], 'LAB'),
    fontFamily: isLong(positionSide.value) ? fonts.SFProRounded.heavy.fontFamily : fonts.SFProRounded.black.fontFamily,
  }));

  const selectedHighlightStyle = useAnimatedStyle(() => ({
    backgroundColor: color.value,
    transform: [{ translateX: interpolate(longToShortProgress.value, PROGRESS_RANGE, TRANSLATE_X_RANGE) }],
    shadowColor: color.value,
    shadowOpacity: interpolate(longToShortProgress.value, PROGRESS_RANGE, SHADOW_OPACITY_RANGE),
  }));

  return (
    <Box height={POSITION_SIDE_SELECTOR_HEIGHT} width={DEVICE_WIDTH - HORIZONTAL_PADDING * 2} style={{ overflow: 'visible' }}>
      <Box flexDirection="row" alignItems="center" style={{ overflow: 'visible' }}>
        <GradientBorderView
          borderGradientColors={[opacityWorklet('#FF584D', 0.06), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={20}
          borderWidth={2}
          backgroundColor={backgroundColor}
          style={styles.optionContainer}
        >
          <View />
        </GradientBorderView>
        <GradientBorderView
          borderGradientColors={[opacityWorklet('#3ECF5B', 0.06), 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          borderRadius={20}
          borderWidth={2}
          backgroundColor={backgroundColor}
          style={styles.optionContainer}
        >
          <View />
        </GradientBorderView>
        <Animated.View
          style={[
            {
              width: '50%',
              borderCurve: 'continuous',
              borderRadius: POSITION_SIDE_SELECTOR_HEIGHT / 2,
              position: 'absolute',
              height: POSITION_SIDE_SELECTOR_HEIGHT,
              marginBottom: 0,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
            },
            selectedHighlightStyle,
          ]}
        >
          <Border
            borderRadius={POSITION_SIDE_SELECTOR_HEIGHT / 2}
            borderWidth={isDarkMode ? 2 : THICKER_BORDER_WIDTH}
            borderColor={{ custom: opacityWorklet(isDarkMode ? '#ffffff' : '#000000', isDarkMode ? 0.16 : 0.02) }}
          />
        </Animated.View>
        <Box style={StyleSheet.absoluteFill} zIndex={2000}>
          <Box flexDirection="row">
            <GestureHandlerButton
              hapticTrigger="tap-end"
              hapticType="soft"
              hitSlop={BUTTON_HIT_SLOP}
              onPressJS={() => hlNewPositionStoreActions.setPositionSide(PerpPositionSide.LONG)}
              style={styles.optionContainer}
            >
              <AnimatedText align="center" size="17pt" weight="black" color="label" style={longTextStyle}>
                {i18n.t(i18n.l.perps.position_side.long)}
              </AnimatedText>
            </GestureHandlerButton>

            <GestureHandlerButton
              hapticTrigger="tap-end"
              hapticType="soft"
              hitSlop={BUTTON_HIT_SLOP}
              onPressJS={() => hlNewPositionStoreActions.setPositionSide(PerpPositionSide.SHORT)}
              style={styles.optionContainer}
            >
              <AnimatedText align="center" size="17pt" weight="black" color="label" style={shortTextStyle}>
                {i18n.t(i18n.l.perps.position_side.short)}
              </AnimatedText>
            </GestureHandlerButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  optionContainer: {
    borderCurve: 'continuous',
    overflow: 'hidden',
    flex: 1,
    height: POSITION_SIDE_SELECTOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
