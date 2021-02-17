import React from 'react';
import { Text } from '../text';

const SheetTitle = props => {
  const { colors } = useTheme();
  return (
    <Text
      align="center"
      color={colors.dark}
      letterSpacing="roundedMedium"
      size="large"
      weight="bold"
      {...props}
    />
  );
};

export default SheetTitle;
