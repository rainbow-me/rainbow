import React, { ReactNode, useMemo } from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box, useColorMode } from '@/design-system';
import { BASE_INPUT_WIDTH, ETH_COLOR, ETH_COLOR_DARK, INPUT_PADDING, THICK_BORDER_WIDTH } from '../constants';
import { useSwapInputStyles } from '../hooks/useSwapInputStyles';
import { StyleSheet } from 'react-native';

export const SwapInput = ({
  children,
  color,
  bottomInput,
  otherInputProgress,
  progress,
}: {
  children?: ReactNode;
  color: string | undefined;
  bottomInput?: boolean;
  otherInputProgress: SharedValue<number>;
  progress: SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const colorWithFallback = useMemo(() => color || (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR), [color, isDarkMode]);

  const { inputStyle, containerStyle, mixedShadowColor } = useSwapInputStyles({
    bottomInput,
    color: colorWithFallback,
    otherInputProgress,
    progress,
  });

  return (
    <Box
      as={Animated.View}
      style={[containerStyle, styles.staticInputContainerStyles, { shadowColor: mixedShadowColor }]}
      width={{ custom: BASE_INPUT_WIDTH }}
    >
      <Box as={Animated.View} style={[inputStyle, styles.staticInputStyles]}>
        {children}
      </Box>
    </Box>
  );
};

export const styles = StyleSheet.create({
  staticInputContainerStyles: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  staticInputStyles: {
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    padding: INPUT_PADDING,
    width: BASE_INPUT_WIDTH,
  },
});
