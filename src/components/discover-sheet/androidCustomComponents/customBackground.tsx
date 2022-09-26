import { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const CustomBackground: React.FC<BottomSheetBackgroundProps> = ({ style }) => {
  const { colors } = useTheme();
  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
    ],
    [colors, style]
  );

  return <View style={containerStyle} />;
};

export default CustomBackground;
