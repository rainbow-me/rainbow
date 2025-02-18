import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { AnimatedText, Box, Text, useForegroundColor } from '@/design-system';
import Animated, { FadeIn, SharedValue, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FIELD_BACKGROUND_COLOR, FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, COLLAPSABLE_FIELD_ANIMATION } from '../constants';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

const HIT_SLOP = 24;

function AnimatedPlusMinusIcon({ collapsed }: { collapsed: SharedValue<boolean> }) {
  const minusIcon = '􀅽';
  const rotation = useSharedValue(0);

  useAnimatedReaction(
    () => collapsed.value,
    value => {
      rotation.value = withTiming(value ? 270 : 360, TIMING_CONFIGS.buttonPressConfig);
    }
  );

  const rotateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  return (
    <Box backgroundColor="rgba(255,255,255,0.06)" borderRadius={16} width={32} height={32} justifyContent="center" alignItems="center">
      <AnimatedText style={[rotateStyle, { position: 'absolute' }]} color="label" size="17pt" weight="heavy">
        {minusIcon}
      </AnimatedText>
      <AnimatedText color="label" size="17pt" weight="heavy">
        {minusIcon}
      </AnimatedText>
    </Box>
  );
}

type CollapsableFieldProps = {
  title: string;
  children: React.ReactNode;
};

export function CollapsableField({ title, children }: CollapsableFieldProps) {
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
    <Animated.View layout={COLLAPSABLE_FIELD_ANIMATION} style={[styles.container, { borderColor }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <GestureHandlerButton
          hapticTrigger="tap-end"
          hapticType="soft"
          onPressWorklet={toggleCollapsed}
          style={{
            margin: -HIT_SLOP,
            padding: HIT_SLOP,
          }}
        >
          <Text color="label" size="17pt" weight="heavy">
            {title}
          </Text>
        </GestureHandlerButton>
        <GestureHandlerButton
          hapticTrigger="tap-end"
          hapticType="soft"
          onPressWorklet={toggleCollapsed}
          style={{
            margin: -HIT_SLOP,
            padding: HIT_SLOP,
          }}
        >
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
