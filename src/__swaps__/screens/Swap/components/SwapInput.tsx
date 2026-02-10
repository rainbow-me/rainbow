import React, { ReactNode } from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box } from '@/design-system';
import { BASE_INPUT_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useSwapInputStyles } from '@/__swaps__/screens/Swap/hooks/useSwapInputStyles';
import { StyleSheet } from 'react-native';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { TOKEN_SEARCH_INPUT_HORIZONTAL_PADDING } from '@/components/token-search/constants';
import { IS_IOS } from '@/env';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

export const SwapInput = ({
  asset,
  bottomInput,
  children,
  otherInputProgress,
  progress,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  bottomInput?: boolean;
  children?: ReactNode;
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
    <Box as={Animated.View} style={[styles.staticInputContainerStyles, containerStyle]} width={{ custom: BASE_INPUT_WIDTH }}>
      <Box as={Animated.View} style={[styles.staticInputStyles, inputStyle]}>
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
    padding: TOKEN_SEARCH_INPUT_HORIZONTAL_PADDING,
    width: BASE_INPUT_WIDTH,
  },
});
