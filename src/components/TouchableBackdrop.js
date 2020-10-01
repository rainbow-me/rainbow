import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { neverRerender } from '../utils';
import { colors, position } from '@rainbow-me/styles';

const TouchableBackdrop = ({ zIndex = 0, ...props }) => (
  <BorderlessButton
    {...props}
    {...position.centeredAsObject}
    {...position.coverAsObject}
    activeOpacity={1}
    backgroundColor={colors.transparent}
    zIndex={zIndex}
  />
);

export default neverRerender(TouchableBackdrop);
