import React from 'react';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import Monospace from './Monospace';
import { colors } from '@rainbow-me/styles';

export default function ErrorText({ color = colors.red, error }) {
  return (
    <RowWithMargins align="center" margin={9}>
      <Icon color={color} name="warning" />
      <Monospace
        color={color}
        lineHeight="looser"
        size="lmedium"
        weight="medium"
      >
        {error}
      </Monospace>
    </RowWithMargins>
  );
}
