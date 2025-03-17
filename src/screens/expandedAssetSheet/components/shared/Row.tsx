import React from 'react';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Box, useColorMode, useForegroundColor } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';

interface RowProps {
  children: React.ReactNode;
  highlighted?: boolean | SharedValue<boolean>;
}

export function Row({ children, highlighted }: RowProps) {
  const { accentColors } = useExpandedAssetSheetContext();
  const { isDarkMode } = useColorMode();

  const fill = useForegroundColor('fill');
  const separator = useForegroundColor('separator');

  const containerStyle = useAnimatedStyle(() => {
    const isHighlighted = typeof highlighted === 'object' ? highlighted.value : highlighted;
    const colorForBackground = isDarkMode ? accentColors.surfaceSecondary : opacityWorklet(fill, 0.025);
    const colorForBorder = isDarkMode ? accentColors.borderSecondary : opacityWorklet(separator, 0.01);

    return {
      backgroundColor: isHighlighted ? colorForBackground : 'transparent',
      borderColor: isHighlighted ? colorForBorder : 'transparent',
    };
  });

  return (
    <Animated.View style={[{ borderWidth: THICK_BORDER_WIDTH, borderRadius: 14, height: 36 }, containerStyle]}>
      <Box height="full" alignItems="center" paddingLeft="10px" paddingRight="12px" justifyContent="space-between" flexDirection="row">
        {children}
      </Box>
    </Animated.View>
  );
}
