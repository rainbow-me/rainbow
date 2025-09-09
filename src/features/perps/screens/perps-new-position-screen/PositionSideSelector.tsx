import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedText, Border, Box, useBackgroundColor, useForegroundColor } from '@/design-system';
import { PerpPositionSide } from '@/features/perps/types';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { PERPS_COLORS } from '@/features/perps/constants';

const HEIGHT = 36;

export const PositionSideSelector = memo(function PositionSideSelector() {
  const width = DEVICE_WIDTH - 40;
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const label = useForegroundColor('label');
  const labelSecondary = useForegroundColor('labelSecondary');
  const positionSide = useStoreSharedValue(useHlNewPositionStore, state => state.positionSide);

  const longTextStyle = useAnimatedStyle(() => {
    return {
      color: positionSide.value === PerpPositionSide.LONG ? 'black' : labelSecondary,
      fontWeight: positionSide.value === PerpPositionSide.LONG ? '900' : '800',
    };
  });

  const shortTextStyle = useAnimatedStyle(() => {
    return {
      color: positionSide.value === PerpPositionSide.SHORT ? label : labelSecondary,
      fontWeight: positionSide.value === PerpPositionSide.SHORT ? '900' : '800',
    };
  });

  const selectedHighlightStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: positionSide.value === PerpPositionSide.LONG ? PERPS_COLORS.longGreen : PERPS_COLORS.shortRed,
      transform: [
        { translateX: withSpring(positionSide.value === PerpPositionSide.LONG ? 0 : width / 2, SPRING_CONFIGS.snappyMediumSpringConfig) },
      ],
      // TODO (kane): shadow is being clipped
      // shadowColor: positionSide.value === PerpPositionSide.LONG ? PERPS_COLORS.longGreen : PERPS_COLORS.shortRed,
      // shadowRadius: 12,
      // shadowOffset: { width: 0, height: 8 },
      // shadowOpacity: 0.12,
    };
  });

  return (
    <Box height={HEIGHT} width={width} style={{ overflow: 'visible' }}>
      <Box flexDirection="row" alignItems="center" style={{ overflow: 'visible' }}>
        <GradientBorderView
          borderGradientColors={[opacityWorklet('#FF584D', 0.06), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={20}
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
          backgroundColor={backgroundColor}
          style={styles.optionContainer}
        >
          <View />
        </GradientBorderView>
        <Animated.View style={[selectedHighlightStyle, { width: '50%', borderRadius: 24, position: 'absolute', height: HEIGHT }]}>
          <Border borderRadius={24} borderWidth={2} borderColor={{ custom: opacityWorklet('#ffffff', 0.16) }} />
        </Animated.View>
        <Box style={StyleSheet.absoluteFill}>
          <Box flexDirection="row">
            <ButtonPressAnimation
              onPress={() => {
                useHlNewPositionStore.getState().setPositionSide(PerpPositionSide.LONG);
              }}
              style={styles.optionContainer}
            >
              <AnimatedText size="17pt" weight="black" color="label" style={longTextStyle}>
                {'Long'}
              </AnimatedText>
            </ButtonPressAnimation>
            <ButtonPressAnimation
              onPress={() => {
                useHlNewPositionStore.getState().setPositionSide(PerpPositionSide.SHORT);
              }}
              style={styles.optionContainer}
            >
              <AnimatedText size="17pt" weight="black" color="label" style={shortTextStyle}>
                {'Short'}
              </AnimatedText>
            </ButtonPressAnimation>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    width: DEVICE_WIDTH - 40,
    overflow: 'visible',
  },
  optionContainer: {
    flex: 1,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
