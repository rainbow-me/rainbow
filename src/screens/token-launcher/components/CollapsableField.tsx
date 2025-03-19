import React, { useCallback } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, globalColors, Text, useForegroundColor } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { FIELD_BACKGROUND_COLOR, FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, COLLAPSABLE_FIELD_ANIMATION } from '../constants';

const HIT_SLOP = 24;

function AnimatedPlusMinusIcon({ collapsed }: { collapsed: SharedValue<boolean> }) {
  const rotation = useSharedValue(0);

  useAnimatedReaction(
    () => collapsed.value,
    value => {
      rotation.value = withTiming(value ? 270 : 360, TIMING_CONFIGS.buttonPressConfig);
    }
  );

  const rotateStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(rotation.value, [270, 360, 360], [1, 1, 0], 'clamp'),
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  return (
    <Box backgroundColor="rgba(255,255,255,0.06)" borderRadius={16} width={32} height={32} justifyContent="center" alignItems="center">
      <Animated.View style={[styles.plusMinusBar, rotateStyle]} />
      <Animated.View style={styles.plusMinusBar} />
    </Box>
  );
}

type CollapsableFieldProps = {
  title: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function CollapsableField({ title, children, style }: CollapsableFieldProps) {
  const borderColor = useForegroundColor('buttonStroke');
  const collapsed = useSharedValue(true);

  const toggleCollapsed = useCallback(() => {
    'worklet';
    collapsed.value = !collapsed.value;
  }, [collapsed]);

  const contentStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      display: collapsed.value ? 'none' : 'flex',
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: collapsed.value ? 0 : 10,
    };
  });

  return (
    <Animated.View layout={COLLAPSABLE_FIELD_ANIMATION} style={[styles.container, { borderColor }, style]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <GestureHandlerButton hapticTrigger="tap-end" hapticType="soft" onPressWorklet={toggleCollapsed} hitSlop={HIT_SLOP}>
          <Text color="label" size="17pt" weight="heavy">
            {title}
          </Text>
        </GestureHandlerButton>
        <GestureHandlerButton hapticTrigger="tap-end" hapticType="soft" onPressWorklet={toggleCollapsed} hitSlop={HIT_SLOP}>
          <AnimatedPlusMinusIcon collapsed={collapsed} />
        </GestureHandlerButton>
      </Animated.View>
      <Animated.View entering={FadeIn} style={contentStyle}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderWidth: FIELD_BORDER_WIDTH,
    backgroundColor: FIELD_BACKGROUND_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: FIELD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plusMinusBar: {
    backgroundColor: globalColors.white100,
    borderRadius: 1.5,
    height: 3,
    position: 'absolute',
    width: 14,
  },
});
