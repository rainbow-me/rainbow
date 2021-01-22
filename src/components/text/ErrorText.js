import React from 'react';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import Monospace from './Monospace';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

export default function ErrorText({ color = colors_NOT_REACTIVE.red, error }) {
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
