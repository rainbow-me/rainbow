import React, { ReactNode } from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box } from '@/design-system';
import { BASE_INPUT_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useSwapInputStyles } from '@/__swaps__/screens/Swap/hooks/useSwapInputStyles';
import { StyleSheet } from 'react-native';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

export const SwapInput = ({
  children,
  asset,
  bottomInput,
  otherInputProgress,
  progress,
}: {
  children?: ReactNode;
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  bottomInput?: boolean;
  otherInputProgress: SharedValue<number>;
  progress: SharedValue<number>;
}) => {
  const { containerStyle, inputStyle } = useSwapInputStyles({
    asset,
    bottomInput,
    otherInputProgress,
    progress,
  });

  return (
    <Box as={Animated.View} style={[containerStyle, styles.staticInputContainerStyles]} width={{ custom: BASE_INPUT_WIDTH }}>
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
