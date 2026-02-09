import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { useTheme } from '../theme/ThemeContext';
import neverRerender from '@/utils/neverRerender';
import { position } from '@/styles';

const TouchableBackdrop = ({ zIndex = 0, ...props }) => {
  const { colors } = useTheme();

  return (
    <BorderlessButton
      {...props}
      {...position.centeredAsObject}
      {...position.coverAsObject}
      activeOpacity={1}
      style={{ backgroundColor: colors.transparent }}
      zIndex={zIndex}
    />
  );
};

export default neverRerender(TouchableBackdrop);
