import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import { neverRerender } from '../utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const TouchableBackdrop = ({ zIndex = 0, ...props }) => {
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
