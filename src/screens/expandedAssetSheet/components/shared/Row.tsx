import React from 'react';
import { Box } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface RowProps {
  children: React.ReactNode;
  highlighted?: boolean | SharedValue<boolean>;
}

export function Row({ children, highlighted }: RowProps) {
  const { accentColors } = useExpandedAssetSheetContext();

  const containerStyle = useAnimatedStyle(() => {
    const isHighlighted = typeof highlighted === 'object' ? highlighted.value : highlighted;

    return {
      backgroundColor: isHighlighted ? accentColors.opacity3 : 'transparent',
      borderColor: isHighlighted ? accentColors.opacity2 : 'transparent',
      borderWidth: 1.33,
      borderRadius: 14,
    };
  });

  return (
    <Animated.View style={containerStyle}>
      <Box paddingVertical="12px" paddingHorizontal="10px" justifyContent="space-between" flexDirection="row">
        {children}
      </Box>
    </Animated.View>
  );
}
