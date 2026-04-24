import React from 'react';

import { BorderlessButton } from 'react-native-gesture-handler';

import { position } from '@/styles';
import neverRerender from '@/utils/neverRerender';

import { useTheme } from '../theme/ThemeContext';

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
