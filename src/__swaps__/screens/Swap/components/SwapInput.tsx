import React, { ReactNode, useMemo } from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box, useColorMode } from '@/design-system';
import { BASE_INPUT_WIDTH, ETH_COLOR, ETH_COLOR_DARK } from '../constants';
import { useSwapInputStyles } from '../hooks/useSwapInputStyles';
import { styles } from '../Swap';

// TODO: Should move the components below to their own files, but some of the
// wrappers and code in SwapScreen above should be moved out to components, so
// leaving it all here for now

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
