import React from 'react';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Box } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';

interface RowProps {
  children: React.ReactNode;
  highlighted?: boolean | SharedValue<boolean>;
}

export function Row({ children, highlighted }: RowProps) {
  const { accentColors } = useExpandedAssetSheetContext();

  const containerStyle = useAnimatedStyle(() => {
    const isHighlighted = typeof highlighted === 'object' ? highlighted.value : highlighted;

    return {
      backgroundColor: isHighlighted ? accentColors.surfaceSecondary : 'transparent',
      borderColor: isHighlighted ? accentColors.borderSecondary : 'transparent',
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
