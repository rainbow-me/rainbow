import React, { ReactNode, useMemo } from 'react';
import Animated, { SharedValue } from 'react-native-reanimated';
import { Box, useColorMode } from '@/design-system';
import { BASE_INPUT_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useSwapInputStyles } from '@/__swaps__/screens/Swap/hooks/useSwapInputStyles';
import { StyleSheet } from 'react-native';
import { useSwapAssets } from '@/state/swaps/assets';
import { extractColorValueForColors } from '@/__swaps__/utils/swaps';
import { TokenColors } from '@/graphql/__generated__/metadata';

export const SwapInput = ({
  children,
  bottomInput,
  otherInputProgress,
  progress,
}: {
  children?: ReactNode;
  bottomInput?: boolean;
  otherInputProgress: SharedValue<number>;
  progress: SharedValue<number>;
}) => {
  const { isDarkMode } = useColorMode();

  const assetToSellColors = useSwapAssets(state => state.assetToSell?.colors);
  const assetToBuyColors = useSwapAssets(state => state.assetToBuy?.colors);

  const color = useMemo(() => {
    return extractColorValueForColors({
      colors: bottomInput ? (assetToBuyColors as TokenColors) : (assetToSellColors as TokenColors),
      isDarkMode,
    });
  }, [assetToBuyColors, assetToSellColors, bottomInput, isDarkMode]);

  const { inputStyle, containerStyle, mixedShadowColor } = useSwapInputStyles({
    bottomInput,
    color,
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
