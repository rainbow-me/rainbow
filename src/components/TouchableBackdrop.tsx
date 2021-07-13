import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { neverRerender } from '../utils';
import { position } from '@rainbow-me/styles';

const TouchableBackdrop = ({ zIndex = 0, ...props }) => {
  const { colors } = useTheme();

  return (
    <BorderlessButton
      {...props}
      {...position.centeredAsObject}
      {...position.coverAsObject}
      activeOpacity={1}
      backgroundColor={colors.transparent}
      zIndex={zIndex}
    />
  );
};

export default neverRerender(TouchableBackdrop);
