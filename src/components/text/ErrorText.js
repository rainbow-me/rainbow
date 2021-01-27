import React from 'react';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import Monospace from './Monospace';

export default function ErrorText({ color, error }) {
  const { colors } = useTheme();
  return (
    <RowWithMargins align="center" margin={9}>
      <Icon color={color || colors.red} name="warning" />
      <Monospace
        color={color || colors.red}
        lineHeight="looser"
        size="lmedium"
        weight="medium"
      >
        {error}
      </Monospace>
    </RowWithMargins>
  );
}
