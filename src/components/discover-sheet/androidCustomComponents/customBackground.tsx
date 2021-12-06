import { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import React, { useMemo } from 'react';
import { View } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../../context/ThemeContext' was resolve... Remove this comment to see the full error message
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

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <View style={containerStyle} />;
};

export default CustomBackground;
