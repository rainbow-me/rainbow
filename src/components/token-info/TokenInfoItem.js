import React from 'react';
import { ColumnWithMargins } from '../layout';
import TokenInfoBalanceValue from './TokenInfoBalanceValue';
import TokenInfoHeading from './TokenInfoHeading';
import TokenInfoValue from './TokenInfoValue';

export default function TokenInfoItem({
  align = 'left',
  asset,
  children,
  color,
  title,
  ...props
}) {
  return (
    <ColumnWithMargins
      justify={align === 'left' ? 'start' : 'end'}
      margin={5}
      {...props}
    >
      <TokenInfoHeading align={align}>{title}</TokenInfoHeading>
      {asset ? (
        <TokenInfoBalanceValue align={align} color={color} {...asset} />
      ) : (
        <TokenInfoValue align={align}>{children}</TokenInfoValue>
      )}
    </ColumnWithMargins>
  );
}
