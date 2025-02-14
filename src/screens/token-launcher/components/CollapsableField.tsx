import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { AnimatedText, Box, Text, useForegroundColor } from '@/design-system';
import Animated, { FadeIn, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { FIELD_BACKGROUND_COLOR, FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, COLLAPSABLE_FIELD_ANIMATION } from '../constants';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';

export const CollapsableField = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const borderColor = useForegroundColor('buttonStroke');
  const collapsed = useSharedValue(true);
  const collapsedIcon = useDerivedValue(() => {
    return collapsed.value ? ('􀅼' as string) : ('􀅽' as string);
  });

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
        <GestureHandlerButton hapticTrigger="tap-end" hapticType="soft" onPressWorklet={toggleCollapsed}>
          <Text color="label" size="17pt" weight="heavy">
            {title}
          </Text>
        </GestureHandlerButton>
        <GestureHandlerButton hapticTrigger="tap-end" hapticType="soft" onPressWorklet={toggleCollapsed}>
          <Box
            backgroundColor="rgba(255,255,255,0.06)"
            borderRadius={16}
            width={32}
            height={32}
            justifyContent="center"
            alignItems="center"
          >
            <AnimatedText color="label" size="17pt" weight="heavy">
              {collapsedIcon}
            </AnimatedText>
          </Box>
        </GestureHandlerButton>
      </Animated.View>
      <Animated.View entering={FadeIn} style={contentStyle}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

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
