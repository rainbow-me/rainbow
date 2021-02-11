import { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface CustomBackgroundProps extends BottomSheetBackgroundProps {}

const CustomBackground: React.FC<CustomBackgroundProps> = ({ style }) => {
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
