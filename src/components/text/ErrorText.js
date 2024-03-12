import React from 'react';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import Text from './Text';

export default function ErrorText({ color, error, style }) {
  const { colors } = useTheme();
  return (
    <RowWithMargins style={style} align="center" margin={9}>
      <Icon color={color || colors.red} name="warning" />
      <Text color={color || colors.red} lineHeight="looser" size="lmedium" weight="medium">
        {error}
      </Text>
    </RowWithMargins>
  );
}
