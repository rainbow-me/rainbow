import React, { ReactNode } from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box } from '@/design-system';
import { BASE_INPUT_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '@/components/swaps/constants';
import { useSwapInputStyles } from '@/components/swaps/hooks/useSwapInputStyles';
import { StyleSheet } from 'react-native';
import { ExtendedAnimatedAssetWithColors } from '@/components/swaps/types/assets';
import { IS_IOS } from '@/env';

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
  const { containerStyle, inputHeight, inputStyle } = useSwapInputStyles({
    asset,
    bottomInput,
    otherInputProgress,
    progress,
  });

  return (
    <Box as={Animated.View} style={[styles.staticInputContainerStyles, containerStyle]} width={{ custom: BASE_INPUT_WIDTH }}>
      <Box as={Animated.View} style={[styles.staticInputStyles, inputStyle, { height: inputHeight }]}>
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
    borderWidth: IS_IOS ? THICK_BORDER_WIDTH : 0,
    overflow: 'hidden',
    padding: INPUT_PADDING,
    width: BASE_INPUT_WIDTH,
  },
});
